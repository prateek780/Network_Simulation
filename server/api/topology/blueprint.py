from flask import Blueprint, Response, abort, request
import json

topology_api = Blueprint("topology", __name__, url_prefix="/topology")

NETWORK_FILE = "network.json"


@topology_api.put("/")
def on_topology_updated():
    with open(NETWORK_FILE, "w") as f:
        json.dump(request.json, f)
    return Response(request.data, 201)


@topology_api.get("/")
def get_topology():
    try:
        with open(NETWORK_FILE) as f:
            fc = f.read()
            return Response(fc, 200)
    except FileNotFoundError:
        abort(404)
