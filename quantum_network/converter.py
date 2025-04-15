from core.base_classes import Node
from classical_network.connection import ClassicConnection
from core.enums import NodeType
from quantum_network.channel import QuantumChannel


class QuantumToClassicalConverter(Node):
    def __init__(self, address, classic_connection: ClassicConnection, quantum_channel: QuantumChannel, location, zone=None, name="", description=""):
        super().__init__(NodeType.Q2C_CONVERTER, location, zone, name, description)
        self.address = address
        self.classic_connection = classic_connection
        self.quantum_channel = quantum_channel

    def receive_quantum_state(self, state):
        pass

    def measure_and_convert(self):
        pass

    def transmit_classical_data(self, data):
        pass