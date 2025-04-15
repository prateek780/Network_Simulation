from queue import Queue
import time
from typing import List, Tuple
import qutip as qt
from classical_network.connection import ClassicConnection
from classical_network.enum import PacketType
from classical_network.packet import ClassicDataPacket
from classical_network.router import ClassicalRouter
from core.base_classes import Node, World, Zone
from core.enums import NodeType, NetworkType
from core.exceptions import (
    DefaultGatewayNotFound,
    NotConnectedError,
    PairAdapterAlreadyExists,
    PairAdapterDoesNotExists,
    QuantumChannelDoesNotExists,
    UnSupportedNetworkError,
)
from core.network import Network

# from quantum_network.channel import QuantumChannel
from quantum_network.host import QuantumHost
from quantum_network.packet import QKDTransmissionPacket
from utils.simple_encryption import simple_xor_decrypt, simple_xor_encrypt

# from quantum_network.node import QuantumNode
# from quantum_network.repeater import QuantumRepeater
# from classical_network.router import ClassicalRouter


class QuantumAdapter(Node):
    def __init__(
        self,
        address: str,
        classical_network: Network,
        quantum_network: Network,
        location: Tuple,
        paired_adapter: "QuantumAdapter",
        quantum_host: QuantumHost,
        zone=None,
        name="",
        description="",
    ):
        super().__init__(address, location, classical_network, zone, name, description)
        self.type = NodeType.QUANTUM_ADAPTER
        self.classical_network = classical_network
        self.quantum_network = quantum_network
        self.input_data_buffer = Queue()

        self.shared_key = None  # Store the shared secret key here

        self.local_quantum_host = quantum_host
        self.local_quantum_host.send_classical_data = self.send_classical_data
        self.local_quantum_host.qkd_completed_fn = self.on_qkd_established
        self.local_classical_router = ClassicalRouter(
            f"InternalQCRouter{self.name}",
            self.location,
            self.classical_network,
            self.zone,
            f"QC_Router_{self.name}",
        )
        self.local_classical_router.route_packet = self.intercept_route_packet

        self.paired_adapter = paired_adapter  # Reference to the paired adapter
        if paired_adapter:
            connection = ClassicConnection(
                self.local_classical_router,
                self.paired_adapter.local_classical_router,
                10,
                10,
                name="QC_Router_Connection",
            )
            self.local_classical_router.add_connection(connection)
            self.paired_adapter.local_classical_router.add_connection(connection)

        if paired_adapter and (
            not self.local_quantum_host.channel_exists(
                paired_adapter.local_quantum_host
            )
        ):
            raise QuantumChannelDoesNotExists(self)

    def add_paired_adapter(self, adapter: "QuantumAdapter"):
        if self.paired_adapter:
            raise PairAdapterAlreadyExists(self, self.paired_adapter)

        self.paired_adapter = adapter

    def on_qkd_established(self, key: List[int]):
        self.shared_key = key
        self.logger.debug(f"QKD Established {key}")

        while not self.input_data_buffer.empty():
            packet = self.input_data_buffer.get()
            self.receive_packet(packet)

    def calculate_distance(self, node1, node2):
        # Simple Euclidean distance calculation, adjust as needed for your network topology
        x1, y1 = node1.location
        x2, y2 = node2.location
        return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5

    def initiate_qkd(self):
        # Initiate QKD with the paired adapter
        if self.paired_adapter:
            self.local_quantum_host.perform_qkd()
            self._send_update("qkd_initiated", with_adapter=self.paired_adapter)
        else:
            self.logger.debug(f"{self.name} has no paired adapter to perform QKD.")
            raise PairAdapterDoesNotExists(self)

    def receive_packet(self, packet: ClassicDataPacket | QKDTransmissionPacket):
        # Log packet reception
        with open("log.txt", "a") as f:
            f.write(f"{self.name} received packet from {packet.from_address.name}\n")
        
        # If the packet was last sent by pair adapter and  is type of classical packet, that packet was result of QKD encryption
        if (
            packet.hops[-2] == self.paired_adapter.local_classical_router
            and type(packet) == ClassicDataPacket
        ):
            self.process_packet(packet)
        elif type(packet) == QKDTransmissionPacket:
            with open("log.txt", "a") as f:
                f.write(f"{self.name} received QKD transmission packet\n")
            self.local_quantum_host.receive_classical_data(packet.data)
        else:
            # Check if a QKD process needs to be initiated or if a key exists
            if self.shared_key is None and self.paired_adapter is not None:
                with open("log.txt", "a") as f:
                    f.write(f"{self.name} initiating QKD with {self.paired_adapter.name} before processing packet\n")
                self.initiate_qkd()
                self.input_data_buffer.put(packet)
                return

            # If the packet is for the paired adapter, check if a key exists and then encrypt and forward
            if self.paired_adapter and packet.to_address == self.local_classical_router:
                if self.shared_key:
                    with open("log.txt", "a") as f:
                        f.write(f"{self.name} encrypting packet for {self.paired_adapter.name}\n")
                    packet = self.encrypt_packet(packet)
                    self.forward_packet(packet, self.paired_adapter.local_classical_router)
                else:
                    with open("log.txt", "a") as f:
                        f.write(f"{self.name} cannot forward packet, no shared key with {self.paired_adapter.name}\n")
                    print(
                        f"Time: {self.network.world.time:.2f}, {self.name} cannot forward packet, no shared key with {self.paired_adapter.name}"
                    )
            else:
                # Otherwise, forward the packet normally
                with open("log.txt", "a") as f:
                    f.write(f"{self.name} forwarding packet to {self.paired_adapter.name}\n")
                self.forward_packet(packet, self.paired_adapter.local_classical_router)
        self._send_update("packet_received", packet=packet)

    def encrypt_packet(self, packet: ClassicDataPacket):
        encrypted_data = simple_xor_encrypt(packet.data, self.shared_key)
        self.logger.debug(f"Encrypted Data: {packet.data} -> {encrypted_data}")
        
        with open("log.txt", "a") as f:
            f.write(f"{self.name} encrypted data '{packet.data}' to '{encrypted_data}'\n")
        
        return ClassicDataPacket(
            data=encrypted_data,
            from_address=packet.from_address,
            to_address=self.paired_adapter.local_classical_router,
            type=packet.type,
            protocol=packet.protocol,
            time=packet.time,
            name=packet.name,
            description=packet.description,
            destination_address=packet.destination_address,
        )

    def decrypt_packet(self, packet: ClassicDataPacket):
        decrypted_data = simple_xor_decrypt(packet.data, self.shared_key)
        self.logger.debug(f"Decrypted Data: {packet.data} -> {decrypted_data}")

        with open("log.txt", "a") as f:
            f.write(f"{self.name} decrypted data '{packet.data}' to '{decrypted_data}'\n")

        return ClassicDataPacket(
            data=decrypted_data,
            from_address=packet.from_address,
            to_address=packet.destination_address or packet.to_address,
            type=packet.type,
            protocol=packet.protocol,
            time=packet.time,
            name=packet.name,
            description=packet.description,
        )

    def process_packet(self, packet: ClassicDataPacket):
        # Decrypt the packet if a shared key exists
        with open("log.txt", "a") as f:
            f.write(f"{self.name} processing packet from {packet.from_address.name}\n")
        
        if self.shared_key:
            packet = self.decrypt_packet(packet)
            # Assuming the decrypted packet is meant to be forwarded to a classical node
            with open("log.txt", "a") as f:
                f.write(f"{self.name} forwarding decrypted packet to {packet.to_address.name}\n")
            self.forward_packet(
                packet, packet.to_address
            )  # You may need to adjust the logic for determining the next hop
        else:
            with open("log.txt", "a") as f:
                f.write(f"{self.name} cannot process packet, no shared key\n")
            print(
                f"Time: {self.network.world.time:.2f}, {self.name} cannot process packet, no shared key"
            )

    def send_classical_data(self, data):

        conn = self.local_classical_router.get_connection(
            self.local_classical_router, self.paired_adapter.local_classical_router
        )

        if not conn:
            raise NotConnectedError(self, self.paired_adapter.local_classical_router)

        packet = QKDTransmissionPacket(
            data=data,
            from_address=self.local_classical_router,
            to_address=self.paired_adapter.local_classical_router,
            type=PacketType.DATA,
        )
        conn.transmit_packet(packet)

    def forward(self):
        self.local_classical_router.forward()

    def intercept_route_packet(self, packet: ClassicDataPacket):
        self.receive_packet(packet)

    def forward_packet(self, packet: ClassicDataPacket, to):
        packet.append_hop(self.local_classical_router)
        with open("log.txt", "a") as f:
            f.write(f"{self.name} forwarding packet from {packet.from_address.name} to {to.name}\n")
        
        direct_connection = self.local_classical_router.get_connection(
            self.local_classical_router, to
        )
        #  self.paired_adapter.local_classical_router

        if direct_connection:
            packet.next_hop = packet.to_address
            with open("log.txt", "a") as f:
                f.write(f"{self.name} using direct connection to {to.name}\n")
            direct_connection.transmit_packet(packet)
            return
        
        shortest_path = self.local_classical_router.default_gateway.get_path(self.local_classical_router, packet.to_address)
        
        if len(shortest_path) <= 1:
            raise NotConnectedError(self.local_classical_router, packet.to_address)
        
        next_hop = shortest_path[1]
        with open("log.txt", "a") as f:
            f.write(f"{self.name} routing via next hop {next_hop.name}\n")
        
        packet.next_hop = next_hop
        next_connection = self.local_classical_router.get_connection(self.local_classical_router, next_hop)
        
        if not next_connection:
            raise NotConnectedError(self.local_classical_router, next_hop)
        
        next_connection.transmit_packet(packet)

    def __name__(self):
        return f"QuantumAdapter - '{self.name}'"

    def __repr__(self):
        return self.__name__()
