import React, { useCallback, useState } from "react";
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react';
import "./canvas.scss";
import Toolbar from "../toolbar/toolbar";
// import { manager } from "../node/nodeManager";
import { SimulationNodeType } from "../node/base/enums";
import * as fabric from "fabric";
import { ConnectionManager } from "../node/connections/connectionManager";
import { KeyboardListener } from "./keyboard";
import { SimulatorNode, SimulatorNodeOptions } from "../node/base/baseNode";
import { getLogger } from "../../helpers/simLogger";
import { NetworkManager } from "../node/network/networkManager";
import { exportToJSON } from "../../services/exportService";

const SimulatorCanvas: React.FC = () => {
    const { editor, onReady } = useFabricJSEditor();
    const [nodes, setNodes] = useState([]);
    const logger = getLogger("Canvas");


    // useEffect(() => {
    //     nodeManagerRef.current = new NodeManager(); // Initialize NodeManager instance
    // }, []);

    const fabricRendered = (canvas: fabric.Canvas) => {
        // ConnectionManager.getInstance(canvas);
        onReady(canvas);
    }


    const onFirstNodeAdded = (node: SimulatorNode) => {
        ConnectionManager.getInstance(editor?.canvas);
        KeyboardListener.getInstance(editor?.canvas);
        NetworkManager.getInstance(editor?.canvas);
    };

    const addNodeToCanvas = (fabricObject: fabric.FabricObject) => {
        editor?.canvas.add(fabricObject);

        if (editor?.canvas.getObjects().length === 1) {
            onFirstNodeAdded(fabricObject as SimulatorNode);
        }
    };

    const createNode = useCallback(async (type: SimulationNodeType, x: number, y: number) => {
        let newNode;
        // const nodeManager = manager;
        const nodeManager = (global as any).nodeManager;

        if (!nodeManager) {
            logger.error("NodeManager is not initialized.");
            return;
        }

        const commonOptions: Partial<SimulatorNodeOptions> = {
            canvas: editor?.canvas as fabric.Canvas,
        }

        if (type === SimulationNodeType.CLASSICAL_HOST) {
            newNode = nodeManager.createClassicalHost(`ClassicalHost-${nodeManager.getAllNodes().length + 1}`, x, y, commonOptions);
        } else if (type === SimulationNodeType.CLASSICAL_ROUTER) {
            newNode = nodeManager.createClassicalRouter(`ClassicalRouter-${nodeManager.getAllNodes().length + 1}`, x, y, commonOptions);
        } else if (type === SimulationNodeType.QUANTUM_HOST) {
            newNode = nodeManager.createQuantumHost(`QuantumHost-${nodeManager.getAllNodes().length + 1}`, x, y, commonOptions);
        } else if (type === SimulationNodeType.QUANTUM_ADAPTER) {
            newNode = nodeManager.createQuantumAdapter(`QuantumAdapter-${nodeManager.getAllNodes().length + 1}`, x, y, commonOptions);
        } else if (type === SimulationNodeType.QUANTUM_REPEATER) {
            newNode = nodeManager.createQuantumRepeater(`QuantumRepeater-${nodeManager.getAllNodes().length + 1}`, x, y, commonOptions);
        } else if (type === SimulationNodeType.INTERNET_EXCHANGE) {
            newNode = nodeManager.createInternetExchange(`InternetExchange-${nodeManager.getAllNodes().length + 1}`, x, y, commonOptions);
        } else if (type === SimulationNodeType.CLASSIC_TO_QUANTUM_CONVERTER) {
            newNode = nodeManager.createClassicToQuantumConverter(`C2QConverter-${nodeManager.getAllNodes().length + 1}`, x, y, commonOptions);
        } else if (type === SimulationNodeType.QUANTUM_TO_CLASSIC_CONVERTER) {
            newNode = nodeManager.createQuantumToClassicalConverter(`Q2CConverter-${nodeManager.getAllNodes().length + 1}`, x, y, commonOptions);
        } else if (type == SimulationNodeType.ZONE) {
            newNode = nodeManager.createZone(`Zone-${nodeManager.getAllNodes().length + 1}`, x, y, commonOptions);
        } else if (type == SimulationNodeType.CLASSICAL_NETWORK) {
            // newNode = nodeManager.createNetwork(`classical-network-${nodeManager.getAllNodes().length + 1}`, x, y, commonOptions);
        } else {
            logger.error("Unknown node type:", type);
            return;
        }


        if (newNode) {
            addNodeToCanvas(newNode); // Add Fabric.js object to canvas
            setNodes((prevNodes): any => [...prevNodes, newNode.getNodeInfo()]); // Update React state (if needed)
        }


        // Call API to create node (placeholder in api.js) - No need to call API on button click for POC
        // await api.createNode(newNode);
        // addNodeToCanvas(newNode); // No need to call this again as addNodeToCanvas is called above
    }, [editor]); // Dependency array includes editor and createNode

    // Callback function to create a ClassicalHost node
    const handleCreateClassicalHost = useCallback(() => {
        createNode(SimulationNodeType.CLASSICAL_HOST, 50, 50);
    }, [createNode]);

    // Callback function to create a ClassicalRouter node
    const handleCreateClassicalRouter = useCallback(() => {
        createNode(SimulationNodeType.CLASSICAL_ROUTER, 150, 50);
    }, [createNode]);

    // Callback function to create a QuantumHost node
    const handleCreateQuantumHost = useCallback(() => {
        createNode(SimulationNodeType.QUANTUM_HOST, 250, 50);
    }, [createNode]);

    const handleCreateQuantumRepeater = useCallback(() => {
        createNode(SimulationNodeType.QUANTUM_REPEATER, 350, 50);
    }, [createNode]);

    const handleCreateQuantumAdapter = useCallback(() => {
        createNode(SimulationNodeType.QUANTUM_ADAPTER, 450, 50);
    }, [createNode]);

    const handleCreateInternetExchange = useCallback(() => {
        createNode(SimulationNodeType.INTERNET_EXCHANGE, 550, 50);
    }, [createNode]);

    const handleCreateC2QConverter = useCallback(() => {
        createNode(SimulationNodeType.CLASSIC_TO_QUANTUM_CONVERTER, 650, 50);
    }, [createNode]);

    const handleCreateQ2CConverter = useCallback(() => {
        createNode(SimulationNodeType.QUANTUM_TO_CLASSIC_CONVERTER, 750, 50);
    }, [createNode]);

    const handleCreateZone = useCallback(() => {
        createNode(SimulationNodeType.ZONE, 50, 200);
    }, [createNode]);

    const handleCreateNetwork = useCallback(() => {
        createNode(SimulationNodeType.CLASSICAL_NETWORK, 50, 300);
    }, [createNode]);


    return (
        <div className="playground-container">
            <Toolbar
                onCreateClassicalHost={handleCreateClassicalHost}
                onCreateClassicalRouter={handleCreateClassicalRouter}
                onCreateQuantumHost={handleCreateQuantumHost}
                onCreateQuantumRepeater={handleCreateQuantumRepeater}
                onCreateQuantumAdapter={handleCreateQuantumAdapter}
                onCreateInternetExchange={handleCreateInternetExchange}
                onCreateClassicToQuantumConverter={handleCreateC2QConverter}
                onCreateQuantumToClassicalConverter={handleCreateQ2CConverter}
                onCreateZone={handleCreateZone}
                onCreateNetwork={handleCreateNetwork}
                onExportClick={exportToJSON}
            />

            <FabricJSCanvas className="canvas-container" onReady={fabricRendered} />
        </div>
    );
};

export default SimulatorCanvas;