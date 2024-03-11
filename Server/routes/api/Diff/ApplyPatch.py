from .textFilePatch import apply_patch
import json
import os
import shutil
from .CreatePatch import is_text_file

# the function apply changes patch to a local project
def apply_project_patch(old: str, patch: str) -> None:
    with open(os.path.join(patch, "patchJson.json"), 'r') as conf:
        data = json.load(conf)

    for changed_dir in data["Directories_Changes"]:
        if (changed_dir["sign"] == "+"):
            os.mkdir(os.path.join(old, changed_dir["path"]))

    for changed_dir in data["Changes"]:
        for change in list(changed_dir.items())[0][1]:
            if change["Sign"] == "+":
                new_file_path = os.path.join(old, list(changed_dir.items())[0][0].split("-")[1], change["name"])
                shutil.copy(os.path.join(patch, 'changes', change["Hash"] + "." + change["name"].split(".")[1]), new_file_path)
            
            elif change["Sign"] == "?":
                new_file_path = os.path.join(old, list(changed_dir.items())[0][0].split("-")[1], change["New_name"])
                old_file_name = os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["Old_name"])
                old_file_path = os.path.join(old, list(changed_dir.items())[0][0].split("-")[0], change["Old_name"])
                if change["New_name"] != change["Old_name"]:
                    os.rename(old_file_name, new_file_path)
                
                if is_text_file(new_file_path):
                    with open(old_file_path, 'r') as textfile:
                        old_text = textfile.read()
                    
                    with open(os.path.join(patch, 'changes', change["Hash"] + "." + change["New_name"].split(".")[1]), 'r') as textfile:
                        patch_text = textfile.read()
                    
                    applied_patch = apply_patch(old_text, patch_text)
                    with open(new_file_path, 'w') as textfile:
                        textfile.write(applied_patch)
                else:
                    shutil.copy2(os.path.join(patch, 'changes', change["Hash"] + "." + change["New_name"].split(".")[1]), new_file_path)
            
            elif change["Sign"] == "*":
                new_file_path = os.path.join(old, list(changed_dir.items())[0][0].split("-")[1], change["New_name"])
                old_file_name = os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["Old_name"])
                if change["New_name"] != change["Old_name"]:
                    os.rename(old_file_name, new_file_path)
            
            elif change["Sign"] == "-":
                new_file_path = os.path.join(old, list(changed_dir.items())[0][0], change["name"])
                os.remove(new_file_path)
                

# the function apply remote changes patch to a local project
def apply_project_patch_cid(old: str, patch_cid: str, client) -> None:
    files_list = client.ls(patch_cid)
    
    for i in files_list["Objects"]:
        for j in i['Links']:
            if j['Name'] == "patchJson.json":
                patch_json_cid = j["Hash"]
            elif j['Name'] == "changes":
                patch_folder_changes_cid = j["Hash"]

    changes_files_hashes = {}
    for i in client.ls(patch_folder_changes_cid)["Objects"]:
        for j in i['Links']:
            changes_files_hashes[j["Name"]] = j["Hash"]

    json_data = client.cat(patch_json_cid)
    data = json.loads(json_data.decode('utf-8'))

    for changed_dir in data["Directories_Changes"]:
        if (changed_dir["sign"] == "+"):
            os.mkdir(os.path.join(old, changed_dir["path"]))

    for changed_dir in data["Changes"]:
        for change in list(changed_dir.items())[0][1]:
            if change["Sign"] == "+":
                new_file_path = os.path.join(old, list(changed_dir.items())[0][0], change["name"])
                added_file_cid = changes_files_hashes[change["Hash"] + "." + change["name"].split(".")[1]]
        
                client.get(added_file_cid, new_file_path)
                os.rename(os.path.join(new_file_path, added_file_cid), os.path.join(new_file_path, change["name"]))
            
            elif change["Sign"] == "?":
                new_file_path = os.path.join(old, list(changed_dir.items())[0][0].split("-")[1], change["New_name"])
                old_file_name = os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["Old_name"])
                old_file_path = os.path.join(list(changed_dir.items())[0][0].split("-")[0], change["Old_name"])
                if change["New_name"] != change["Old_name"]:
                    os.rename(old_file_name, new_file_path)
                
                if is_text_file(new_file_path):
                    with open(old_file_path, 'r') as textfile:
                        old_text = textfile.read()

                    patch_text = client.cat(changes_files_hashes[change["Hash"] + "." + change["New_name"].split(".")[1]]).decode('utf-8')
                    
                    applied_patch = apply_patch(old_text, patch_text)
                    with open(new_file_path, 'w') as textfile:
                        textfile.write(applied_patch)
                else:
                    os.remove(old_file_path)
                    added_file_cid = changes_files_hashes[change["Hash"] + "." + change["New_name"].split(".")[1]]
                    client.get(added_file_cid, new_file_path + "\\")
                    os.rename(os.path.join(new_file_path, added_file_cid), change["Hash"] + "." + change["name"].split(".")[1])

            
            elif change["Sign"] == "*":
                new_file_path = os.path.join(old, list(changed_dir.items())[0][0].split("-")[1], change["New_name"])
                old_file_name = os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["Old_name"])
                if change["New_name"] != change["Old_name"]:
                    os.rename(old_file_name, new_file_path)
            
            elif change["Sign"] == "-":
                new_file_path = os.path.join(old, list(changed_dir.items())[0][0], change["name"])
                os.remove(new_file_path)
    
