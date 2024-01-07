react_build_dir = "C:/Users/User/Desktop/תכנות/davidson/project/DavidsonProject/WebApp/steps/build"

import time
import os
from flask import Flask, send_from_directory, jsonify, request
import ipfshttpclient2
from flask_cors import CORS
from Diff.ApplyPatch import apply_project_patch_cid
import json
from Diff.getData import get_project_files_cid
from Diff.CreatePatch import create_project_patch_json
from Diff.CreatePatch import create_project_patch_json_cid
from Diff.getData import get_file_paths_in_cid
from Diff.getData import get_single_file_internal
from Diff.CreatePatch import compare_projects_cid

app = Flask(__name__, static_folder=react_build_dir)
CORS(app)

class AppContext:
    def __init__(self):
        self.base_path = os.getcwd()

app_context = AppContext()


# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


# other functions
@app.route('/api/upload', methods=['POST'])
def upload():
    os.chdir(app_context.base_path)
    client = ipfshttpclient2.connect('/ip4/127.0.0.1/tcp/5001')
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
            client.close()
            os.rmdir("base")
            os.mkdir("changes")
            os.chdir("..")
            os.rename("Temp", data["name"])
            return jsonify({'ipfsCID': ipfs_hash}), 200
        else:
            client.close()
            print("Invalid file path")
            return jsonify({'error': 'Invalid file path'}), 400
        
    except Exception as e:
        client.close()
        return jsonify({'error': str(e)}), 500
    


@app.route('/api/download_project', methods=['POST'])
def download_project():
    os.chdir(app_context.base_path)
    try:
        data = request.get_json()
        changes_cids = data["changes"]
        project_path = data["path"]
        project_name = data["file_name"]
        os.chdir(project_path)
        if (project_name not in os.listdir()):
            os.mkdir(project_name)
            os.chdir(project_name)
            client = ipfshttpclient2.connect('/ip4/127.0.0.1/tcp/5001')
            all_files = get_project_files_internal(changes_cids, client)
            folders = sorted([j for j in all_files if "." not in j], key=lambda x: x.count("\\"))
            files = [j for j in all_files if "." in j]
            for i in folders:
                if ("." not in i):
                    os.mkdir(i)
            
            for i in files:
                file_temp = get_single_file_internal(changes_cids, i)
                if (type(file_temp) == list):
                    client.get(file_temp[0], i)
                else:
                    with open(i, 'w') as new_file:
                        new_file.write(file_temp)

            return jsonify({'message': 352}), 200
        
        return jsonify({'message': 354}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/save_changes', methods=['POST'])
def save_changes():
    os.chdir(app_context.base_path)
    try:
        data = request.get_json()
        project_name = data["name"]
        os.chdir("projects")
        os.chdir(project_name)
        with open("project-details.json", 'r') as json_file:
            project_details = json.load(json_file)
            os.chdir("changes")
            if (un_saved_changes_internal(project_details["project-changes"], project_details["project-path"])):
                create_project_patch_json_cid(project_details["project-changes"], project_details["project-path"], "changes-" + str(round(time.time())))
                return jsonify({'message': 355}), 200
            else:
                return jsonify({"message": 356}, 200)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get_my_changes', methods=['POST'])
def get_my_changes():
    os.chdir(app_context.base_path)
    try:
        data = request.get_json()
        project_name = data["name"]
        os.chdir("projects")
        os.chdir(project_name)
        my_changes = os.listdir("changes")
        return jsonify({'my_changes': my_changes}), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def un_saved_changes_internal(change_cids, project_path):
    _, files_changes = compare_projects_cid(change_cids, project_path)
    if ("+" in str(files_changes) or "-" in str(files_changes) or "?" in str(files_changes)):
        return True
    else:
        return False

@app.route('/api/upload_changes', methods=['POST'])
def upload_changes():
    os.chdir(app_context.base_path)
    try:
        data = request.get_json()
        project_name = data["name"]
        os.chdir("projects")
        os.chdir(project_name)
        with open("project-details.json", 'r') as json_file:
            project_details = json.load(json_file)
    
        if un_saved_changes_internal(project_details["project-changes"], project_details["project-path"]):
            my_changes = os.listdir("changes")
            last_change = max(my_changes, key=lambda f: int(f.split("-")[2]))
            client = ipfshttpclient2.connect('/ip4/127.0.0.1/tcp/5001')
            result = client.add(os.path.join("changes", last_change), recursive=True)
            ipfs_hash = result[-1]["Hash"]
            
            return jsonify({'ipfsCID': ipfs_hash}), 200
        else:
            return jsonify({'unsaved changes': 357}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/updateproject', methods=['POST'])
def update_project():
    os.chdir(app_context.base_path)
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
                    apply_project_patch_cid(project_details["project-path"], project_details["project-changes"][i])
        return jsonify({'message': 352}), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/check-project', methods=['POST'])
def check_project():
    os.chdir(app_context.base_path)
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

        return jsonify(message), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

def get_project_files_internal(changes_cids, client):
    all_files = get_file_paths_in_cid(client, changes_cids[0])
    if len(changes_cids) > 1:
        for change in changes_cids[1:]:
            all_files = get_project_files_cid(all_files, change)
    return all_files


@app.route('/api/get_project_files', methods=['POST'])
def get_project_files():
    client = ipfshttpclient2.connect('/ip4/127.0.0.1/tcp/5001')
    os.chdir(app_context.base_path)
    try:
        os.chdir("projects")
        data = request.get_json()
        changes_cids = data["changes"]
        os.chdir(data["name"])
        all_files = get_project_files_internal(changes_cids, client)
        
        return jsonify({"files": all_files}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/get_file', methods=['POST'])
def get_single_file():
    data = request.get_json()
    changes_cids = data["changes"]
    file_name = data["file_name"]
    version = get_single_file_internal(changes_cids, file_name)
    return jsonify({'file': version}), 200


if __name__ == '__main__':
    app.run(use_reloader=True, port=8000, threaded=True)
