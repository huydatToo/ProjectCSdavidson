import os
from .get_diff import is_folders_content_same, compare_folders, compare_remote_folder
from .diff_objects import FolderChange
from .get_diff import get_project_tree
import ipfshttpclient2
from .get_from_ipfs import get_remote_project_tree, is_remote_folder_content_same
from .others import is_file
from .diff_objects import FileChange

def compare_projects_folder_changes(old_project_path: str, new_project_path: str) -> list[FolderChange]:
    folder_changes = []
    
    abs_len_new = (len(new_project_path) + 1)
    abs_len_old = (len(old_project_path) + 1)

    old_dirs = {folder[abs_len_old:] for folder in get_project_tree(old_project_path)}
    new_dirs = {folder[abs_len_new:] for folder in get_project_tree(new_project_path)}

    common_folders = old_dirs & new_dirs
    for folder in common_folders:
        old_path = os.path.join(old_project_path, folder)
        new_path = os.path.join(new_project_path, folder)
        if is_folders_content_same(old_path, new_path):
            if os.path.basename(old_path) == os.path.basename(new_path):
                folder_changes.append(FolderChange('/', folder))
            else:
                folder_changes.append(FolderChange('*', folder, os.path.basename(new_path))) # currently not working
        else:
            folder_changes.append(FolderChange('?', new_name=folder))

    for folder in old_dirs - new_dirs:
        folder_changes.append(FolderChange('-', folder))

    for folder in new_dirs - old_dirs:
        folder_changes.append(FolderChange(diff_type='+', new_name=folder))

    return folder_changes


def compare_projects(old_project_path: str, new_project_path: str) -> list[FolderChange]:
    folder_changes = compare_projects_folder_changes(old_project_path, new_project_path)
    changed_folders = list(filter(lambda folder: folder.diff_type != "/", folder_changes))

    for folder in folder_changes:
        if folder.diff_type == "?":
            full_path_old = os.path.join(old_project_path, folder.new_name)
            full_path_new = os.path.join(new_project_path, folder.new_name)

            for change in compare_folders(full_path_old, full_path_new):
                folder.add_change(change)
        
        elif folder.diff_type == "+":
            full_path_new = os.path.join(new_project_path, folder.new_name)
            new_folder_files = list(filter(lambda path: is_file(path), os.listdir(full_path_new)))
            for change in new_folder_files:
                folder.add_change(FileChange(diff_type='+', new_name=change))

    if not is_folders_content_same(old_project_path, new_project_path):
        changed_main_folder = FolderChange("?", "", "")
        for change in compare_folders(old_project_path, new_project_path):
            changed_main_folder.add_change(change)

        changed_folders.append(changed_main_folder)

    return changed_folders


# IPFS ----------------------------------------------------------------------------


def compare_remote_project_folder_changes(
        client: ipfshttpclient2.Client, 
        patches_cids: list[str], 
        new_project_path: str
    ) -> list[FolderChange]:
    
    folder_changes = []
    
    abs_len_new = (len(new_project_path) + 1)
    ipfs_project_tree = get_remote_project_tree(client, patches_cids)

    old_dirs = set(ipfs_project_tree.keys())
    new_dirs = {folder[abs_len_new:] for folder in get_project_tree(new_project_path)}
    new_dirs.add("")

    common_folders = old_dirs & new_dirs
    for folder in common_folders:
        new_path = os.path.join(new_project_path, folder)

        if is_remote_folder_content_same(client, folder, ipfs_project_tree[folder], new_path, patches_cids):
            if os.path.basename(folder) == os.path.basename(new_path):
                folder_changes.append(FolderChange('/', folder))
            else:
                folder_changes.append(FolderChange('*', folder, os.path.basename(new_path))) # currently not working
        else:
            folder_changes.append(FolderChange('?', new_name=folder))

    for folder in old_dirs - new_dirs:
        folder_changes.append(FolderChange('-', folder))

    for folder in new_dirs - old_dirs:
        folder_changes.append(FolderChange(diff_type='+', new_name=folder))

    return folder_changes


def compare_remote_project(
        client: ipfshttpclient2.Client, 
        patches_cids: list[str], 
        new_project_path: str
    ) -> list[FolderChange]:
    
    folder_changes = compare_remote_project_folder_changes(client, patches_cids, new_project_path)
    changed_folders = list(filter(lambda folder: folder.diff_type != "/", folder_changes))
    old_project_tree = get_remote_project_tree(client, patches_cids)

    for folder in folder_changes:
        if folder.diff_type == "?":
            full_path_new = os.path.join(new_project_path, folder.new_name)
            for change in compare_remote_folder(client, patches_cids, folder.new_name, old_project_tree[folder.new_name], full_path_new):
                folder.add_change(change)

        elif folder.diff_type == "+":
            full_path_new = os.path.join(new_project_path, folder.new_name)
            new_folder_files = list(filter(lambda path: is_file(path), os.listdir(full_path_new)))
            for change in new_folder_files:
                folder.add_change(FileChange(diff_type='+', new_name=change))

    return changed_folders