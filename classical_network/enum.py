from enum import Enum


class PacketType(Enum):
    ESTABLISH = 'establish'
    DATA = 'data'