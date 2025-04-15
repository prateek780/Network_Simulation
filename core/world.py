from typing import List, Tuple
from core.base_classes import Zone
from core.network import Network
from core.s_object import Sobject


class World(Sobject):
    def __init__(self, size: Tuple[int, int] = (100, 100), name="", description=""):
        super().__init__(name, description)
        self.size = size
        self.zones: List[Zone] = []
        self.networks: List[Network] = []  # Store all objects in the world

    def add_zone(self, zone: "Zone"):
        self.zones.append(zone)

    def add_network(self, network: Network):
        self.networks.append(network)

    def remove_network(self, obj: Network):
        self.networks.remove(obj)