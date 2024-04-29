from .get_from_ipfs import get_file_cid_from_patch
import ipfshttpclient2
import json
import os
from .wrappers import save_path
from .compare_projects import compare_remote_projects
from .others import get_local_file_hash

def get_removed_folders_in_json(data_json: dict[str, str]) -> list[str]:
    removed_folders = []
    for removed_folder in data_json["changed_folders"]:
        folder_path = removed_folder["path"]
        if (removed_folder["sign"] == "-"):
            removed_folders.append(folder_path)
    return removed_folders


def compare_patches(client: ipfshttpclient2.Client, local_patch: str, updated_patch_data: dict) -> set[str]:
    current_path = os.getcwd() 
    while (os.path.basename(os.getcwd()) != "projects"):
        os.chdir("..")
    
    patch_cid = get_file_cid_from_patch(client, local_patch, "patch_json.json")

    json_patch_data = client.cat(patch_cid)
    data_patch = json.loads(json_patch_data.decode('utf-8'))

    removed_folders = []
    removed_folders.extend(get_removed_folders_in_json(data_patch))
    removed_folders.extend(get_removed_folders_in_json(updated_patch_data))
    patch_files = set()
    other_patch_files = set()
    conflicts = set([i for i in removed_folders if removed_folders.count(i) == 2])
    
    changed_files = data_patch["changed_files"]
    for changed_folder in changed_files.keys():
        if (changed_folder in removed_folders):
            conflicts.add(changed_folder)
            continue
        for changed_file in changed_files[changed_folder]:
            if (changed_file["sign"] == "+"):
                patch_files.add(os.path.join(changed_folder, changed_file["new_name"]))
            else:
                patch_files.add(os.path.join(changed_folder, changed_file["old_name"]))
    
    changed_files = updated_patch_data["changed_files"]
    for changed_folder in changed_files.keys():
        if (changed_folder in removed_folders):
            conflicts.add(changed_folder)
            continue
        for changed_file in changed_files[changed_folder]:
            if (changed_file["sign"] == "+"):
                other_patch_files.add(os.path.join(changed_folder, changed_file["new_name"]))
            else:
                other_patch_files.add(os.path.join(changed_folder, changed_file["old_name"]))
    merged_conflicts = conflicts.union(patch_files & other_patch_files)
    
    os.chdir(current_path)
    return merged_conflicts


def paths_list_to_dict(paths: list[str]) -> dict[str, list[str] | dict[str, list[str]]]:
    folder_dict = []
    file_dict = {}
    
    for path in paths:
        folders = path.split('/')
        folder_path = '/'.join(folders[:-1])
        filename = folders[-1]
        if "." in filename: 
            if folder_path not in file_dict:
                file_dict[folder_path] = []
            file_dict[folder_path].append(filename)
        else:  
            folder_dict.append(path)
            
    return {'folders': folder_dict, 'files': file_dict}

#                                                             folder/file -> folders | folder -> file
def get_conflicts(client: ipfshttpclient2.Client, patch: str, patches_local_project: list[str], patches_updated_project: list[str]) -> dict[str, list[str] | dict[str, list[str]]]:
    json_data = create_updates_patch(client, patches_updated_project, patches_local_project)
    conflicts = compare_patches(client, patch, json_data)
    return paths_list_to_dict(list(conflicts))


def create_updates_patch(
        client, 
        patches_updated_project: list[str], 
        patches_local_project: list[str], 
    ) -> dict[str, list[dict, str]]:

    folders_changes = compare_remote_projects(client, patches_updated_project, patches_local_project)
    
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
            
            hash_file = None
                
            folder_changes.append({
                "sign": file_change.diff_type,
                "new_name": file_change.new_name,
                "old_name": file_change.old_name,
                "hash": hash_file
            })

        json_patch['changed_files'][folder_change.new_name] = folder_changes
    
    return json_patch