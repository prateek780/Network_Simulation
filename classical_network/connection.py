from classical_network.node import ClassicalNode
from classical_network.packet import ClassicDataPacket
from core.base_classes import Sobject
from core.exceptions import NotConnectedError


class ClassicConnection(Sobject):
    def __init__(self, node_1: ClassicalNode, node_2: ClassicalNode, bandwidth, latency, status="up", name="", description=""):
        super().__init__(name, description)
        self.node_1 = node_1
        self.node_2 = node_2
        self.bandwidth = bandwidth
        self.latency = latency
        self.status = status
        
    def __name__(self):
        return f'{self.node_1.name} <-> {self.node_2.name}'
    
    def __repr__(self):
        return self.__name__()

    def transmit_packet(self, packet: ClassicDataPacket):
        if packet.next_hop == self.node_1:
            self.node_1.write_buffer(packet.hops[-1], packet)
        elif packet.next_hop == self.node_2:
            self.node_2.write_buffer(packet.hops[-1], packet)
        else:
            raise NotConnectedError(packet.hops[-1], packet.next_hop)

        self._send_update("packet_transmitted", packet=packet)

