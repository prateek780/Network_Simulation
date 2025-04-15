from flask_socketio import SocketIO
import eventlet
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('SocketServer')

# Patch eventlet for asynchronous mode
eventlet.monkey_patch()

class SocketServer:
    _instance = None
    _socketio = None
    
    @classmethod
    def get_instance(cls, app=None):
        logger.debug("get_instance called with app: %s", app)
        if cls._instance is None:
            logger.debug("Creating new SocketServer instance")
            cls._instance = cls()
        
        # Initialize socketio if app is provided and socketio is None
        if app is not None:
            if cls._socketio is None:
                # Create the SocketIO instance with CORS enabled
                logger.debug("Creating new SocketIO instance with app")
                cls._socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
                logger.info("SocketIO instance created with app: %s", app)
                # Register event handlers
                cls._register_handlers()
            elif cls._socketio.server is None:
                # If we have a socketio instance but it needs to be initialized with the app
                logger.debug("Initializing existing SocketIO instance with app")
                cls._socketio.init_app(app)
                logger.info("SocketIO instance initialized with app: %s", app)
                # Register event handlers
                cls._register_handlers()
        
        return cls._instance
    
    @classmethod
    def _register_handlers(cls):
        """Register all event handlers"""
        logger.debug("Registering SocketIO event handlers")
        
        @cls._socketio.on('connect')
        def handle_connect():
            logger.info('Client connected: %s', cls._socketio.server)
            print('Client connected!')
            
        @cls._socketio.on('disconnect')
        def handle_disconnect():
            logger.info('Client disconnected')
            print('Client disconnected!')
            
        # Add your custom event handlers here
        @cls._socketio.on('client_message')
        def handle_message(data):
            logger.info('Received message: %s', data)
            print(f'Received message: {data}')
            # Echo back to the client
            cls._socketio.emit('server_response', {'status': 'received', 'data': data})
            logger.debug('Emitted server_response event')
            
        logger.debug("All SocketIO event handlers registered")
    
    def emit(self, event, data, room=None):
        """
        Emit an event to connected clients
        
        Args:
            event (str): Event name
            data (dict): Event data
            room (str, optional): Specific room to emit to
        """
        # Check if socketio is initialized
        if self._socketio is None:
            logger.warning("SocketIO not initialized, skipping emit")
            print("Warning: SocketIO not initialized, skipping emit")
            return
        
        try:    
            logger.debug("Emitting event: %s, data: %s, room: %s", event, str(data)[:100], room)
            print(f"Emitting event: {event}, data (truncated): {str(data)[:100]}...")
            
            if room:
                self._socketio.emit(event, data, room=room)
            else:
                self._socketio.emit(event, data)
                
            logger.debug("Event emitted successfully: %s", event)
        except Exception as e:
            logger.error("Error emitting event %s: %s", event, e)
            print(f"Error emitting event {event}: {e}")
    
    def get_socketio(self):
        """Get the SocketIO instance"""
        if self._socketio is None:
            logger.warning("get_socketio called but SocketIO is not initialized")
        else:
            logger.debug("get_socketio returning initialized SocketIO instance")
        return self._socketio

# Convenience function to get the socket server
def get_socket_server(app=None):
    return SocketServer.get_instance(app)