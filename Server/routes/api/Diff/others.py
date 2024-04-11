import hashlib
import os

# the functions returns the hash of a local file
def get_local_file_hash(filename: str) -> str:
    with open(filename, 'rb') as f:
        file_hash = hashlib.sha256()
        while chunk := f.read(4096):
            file_hash.update(chunk)
    return file_hash.hexdigest()

# the functions checks by exstension whether a file is a text file or not
def is_text_file(filename: str) -> bool:
    code_extensions = {'.txt', '.c', '.cpp', '.cc', '.java', '.py', \
                       '.js', '.html', '.css', '.php', '.rb', '.swift', \
                       '.go', '.pl', '.lua', '.sh', '.xml', '.json', '.yaml', '.yml', '.cfg'}
    
    _, file_extension = os.path.splitext(filename)
    return file_extension in code_extensions

def is_file(file_path: str) -> bool:
    return "." in file_path