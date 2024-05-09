import os
from .compare_projects import compare_projects
from .others import get_local_file_hash, is_text_file
import shutil
from .text_patch import create_patch
import json
from .compare_projects import compare_remote_project
from .get_from_ipfs import get_single_text_file_ipfs
from .compare_patches import compare_remote_projects
import ipfshttpclient2
from .get_from_ipfs import get_single_not_text_file_ipfs

def initialize_new_path(patch_name: str) -> None:
    os.mkdir(patch_name)
    os.mkdir(os.path.join(patch_name, "changes"))

# the functions create a local changes patch from local projects
def create_project_patch_json(
        old_project_path: str, 
        new_project_path: str, 
        patch_name: str
    ) -> None:
    
    patch_name = "patch-{}".format(patch_name)
    initialize_new_path(patch_name)
    folders_changes = compare_projects(old_project_path, new_project_path)
    
    json_patch = {"changed_folders": [], "changed_files": {}}

    for folder_change in folders_changes:
        if (folder_change.diff_type == "?" or folder_change.diff_type == "+"):
            json_patch['changed_folders'].append({
                "sign": folder_change.diff_type,
                "path": folder_change.new_name,
            })
        else:
            json_patch['changed_folders'].append({
                "sign": folder_change.diff_type,
                "path": folder_change.old_name,
            })
    
    for folder_change in list(filter(lambda i: i.diff_type == "?" or i.diff_type == "+", folders_changes)):
        folder_changes = []
        
        for file_change in folder_change.diff_list:
            if (file_change.diff_type == "?" or file_change.diff_type == "+"):
                file_name = file_change.new_name
            elif file_change.diff_type == "-":
                file_name = file_change.old_name
            else:
                continue
            
            absolute_path_new = os.path.join(new_project_path, folder_change.new_name, file_name)
            absolute_path_old = os.path.join(old_project_path, folder_change.new_name, file_name)

            if (file_change.diff_type == "?" or file_change.diff_type == "+"):
                hash_file = get_local_file_hash(absolute_path_new)
                hash_file_name = hash_file + "." + file_change.new_name.split(".")[-1]
            else:
                hash_file = None
                
            folder_changes.append({
                "sign": file_change.diff_type,
                "new_name": file_change.new_name,
                "old_name": file_change.old_name,
                "hash": hash_file
            })

            if (file_change.diff_type == "?"):
                if is_text_file(absolute_path_new):
                    with open(absolute_path_old, 'r') as orig: 
                        original = orig.read()
                    with open(absolute_path_new, 'r') as modi: 
                        modified = modi.read()
                    with open(os.path.join(patch_name, "changes", hash_file_name), "w") as f:
                        f.write(create_patch(original, modified))
                else:
                    shutil.copy(absolute_path_new, os.path.join(patch_name, "changes", hash_file_name))

            elif (file_change.diff_type == "+"):
                shutil.copy(absolute_path_new, os.path.join(patch_name, "changes", hash_file_name))
        
        json_patch['changed_files'][folder_change.new_name] = folder_changes
    
    json_path = os.path.join(patch_name, "patch_json.json")
    with open(json_path, "w") as json_file:
        json.dump(json_patch, json_file, indent=2)


# the functions create a local changes patch from local projects
def create_project_patch_from_remote_project(
        client, 
        patches: list[str], 
        new_project_path: str, 
        patch_name: str,
    ) -> None:
    patch_name = "patch-{}".format(patch_name)
    initialize_new_path(patch_name)
    folders_changes = compare_remote_project(client, patches, new_project_path)
    
    json_patch = {"changed_folders": [], "changed_files": {}}

    for folder_change in folders_changes:
        if (folder_change.diff_type == "?" or folder_change.diff_type == "+"):
            json_patch['changed_folders'].append({
                "sign": folder_change.diff_type,
                "path": folder_change.new_name,
            })
        else:
            json_patch['changed_folders'].append({
                "sign": folder_change.diff_type,
                "path": folder_change.old_name,
            })
    
    for folder_change in list(filter(lambda i: i.diff_type == "?" or i.diff_type == "+", folders_changes)):
        folder_changes = []
        
        for file_change in folder_change.diff_list:
            if (file_change.diff_type == "?" or file_change.diff_type == "+"):
                file_name = file_change.new_name
            elif file_change.diff_type == "-":
                file_name = file_change.old_name
            else:
                continue
            
            absolute_path_new = os.path.join(new_project_path, folder_change.new_name, file_name)
            absolute_path_old = os.path.join(folder_change.new_name, file_name)

            if (file_change.diff_type == "?" or file_change.diff_type == "+"):
                hash_file = get_local_file_hash(absolute_path_new)
                hash_file_name = hash_file + "." + file_change.new_name.split(".")[-1]
            else:
                hash_file = None
                
            folder_changes.append({
                "sign": file_change.diff_type,
                "new_name": file_change.new_name,
                "old_name": file_change.old_name,
                "hash": hash_file
            })

            if (file_change.diff_type == "?"):
                if is_text_file(absolute_path_new):
                    original = get_single_text_file_ipfs(client, absolute_path_old, patches)

                    with open(absolute_path_new, 'r') as modi: 
                        modified = modi.read()
                    with open(os.path.join(patch_name, "changes", hash_file_name), "w") as f:
                        f.write(create_patch(original, modified))
                else:
                    shutil.copy(absolute_path_new, os.path.join(patch_name, "changes", hash_file_name))

            elif (file_change.diff_type == "+"):
                shutil.copy(absolute_path_new, os.path.join(patch_name, "changes", hash_file_name))
        
        json_patch['changed_files'][folder_change.new_name] = folder_changes
    
    json_path = os.path.join(patch_name, "patch_json.json")
    with open(json_path, "w") as json_file:
        json.dump(json_patch, json_file, indent=2)



# the functions create a local changes patch from two remote projects
def create_updates_patch_json(
        client: ipfshttpclient2.Client,
        patch_name: str,
        patches_updated_project: list[str], 
        patches_local_project: list[str], 
    ) -> None:

    folders_changes = compare_remote_projects(client, patches_updated_project, patches_local_project)
    patch_name = "patch-{}".format(patch_name)
    initialize_new_path(patch_name)

    json_patch = {"changed_folders": [], "changed_files": {}}

    for folder_change in folders_changes:
        if (folder_change.diff_type == "?" or folder_change.diff_type == "+"):
            json_patch['changed_folders'].append({
                "sign": folder_change.diff_type,
                "path": folder_change.new_name,
            })
        else:
            json_patch['changed_folders'].append({
                "sign": folder_change.diff_type,
                "path": folder_change.old_name,
            })

    for folder_change in list(filter(lambda i: i.diff_type == "?" or i.diff_type == "+", folders_changes)):
        folder_changes = []
        
        for file_change in folder_change.diff_list:    
            if (file_change.diff_type == "?" or file_change.diff_type == "+"):
                file_name = file_change.new_name
            elif file_change.diff_type == "-":
                file_name = file_change.old_name
            else:
                continue

            file_path = os.path.join(folder_change.new_name, file_name)
            hash_file = get_single_not_text_file_ipfs(client, file_path, patches_local_project)
            hash_file_name = hash_file + "." + file_change.new_name.split(".")[-1]

            folder_changes.append({
                "sign": file_change.diff_type,
                "new_name": file_change.new_name,
                "old_name": file_change.old_name,
                "hash": hash_file
            })

            if (file_change.diff_type == "?"):
                if is_text_file(file_path):
                    original = get_single_text_file_ipfs(client, file_path, patches_local_project)
                    modified = get_single_text_file_ipfs(client, file_path, patches_updated_project)
                    with open(os.path.join(patch_name, "changes", hash_file_name), "w") as f:
                        f.write(create_patch(original, modified))
                else:
                    file_cid = get_single_not_text_file_ipfs(file_path, patches_updated_project)
                    folder_path = os.path.join(patch_name, "changes", hash_file_name)
                    client.get(file_cid, folder_path)

            elif (file_change.diff_type == "+"):
                new_file_path = os.path.join(patch_name, "changes", hash_file_name)
                client.get(file_cid, new_file_path)

        json_patch['changed_files'][folder_change.new_name] = folder_changes
    
    json_path = os.path.join(patch_name, "patch_json.json")
    with open(json_path, "w") as json_file:
        json.dump(json_patch, json_file, indent=2)