import time

from utils.encoding import transform_val

class Event:
    def __init__(self, event_type, node, **kwargs):
        self.event_type = event_type  # e.g., "packet_received", "data_sent", "connection_added"
        self.node = node  # The node where the event occurred
        self.timestamp = time.time()
        self.data = kwargs  # Any additional data related to the event

    def to_dict(self):
        return {
            'event_type': self.event_type,
            'node': self.node.name,  # Use node name instead of full node object
            'timestamp': self.timestamp,
            'data': {k: transform_val(v)
                    for k, v in self.data.items()}
        }