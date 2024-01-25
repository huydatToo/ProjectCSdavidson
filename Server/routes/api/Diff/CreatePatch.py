import os
from .ProjectFilesPatch import compare_projects, compare_projects_cid
from .textFilePatch import create_patch
import json
import shutil
from .others import is_text_file, get_local_file_hash
from .getData import get_single_file_internal

def create_project_patch_json(old_project_path, new_project_path):
    dirs_changes, files_changes = compare_projects(old_project_path, new_project_path)
    print((dirs_changes, files_changes))
    patch_name = "patch-{}".format(old_project_path.split("\\")[-1])
    os.mkdir(patch_name)
    os.mkdir(os.path.join(patch_name, "changes"))
    json_patch = {"Directories_Changes": [], "Changes": []}
    abs_len_new = (len(new_project_path) + 1)
    abs_len_old = (len(old_project_path) + 1)

    for change in dirs_changes:
        data = change.split('|')
        if len(data) == 2 and data[0] != "/":
            json_patch['Directories_Changes'].append({
                "sign": data[0],
                "path": data[1][abs_len_new:],
            })
        else:
            json_patch['Directories_Changes'].append({
                "sign": data[0],
                "old_path": data[1][abs_len_old:],
                "new_path": data[2][abs_len_new:],
            })
    
    for changed_directory in files_changes:
        if changed_directory[0] != "|+" or changed_directory[0] != "|-":
            folder = changed_directory[0][abs_len_old:] + "-" + changed_directory[1][abs_len_new:]
        else:
            folder = changed_directory[1][abs_len_new:]
            if folder == "-":
                folder = ""

        folder_changes = []
        for change in changed_directory[2]:
            data = change.split('|')
            if data[0] != "/":
                if data[0] == "?":
                    hash_file = get_local_file_hash(changed_directory[1] + "/" + data[2])
                    folder_changes.append({
                        "Sign": data[0],
                        "New_name": data[2],
                        "Old_name": data[1],
                        "Hash": hash_file
                    })
                    new_file = changed_directory[1] + "/" + data[2]
                    old_file = changed_directory[0] + "/" + data[2]
                    if is_text_file(new_file):
                        with open(old_file, 'r') as orig: 
                            original = orig.read()
                        with open(new_file, 'r') as modi: 
                            modified = modi.read()
                        hash_file_name = hash_file + "." + new_file.split(".")[1]
                        with open(os.path.join(patch_name, "changes", hash_file_name), "w") as f:
                            f.write(create_patch(original, modified))
                    else:
                        shutil.copy(new_file, os.path.join(patch_name, "changes", hash_file + "." + new_file.split(".")[1])) 

                elif data[0] == "+":
                    hash_file = get_local_file_hash(changed_directory[1] + "/" + data[1])
                    folder_changes.append({
                        "Sign": data[0],
                        "name": data[1],
                        "Hash": hash_file
                    })
                    hash_file += "." + data[1].split(".")[1]
                    shutil.copy(changed_directory[1] + "/" + data[1], os.path.join(patch_name, "changes", hash_file))

                elif data[0] == "-":
                    print(data)
                    folder_changes.append({
                        "Sign": data[0],
                        "name": data[1],
                    })
                    
                elif data[0] == "*":
                    folder_changes.append({ 
                        "Sign": data[0],
                        "New_name": data[2],
                        "Old_name": data[1],
                    })
        
        if len(folder_changes) != 0:
            json_patch['Changes'].append({folder: folder_changes})
    
    json_path = os.path.join(patch_name, "patchJson.json")
    with open(json_path, "w") as json_file:
        json.dump(json_patch, json_file, indent=2)

# -------------------------------------------------------------------------------------
        
def create_project_patch_json_cid(change_cids, new_project_CID, name, client):
    dirs_changes, files_changes = compare_projects_cid(change_cids, new_project_CID, client)
    print(dirs_changes, files_changes)

    patch_name = "patch-{}".format(name)
    os.mkdir(patch_name)
    os.mkdir(os.path.join(patch_name, "changes"))
    json_patch = {"Directories_Changes": [], "Changes": []}
    abs_len_new = (len(new_project_CID) + 1)

    for change in dirs_changes:
        data = change.split('|')
        if len(data) == 2 and data[0] != "/":
            json_patch['Directories_Changes'].append({
                "sign": data[0],
                "path": data[1][abs_len_new:],
            })
        else:
            json_patch['Directories_Changes'].append({
                "sign": data[0],
                "old_path": data[1],
                "new_path": data[2][abs_len_new:],
            })
    
    for changed_directory in files_changes:
        if changed_directory[0] != "|+" or changed_directory[0] != "|-":
            folder = changed_directory[0] + "-" + changed_directory[1][abs_len_new:]
        else:
            folder = changed_directory[1][abs_len_new:]
            if folder == "-":
                folder = ""

        folder_changes = []
        for change in changed_directory[2]:
            data = change.split('|')
            if data[0] != "/":
                if data[0] == "?":
                    hash_file = get_local_file_hash(changed_directory[1] + "\\" + data[2])
                    folder_changes.append({
                        "Sign": data[0],
                        "New_name": data[2],
                        "Old_name": data[1].split("\\")[-1],
                        "Hash": hash_file
                    })
                    new_file = os.path.join(changed_directory[1], data[2])
                    old_file = os.path.join(changed_directory[0], data[2])
                    if is_text_file(new_file):
                        original = get_single_file_internal(change_cids, old_file, client)
                        with open(new_file, 'r') as modi: 
                            modified = modi.read()
                        hash_file_name = hash_file + "." + new_file.split(".")[1]
                        with open(os.path.join(patch_name, "changes", hash_file_name), "w") as f:
                            f.write(create_patch(original, modified))
                    else:
                        shutil.copy(new_file, os.path.join(patch_name, "changes", hash_file + "." + new_file.split(".")[1])) 

                elif data[0] == "+":
                    hash_file = get_local_file_hash(changed_directory[1] + "\\" + data[1])
                    folder_changes.append({
                        "Sign": data[0],
                        "name": data[1],
                        "Hash": hash_file
                    })
                    hash_file += "." + data[1].split(".")[1]
                    shutil.copy(changed_directory[1] + "\\" + data[1], os.path.join(patch_name, "changes", hash_file))

                elif data[0] == "-":
                    folder_changes.append({
                        "Sign": data[0],
                        "name": data[1].split("\\")[-1],
                    })
                    
                elif data[0] == "*":
                    folder_changes.append({ 
                        "Sign": data[0],
                        "New_name": data[2],
                        "Old_name": data[1],
                    })
        
        if len(folder_changes) != 0:
            json_patch['Changes'].append({folder: folder_changes})
    
    json_path = os.path.join(patch_name, "patchJson.json")
    with open(json_path, "w") as json_file:
        json.dump(json_patch, json_file, indent=2)