import time
from typing import Tuple
from classical_network.packet import ClassicDataPacket
from core.base_classes import Node, World, Zone
from classical_network.connection import ClassicConnection
from core.enums import NetworkType, NodeType
from core.exceptions import UnSupportedNetworkError
from core.network import Network
from quantum_network.channel import QuantumChannel
from quantum_network.host import QuantumHost
from quantum_network.repeater import QuantumRepeater
import qutip as qt


class ClassicToQuantumConverter(Node):
    def __init__(
        self,
        address: str,
        classical_network: Network,
        quantum_network: Network,
        location: Tuple[int, int],
        zone: Zone | World=None,
        name="",
        description="",
    ):
        if classical_network.network_type != NetworkType.CLASSICAL_NETWORK:
            raise UnSupportedNetworkError(classical_network, self)

        if quantum_network.network_type != NetworkType.QUANTUM_NETWORK:
            raise UnSupportedNetworkError(quantum_network, self)

        super().__init__(NodeType.C2Q_CONVERTER, location, classical_network, zone, name, description)
        self.address = address
        self.classical_network = classical_network
        self.quantum_network = quantum_network
        self.classical_connections: list[ClassicConnection] = []
        self.quantum_channels: list[QuantumChannel] = []

    def add_classical_connection(self, connection: ClassicConnection):
        self.classical_connections.append(connection)

    def add_quantum_channel(self, channel: QuantumChannel):
        self.quantum_channels.append(channel)

    def update_routing_table(self, nodes, next_hop):
        # Converters can also have routing tables to decide where to forward packets
        # This is a simplified example
        for node in nodes:
            self.routing_table[node.address] = next_hop

    def convert_to_quantum(self, packet: ClassicDataPacket):
        # This is a placeholder for a more complex implementation
        # that would involve encoding classical information into quantum states.
        # Here you would create and send quantum states (qubits) based on the data
        # For example, using a QuantumHost connected to this converter
        # You might also need to handle key exchange protocols if using QKD
        for channel in self.quantum_channels:
            if isinstance(channel.node_2, QuantumHost):
                qbit = self.create_qubit(packet.data)  # Replace with actual qubit creation
                channel.transmit_qubit(qbit)
            elif isinstance(channel.node_2, QuantumRepeater):
                qbit = self.create_qubit(packet.data)  # Replace with actual qubit creation
                channel.transmit_qubit(qbit)

    def create_qubit(self, data):
        # Placeholder for qubit creation logic
        # This is a highly simplified example
        # In a real implementation, this would involve encoding data into quantum states
        # Create a qubit in the |0> state using QuTiP
        qubit = qt.basis(2, 0)  # |0> state

        # Example: Encoding a classical bit into the qubit state
        if data == '1':
            qubit = qt.basis(2, 1)  # |1> state

        return qubit

    def transmit_quantum_state(self, state):
        # Placeholder for the actual transmission of quantum states
        pass

    def forward(self):
        # Placeholder for handling the forwarding logic
        # This might involve checking buffers or queues for incoming data or qubits
        pass

    def __name__(self):
        return f"C2QConverter - '{self.name}'"

    def __repr__(self):
        return self.__name__()
