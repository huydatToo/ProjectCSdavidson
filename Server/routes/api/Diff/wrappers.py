import os

def save_path(directory):
    def decorator(func):
        def wrapped_function(*args, **kwargs):
            current_path = os.getcwd() 
            os.chdir(directory)
            try:
                return func(*args, **kwargs)
            finally:
                os.chdir(current_path)
        wrapped_function.__name__ = f"{func.__name__}_wrapped"
        return wrapped_function
    return decorator


def return_to_origin(directory):
    def decorator(func):
        def wrapped_function(*args, **kwargs):
            os.chdir(directory)
            try:
                return func(*args, **kwargs)
            finally:
                os.chdir(directory)
        wrapped_function.__name__ = f"{func.__name__}_wrapped"
        return wrapped_function
    return decorator
