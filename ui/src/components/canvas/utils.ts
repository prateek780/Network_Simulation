import { SimulatorNodeOptions } from "../node/base/baseNode";
import { SimulationNodeType } from "../node/base/enums";
// import { manager } from "../node/nodeManager";
import * as fabric from "fabric";

export function getNewNode(type: SimulationNodeType, x: number, y: number, canvas: fabric.Canvas, options: Partial<SimulatorNodeOptions> = {}) {
    const nodeManager = (window as any).nodeManager;
    let newNode;

    const commonOptions: Partial<SimulatorNodeOptions> = {
        //   canvas: editor?.canvas as fabric.Canvas,
        canvas,
        ...options
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
        console.error("Unknown node type:", type);
        return;
    }

    return newNode;
}