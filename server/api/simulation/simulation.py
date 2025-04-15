from flask import Blueprint, Response, request

from server.api.simulation.manager import SimulationManager

simulation_api = Blueprint("simulation", __name__, url_prefix="/simulation")

manager = SimulationManager.get_instance()

@simulation_api.get('/status/')
def get_simulation_status():
    return {
        'is_running': manager.is_running
    }

@simulation_api.post('/message/')
def send_simulation_message():
    if not manager.is_running:
        return Response('Simulation Not Running', 400)
    data = request.get_json()
    manager.send_message_command(**data)

    return Response('Message command sent', 200)


@simulation_api.delete("/")
def stop_simulation():
    # Try to start the simulation
    if not manager.is_running:
        return Response("Simulation not running", 400)
    
    manager.stop()

    return Response("Simulation Stopped", 200)
        

@simulation_api.get("/")
@simulation_api.post("/")
def execute_simulation():
    global manager
    network_file = "network.json"
    
    try:
        # First stop any existing simulation
        if manager.is_running:
            manager.stop()
        
        # Reset the simulation manager
        SimulationManager.destroy_instance()
        manager = SimulationManager.get_instance()
        
        # Try to start the simulation
        if not manager.start_simulation(network_file):
            return Response("Simulation already running", 409)
        
        return Response("Simulation reset and started", 201)
    
    except Exception as e:
        return Response(f"Error: {str(e)}", 500)

@simulation_api.post("/reset")
def reset_simulation():
    """Reset the simulation by destroying and recreating the manager instance"""
    global manager
    try:
        # First stop any running simulation
        if manager.is_running:
            manager.stop()
        
        # Destroy the current manager instance
        SimulationManager.destroy_instance()
        
        # Get a fresh manager instance
        manager = SimulationManager.get_instance()
        
        return Response("Simulation reset complete", 200)
    except Exception as e:
        return Response(f"Error resetting simulation: {str(e)}", 500)
