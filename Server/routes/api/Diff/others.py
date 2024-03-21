import hashlib
import os

# the functions returns the hash of a local file
def get_local_file_hash(filename: str) -> str:
    sha256_hash = hashlib.sha256()
    
    with open(filename, "rb") as file:
        while True:
            data = file.read(65536)  # 64 KB chunks
            if not data:
                break
            sha256_hash.update(data)
    
    return sha256_hash.hexdigest()

# the functions checks by exstension whether a file is a text file or not
def is_text_file(filename: str) -> bool:
    code_extensions = {'.txt', '.c', '.cpp', '.cc', '.java', '.py', \
                       '.js', '.html', '.css', '.php', '.rb', '.swift', \
                       '.go', '.pl', '.lua', '.sh', '.xml', '.json', '.yaml', '.yml', '.cfg'}
    
    _, file_extension = os.path.splitext(filename)
    return file_extension in code_extensions

def is_file(file_path: str) -> bool:
    return "." in file_path