import filecmp
import os
from .diff_objects import FileChange
import ipfshttpclient2
from .get_from_ipfs import compare_files_ipfs
from .others import is_file

# Local ------------------------------------------------------------------------------------

# the function compare two local files
def compare_files(old: str, new: str) -> bool:
    return filecmp.cmp(new, old)


# the function compare two local folders by content
def is_folders_content_same(folder1: str, folder2: str) -> bool:
    files1 = [f for f in os.listdir(folder1) if os.path.isfile(os.path.join(folder1, f))]
    files2 = [f for f in os.listdir(folder2) if os.path.isfile(os.path.join(folder2, f))]

    files1.sort()
    files2.sort()

    if files1 != files2:
        return False

    for file1, file2 in zip(files1, files2):
        path1 = os.path.join(folder1, file1)
        path2 = os.path.join(folder2, file2)

        if not filecmp.cmp(path1, path2, shallow=False):
            return False

    return True
    

def get_folder_files(path: str) -> list[str]:
    return list(filter(lambda x: is_file(x), os.listdir(path)))


# the function compare two local folders and return their differences
def compare_folders(_old_dir: str, _new_dir: str) -> list[FileChange]:
    changes = []

    old_files = set(get_folder_files(_old_dir))
    new_files = set(get_folder_files(_new_dir))

    common_files = old_files & new_files
    for _file in common_files:
        old_path = os.path.join(_old_dir, _file)
        new_path = os.path.join(_new_dir, _file)
        if compare_files(old_path, new_path):
            if _file == os.path.basename(new_path):
                changes.append(FileChange('/', _file))
            else:
                changes.append(FileChange('*', _file, os.path.basename(new_path)))
        else:
            changes.append(FileChange('?', _file, os.path.basename(new_path)))

    for _file in old_files - new_files:
        changes.append(FileChange('-', _file))

    for _file in new_files - old_files:
        changes.append(FileChange(diff_type='+', new_name=_file))

    return changes


def get_project_tree(project: str) -> set[str]:
    folder_set = set()
    if os.path.isdir(project):
        items = os.listdir(project)
        for item in items:
            item_path = os.path.join(project, item)
            if os.path.isdir(item_path):
                folder_set.add(item_path)
                subfolder_set = get_project_tree(item_path)
                folder_set.update(subfolder_set)
    return folder_set


# IPFS ------------------------------------------------------------------------------------

def compare_remote_folder(
        client: ipfshttpclient2.Client, 
        patch_cids: list[str], 
        old_dir_path: str,
        old_dir_files: list[str], 
        _new_dir: str
    ) -> list[FileChange]:

    changes = []

    old_files = set(old_dir_files)
    new_files = set(get_folder_files(_new_dir))

    common_files = old_files & new_files
    for _file in common_files:
        new_path = os.path.join(_new_dir, _file)
        old_path = os.path.join(old_dir_path, _file)
        if compare_files_ipfs(client, patch_cids, old_path, new_path):
            if _file == os.path.basename(new_path):
                changes.append(FileChange('/', _file))
            else:
                changes.append(FileChange('*', _file, os.path.basename(new_path)))
        else:
            changes.append(FileChange('?', _file, os.path.basename(new_path)))

    for _file in old_files - new_files:
        changes.append(FileChange('-', _file))

    for _file in new_files - old_files:
        changes.append(FileChange(diff_type='+', new_name=_file))

    return changes
