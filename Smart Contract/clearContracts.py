import os

def delete_files_in_directory(directory_path):
    try:
        file_list = os.listdir(directory_path)
        for file_name in file_list:
            file_path = os.path.join(directory_path, file_name)
            if os.path.isfile(file_path):
                os.remove(file_path)
                print(f"Deleted: {file_path}")

        print("All files in the directory have been deleted.")
    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage:
directory_to_clean = "./build/contracts/"
delete_files_in_directory(directory_to_clean)
