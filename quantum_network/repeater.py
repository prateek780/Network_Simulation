import random
from typing import Tuple
from core.base_classes import World, Zone
from core.enums import NodeType
from core.network import Network
from quantum_network.channel import QuantumChannel
from quantum_network.node import QuantumNode


class QuantumRepeater(QuantumNode):
    def __init__(
        self,
        address: str,
        location: Tuple[int, int],
        network: Network,
        repeater_protocol: str,
        num_memories: int,
        memory_fidelity: float,
        zone: Zone | World = None,
        name="",
        description="",
    ):
        super().__init__(
            NodeType.QUANTUM_REPEATER,
            location,
            network,
            address,
            zone,
            name,
            description,
        )
        self.quantum_channels_in: list[QuantumChannel] = []
        self.quantum_channels_out: list[QuantumChannel] = []
        self.repeater_protocol = repeater_protocol
        self.num_memories = num_memories
        self.memory_fidelity = memory_fidelity

    def add_quantum_channel_in(self, channel: QuantumChannel):
        self.quantum_channels_in.append(channel)

    def add_quantum_channel_out(self, channel: QuantumChannel):
        self.quantum_channels_out.append(channel)

    def forward(self):
        if self.repeater_protocol == "simple_swap":
            self.simple_entanglement_swap()
        # Add more protocols as needed

    def simple_entanglement_swap(self):
        # Check if there are qubits in memory from two different channels
        if self.qmemory and len(self.quantum_channels_in) >= 2 and all(self.qmemory):
            q1 = self.quantum_channels_in[0].node_2.get_qmemory()
            q2 = self.quantum_channels_in[1].node_2.get_qmemory()

            # Perform a Bell measurement (CNOT followed by measurement on the control qubit)
            # Replace this with actual QuTiP Bell measurement logic
            result = self.perform_bell_measurement(q1, q2)

            # Inform the connected nodes about the result
            self.quantum_channels_in[0].node_2.entanglement_swap_outcome(
                self.quantum_channels_in[1].node_2, result
            )
            self.quantum_channels_in[1].node_2.entanglement_swap_outcome(
                self.quantum_channels_in[0].node_2, result
            )

            # Clear the repeater's memory
            self.clear_qmemory()

    def perform_bell_measurement(self, q1, q2):
        # Placeholder for Bell measurement using QuTiP
        # Replace this with actual QuTiP logic for a Bell measurement
        # This is a simplified example and may need to be adapted based on your specific protocol
        return random.choice([0, 1])

    def receive_qubit(self, qubit, channel: QuantumChannel):
        # Receive a qubit and store it in memory
        # For simplicity, we assume the repeater has two memories corresponding to two channels
        if channel == self.quantum_channels_in[0]:
            self.qmemory[0] = qubit
        elif channel == self.quantum_channels_in[1]:
            self.qmemory[1] = qubit
        else:
            print(f"Repeater {self.name}: Qubit received on unexpected channel.")

    def __name__(self):
        return f"QuantumRepeater - '{self.name}'"

    def __repr__(self):
        return self.__name__()
