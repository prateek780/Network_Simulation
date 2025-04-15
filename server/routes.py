import os
from flask import Blueprint, request, Response, Flask, send_from_directory
import requests


def proxy_to_live_app(app):
    REACT_DEV_SERVER_URL = "http://localhost:5173"

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def proxy(path):
        """
        Proxies requests to the React development server.
        """
        url = f"{REACT_DEV_SERVER_URL}/{path}"
        resp = requests.request(
            method=request.method,
            url=url,
            headers={key: value for (key, value) in request.headers if key != "Host"},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False,
        )

        excluded_headers = [
            "content-encoding",
            "content-length",
            "transfer-encoding",
            "connection",
        ]
        headers = [
            (name, value)
            for (name, value) in resp.raw.headers.items()
            if name.lower() not in excluded_headers
        ]

        response = Response(resp.content, resp.status_code, headers)
        return response



REACT_BUILD_FOLDER = "/home/sahil/QUANTUM/network_simulator_project/simulator_1/ui/dist"

def serve_dist(app):
    # Serve main page
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # If path is an API route, skip handling it here
        if path.startswith('api/'):
            # Return None to let Flask continue to the next matching route
            return None
        print(os.path.join(REACT_BUILD_FOLDER, path))
        # If path exists as a file, serve it directly
        if path and os.path.exists(os.path.join(REACT_BUILD_FOLDER, path)):
            return send_from_directory(REACT_BUILD_FOLDER, path)
        
        # Otherwise return index.html for client-side routing
        return send_from_directory(REACT_BUILD_FOLDER, 'index.html')
    
    # Optional: Explicitly handle assets folder
    @app.route('/assets/<path:path>')
    def serve_assets(path):
        return send_from_directory(os.path.join(REACT_BUILD_FOLDER, 'assets'), path)

def register_blueprints(app: Flask):
    api_blueprint = Blueprint("api", __name__, url_prefix="/api")
    
    from server.api.topology.blueprint import topology_api
    api_blueprint.register_blueprint(topology_api)

    from server.api.simulation.simulation import simulation_api
    api_blueprint.register_blueprint(simulation_api)


    @api_blueprint.get("/")
    def check():
        return Response("null")
    
    app.register_blueprint(api_blueprint)


def register_routes(app: Flask):
    register_blueprints(app)
    if os.getenv('SERVE_DIST'):
        print("Serve UI Build")
        serve_dist(app)
    else:
        proxy_to_live_app(app)
