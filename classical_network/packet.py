from datetime import datetime
import json
from typing import Any
from classical_network.enum import PacketType
from core.base_classes import Node, Sobject


class ClassicDataPacket(Sobject):
    def __init__(
        self,
        data: Any,
        from_address: Node,
        to_address: Node,
        type: PacketType,
        protocol="tcp",
        time=0,
        name="",
        description="",
        destination_address: Node = None,
    ):
        super().__init__(name, description)

        if time == 0:
            time = datetime.now().timestamp

        self.from_address = from_address
        self.to_address = to_address
        self.type = type
        self.time = time
        self.hops = [from_address]
        self.protocol = protocol
        self.next_hop = to_address
        self.data = data
        self.destination_address = destination_address

    def append_hop(self, hop: Node):
        self.hops.append(hop)
    
    def to_dict(self):
        dict_str = {
            'type': str(type(self)),
            'from': self.from_address.name,
            'to': self.to_address.name,
            'hops': list(map(lambda x : x.name,self.hops)),
            'data': str(self.data),
            'destination_address': self.destination_address.name if self.destination_address else None 
        }
        
        return dict_str

        
    # def __name__(self):
    #     json_str = self.toJSON()
    #     return f"Packet -> {json_str}"
    
    # def __repr__(self):
    #     return self.__name__()
