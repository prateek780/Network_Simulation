def start_server():
    # Import and use eventlet for better performance
    import eventlet
    eventlet.monkey_patch()
    from server.app import get_app
    import socket
    import sys
    import time
    import os
    
    app, socketio = get_app()
    
    # Starting port
    base_port = 5174
    port = base_port
    
    # Function to check if a port is available
    def is_port_available(host, port):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind((host, port))
            return True
        except socket.error:
            return False
        finally:
            sock.close()
    
    # Cleanup: First find and kill any python processes using our ports
    try:
        import psutil
        print("Checking for processes using our ports...")
        for proc in psutil.process_iter(['pid', 'name']):
            if proc.info['name'] == 'python.exe':
                try:
                    # Get connections separately since it's not a valid attribute for process_iter
                    connections = proc.connections()
                    for conn in connections:
                        if hasattr(conn, 'laddr') and hasattr(conn.laddr, 'port'):
                            if conn.laddr.port in range(base_port, base_port + 10) and proc.pid != os.getpid():
                                print(f"Found Python process (PID {proc.pid}) using port {conn.laddr.port}, attempting to terminate")
                                try:
                                    proc.terminate()
                                    proc.wait(timeout=3)
                                except:
                                    print(f"Could not terminate process {proc.pid}, you may need to kill it manually")
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    # Skip processes we don't have access to
                    continue
    except ImportError:
        print("psutil module not found, skipping process cleanup (you might want to install it with 'pip install psutil')")
    
    # Try to start the server, handle port-in-use errors
    max_attempts = 10
    for attempt in range(max_attempts):
        try:
            # Check if port is available first
            if not is_port_available('0.0.0.0', port):
                print(f"Port {port} is already in use.")
                port += 1
                continue
                
            print(f"Attempting to start server on port {port}...")
            socketio.run(app, host='0.0.0.0', port=port, debug=True)
            print(f"Server successfully started on port {port}")
            break  # If successful, exit the loop
        except OSError as e:
            if "Only one usage of each socket address" in str(e) or "Address already in use" in str(e):
                if attempt < max_attempts - 1:
                    print(f"Port {port} is already in use.")
                    # Try a different port
                    port += 1
                    print(f"Trying port {port} instead...")
                    # Add a small delay to let the OS release resources
                    time.sleep(1)
                else:
                    print(f"Error: Could not find an available port after {max_attempts} attempts.")
                    print("Please ensure no other server processes are running and try again.")
                    print("You can use 'taskkill /f /im python.exe' to stop all Python processes.")
                    sys.exit(1)
            else:
                # For other socket errors, just raise them
                print(f"Socket error: {e}")
                sys.exit(1)

if __name__ == '__main__':
    start_server()