from .get_from_ipfs import get_file_cid_from_patch
import ipfshttpclient2
import json
import os
from .wrappers import save_path


def get_removed_folders_in_json(data_json: dict[str, str]) -> list[str]:
    removed_folders = []
    for removed_folder in data_json["changed_folders"]:
        folder_path = removed_folder["path"]
        if (removed_folder["sign"] == "-"):
            removed_folders.append(folder_path)
    return removed_folders

def compare_patches(client: ipfshttpclient2.Client, project_name: str, patch: str, other_patch: str) -> set:
    current_path = os.getcwd() 
    while (os.path.basename(os.getcwd()) != "projects"):
        os.chdir("..")
    
    patch_cid = get_file_cid_from_patch(client, patch, "patch_json.json")
    other_patch_cid = get_file_cid_from_patch(client, other_patch, "patch_json.json")

    json_patch_data = client.cat(patch_cid)
    data_patch = json.loads(json_patch_data.decode('utf-8'))
    json_other_patch_data = client.cat(other_patch_cid)
    data_other_patch = json.loads(json_other_patch_data.decode('utf-8'))

    removed_folders = []
    removed_folders.extend(get_removed_folders_in_json(data_patch))
    removed_folders.extend(get_removed_folders_in_json(data_other_patch))
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
    
    changed_files = data_other_patch["changed_files"]
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
def get_conflicts(client: ipfshttpclient2.Client, project_name, patch: str, other_patches: list[str]) -> dict[str, list[str] | dict[str, list[str]]]:
    conflicts = set()
    for other_patch in other_patches:
        conflicts = conflicts.union(compare_patches(client, project_name, patch, other_patch))
    return paths_list_to_dict(list(conflicts))