from __future__ import annotations
import random
import time
import qutip as qt

# from core.base_classes import Node
from core.exceptions import QubitLossError
from core.s_object import Sobject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from quantum_network.node import QuantumNode

class QuantumChannel(Sobject):
    def __init__(
        self,
        node_1: QuantumNode,
        node_2: QuantumNode,
        length: float,
        loss_per_km: float,
        noise_model: str,
        name="",
        description="",
    ):
        super().__init__(name, description)
        self.node_1 = node_1
        self.node_2 = node_2
        self.length = length
        self.loss_per_km = loss_per_km
        self.noise_model = noise_model

    def __name__(self):
        return f"{self.node_1.name} <~~~> {self.node_2.name}"

    def __repr__(self):
        return self.__name__()

    def transmit_qubit(self, qubit, from_node):
        # Log qubit transmission
        with open("log.txt", "a") as f:
            f.write(f"Quantum channel transmitting qubit from {from_node.name}\n")
        
        # Simulate the loss based on length and loss_per_km
        loss_prob = 1 - (1 - self.loss_per_km) ** (
            self.length / 1000
        )  # Assuming length is in meters
        if random.random() < loss_prob:
            with open("log.txt", "a") as f:
                f.write(f"Qubit lost during transmission in quantum channel from {from_node.name}\n")
            raise QubitLossError(self, qubit)

        # Apply noise to the qubit (using QuTiP)
        noisy_qubit = self.apply_noise(qubit)

        # Send the qubit to the destination node
        # self.to_node.receive_qubit(noisy_qubit, self)
        to_node = self.node_2 if self.node_1 == from_node else self.node_1
        
        with open("log.txt", "a") as f:
            f.write(f"Quantum channel successfully transmitted qubit from {from_node.name} to {to_node.name}\n")
        
        to_node.receive_qbit(noisy_qubit)

    def apply_noise(self, qubit):
        """Applies the specified noise model to the qubit using QuTiP."""
        if self.noise_model == "depolarizing":
            # Example: Apply depolarizing noise with a given probability
            p = 0.05  # Example depolarizing probability
            return qt.depolarize(qubit, p)
        elif self.noise_model == "dephasing":
            # Example: Apply dephasing noise
            p = 0.1  # Example dephasing probability
            return qt.phase_damp(qubit, p)
        elif self.noise_model == "amplitude_damping":
            # Example: Apply amplitude damping
            p = 0.1
            return qt.amplitude_damp(qubit, p)
        # Add more noise models as needed
        else:
            return qubit  # No noise