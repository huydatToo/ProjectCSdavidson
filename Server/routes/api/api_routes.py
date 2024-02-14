import time
import os
from flask import jsonify, request
import ipfshttpclient2
from .Diff.ApplyPatch import apply_project_patch_cid
import json
from .Diff.getData import get_project_files_cid
from .Diff.CreatePatch import create_project_patch_json
from .Diff.CreatePatch import create_project_patch_json_cid
from .Diff.getData import get_file_paths_in_cid
from .Diff.getData import get_single_file_internal
from .Diff.CreatePatch import compare_projects_cid
from flask import Blueprint

# This page contains all the accessible API routes for users, each function with @api_routes representing an individual route.
api_routes = Blueprint('api_routes', __name__, url_prefix="/api")


# the function initiate necessary data on the project
class API_Context:
    def __init__(self):
        self.base_path = "C:\\Users\\User\\Desktop\\תכנות\\davidson\\project\\DavidsonProject\\Server"
        self.client_addr = '/ip4/127.0.0.1/tcp/5001'
    
    def Start(self):
        os.chdir(self.base_path)
        return ipfshttpclient2.connect(self.client_addr)

api_context = API_Context()


# the functions upload a new project to the IPFS and returns it's CID
@api_routes.route('/upload', methods=['POST'])
def upload():
    client = api_context.Start()
    try:
        data = request.get_json()
        os.chdir("projects")

        file_path = data['path']
        if data['path']:
            os.mkdir("Temp")
            os.chdir("Temp")
            os.mkdir("base")
            create_project_patch_json("base", file_path)

            result = client.add("patch-base", recursive=True)
            ipfs_hash = result[-1]["Hash"]
            
            project_details = {
            "project-name": data["name"],
            "project-path": data["path"],
            "project-changes": [ipfs_hash]
            }

            with open("project-details.json", 'w') as json_file:
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
def download_project():
    client = api_context.Start()
    try:
        data = request.get_json()
        changes_cids = data["changes"]
        project_path = data["path"]
        project_name = data["file_name"]
        os.chdir(project_path)
        if (project_name not in os.listdir()):
            os.mkdir(project_name)
            os.chdir(project_name)
            all_files = get_project_files_internal(changes_cids, client)
            folders = sorted([j for j in all_files if "." not in j], key=lambda x: x.count("\\"))
            files = [j for j in all_files if "." in j]
            for i in folders:
                if ("." not in i):
                    os.mkdir(i)
            
            for i in files:
                file_temp = get_single_file_internal(changes_cids, i, client)
                if (type(file_temp) == list):
                    client.get(file_temp[0], i)
                else:
                    with open(i, 'w') as new_file:
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
def save_changes():
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
                create_project_patch_json_cid(project_details["project-changes"], project_details["project-path"], "changes-" + str(round(time.time())), client)
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
def get_my_changes():
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
def unsaved_changes_internal(change_cids, project_path, client):
    _, files_changes = compare_projects_cid(change_cids, project_path, client)
    if ("+" in str(files_changes) or "-" in str(files_changes) or "?" in str(files_changes)):
        return True
    else:
        return False

# the function upload changes patch to IPFS
@api_routes.route('/upload_changes', methods=['POST'])
def upload_changes():
    try:
        client = api_context.Start()
        data = request.get_json()
        project_name = data["name"]
        os.chdir("projects")
        os.chdir(project_name)
        with open("project-details.json", 'r') as json_file:
            project_details = json.load(json_file)
    
        if unsaved_changes_internal(change_cids=project_details["project-changes"], project_path=project_details["project-path"], client=client):
            my_changes = os.listdir("changes")
            last_change = max(my_changes, key=lambda f: int(f.split("-")[2]))
            result = client.add(os.path.join("changes", last_change), recursive=True)
            ipfs_hash = result[-1]["Hash"]
            
            message = jsonify({'ipfsCID': ipfs_hash}), 200
        else:
            message = jsonify({'unsaved changes': 357}), 500
            
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message

# the function update local project
@api_routes.route('/updateproject', methods=['POST'])
def update_project():
    client = api_context.Start()
    try:
        data = request.get_json()
        changes_cids = data["changes"]
        project_name = data["name"]
        os.chdir("projects")
        os.chdir(project_name)
        with open("project-details.json", 'r') as json_file:
            project_details = json.load(json_file)
            for i in range(len(changes_cids)):
                if changes_cids[i] != project_details["project-changes"][i]:
                    apply_project_patch_cid(project_details["project-path"], project_details["project-changes"][i], client)
        message = jsonify({'message': 352}), 200
            
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message

# the functions returns the status of local project
@api_routes.route('/check-project', methods=['POST'])
def check_project():
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
def get_project_files_internal(changes_cids, client):
    all_files = get_file_paths_in_cid(client, changes_cids[0])
    if len(changes_cids) > 1:
        for change in changes_cids[1:]:
            all_files = get_project_files_cid(all_files, change, client)
    return all_files


# the function returns the tree of files in a remote project
@api_routes.route('/get_project_files', methods=['POST'])
def get_project_files():
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
def get_single_file():
    client = api_context.Start()
    try:
        data = request.get_json()
        changes_cids = data["changes"]
        file_name = data["file_name"]
        version = get_single_file_internal(changes_cids, file_name, client)
        message = jsonify({'file': version}), 200
    
    except Exception as e:
        message = jsonify({'error': str(e)}), 500
    
    finally:
        client.close()
        return message

@api_routes.route('/getLocalProjects', methods=['GET'])
def getLocalProjects():
    api_context.Start()
    try:
        local_projects = os.listdir("projects")
        message = jsonify({'projects': local_projects}), 200

    except Exception as e:
        print(e)
        message = jsonify({'error': str(e)}), 500
    return message

