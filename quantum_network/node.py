from queue import Queue
from typing import List, Tuple
from core.base_classes import Node, World, Zone
from core.enums import NetworkType, NodeType
from core.exceptions import UnSupportedNetworkError
from core.network import Network
from quantum_network.channel import QuantumChannel


class QuantumNode(Node):
    def __init__(
        self,
        node_type: NodeType,
        location: Tuple[int, int],
        network: Network,
        address: str,
        zone: Zone | World = None,
        name="",
        description="",
    ):
        super().__init__(node_type, location, network, zone, name, description)
        if network.network_type != NetworkType.QUANTUM_NETWORK:
            raise UnSupportedNetworkError(network, self)

        self.address = address
        self.quantum_channels: List[QuantumChannel] = []
        self.qmemory = None  # Consider adding qmemory for qbits
        self.qmemeory_buffer = Queue()
        
    def receive_qbit(self, qbit):
        self.qmemeory_buffer.put(qbit)
        
    def set_qmemory(self, qbit):
        self.qmemory = qbit

    def get_qmemory(self):
        return self.qmemory

    def clear_qmemory(self):
        self.qmemory = None