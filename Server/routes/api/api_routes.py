import time
import os
import flask
from flask import jsonify, request
import ipfshttpclient2
from flask import Blueprint
import shutil
from .Diff.create_patch import create_project_patch_json
from .Diff.create_patch import create_project_patch_from_remote_project
from .Diff.compare_projects import compare_remote_project_folder_changes
from .Diff.get_from_ipfs import get_single_text_file_ipfs
from .Diff.get_from_ipfs import get_remote_project_tree
from .Diff.apply_patch import apply_project_patch_from_remote_project
import json
# This page contains all the accessible API routes for users, each function with @api_routes representing an individual route.
api_routes = Blueprint('api_routes', __name__, url_prefix="/api")


# the function initiate necessary data on the project
class API_Context:
    def __init__(self):
        self.base_path = "C:\\Users\\User\\Desktop\\תכנות\\davidson\\project\\DavidsonProject\\Server"
        self.client_addr = '/ip4/127.0.0.1/tcp/5001'
    
    def Start(self: str) -> ipfshttpclient2.Client:
        os.chdir(self.base_path)
        return ipfshttpclient2.connect(self.client_addr)

api_context = API_Context()


# the functions upload a new project to the IPFS and returns it's CID
@api_routes.route('/upload', methods=['POST'])
def upload() -> flask.Response:
    client = api_context.Start()
    try:
        data = request.get_json()
        os.chdir("projects")

        file_path = data['path']
        if data['path']:
            os.mkdir("Temp")
            os.chdir("Temp")
            os.mkdir("base")

            create_project_patch_json("base", file_path, "base")

            result = client.add("patch-base", recursive=True)
            ipfs_hash = result[-1]["Hash"]
            
            project_details = {
            "project-name": data["name"],
            "project-path": data["path"],
            "project-changes": [ipfs_hash]
            }

            with open("project_details.json", 'w') as json_file:
                json.dump(project_details, json_file, indent=4)
            os.rmdir("base")
            os.mkdir("changes")
            os.chdir("..")
            os.rename("Temp", data["name"])
            message = jsonify({'ipfsCID': ipfs_hash}), 200
        else:
            message = jsonify({'error': 'Invalid file path'}), 400
        
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message
    

# the functions downloads a remote project
@api_routes.route('/download_project', methods=['POST'])
def download_project() -> flask.Response:
    client = api_context.Start()
    try:
        data = request.get_json()
        patches_cids = data["changes"]
        project_path = data["path"]
        project_name = data["file_name"]
        os.chdir(project_path)
        if (project_name not in os.listdir()):
            os.mkdir(project_name)
            os.chdir(project_name)
            all_files = get_project_files_internal(patches_cids, client)
            folders = sorted([j for j in all_files if "." not in j], key=lambda x: x.count("\\"))
            files = [j for j in all_files if "." in j]
            for folder_name in folders:
                if ("." not in folder_name):
                    os.mkdir(folder_name)
            
            for file_name in files:
                file_temp = get_single_text_file_ipfs(client, file_name, patches_cids)
                if (isinstance(file_temp, list)):
                    client.get(file_temp[0], file_name)
                else:
                    with open(file_name, 'w') as new_file:
                        new_file.write(file_temp)

            return jsonify({'message': 352}), 200
        
        message = jsonify({'message': 354}), 200
    
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message

# the functions create a changes patch from updated version of a project and a local project
@api_routes.route('/save_changes', methods=['POST'])
def save_changes() -> flask.Response:
    try:
        client = api_context.Start()
        data = request.get_json()
        project_name = data["name"]
        os.chdir("projects")
        os.chdir(project_name)
        with open("project-details.json", 'r') as json_file:
            project_details = json.load(json_file)
            os.chdir("changes")
            if (unsaved_changes_internal(change_cids=project_details["project-changes"], project_path=project_details["project-path"], client=client)):
                create_project_patch_from_remote_project(client, project_details["project-changes"], project_details["project-path"], str(round(time.time())))
                message = jsonify({'message': 355}), 200
            else:
                message = jsonify({"message": 356}, 200)
            
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message

# the functions returns the local changes
@api_routes.route('/get_my_changes', methods=['POST'])
def get_my_changes() -> flask.Response:
    api_context.Start()
    try:
        data = request.get_json()
        project_name = data["name"]
        os.chdir("projects")
        os.chdir(project_name)
        my_changes = os.listdir("changes")
        message = jsonify({'my_changes': my_changes}), 200
            
    except Exception as e:
        message = jsonify({'error': str(e)}), 500

    finally:
        return message
    
# the functions checks if unsaved changes exist
def unsaved_changes_internal(change_cids, project_path, client) -> flask.Response:
    folder_changes = compare_remote_project_folder_changes(client, change_cids, project_path)
    filtered = list(filter(lambda folder: folder.diff_type != "/", folder_changes))
    if (len(filtered) != 0):
        return True
    else:
        return False

# the function upload changes patch to IPFS
@api_routes.route('/upload_changes', methods=['POST'])
def upload_changes() -> flask.Response:
    try:
        client = api_context.Start()
        data = request.get_json()
        project_name = data["name"]
        change_name = data["change_name"]
        os.chdir("projects")
        os.chdir(project_name)
        with open("project-details.json", 'r') as json_file:
            project_details = json.load(json_file)
    
        if unsaved_changes_internal(change_cids=project_details["project-changes"], project_path=project_details["project-path"], client=client):
            my_changes = os.listdir("changes")
            last_change = my_changes.index(change_name)
            result = client.add(os.path.join("changes", my_changes[last_change]), recursive=True)
            ipfs_hash = result[-1]["Hash"]
            
            message = jsonify({'ipfsCID': ipfs_hash}), 200
        else:
            message = jsonify({'unsaved changes': 357}), 500
            
    except Exception as e:
        print(e)
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message

# the function update local project
@api_routes.route('/update_project', methods=['POST'])
def update_project() -> flask.Response:
    client = api_context.Start()
    try:
        data = request.get_json()
        changes_cids = data["changes"]
        project_name = data["name"]
        os.chdir("projects")
        os.chdir(project_name)

        if (unsaved_changes_internal(change_cids=project_details["project-changes"], project_path=project_details["project-path"], client=client)):
            pass
        
        with open("project-details.json", 'r') as json_file:
            project_details = json.load(json_file)
            for i in range(len(changes_cids)):
                if changes_cids[i] != project_details["project-changes"][i]:
                    apply_project_patch_from_remote_project(client, project_details["project-path"], project_details["project-changes"][i])
        
        message = jsonify({'message': 352}), 200
            
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message

# the functions returns the status of local project
@api_routes.route('/check-project', methods=['POST'])
def check_project() -> flask.Response:
    api_context.Start()
    try:
        os.chdir("projects")
        data = request.get_json()
        changes_cids = data["changes"]
        message = ""
        if (data["name"] not in os.listdir()):
            message = {'message': 353}
        
        else:
            os.chdir(data["name"])
            with open("project-details.json", 'r') as json_file:
                project_details = json.load(json_file)
            if (project_details["project-changes"] == changes_cids):
                message = {'message': 354}
            else:
                message = {'message': 351}

        message = jsonify(message), 200
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    finally:
        return message
    

# the function returns the tree of files in a remote project
def get_project_files_internal(changes_cids, client) -> list:
    project_tree = get_remote_project_tree(client, changes_cids)
    project_tree_list = []
    for folder in project_tree.keys():
        folder_files = [os.path.join(folder, file_name) for file_name in project_tree[folder]]
        folder_files.append(folder)
        project_tree_list.extend(folder_files)
    
    return project_tree_list


# the function returns the tree of files in a remote project
@api_routes.route('/get_project_files', methods=['POST'])
def get_project_files() -> flask.Response:
    client = api_context.Start()
    try:
        os.chdir("projects")
        data = request.get_json()
        changes_cids = data["changes"]
        os.chdir(data["name"])
        all_files = get_project_files_internal(changes_cids, client)
        
        message = jsonify({"files": all_files}), 200
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message
    
# the function returns a single remote file content
@api_routes.route('/get_file', methods=['POST'])
def get_single_file() -> flask.Response:
    client = api_context.Start()
    try:
        data = request.get_json()
        changes_cids = data["changes"]
        file_name = data["file_name"]
        version = get_single_text_file_ipfs(client, file_name, changes_cids)
        message = jsonify({'file': version}), 200
    
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message

@api_routes.route('/getLocalProjects', methods=['GET'])
def getLocalProjects() -> flask.Response:
    api_context.Start()
    try:
        local_projects = os.listdir("projects")
        message = jsonify({'projects': local_projects}), 200

    except Exception as e:
        print(e)
        message = jsonify({'error': str(e)}), 500
    return message

@api_routes.route('/delete_change', methods=['POST'])
def delete_change() -> flask.Response:
    client = api_context.Start()
    try:
        data = request.get_json()
        change_name = data["change_name"]
        project_name = data["name"]
        
        os.chdir("projects")
        os.chdir(project_name)
        os.chdir("changes")

        shutil.rmtree(change_name)
        message = jsonify({'my_changes': os.listdir()}), 200
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message
