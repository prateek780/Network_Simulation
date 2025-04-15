import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Info, CheckCircle, Search, RefreshCw, Wifi, WifiOff } from "lucide-react"
import socket, { SocketIOClient } from "@/services/socket";
import { convertEventToLog } from "./log-parser";
import { Input } from "../ui/input";
import { toast } from "sonner";

export interface LogI {
  level: string;
  time: string;
  source: string;
  message: string;
}

export function SimulationLogsPanel() {
  
  const socket = SocketIOClient.getInstance();
  
  const [logFilter, setLogFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [simulationLogs, setSimulationLogs] = useState<LogI[]>([]);
  const [socketConnected, setSocketConnected] = useState(socket.isConnected());

  // Initialize with current logs and log debug info
  useEffect(() => {
    console.log("DEBUG - SimulationLogsPanel - Initializing with existing logs");
    console.log("DEBUG - SimulationLogsPanel - Socket event logs count:", socket.simulationEventLogs.length);
    
    loadLogsFromSocket();
    
    // Check socket connection status periodically
    const intervalId = setInterval(() => {
      const isConnected = socket.isConnected();
      setSocketConnected(isConnected);
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  const loadLogsFromSocket = () => {
    const initialLogs = socket.simulationEventLogs
      .slice() // Create a copy to avoid modifying the original array
      .reverse()
      .map(x => {
        console.log("DEBUG - SimulationLogsPanel - Processing event log:", x);
        const converted = convertEventToLog(x);
        console.log("DEBUG - SimulationLogsPanel - Converted log:", converted);
        return converted;
      })
      .filter(x => x !== undefined);
      
    console.log("DEBUG - SimulationLogsPanel - Initial logs count:", initialLogs.length);
    setSimulationLogs(initialLogs);
  };

  useEffect(() => {
    console.log("DEBUG - SimulationLogsPanel - Setting up event handler for simulation_event");
    const handleEvent = (event: any) => {
      console.log("DEBUG - SimulationLogsPanel - Received simulation_event:", event);
      const converted = convertEventToLog(event);
      console.log("DEBUG - SimulationLogsPanel - Converted event to log:", converted);
      if (converted) {
        console.log("DEBUG - SimulationLogsPanel - Adding log to state");
        setSimulationLogs(prevLogs => [converted, ...prevLogs]);
      } else {
        console.log("DEBUG - SimulationLogsPanel - Event could not be converted to log");
      }
    };

    // Debug socket connection state
    const isConnected = socket.isConnected();
    console.log("DEBUG - SimulationLogsPanel - Socket connected:", isConnected);
    setSocketConnected(isConnected);
    
    // Register handler for simulation events
    socket.onMessage('simulation_event', handleEvent);
    console.log("DEBUG - SimulationLogsPanel - Registered handler for simulation_event");
    
    // Register handler for server responses to test pings
    socket.onMessage('server_response', (data) => {
      console.log("DEBUG - SimulationLogsPanel - Received server_response:", data);
      toast.success("Server connection verified");
    });

    // Clean up the event listener on unmount
    return () => {
      console.log("DEBUG - SimulationLogsPanel - Removing event handler for simulation_event");
      socket.offMessage('simulation_event', handleEvent);
      socket.offMessage('server_response', () => {});
    };
  }, []); // Empty dependency array so this only runs once

  // Handle manual refresh
  const handleRefresh = async () => {
    console.log("DEBUG - SimulationLogsPanel - Manual refresh requested");
    
    // Check socket connection
    if (!socket.isConnected()) {
      console.log("DEBUG - SimulationLogsPanel - Socket not connected, attempting to connect");
      
      // Try connecting to multiple possible ports
      const possiblePorts = [5174, 5175, 5176];
      let connected = false;
      
      for (const port of possiblePorts) {
        if (connected) break;
        
        try {
          // Try to connect to socket if not already connected
          const URL = process.env.NODE_ENV === 'production' 
            ? `${window.location.protocol}//${window.location.hostname}:${port}` 
            : `http://localhost:${port}`;
            
          console.log(`DEBUG - SimulationLogsPanel - Attempting to connect to port ${port}`);
          await socket.connect(URL, {});
          console.log(`DEBUG - SimulationLogsPanel - Socket connected successfully to port ${port}`);
          connected = true;
          setSocketConnected(true);
          toast.success(`Socket connection established on port ${port}`);
        } catch (error) {
          console.error(`DEBUG - SimulationLogsPanel - Failed to connect socket on port ${port}:`, error);
        }
      }
      
      if (!connected) {
        setSocketConnected(false);
        toast.error("Failed to connect to server socket on any port");
      }
    }
    
    // Load logs from socket regardless of connection status (may be stored in memory)
    loadLogsFromSocket();
  };
  
  // Send test message to server
  const handleTestConnection = async () => {
    try {
      console.log("DEBUG - SimulationLogsPanel - Sending test message to server");
      await socket.send('client_message', { test: 'Testing socket connection' });
      console.log("DEBUG - SimulationLogsPanel - Test message sent");
    } catch (error) {
      console.error("DEBUG - SimulationLogsPanel - Error sending test message:", error);
      toast.error("Failed to send test message");
    }
  };

  // Filter logs based on level and search query
  const filteredLogs = simulationLogs.filter((log) => {
    const matchesLevel = logFilter === "all" || log.level === logFilter
    const matchesSearch =
      searchQuery === "" ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesLevel && matchesSearch
  })

  // Function to get the appropriate icon for log level
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  // Function to get the appropriate badge color for log level
  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-900/30 text-red-400 hover:bg-red-900/40"
      case "warning":
        return "bg-amber-900/30 text-amber-400 hover:bg-amber-900/40"
      case "info":
        return "bg-blue-900/30 text-blue-400 hover:bg-blue-900/40"
      case "success":
        return "bg-green-900/30 text-green-400 hover:bg-green-900/40"
      default:
        return "bg-slate-800 hover:bg-slate-700"
    }
  }

  const clearLogs = () => {
    console.log("DEBUG - SimulationLogsPanel - Clearing logs");
    setSimulationLogs([]);
    socket.simulationEventLogs = [];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Simulator Logs</h3>
          {socketConnected ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <span className={`text-xs ${socketConnected ? 'text-green-400' : 'text-red-400'}`}>
            {socketConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" 
            size="sm"
            onClick={handleTestConnection}
            disabled={!socketConnected}
            className="flex items-center gap-1 text-xs"
          >
            <Wifi className="h-3 w-3" /> Test
          </Button>
          <Button
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search logs..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-md border border-slate-700">
        <div className="grid grid-cols-12 gap-2 p-2 border-b border-slate-700 text-xs font-medium text-slate-400">
          <div className="col-span-1">Level</div>
          <div className="col-span-2">Time</div>
          <div className="col-span-3">Source</div>
          {/* <div className="col-span-6">Message</div> */}
        </div>

        <ScrollArea className="h-[75vh] overflow-x-auto">
          <div className="space-y-1 p-2">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 p-2 text-sm rounded hover:bg-slate-800">
                  <div className="col-span-1 flex items-center">
                    <Badge className={`flex h-6 items-center gap-1 px-2 ${getLogLevelBadge(log.level)}`}>
                      {getLogLevelIcon(log.level)}
                    </Badge>
                  </div>
                  <div className="col-span-2 font-mono text-slate-400">{log.time}</div>
                  <div className="col-span-3 font-medium">{log.source}</div>
                  <div className="col-span-6 text-slate-300">{log.message}</div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-20 text-slate-500">
                No logs matching current filters
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-2 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
          <div>
            Showing {filteredLogs.length} of {simulationLogs.length} logs
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}