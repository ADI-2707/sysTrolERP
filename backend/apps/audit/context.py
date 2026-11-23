import contextvars

_current_request = contextvars.ContextVar("current_request", default=None)

def set_current_request(request):
    return _current_request.set(request)

def get_current_request():
    return _current_request.get()

def reset_current_request(token):
    _current_request.reset(token)
