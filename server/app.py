import os
from flask import Flask
from flask_cors import CORS

from server.socket_server.socket_server import get_socket_server

REACT_BUILD_FOLDER = "../ui/dist"

# Create a new app factory function
def get_app():
    app = Flask(__name__, static_folder=REACT_BUILD_FOLDER)
    print("app is ", app)
    CORS(app, origins='*')

    # Register the SocketIO instance and initialize it with the app
    socketio = get_socket_server(app)
    print("socketio initialized:", socketio)
    
    # Import routes after app is created to avoid circular imports
    from server.routes import register_routes
    register_routes(app)
    
    # Return both app and socketio instance as expected by start.py
    return app, socketio.get_socketio()
