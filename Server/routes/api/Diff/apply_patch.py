import os
import json
import shutil
from .others import is_text_file
from .text_patch import apply_patch
from .get_from_ipfs import get_file_cid_from_patch
import ipfshttpclient2
from .diff_objects import Conflicted_file
from .get_from_ipfs import get_single_text_file_ipfs



# the function apply changes patch to a local project
def apply_project_patch(old: str, patch: str) -> None:
    with open(os.path.join(patch, "patch_json.json"), 'r') as conf:
        data = json.load(conf)

    for new_removed_folder in data["changed_folders"]:
        folder_path = os.path.join(old, new_removed_folder["path"])

        if (new_removed_folder["sign"] == "+"):
            os.mkdir(folder_path)

        elif (new_removed_folder["sign"] == "-"):
            os.rmdir(folder_path)

    changed_files = data["changed_files"]
    for changed_folder in changed_files.keys():
        for changed_file in changed_files[changed_folder]:
            if (changed_file["sign"] == "+"):
                new_file_path = os.path.join(old, changed_folder, changed_file["new_name"])
                shutil.copy(os.path.join(patch, 'changes', changed_file["hash"] + "." + changed_file["new_name"].split(".")[1]), new_file_path)
            
            elif (changed_file["sign"] == "-"):
                new_file_path = os.path.join(old, changed_folder, changed_file["old_name"])
                os.remove(new_file_path)

            elif (changed_file["sign"] == "?"):
                new_file_path = os.path.join(old, changed_folder, changed_file["new_name"])
                hash_path = os.path.join(patch, 'changes', changed_file["hash"] + "." + changed_file["new_name"].split(".")[1])

                if is_text_file(new_file_path):
                    with open(new_file_path, 'r') as textfile:
                        old_text = textfile.read()
                    
                    with open(hash_path, 'r') as textfile:
                        patch_text = textfile.read()
                    
                    applied_patch = apply_patch(old_text, patch_text)
                    with open(new_file_path, 'w') as textfile:
                        textfile.write(applied_patch)
                else:
                    shutil.copy2(hash_path, new_file_path)


def apply_project_patch_from_remote_project(client: ipfshttpclient2.Client, old: str, patch: str, ignore: dict[str, dict[str, int] | dict[str, list[dict[str, int]]]]=None) -> None:
    patch_cid, changes_folder_cid = get_file_cid_from_patch(client, patch, "patch_json.json", "changes")

    json_data = client.cat(patch_cid)
    data = json.loads(json_data.decode('utf-8'))

    for new_removed_folder in data["changed_folders"]:
        folder_path = os.path.join(old, new_removed_folder["path"])

        if (new_removed_folder["sign"] == "+"):
            os.mkdir(folder_path)

        elif (new_removed_folder["sign"] == "-"):
            if ignore != None:
                folder_conflicts = ignore.get("new_removed_folder")
                if (folder_conflicts != None or folder_conflicts != []):
                    continue
                else:
                    os.rmdir(folder_path)

    changed_files = data["changed_files"]
    for changed_folder in changed_files.keys():
        for changed_file in changed_files[changed_folder]:

            if ignore != None:
                ignored_changed_folders = ignore["files"]
                ignored_file = ignored_changed_folders.get(changed_folder).get(changed_file)
                if (ignored_file != None and ignored_file != 1):
                    continue

            if (changed_file["sign"] == "+"):
                new_file_path = os.path.join(old, changed_folder, changed_file["new_name"])
                hash_file_name = changed_file["hash"] + "." + changed_file["new_name"].split(".")[1]
                changed_file_cid = get_file_cid_from_patch(client, changes_folder_cid, hash_file_name)
                
                new_file_cid = client.get(changed_file_cid, new_file_path)
                os.rename(os.path.join(new_file_path, new_file_cid), os.path.join(new_file_path, changed_file["new_name"]))

            
            elif (changed_file["sign"] == "-"):
                old_file_path = os.path.join(old, changed_folder, changed_file["old_name"])
                os.remove(old_file_path)

            elif (changed_file["sign"] == "?"):
                old_file_path = os.path.join(old, changed_folder, changed_file["old_name"])
                hash_path = os.path.join(patch, 'changes', changed_file["hash"] + "." + changed_file["new_name"].split(".")[1])
                changed_file_cid = get_file_cid_from_patch(client, changes_folder_cid, hash_path)

                if is_text_file(old_file_path):
                    old_text = client.cat(changed_file_cid).decode('utf-8')
                    
                    with open(hash_path, 'r') as textfile:
                        patch_text = textfile.read()
                    
                    applied_patch = apply_patch(old_text, patch_text)
                    with open(old_file_path, 'w') as textfile:
                        textfile.write(applied_patch)
                else:
                    shutil.copy2(hash_path, old_file_path)
                    os.remove(old_file_path)
                    hash_file_name = changed_file["hash"] + "." + changed_file["new_name"].split(".")[1]
                    changed_file_cid = get_file_cid_from_patch(client, changes_folder_cid, hash_file_name)
                    added_file_cid = client.get(changed_file_cid, old_file_path + "\\")
                    os.rename(os.path.join(old_file_path, added_file_cid), changed_file["new_name"])


def apply_conflicts_configurations(client: ipfshttpclient2.Client, old: str, original_project: list[str], new_patches: list[str], conflicts: dict[str, dict[str, int] | dict[str, list[dict[str, int]]]]) -> None:
    conflicted_folders = conflicts["folders"]
    for conflicted_folder in conflicted_folders.keys():
        action = conflicted_folders.get(conflicted_folder)
        if action == 2:
            os.rmdir(os.path.join(old, conflicted_folder))

    conflicted_changed_folders = conflicts["files"]
    for conflicted_changed_folder in conflicted_changed_folders.keys():
        conflicted_changed_folder_files = conflicted_changed_folders[conflicted_changed_folder]
        
        for conflicted_file in conflicted_changed_folder_files:
            file_name = conflicted_file.keys()[0]
            action = conflicted_file[file_name]

            if action == 2:
                file_path = os.path.join(conflicted_changed_folder, file_name)
                file_absolute_path = os.path.join(old, file_path)

                file_content = get_single_text_file_ipfs(client, file_path, original_project + new_patches)
                
                if is_text_file(file_name):
                    with open(file_absolute_path, 'w') as textfile:
                        textfile.write(file_content)
                else:
                    os.remove(file_absolute_path)
                    folder_abs_path = os.path.join(old, conflicted_changed_folder)
                    added_file_cid = client.get(file_content, folder_abs_path)
                    os.rename(os.path.join(folder_abs_path, added_file_cid), file_name)
