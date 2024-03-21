import os
import json
import shutil
from .others import is_text_file
from .text_patch import apply_patch
from .get_from_ipfs import get_file_cid_from_patch
import ipfshttpclient2



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


def apply_project_patch_from_remote_project(client: ipfshttpclient2.Client, old: str, patch: str) -> None:
    patch_cid, changes_folder_cid = get_file_cid_from_patch(client, patch, "patch_json.json", "changes")

    json_data = client.cat(patch_cid)
    data = json.loads(json_data.decode('utf-8'))

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

# if __name__ == "__main__":
#     client = ipfshttpclient2.client.connect("/ip4/127.0.0.1/tcp/5001")
#     apply_project_patch_from_remote_project(client, "Diff\\new\\", "QmUgj1yWJBtzjzbFqHvXriLsSop23WFJaTzbV5CkgJLtmT")
