import functools
import inspect
import random
import sys

ENABLE_DEBUG = True

def print_caller(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):

        if not ENABLE_DEBUG:
            return func(*args, **kwargs)

        # Get the frame of the caller
        frame = sys._getframe(1)
        id = random.randint(0, 1000000)
        # Get function name
        caller_func_name = frame.f_code.co_name
        
        # Try to determine if the caller is a method of a class
        caller_class = None
        if 'self' in frame.f_locals:
            caller_class = frame.f_locals['self'].__class__.__name__
        
        print(f'--------------------{func.__name__}#{id} START--------------------------')
        # Print caller information
        if caller_class:
            print(f"Called from class '{caller_class}', method '{caller_func_name}'")
        else:
            print(f"Called from function '{caller_func_name}'")
        print(f'Arguments: {args}')
        
        # Call the original function
        resp = func(*args, **kwargs)
        print(f'Result: {resp}')
        print(f'--------------------{func.__name__} #{id} END--------------------------')

        return resp
    
    return wrapper