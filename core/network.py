import threading
import time
from typing import Any, List, Tuple
# from core.base_classes import World, Zone
from core.enums import NetworkType, NodeType
from core.s_object import Sobject

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.base_classes import Node


class Network(Sobject):
    is_running = False
    stop_flag = False
    
    def __init__(
        self,
        network_type: NetworkType,
        location: Tuple[int, int],
        zone= None,
        name="",
        description="",
    ):
        super().__init__(name, description)
        self.network_type = network_type  # "Quantum" or "Classical"
        self.nodes: List[Node] = []
        self.inbound_connections = []
        self.outbound_connections = []
        self.location = location
        self.zone = zone
        
    def add_hosts(self, node: Any):
        self.nodes.append(node)
        
        if self.on_update_func:
            node.on_update_func = self.on_update_func

    def add_inbound_connection(self, connection):
        self.inbound_connections.append(connection)

    def add_outbound_connection(self, connection):
        self.outbound_connections.append(connection)

    def _forward(self):
        for node in self.nodes:
            node.forward()

    def simulation_loop(self, fps):
        while not self.stop_flag:
            self.is_running = True
            self._forward()
            
            time.sleep(fps)

        self.is_running = False

    def start(self, fps):
        self.stop_flag = False
        self.logger.info(f"Starting Network - {self.name}")
        thread = threading.Thread(target=self.simulation_loop, args=(fps,))
        thread.start()

    def stop(self):
        self.stop_flag = True