from typing import Tuple
from classical_network.connection import ClassicConnection
from classical_network.enum import PacketType
from classical_network.node import ClassicalNode
from classical_network.packet import ClassicDataPacket
from core.base_classes import World, Zone
from core.enums import NodeType
from core.exceptions import NotConnectedError
from core.network import Network
from classical_network.routing import InternetExchange, RouteTable


class ClassicalRouter(ClassicalNode):
    def __init__(
        self,
        address: str,
        location: Tuple[int, int],
        network: Network,
        zone: Zone | World = None,
        name="",
        description="",
    ):
        super().__init__(
            NodeType.CLASSICAL_ROUTER,
            location,
            address,
            network,
            zone,
            name,
            description,
        )
        self.routing_table = RouteTable()
        self.default_gateway = InternetExchange.get_instance()
        isp_connection = ClassicConnection(self, self.default_gateway, 100, 10)
        self.add_connection(isp_connection)

    def update_local_routing_table(self, node_1, node_2):
        self.routing_table.add_edge(node_1, node_2)

    def add_connection(self, connection: ClassicConnection):
        super().add_connection(connection)

        self.update_local_routing_table(connection.node_1, connection.node_2)
        self.default_gateway.add_connection(connection)

    def forward(self):
        for node_2, buffer in self.buffers.items():
            while not buffer.empty():
                packet = buffer.get()

                if packet.next_hop == self:
                    self.recive_packet(packet)
                else:
                    print(f"Unexpected packet '{packet}' received from {node_2}")

    def recive_packet(self, packet: ClassicDataPacket):
        packet.append_hop(self)
        if packet.type == PacketType.DATA:
            # Log the packet reception
            with open("log.txt", "a") as f:
                f.write(f"{self.name} received packet from {packet.from_address.name} to {packet.to_address.name} with data '{packet.data}'\n")
            
            self.route_packet(packet)
            self._send_update("packet_received", packet=packet)

    def route_packet(self, packet: ClassicDataPacket):
        direct_connection = self.get_connection(self, packet.to_address)

        if direct_connection:
            packet.next_hop = packet.to_address
            # Log direct routing
            with open("log.txt", "a") as f:
                f.write(f"{self.name} routing packet directly to {packet.to_address.name}\n")
            direct_connection.transmit_packet(packet)
            return

        shortest_path = self.default_gateway.get_path(self, packet.to_address)

        if len(shortest_path) <= 1:
            raise NotConnectedError(self, packet.to_address)

        next_hop = shortest_path[1]

        packet.next_hop = next_hop
        # Log next hop routing
        with open("log.txt", "a") as f:
            f.write(f"{self.name} routing packet to {packet.to_address.name} via next hop {next_hop.name}\n")
        
        next_connection = self.get_connection(self, next_hop)

        if not next_connection:
            raise NotConnectedError(self, next_hop)

        next_connection.transmit_packet(packet)
        self._send_update("packet_routed", packet=packet)

    def __name__(self):
        return f"Router - '{self.name}'"

    def __repr__(self):
        return self.__name__()
