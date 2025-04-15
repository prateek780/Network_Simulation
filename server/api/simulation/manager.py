from datetime import datetime
import json
from pprint import pprint
from typing import Optional, Dict, Any, Callable
import traceback

from core.base_classes import World
from core.event import Event
from json_parser import simulate_from_json
from server.socket_server.socket_server import get_socket_server

class SimulationManager:
    _instance: Optional['SimulationManager'] = None
    simulation_world: World = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(SimulationManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self.is_running = False
        self.socketio = get_socket_server()
        self.current_simulation = None
        self.simulation_data = {}
        
    @classmethod
    def get_instance(cls) -> 'SimulationManager':
        """Get or create the singleton instance"""
        if cls._instance is None:
            return cls()
        return cls._instance
        
    @classmethod
    def destroy_instance(cls) -> None:
        """Reset the singleton instance"""
        if cls._instance is not None:
            cls._instance.stop()
            cls._instance = None
    
    def start_simulation(self, network_file: str) -> bool:
        """
        Start a new simulation if none is running
        
        Args:
            network_file: Path to network configuration file
            
        Returns:
            bool: True if simulation started, False if one is already running
            
        Raises:
            FileNotFoundError: If network file doesn't exist
            json.JSONDecodeError: If network file has invalid JSON
        """
        if self.is_running:
            return False
            
        try:
            # Load and validate network configuration
            with open(network_file, 'r') as f:
                network_config = json.load(f)
                
            # Set simulation state
            self.is_running = True
            self.simulation_data = {
                "network_file": network_file,
                "network_config": network_config,
                "progress": 0,
                "status": "running",
                "results": None,
                "error": None
            }
            
            # Start the simulation process
            self._run_simulation(network_file)
            
            return True
            
        except FileNotFoundError:
            self.emit_event("simulation_error", {
                "message": f"Network file not found: {network_file}"
            })
            raise
            
        except json.JSONDecodeError:
            self.emit_event("simulation_error", {
                "message": f"Invalid JSON in network file: {network_file}"
            })
            raise

    

    def on_update(self, event):
        self.emit_event("simulation_event", event)
    
    def _run_simulation(self, network_file:str) -> None:
        """
        Run the actual simulation process
        This would be where your simulation logic lives
        """
        try:
            # Here you would implement your actual simulation logic
            # For example:
            # self.current_simulation = YourSimulationClass(self.simulation_data["network_config"])
            # self.current_simulation.on_progress = self._on_progress_update
            # results = self.current_simulation.run()
            
            # For now, we'll just simulate some progress events
            import time
            from threading import Thread
            
            def simulation_worker():
                try:
                    self.emit_event("simulation_started", {
                        "time": datetime.now().timestamp() 
                    })
                    
                    self.simulation_world = simulate_from_json(network_file, self.on_update)


                    while self.simulation_world.is_running:
                        time.sleep(5)
                    
                    self.emit_event("simulation_completed", {
                        "results": self.simulation_data["results"]
                    })
                    
                except Exception as e:
                    self._handle_error(e)
                finally:
                    # Reset run state if this wasn't from an external stop
                    if self.is_running:
                        self.is_running = False
            
            # Run simulation in background
            Thread(target=simulation_worker).start()
            
        except Exception as e:
            self._handle_error(e)

    def send_message_command(self, from_node_name: str, to_node_name: str, message: str):
        from_node = to_node = None
        for network in self.simulation_world.networks:
            for node in network.nodes:
                if node.name == from_node_name:
                    from_node = node
                    continue
                if node.name == to_node_name:
                    to_node = node
                    continue
        
        if not (from_node and to_node):
            print(from_node, to_node)
            self.emit_event("simulation_error", {
                'error': "Nodes not found for sending message"
            })
            return

        print("Send Message B/W ", from_node, " And ", to_node)

        from_node.send_data(message, to_node)
    
    def stop(self) -> None:
        """Stop the running simulation"""
        if not self.is_running:
            return
            
        self.is_running = False
        
        if self.current_simulation is not None:
            # Add logic to safely stop your simulation
            # self.current_simulation.stop()
            self.current_simulation = None
        
        self.simulation_data["status"] = "stopped"
        self.simulation_world.stop()
    
    def get_status(self) -> Dict[str, Any]:
        """Get current simulation status"""
        return {
            "is_running": self.is_running,
            "progress": self.simulation_data.get("progress", 0),
            "status": self.simulation_data.get("status", "idle"),
            "results": self.simulation_data.get("results"),
            "error": self.simulation_data.get("error")
        }
    
    def emit_event(self, event: str, data: Dict[str, Any]) -> None:
        """
        Emit event to connected clients via SocketIO
        
        Args:
            event: Event name
            data: Event data
        """
        print(f"DEBUG - emit_event - Attempting to emit event: {event}")
        if self.socketio:
            try:
                # Convert event data to a serializable format if needed
                if hasattr(data, 'to_dict'):    
                    data = data.to_dict()
                    
                # Handle special case for simulation_event
                if event == "simulation_event":
                    # Make sure event has required fields for log parsing
                    if "timestamp" not in data:
                        data["timestamp"] = datetime.now().timestamp()
                        
                    if "node" not in data:
                        data["node"] = "Simulation"
                
                print(f"DEBUG - emit_event - Emitting event: {event} with data: {str(data)[:100]}...")
                self.socketio.emit(event, data)
                print(f"DEBUG - emit_event - Event emitted successfully: {event}")
            except TypeError as e:
                print(f"DEBUG - emit_event - ERROR emitting event {event}: {e}")
                print("XXXXXXXXXXXXXXXXXX NOT SENDING MESSAGE XXXXXXXXXXXXXXXXXXXXXXXXX")
                print(f"Problematic data type: {type(data)}")
                print(f"Data sample: {str(data)[:200]}")
                
                # Try to convert complex objects to strings
                try:
                    import json
                    simplified_data = {}
                    for k, v in data.items():
                        try:
                            # Test if value is JSON serializable
                            json.dumps({k: v})
                            simplified_data[k] = v
                        except (TypeError, OverflowError):
                            # If not serializable, convert to string
                            simplified_data[k] = str(v)
                    
                    print(f"DEBUG - emit_event - Retrying with simplified data")
                    self.socketio.emit(event, simplified_data)
                    print(f"DEBUG - emit_event - Retry successful")
                except Exception as e2:
                    print(f"DEBUG - emit_event - Retry also failed: {e2}")
        else:
            print(f"DEBUG - emit_event - ERROR: SocketIO instance is None, can't emit event: {event}")
    
    def _handle_error(self, error: Exception) -> None:
        """
        Handle simulation errors
        
        Args:
            error: The exception that occurred
        """
        error_info = {
            "message": str(error),
            "traceback": traceback.format_exc()
        }
        
        self.simulation_data["status"] = "error"
        self.simulation_data["error"] = error_info
        self.is_running = False
        
        self.emit_event("simulation_error", error_info)
        
        raise error
        
    def _on_progress_update(self, progress: int, message: str) -> None:
        """
        Handle progress updates from the simulation
        
        Args:
            progress: Progress percentage (0-100)
            message: Progress message
        """
        self.simulation_data["progress"] = progress
        self.emit_event("simulation_progress", {
            "progress": progress,
            "message": message
        })