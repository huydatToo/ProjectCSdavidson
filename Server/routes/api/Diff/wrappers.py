import os

def save_path(func):
    def wrapped_function(*args, **kwargs):
        current_path = os.getcwd() 
        os.chdir("C:\\Users\\User\\Desktop\\תכנות\\davidson\\project\\DavidsonProject\\Server\\projects")
        try:
            return func(*args, **kwargs)
        finally:
            os.chdir(current_path)
    wrapped_function.__name__ = f"{func.__name__}_wrapped"
    return wrapped_function

def return_to_origin(func):
    def wrapped_function(*args, **kwargs):
        os.chdir("C:\\Users\\User\\Desktop\\תכנות\\davidson\\project\\DavidsonProject\\Server\\projects")
        try:
            return func(*args, **kwargs)
        finally:
            os.chdir("C:\\Users\\User\\Desktop\\תכנות\\davidson\\project\\DavidsonProject\\Server\\projects")
    wrapped_function.__name__ = f"{func.__name__}_wrapped"
    return wrapped_function
