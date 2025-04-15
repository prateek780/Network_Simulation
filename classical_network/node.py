from __future__ import annotations
from queue import Queue
from typing import Dict, List, Tuple

from classical_network.packet import ClassicDataPacket
from core.base_classes import Node, World, Zone
from core.enums import NetworkType, NodeType
from core.exceptions import BufferNotAssigned, UnSupportedNetworkError
from core.network import Network

from typing import TYPE_CHECKING

from utils.debug import print_caller

if TYPE_CHECKING:
    from classical_network.connection import ClassicConnection

class ClassicalNode(Node):
    def __init__(
        self,
        node_type: NodeType,
        location: Tuple[int, int],
        address: str,
        network: Network,
        zone: Zone | World = None,
        name="",
        description="",
    ):
        super().__init__(node_type, location, network, zone, name, description)
        if node_type != NodeType.INTERNET_EXCHANGE and network.network_type != NetworkType.CLASSICAL_NETWORK:
            raise UnSupportedNetworkError(network, self)

        self.address = address
        self.connections: List[ClassicConnection] = []
        self.buffers: Dict[ClassicalNode, Queue[ClassicDataPacket]] = dict()

    @print_caller
    def get_connection(self, node_1, node_2):
        for conn in self.connections:
            if (conn.node_1 == node_1 and conn.node_2 == node_2) or (
                conn.node_2 == node_1 and conn.node_1 == node_2
            ):
                return conn
        return None

    def add_connection(self, connection: ClassicConnection):
        self.connections.append(connection)
        other_node = (
            connection.node_2 if connection.node_1 == self else connection.node_1
        )
        self.buffers[other_node] = Queue()

    def write_buffer(self, from_node: "ClassicalNode", packet: ClassicDataPacket):
        if from_node not in self.buffers:
            raise BufferNotAssigned(from_node, self)

        self.buffers[from_node].put_nowait(packet)
