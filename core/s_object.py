
import uuid
import logging
from core.event import Event

class Sobject:
    on_update_func = None

    def __init__(self, name="", description="",
        *args,
        **kwargs):
        self.name = (
            name if name else str(uuid.uuid4())
        )  # Assign a unique ID if name is not provided
        self.description = description
        self.logger = self._setup_logger()

        if 'on_update_func' in kwargs:
            self.on_update_func = kwargs['on_update_func']
        
        
    def set_on_update_func(self, func):
        self.on_update_func = func
    
    def _setup_logger(self):
        logger = logging.getLogger(f"{self.name}-{self.type.value if hasattr(self, 'type') else 'Sobject'}")
        logger.setLevel(logging.DEBUG)  # Set the desired logging level

        # Add a handler if it doesn't have one already
        if not logger.handlers:
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            handler = logging.StreamHandler()
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _send_update(self, event_type, **kwargs):
        event = Event(event_type, self, **kwargs)
        # print("ON UPDATE", self, event.to_dict(), self.on_update_func)
        self.on_update(event)

    def on_update(self, event: Event):
        if self.on_update_func:
            self.on_update_func(event)
        else:
            from server.api.simulation.manager import SimulationManager
            SimulationManager.get_instance().on_update(event)