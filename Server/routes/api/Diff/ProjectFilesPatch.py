import filecmp
import os
from .getData import get_file_paths_in_cid, get_project_files_cid
from .getData import compare_files_from_ipfs, compare_directories_cid

def compare_files(old, new):
    return filecmp.cmp(new, old)

def compare_directories(dir1, dir2):
    print(dir1, dir2)
    dcmp = filecmp.dircmp(dir1, dir2)

    if dcmp.left_only or dcmp.right_only or dcmp.funny_files:
        return False
    elif dcmp.diff_files or dcmp.common_funny:
        return False
    else:
        return True
    
def compare_dirs(_old_dir, _new_dir):
    changes = []
    new_dir = [item for item in os.listdir(_new_dir) if "." in item]

    if _old_dir != "|+":
        old_dir = [item for item in os.listdir(_old_dir) if "." in item]
    else:
        old_dir = []

    for _file in old_dir:
        cmp_old_scc = False
        for _new_file in new_dir: 
            if compare_files(_old_dir + "\\{0}".format(_file), _new_dir + "\\{0}".format(_new_file)):
                cmp_old_scc = True
                if _file.split('\\')[-1] == _new_file.split('\\')[-1]:
                    changes.append("/|{0}".format(_file))
                else:
                    changes.append("*|{0}|{1}".format(_file, _new_file))
                break
            elif _file.split('\\')[-1] == _new_file.split('\\')[-1]:
                cmp_old_scc = True
                changes.append("?|{0}|{1}".format(_file, _new_file))
                break

        if cmp_old_scc == False:
            changes.append("-|{0}".format(_file))
    
    for _new_file in new_dir:
        cmp_new_scc = False
        for _file in old_dir:
            if compare_files(_old_dir + "\\{0}".format(_file), _new_dir + "\\{0}".format(_new_file)) or _file.split('\\')[-1] == _new_file.split('\\')[-1]:
                cmp_new_scc = True
                break
        if not cmp_new_scc:
            changes.append("+|{}".format(_new_file))

    return changes

def compare_dirs_cid(_old_dir, old_dir_files, _new_dir, changes_cid, client):
    changes = []
    new_dir = [item for item in os.listdir(_new_dir) if "." in item]

    if _old_dir != "|+":
        old_dir = old_dir_files
    else:
        old_dir = []

    for _file in old_dir:
        cmp_old_scc = False
        for _new_file in new_dir: 
            if compare_files_from_ipfs(client, changes_cid, _file, _new_dir + "\\{0}".format(_new_file)):
                cmp_old_scc = True
                if _file.split('\\')[-1] == _new_file.split('\\')[-1]:
                    changes.append("/|{0}".format(_file))
                else:
                    changes.append("*|{0}|{1}".format(_file, _new_file))
                break
            elif _file.split('\\')[-1] == _new_file.split('\\')[-1]:
                cmp_old_scc = True
                changes.append("?|{0}|{1}".format(_file, _new_file))
                break

        if cmp_old_scc == False:
            changes.append("-|{0}".format(_file))
    
    for _new_file in new_dir:
        cmp_new_scc = False
        for _file in old_dir:

            if compare_files_from_ipfs(client, changes_cid, _file, _new_dir + "\\{0}".format(_new_file)) or _file.split('\\')[-1] == _new_file.split('\\')[-1]:
                cmp_new_scc = True
                break
        if not cmp_new_scc:
            changes.append("+|{}".format(_new_file))
    
    return changes

def all_dirs_in_dir(project):
    folder_list = []
    if os.path.isdir(project):
        items = os.listdir(project)
        for item in items:
            item_path = os.path.join(project, item)
            if os.path.isdir(item_path):
                folder_list.append(item_path)
                subfolder_list = all_dirs_in_dir(item_path)
                folder_list.extend(subfolder_list)
    return folder_list

def compare_projects(old_project_name, new_project_name):
    folder_changes = []

    abs_len_new = (len(new_project_name) + 1)
    abs_len_old = (len(old_project_name) + 1)

    old_dirs = all_dirs_in_dir(old_project_name)
    new_dirs = all_dirs_in_dir(new_project_name)

    for old_dir in old_dirs:
        cmp_old_scc = False
        for new_dir in new_dirs:
            dcmp = compare_directories(old_dir, new_dir)
            if dcmp:
                cmp_old_scc = True
                if old_dir[abs_len_old:] == new_dir[abs_len_new:]:
                    
                    folder_changes.append("/|{0}|{1}".format(old_dir, new_dir))
                else:
                    folder_changes.append("*|{0}|{1}".format(old_dir, new_dir))
                break

            elif old_dir[abs_len_old:] == new_dir[abs_len_new:]:
                cmp_old_scc = True
                folder_changes.append("?|{0}|{1}".format(old_dir, new_dir))
                break

        if cmp_old_scc == False:
            folder_changes.append("-|{0}".format(old_dir))
    
    for new_dir in new_dirs:
        cmp_new_scc = False
        for old_dir in old_dirs:
            dcmp = filecmp.cmp(old_dir, new_dir, shallow=False)
            if dcmp or old_dir[abs_len_old:] == new_dir[abs_len_new:]:
                cmp_new_scc = True
                break
        if not cmp_new_scc:
            folder_changes.append("+|{}".format(new_dir))

    changed_folders = [[folder.split("|")[1], folder.split("|")[2]] for folder in folder_changes if "?" in folder]
    new = [folder.split("|")[1] for folder in folder_changes if "+" in folder]
    changes = []
    for folders in changed_folders:
        folder_old = folders[0]
        folder_new = folders[1]
        changes.append([folder_old, folder_new, compare_dirs(folder_old, folder_new)])
    for folder in new:
        folder_old = "|+"
        folder_new = folder
        changes.append([folder_old, folder_new, compare_dirs(folder_old, folder_new)])

    changes.append([old_project_name, new_project_name, compare_dirs(old_project_name, new_project_name)])
    return folder_changes, changes
    
# -----------------------------------------------------------------------

def compare_projects_cid(changes_cids, new_project_name, client):
    folder_changes = []

    abs_len_new = (len(new_project_name) + 1)
    old_dirs_and_files = get_file_paths_in_cid(client, changes_cids[0])
    if len(changes_cids) > 1:
        for change in changes_cids[1:]:
            old_dirs_and_files = get_project_files_cid(old_dirs_and_files, change, client)   
    old_files = [i for i in old_dirs_and_files if "." in i]
    
    old_dirs = [i for i in old_dirs_and_files if "." not in i]
    new_dirs = all_dirs_in_dir(new_project_name)

    for old_dir in old_dirs:
        cmp_old_scc = False
        for new_dir in new_dirs:
            old_dir_files = [i for i in old_files if new_dir[abs_len_new:] in i]
            
            dcmp = compare_directories_cid(client, changes_cids, old_dir_files, new_dir)
            if dcmp:
                cmp_old_scc = True
                if old_dir == new_dir[abs_len_new:]:
                    
                    folder_changes.append("/|{0}|{1}".format(old_dir, new_dir))
                else:
                    folder_changes.append("*|{0}|{1}".format(old_dir, new_dir))
                break

            elif old_dir == new_dir[abs_len_new:]:
                cmp_old_scc = True
                folder_changes.append("?|{0}|{1}".format(old_dir, new_dir))
                break

        if cmp_old_scc == False:
            folder_changes.append("-|{0}".format(old_dir))
    
    for new_dir in new_dirs:
        cmp_new_scc = False
        for old_dir in old_dirs:
            old_dir_files = [i for i in old_files if old_dir in i]
            dcmp = compare_directories_cid(client, changes_cids, old_dir_files, new_dir)

            if dcmp or old_dir == new_dir[abs_len_new:]:
                cmp_new_scc = True
                break
        if not cmp_new_scc:
            folder_changes.append("+|{}".format(new_dir))

    changed_folders = [[folder.split("|")[1], folder.split("|")[2]] for folder in folder_changes if "?" in folder]
    new = [folder.split("|")[1] for folder in folder_changes if "+" in folder]
    changes = []
    for folders in changed_folders:
        folder_old = folders[0]
        folder_new = folders[1]

        old_dir_files = [i for i in old_files if folder_old == "\\".join(i.split("\\")[:-1])]
        changes.append([folder_old, folder_new, compare_dirs_cid(folder_old, old_dir_files, folder_new, changes_cids, client)])
    for folder in new:
        folder_old = "|+"
        folder_new = folder
        old_dir_files = [i for i in old_files if folder_new == "\\".join(i.split("\\")[:-1])]
        changes.append([folder_old, folder_new, compare_dirs_cid(folder_old, old_dir_files, folder_new, changes_cids, client)])

    old_dir_files = [i for i in old_files if "\\" not in i]
    changes.append(["", new_project_name, compare_dirs_cid(changes_cids, old_dir_files, new_project_name, changes_cids, client)])
    return folder_changes, changes