import hashlib
import os
import base64

# the functions returns the hash of a local file
def get_local_file_hash(filename: str) -> str:
    if is_text_file(filename):
        with open(filename, 'r') as f:
            file_content = f.read()

        hasher = hashlib.sha256()
        hasher.update(file_content.encode("utf-8"))
        return hasher.hexdigest()
    else:
        sha256_hash = hashlib.sha256()
        with open(filename, "rb") as file:
            data = file.read()
        sha256_hash.update(base64.b64encode(data))
        
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