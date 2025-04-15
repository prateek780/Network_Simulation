"use client"

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle, useLayoutEffect } from "react"
import { motion } from "framer-motion"
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react';
import { getLogger } from "@/helpers/simLogger"
import { SimulatorNode, SimulatorNodeOptions } from "../node/base/baseNode";
import { ConnectionManager } from "../node/connections/connectionManager";
import { KeyboardListener } from "./keyboard";
import { NetworkManager } from "../node/network/networkManager";
import { SimulationNodeType } from "../node/base/enums";
import { manager } from "../node/nodeManager";
import * as fabric from "fabric";
import "./canvas.scss";
import api from "@/services/api";
import { getNewNode } from "./utils";
import { SocketIOClient } from "@/services/socket";
import { importFromJSON } from "@/services/importService";
import { NetworkAnimationController } from "./animation";


interface NetworkCanvasProps {
  onNodeSelect: (node: any) => void
  isSimulationRunning: boolean
  simulationTime: number
  activeMessages?: any[]
}

export const NetworkCanvas = forwardRef(({ onNodeSelect, isSimulationRunning, simulationTime, activeMessages = [], }: NetworkCanvasProps, ref) => {
  // const canvasRef = useRef<HTMLCanvasElement>(null)
  const { editor, onReady } = useFabricJSEditor();
  const [nodes, setNodes] = useState([]);

  const logger = getLogger("Canvas");

  useLayoutEffect(() => {
    setTimeout(async () => {
      const savedTopology = await api.getTopology();
      if (savedTopology?.zones) {
        importFromJSON(savedTopology, editor?.canvas as fabric.Canvas);
        onFirstNodeAdded();
      }

      console.log("DEBUG - NetworkCanvas - Setting up socket connection");
      
      // Try connecting to multiple possible ports
      const possiblePorts = [5174, 5175, 5176];
      let connected = false;
      
      for (const port of possiblePorts) {
        if (connected) break;
        
        // Construct URL with current port
        const URL = process.env.NODE_ENV === 'production' 
          ? `${window.location.protocol}//${window.location.hostname}:${port}` 
          : `http://localhost:${port}`;
          
        console.log(`DEBUG - NetworkCanvas - Attempting to connect to Socket URL: ${URL}`);
        
        try {
          await SocketIOClient.getInstance().connect(URL, {});
          console.log(`DEBUG - NetworkCanvas - Socket connected successfully to port ${port}`);
          connected = true;
        } catch (error) {
          console.error(`DEBUG - NetworkCanvas - Socket connection error on port ${port}:`, error);
        }
      }
      
      if (!connected) {
        console.error("DEBUG - NetworkCanvas - Failed to connect to any socket ports. Please check if the server is running.");
      }

      NetworkAnimationController.getInstance(editor?.canvas as fabric.Canvas);
    }, 2500);
  }, [editor]);

  // Update canvas when simulation state changes
  useEffect(() => {
    // Animate quantum states if simulation is running
    if (isSimulationRunning) {
      // Animation logic would go here
    }
  }, [isSimulationRunning, simulationTime, activeMessages])


  const drawMessagePacket = (ctx: CanvasRenderingContext2D, x: number, y: number, protocol: string) => {
    // Draw different packet styles based on protocol
    console.log("Draw Packet")
  }

  const animatePacket = async () => {
    // Draw active messages
    activeMessages.forEach((message) => {
      const sourceNode = nodes[message.source]
      const targetNode = nodes[message.target]

      if (sourceNode && targetNode) {
        // Calculate message position based on progress
        const progress = (simulationTime - message.startTime) / message.duration
      }
    })
  }

  const fabricRendered = async (canvas: fabric.Canvas) => {
    // Prevent multiple initializations
    // if (fabricInitialized.current) return;
    // fabricInitialized.current = true;

    if (editor?.canvas) {
      console.log("Canvas already initialized, skipping");
      return;
    }


    onReady(canvas);

    canvas.on('mouse:down', (e) => {
      const selectedNode = e.target;
      onNodeSelect(selectedNode);
    })
  }


  const onSimulatorEvent = (event: any) => {
    console.log(event)
  }

  const onFirstNodeAdded = () => {
    ConnectionManager.getInstance(editor?.canvas);
    KeyboardListener.getInstance(editor?.canvas);
    NetworkManager.getInstance(editor?.canvas);
    // api.startAutoUpdateNetworkTopology();
  };

  const addNodeToCanvas = (fabricObject: fabric.FabricObject) => {
    editor?.canvas.add(fabricObject);

    if (editor?.canvas.getObjects().length === 1) {
      onFirstNodeAdded();
    }
  };

  const createNewNode = async (type: SimulationNodeType, x: number, y: number) => {
    const nodeManager = manager;

    if (!nodeManager) {
      logger.error("NodeManager is not initialized.");
      return;
    }

    const newNode = getNewNode(type, x, y, editor?.canvas as fabric.Canvas)

    if (newNode) {
      addNodeToCanvas(newNode); // Add Fabric.js object to canvas
      setNodes((prevNodes): any => [...prevNodes, newNode.getNodeInfo()]);
    }
  }

  const createNodeCallback = useCallback(createNewNode, [editor]); // Dependency array includes editor and createNode

  // Function to clear the canvas
  const clearCanvas = useCallback(() => {
    if (editor?.canvas) {
      // Get all objects on the canvas
      const objects = editor.canvas.getObjects();
      
      // Remove all objects
      if (objects.length > 0) {
        editor.canvas.remove(...objects);
      }
      
      // Reset state
      setNodes([]);
      
      // Render the empty canvas
      editor.canvas.renderAll();
      
      logger.info("Canvas cleared");
    }
  }, [editor, logger]);

  useImperativeHandle(ref, () => ({
    handleCreateClassicalHost: () => {
      createNodeCallback(SimulationNodeType.CLASSICAL_HOST, 50, 50);
    },
    handleCreateClassicalRouter: () => {
      createNodeCallback(SimulationNodeType.CLASSICAL_ROUTER, 150, 50);
    },
    handleCreateQuantumHost: () => {
      createNodeCallback(SimulationNodeType.QUANTUM_HOST, 250, 50);
    },
    handleCreateQuantumRepeater: () => {
      createNodeCallback(SimulationNodeType.QUANTUM_REPEATER, 350, 50);
    },
    handleCreateQuantumAdapter: () => {
      createNodeCallback(SimulationNodeType.QUANTUM_ADAPTER, 450, 50);
    },
    handleCreateInternetExchange: () => {
      createNodeCallback(SimulationNodeType.INTERNET_EXCHANGE, 550, 50);
    },
    handleCreateC2QConverter: () => {
      createNodeCallback(SimulationNodeType.CLASSIC_TO_QUANTUM_CONVERTER, 650, 50);
    },
    handleCreateQ2CConverter: () => {
      createNodeCallback(SimulationNodeType.QUANTUM_TO_CLASSIC_CONVERTER, 750, 50);
    },
    handleCreateZone: () => {
      createNodeCallback(SimulationNodeType.ZONE, 50, 200);
    },
    handleCreateNetwork: () => {
      createNodeCallback(SimulationNodeType.CLASSICAL_NETWORK, 50, 300);
    },
    clearCanvas: clearCanvas
  }));

  return (
    <div className="w-full h-full bg-slate-900 relative">
      {/* <canvas
        ref={canvasRef}
        className="w-full h-full"
        onClick={(e) => {
          // Handle node selection logic here
          // For now, just a placeholder
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top

          // Check if a node was clicked
          // This would be replaced with your actual node detection logic
          console.log(`Canvas clicked at (${x}, ${y})`)
        }}
      /> */}

      <FabricJSCanvas className="canvas-container w-full h-full" onReady={fabricRendered} />

      {/* Overlay elements for interactive components */}
      <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-sm p-2 rounded-md">
        <div className="text-xs text-slate-400">Simulation Time</div>
        <div className="text-lg font-mono">{simulationTime.toFixed(2)}s</div>
      </div>

      {/* Visual indicator for simulation running state */}
      {isSimulationRunning && (
        <motion.div
          className="absolute top-4 left-4 bg-green-500 h-3 w-3 rounded-full"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        />
      )}

      {/* Message count indicator */}
      {activeMessages.length > 0 && (
        <div className="absolute bottom-20 right-4 bg-slate-800/80 backdrop-blur-sm p-2 rounded-md">
          <div className="text-xs text-slate-400">Active Messages</div>
          <div className="text-lg font-mono">{activeMessages.length}</div>
        </div>
      )}
    </div>
  )
});
