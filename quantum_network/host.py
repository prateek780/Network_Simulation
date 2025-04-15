import random
import time
from typing import Any, Callable, List, Tuple
import qutip as qt
from core.base_classes import World, Zone
from core.enums import NodeType
from core.exceptions import QuantumChannelDoesNotExists
from core.network import Network
from quantum_network.channel import QuantumChannel
from quantum_network.node import QuantumNode


class QuantumHost(QuantumNode):
    def __init__(
        self,
        address: str,
        location: Tuple[int, int],
        network: Network,
        zone: Zone | World = None,
        send_classical_fn: Callable[[Any], None] = None,
        qkd_completed_fn: Callable[[List[int]], None] = None,
        num_bits = 16,
        name="",
        description="",
    ):
        super().__init__(
            NodeType.QUANTUM_HOST, location, network, address, zone, name, description
        )
        self.quantum_channels: list[QuantumChannel] = []
        self.entangled_nodes = {}  # Nodes that this node is entangled with
        self.basis_choices = []
        self.measurement_outcomes = []
        self.num_bits = num_bits
        
        if send_classical_fn:
            self.send_classical_data = send_classical_fn
        
        if qkd_completed_fn:
            self.qkd_completed_fn = qkd_completed_fn

    def add_quantum_channel(self, channel):
        self.quantum_channels.append(channel)

    def channel_exists(self, to_host: QuantumChannel):
        for chan in self.quantum_channels:
            if (chan.node_1 == self and chan.node_2 == to_host) or (chan.node_2 == self and chan.node_1 == to_host):
                return chan

    def forward(self):
        while not self.qmemeory_buffer.empty():
            qbit = self.qmemeory_buffer.get()
            self.process_received_qbit(qbit)

    def send_qubit(self, qubit, channel: QuantumChannel):
        # Log sending qubit
        with open("log.txt", "a") as f:
            f.write(f"{self.name} sending qubit through quantum channel to {channel.get_other_node(self).name}\n")
        
        # Apply noise to the qubit based on channel properties (using QuTiP)
        channel.transmit_qubit(qubit, self)
        self.qmemory = None

    def generate_entanglement(self, with_node: QuantumNode, channel: QuantumChannel):
        # Generate a Bell pair using QuTiP
        bell_state = qt.bell_state("00")

        # Assign one qubit to self and one to the other node
        self.qmemory = qt.ptrace(bell_state, 0)  # Keep first qubit
        with_node.qmemory = qt.ptrace(bell_state, 1)  # Send second qubit

        # Store information about the entangled node
        self.entangled_nodes[with_node.address] = channel
        with_node.entangled_nodes[self.address] = channel

        # Send the second qubit to the other node via the channel
        self.send_qubit(with_node.qmemory, channel)

    def prepare_qubit(self, basis, bit):
        """Prepares a qubit in the given basis and bit value using QuTiP."""
        if basis == "Z":
            if bit == 0:
                qubit = qt.basis(2, 0)  # |0>
            else:
                qubit = qt.basis(2, 1)  # |1>
        else:  # basis == "X"
            if bit == 0:
                qubit = (qt.basis(2, 0) + qt.basis(2, 1)).unit()  # |+>
            else:
                qubit = (qt.basis(2, 0) - qt.basis(2, 1)).unit()  # |->
        return qubit

    def measure_qubit(self, qubit, basis):
        """Measures the qubit in the given basis using QuTiP."""
        if basis == "Z":
            # Measurement in the computational basis
            projector0 = qt.ket2dm(qt.basis(2, 0))  # Projector onto |0>
            projector1 = qt.ket2dm(qt.basis(2, 1))  # Projector onto |1>
        else:  # basis == "X"
            # Measurement in the Hadamard basis
            projector0 = qt.ket2dm(
                (qt.basis(2, 0) + qt.basis(2, 1)).unit()
            )  # Projector onto |+>
            projector1 = qt.ket2dm(
                (qt.basis(2, 0) - qt.basis(2, 1)).unit()
            )  # Projector onto |->

        # Calculate probabilities using the expectation value
        prob0 = qt.expect(projector0, qubit)
        prob1 = qt.expect(projector1, qubit)

        # Choose outcome based on probabilities
        outcome = 0 if random.random() < prob0 else 1
        return outcome

    def process_received_qbit(self, qbit):
        self.set_qmemory(qbit)
        
        basis = random.choice(["Z", "X"])
        
        outcome = self.measure_qubit(qbit, basis)
        
        self.basis_choices.append(basis)
        self.measurement_outcomes.append(outcome)
        
        if len(self.measurement_outcomes) == self.num_bits:
            self.send_bases_for_reconsile()
            
    def send_bases_for_reconsile(self):
        self.send_classical_data({
            'type': 'reconcile_bases',
            'data': self.basis_choices
        })
        
    def receive_classical_data(self, message):
        # Log receiving classical data
        with open("log.txt", "a") as f:
            f.write(f"{self.name} received classical data: {message['type']}\n")
        
        self.logger.debug(f"Received Classical Data at host {self}. Data => {message}")
        if message["type"] == "reconcile_bases":
            self.bb84_reconcile_bases(message["data"])
        elif message["type"] == "estimate_error_rate":
            self.bb84_estimate_error_rate(message["data"])
        elif message["type"] == "complete":
            raw_key = self.bb84_extract_key()
            with open("log.txt", "a") as f:
                f.write(f"{self.name} completed QKD and established a shared key\n")
            if self.qkd_completed_fn:
                self.qkd_completed_fn(raw_key)
        elif message['type'] == 'shared_bases_indices':
            self.update_shared_bases_indices(message['data'])
            
        self._send_update("classical_data_received", message=message)
            
    def update_shared_bases_indices(self, shared_base_indices):
        self.shared_bases_indices = shared_base_indices
        
        # Random number (Max value can be 25% of bits)
        random_bit_number = random.randrange(2, self.num_bits // 4)
        random_error_calculation_bit = []
        for _ in range(random_bit_number):
            random_index = random.choice(self.measurement_outcomes)
            random_error_calculation_bit.append((self.measurement_outcomes[random_index], random_index))
        
        self.send_classical_data(
            {
                'type': 'estimate_error_rate',
                'data': random_error_calculation_bit
            }
        )
        
    def bb84_send_qubits(self):
        """Sends a sequence of qubits for the BB84 protocol."""
        self.basis_choices = []  # Reset the basis choices
        if not self.quantum_channels:
            raise QuantumChannelDoesNotExists(self)
        
        channel = self.quantum_channels[0]
        for _ in range(self.num_bits):
            basis = random.choice(["Z", "X"])
            bit = random.choice([0, 1])
            self.basis_choices.append(basis)
            self.measurement_outcomes.append(bit)
            qubit = self.prepare_qubit(basis, bit)
            self.send_qubit(qubit, channel)

        # Send basis choices to the destination host (classical communication)
        # self.send_classical_data(
        #     {"type": "basis_choices", "data": self.basis_choices}
        # )

    def bb84_reconcile_bases(self, their_bases):
        """Performs basis reconciliation."""
        self.shared_bases_indices = [
            i
            for i, (b1, b2) in enumerate(zip(self.basis_choices, their_bases))
            if b1 == b2
        ]

        # Send confirmation of shared bases (classical communication)
        self.send_classical_data(
            {
                "type": "shared_bases_indices",
                "data": self.shared_bases_indices,
                "sender": self,
            },
        )

    def bb84_estimate_error_rate(self, their_bits_sample):
        """Estimates the error rate by comparing a sample of bits."""
        num_errors = 0
        for their_bit, i in their_bits_sample:
            if self.measurement_outcomes[i] != their_bit:
                num_errors += 1
        error_rate = num_errors / len(their_bits_sample) if len(their_bits_sample) > 0 else 0

        # Send error rate to destination host (classical communication)
        # self.send_classical_data({"type": "error_rate", "data": error_rate})

        # return error_rate
        
        # Decive if error_rate > threashold, raise error and retry otherwise, send raw
        self.send_classical_data({
            'type': 'complete'
        })
        
        raw_key = self.bb84_extract_key()
        if self.qkd_completed_fn:
            self.qkd_completed_fn(raw_key)
        

    def bb84_extract_key(self):
        """Extracts a shared key based on the reconciliation information."""
        shared_key = [self.measurement_outcomes[i] for i in self.shared_bases_indices]
        return shared_key
    
    def perform_qkd(self):
        # Log QKD initiation
        with open("log.txt", "a") as f:
            f.write(f"{self.name} initiating quantum key distribution\n")
        
        self.bb84_send_qubits()
        

    def __name__(self):
        return f"QuantumHost - '{self.name}'"

    def __repr__(self):
        return self.__name__()
