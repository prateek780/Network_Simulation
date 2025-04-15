import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: any) => void;
type ConnectHandler = () => void;
type DisconnectHandler = (reason: string) => void;


export enum SocketEvents {
    SimulationEvent = 'simulation_event'
}

/**
 * Singleton SocketIO client
 */
export class SocketIOClient {
    private static instance: SocketIOClient;
    private socket: Socket | null = null;
    private messageHandlers: Map<string, MessageHandler[]> = new Map();
    private connectHandlers: ConnectHandler[] = [];
    private disconnectHandlers: DisconnectHandler[] = [];
    private errorHandlers: ErrorHandler[] = [];
    private url: string | undefined = '';
    private options: Partial<ManagerOptions & SocketOptions> = {};
    private _connecting = false;
    simulationEventLogs: any[] = [];

    /**
     * Private constructor to prevent direct instantiation
     */
    private constructor() {
        console.log("SocketIOClient: Initializing socket client");
        // Store Messages in Memory
        this.onMessage(SocketEvents.SimulationEvent, (data) => {
            console.log("SocketIOClient: Received simulation event", data);
            this.simulationEventLogs.push(data);
        })
        console.log("SocketIOClient: Registered handler for SimulationEvent");
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SocketIOClient {
        if (!SocketIOClient.instance) {
            SocketIOClient.instance = new SocketIOClient();
        }
        return SocketIOClient.instance;
    }

    /**
     * Connect to Socket.IO server
     * 
     * @param url Server URL
     * @param options Connection options
     * @returns Promise that resolves when connected
     */
    public connect(
        url: string | undefined,
        options: Partial<ManagerOptions & SocketOptions> = {}
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected || this._connecting) {
                console.log("Socket already connected or connecting, skipping connection attempt");
                return resolve();
            }
            this._connecting = true;

            // Log connection attempt
            console.log(`Socket attempting to connect to: ${url}`);
            
            // Debug log for connection information
            console.log(`DEBUG - Socket connection - URL: ${url}, Options:`, options);

            this.url = url;
            this.options = options;

            try {
                console.log("DEBUG - Creating socket.io instance");
                this.socket = io(url, options);
                console.log("DEBUG - Socket.io instance created");

                this.socket.on('connect', () => {
                    console.log('Socket connected! Socket ID:', this.socket?.id);
                    console.log('DEBUG - Socket connect event - Connected successfully');
                    this.connectHandlers.forEach(handler => handler());
                    this._connecting = false;
                    resolve();
                });

                this.socket.on('disconnect', (reason) => {
                    console.log(`Socket disconnected: ${reason}`);
                    console.log('DEBUG - Socket disconnect event - Reason:', reason);
                    this.disconnectHandlers.forEach(handler => handler(reason));
                    this._connecting = false;
                });

                this.socket.on('connect_error', (error) => {
                    console.error('Connection error:', error);
                    console.error('DEBUG - Socket connect_error event:', error);
                    this.errorHandlers.forEach(handler => handler(error));
                    this._connecting = false;
                    reject(error);
                });

                // Set up message handlers from the map
                this.messageHandlers.forEach((handlers, event) => {
                    console.log(`Setting up handler for event: ${event}`);
                    this.socket?.on(event, (data) => {
                        console.log(`Received event: ${event}`, data);
                        console.log(`DEBUG - Socket received event: ${event} - Data:`, data);
                        handlers.forEach(handler => handler(data));
                    });
                });
                
                // Listen for all events for debugging
                this.socket.onAny((event, ...args) => {
                    console.log(`DEBUG - Socket onAny - Event: ${event}`, args);
                });
                
            } catch (error) {
                console.error('Failed to create socket:', error);
                console.error('DEBUG - Socket creation error:', error);
                reject(error);
            }
        });
    }

    /**
     * Reconnect to the server using the same URL and options
     */
    public reconnect(): Promise<void> {
        console.log("DEBUG - Socket reconnect initiated");
        if (this.socket) {
            this.socket.disconnect();
        }
        return this.connect(this.url, this.options);
    }

    /**
     * Disconnect from the server
     */
    public disconnect(): void {
        console.log("DEBUG - Socket disconnect initiated");
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Send a message to the server
     * 
     * @param event Event name
     * @param data Data to send
     * @returns Promise that resolves when the message is acknowledged, or void if no ack
     */
    public send<T = any>(
        event: string,
        data?: any
    ): Promise<T | void> {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                console.log(`DEBUG - Socket send failed - Not connected - Event: ${event}`);
                reject(new Error('Socket not connected'));
                return;
            }

            console.log(`DEBUG - Socket sending message - Event: ${event}`, data);
            this.socket.emit(event, data, (response: T) => {
                console.log(`DEBUG - Socket message ack received - Event: ${event}`, response);
                resolve(response);
            });
        });
    }

    /**
     * Register a handler for a specific message event
     * 
     * @param event Event name
     * @param handler Handler function
     */
    public onMessage(event: SocketEvents | string, handler: MessageHandler): void {
        console.log(`SocketIOClient: Registering handler for event: ${event}`);
        
        if (!this.messageHandlers.has(event)) {
            console.log(`SocketIOClient: First handler for event: ${event}, setting up socket listener`);
            this.messageHandlers.set(event, []);

            // If socket exists, add the event listener
            if (this.socket) {
                console.log(`SocketIOClient: Socket exists, adding listener for event: ${event}`);
                this.socket.on(event, (data) => {
                    console.log(`SocketIOClient: Received event from socket: ${event}`, data);
                    const handlers = this.messageHandlers.get(event) || [];
                    handlers.forEach(h => h(data));
                });
            } else {
                console.log(`SocketIOClient: Socket does not exist yet, will add listener when socket is created`);
            }
        } else {
            console.log(`SocketIOClient: Adding another handler for existing event: ${event}`);
        }

        const handlers = this.messageHandlers.get(event) || [];
        handlers.push(handler);
        this.messageHandlers.set(event, handlers);
        console.log(`SocketIOClient: Handler registered for event: ${event}, total handlers: ${handlers.length}`);
    }

    /**
     * Remove a specific handler for a message event
     * 
     * @param event Event name
     * @param handler Handler to remove
     */
    public offMessage(event: string, handler: MessageHandler): void {
        if (!this.messageHandlers.has(event)) return;

        const handlers = this.messageHandlers.get(event) || [];
        const index = handlers.indexOf(handler);

        if (index !== -1) {
            handlers.splice(index, 1);
            this.messageHandlers.set(event, handlers);
        }
    }

    /**
     * Register a connection handler
     * 
     * @param handler Handler function
     */
    public onConnect(handler: ConnectHandler): void {
        this.connectHandlers.push(handler);
    }

    /**
     * Register a disconnect handler
     * 
     * @param handler Handler function
     */
    public onDisconnect(handler: DisconnectHandler): void {
        this.disconnectHandlers.push(handler);
    }

    /**
     * Register an error handler
     * 
     * @param handler Handler function
     */
    public onError(handler: ErrorHandler): void {
        this.errorHandlers.push(handler);
    }

    /**
     * Check if socket is connected
     */
    public isConnected(): boolean {
        const connected = !!(this.socket && this.socket.connected);
        console.log(`DEBUG - Socket isConnected check: ${connected}`);
        return connected;
    }
}

// Export a default instance
export default SocketIOClient.getInstance();