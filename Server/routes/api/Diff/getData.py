import json
import os
import hashlib
import base64
from .others import is_text_file, get_local_file_hash
from .textFilePatch import apply_patch


# The function returns the hash of a file in a remote project
def get_ipfs_file_hash(client, changes_cids, file_name):
    file_content = get_single_file_internal(changes_cids, file_name, client)

    if isinstance(file_content, list):
        file_content = client.cat(file_content[0])

    if not is_text_file(file_name):
        file_content = base64.b64encode(file_content).decode('utf-8')

    hasher = hashlib.sha256()
    hasher.update(file_content.encode('utf-8'))
    return hasher.hexdigest()

# the functions compare two files (one local and one on IPFS)
def compare_files_from_ipfs(client, cid_changes, file_name, local_file_path):
    ipfs_hash = get_ipfs_file_hash(client, cid_changes, file_name)
    local_hash = get_local_file_hash(local_file_path)
    return ipfs_hash == local_hash

# the functions compare two directories (one local and one on IPFS)
def compare_directories_cid(client, changes_cids, file_names, local_dir_path):
    if len(file_names) != len(os.listdir(local_dir_path)):
        print(len(file_names), len(os.listdir(local_dir_path)))
        return False
    
    for file_name in file_names:
        local_file_path = os.path.join(local_dir_path, os.path.basename(file_name))
        if os.path.basename(file_name) in os.listdir(local_dir_path) and not compare_files_from_ipfs(client, changes_cids, file_name, local_file_path):
            return False
    
    return True

# the function returns the list of files in a local project from an existing list
def get_project_files(old_list, patch):
    with open(os.path.join(patch, "patchJson.json"), 'r') as conf:
        data = json.load(conf)

    for changed_dir, changes_list in data["Changes"].items():
        for change in changes_list:
            new_file_path = os.path.join(list(changed_dir.split("-")[1].split("\\")[1:]), change["name"])
            if change["Sign"] == "+":
                old_list.append(new_file_path)
            elif change["Sign"] == "?":
                if change["New_name"] != change["Old_name"]:
                    new_file_path = os.path.join(list(changed_dir.split("-")[1].split("\\")[1:]), change["New_name"])
            elif change["Sign"] == "*":
                new_file_path = os.path.join(list(changed_dir.split("-")[1].split("\\")[1:]), change["New_name"])
                old_file_name = os.path.join(changed_dir.split("-")[1], change["Old_name"])
                old_list[old_list.index(old_file_name)] = new_file_path
            elif change["Sign"] == "-":
                new_file_path = os.path.join(list(changed_dir.split("-")[1].split("\\")[1:]), change["name"])
                if new_file_path in old_list:
                    old_list.pop(old_list.index(new_file_path))


# the function returns the list of files in a remote project from an existing list
def get_project_files_cid(old_list, patch_cid, client):
    files_list = client.ls(patch_cid)
    
    for i in files_list["Objects"]:
        for j in i['Links']:
            if j['Name'] == "patchJson.json":
                patch_json_cid = j["Hash"]

    json_data = client.cat(patch_json_cid)
    data = json.loads(json_data.decode('utf-8'))

    for changed_dir in data["Directories_Changes"]:
        if (changed_dir["sign"] == "+"):
            old_list.append(changed_dir["path"])
        elif (changed_dir["sign"] == "-"):
            old_list.pop(old_list.index(changed_dir["path"]))

    for changed_dir in data["Changes"]:
        for change in list(changed_dir.items())[0][1]:
            if change["Sign"] == "+":
                new_file_path = "\\".join(os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["name"]).split("\\"))
                old_list.append(new_file_path)
                     
            elif change["Sign"] == "?":                
                if change["New_name"] != change["Old_name"]:
                    new_file_path = "\\".join(os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["New_name"]).split("\\"))
            
            elif change["Sign"] == "*":
                new_file_path = "\\".join(os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["New_name"]).split("\\"))
                old_file_name = os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["Old_name"])
                old_list[old_list.index(old_file_name)] = new_file_path

            elif change["Sign"] == "-":
                new_file_path = "\\".join(os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["name"]).split("\\"))
                old_list.pop(old_list.index(new_file_path))
    return old_list


# the functions returns the content of a file on a single change
def get_file_content(file_name, change_cid, client):
    files_list = client.ls(change_cid)
    
    for i in files_list["Objects"]:
        for j in i['Links']:
            if j['Name'] == "patchJson.json":
                patch_json_cid = j["Hash"]
            elif j['Name'] == "changes":
                changes_folder_cid = j["Hash"]

    json_data = client.cat(patch_json_cid)
    data = json.loads(json_data.decode('utf-8'))

    changed = False
    for changed_dir in data["Changes"]:
        for change in list(changed_dir.items())[0][1]:         
            if change["Sign"] == "?":     
                try:
                    new_file_path = os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["New_name"])    
                except:
                    new_file_path = os.path.join(list(changed_dir.items())[0][0], change["New_name"])
                if new_file_path == file_name:
                    changed = change["Hash"] + "." + change["New_name"].split(".")[1]
            elif change["Sign"] == "+":
                try:
                    new_file_path = os.path.join(list(changed_dir.items())[0][0].split("-")[1], change["name"])
                except:
                    new_file_path = os.path.join(list(changed_dir.items())[0][0], change["name"])
                if new_file_path == file_name:
                    changed = change["Hash"] + "." + change["name"].split(".")[1]

    if changed == False:
        return False
    
    files_list = client.ls(changes_folder_cid)
    for i in files_list["Objects"]:
        for j in i['Links']:
            if j['Name'] == changed:
                changed_file_hash = j["Hash"]
                changed_file_name = j["Name"]
                
    if not is_text_file(changed_file_name):
        return [changed_file_hash, "CID"]
    else:
        return client.cat(changed_file_hash).decode('utf-8')


# the functions returns the tree files in a remote project
def get_file_paths_in_cid(client, cid):
    files_list = client.ls(cid)
    for i in files_list["Objects"]:
        for j in i['Links']:
            if j['Name'] == "patchJson.json":
                patch_json_cid = j["Hash"]
            elif j['Name'] == "changes":
                changes_folder_cid = j["Hash"]
    
    files_list = client.ls(changes_folder_cid)
    json_data = client.cat(patch_json_cid)
    data = json.loads(json_data.decode('utf-8'))

    list_files = []
    for changed_dir in data["Changes"]:
        if list(changed_dir.items())[0][0] != "-":
            list_files.append(list(changed_dir.items())[0][0].replace("-", ""))

        for change in list(changed_dir.items())[0][1]:
            if change["Sign"] == "+":            
                if (list(changed_dir.items())[0][0].replace("-", "") != ""):
                    list_files.append(os.path.join(list(changed_dir.items())[0][0], change["name"]).replace("-", ""))
                else:
                    list_files.append(change["name"])
    return list_files

# the functions returns the content of a file on a remote project
def get_single_file_internal(changes_cids, file_name, client):
    hash_idx = 0
    
    if len(changes_cids) > 1:
        for cid in range(0, len(changes_cids)):
            if is_create_in_change(file_name, changes_cids[cid], client):
                hash_idx = cid
    version = get_file_content(file_name, changes_cids[hash_idx], client)
    if len(changes_cids) > 1 and type(version) != list:
        for cid in range(hash_idx + 1, len(changes_cids)):
            patch = get_file_content(file_name, changes_cids[cid], client)
            if patch != version and patch != False:
                version = apply_patch(version, patch)
    return version

# The function checks whether a file was created on a certain change
def is_create_in_change(file_name, change_cid, client):
    files_list = client.ls(change_cid)
    
    for i in files_list["Objects"]:
        for j in i['Links']:
            if j['Name'] == "patchJson.json":
                patch_json_cid = j["Hash"]
    json_data = client.cat(patch_json_cid)
    data = json.loads(json_data.decode('utf-8'))

    created = False
    for changed_dir in data["Changes"]:
        for change in list(changed_dir.items())[0][1]:
            if change["Sign"] == "+":
                new_file_path = os.path.join(list(changed_dir.items())[0][0].split("-")[-1], change["name"])
                if new_file_path == file_name:
                    created = True
    return created


