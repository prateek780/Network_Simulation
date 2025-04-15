export enum SimulationNodeType {
    CLASSICAL_HOST,
    CLASSICAL_ROUTER,
    CLASSICAL_NETWORK,
    INTERNET_EXCHANGE,
    QUANTUM_ADAPTER,
    QUANTUM_HOST,
    QUANTUM_REPEATER,
    CLASSIC_TO_QUANTUM_CONVERTER,
    QUANTUM_TO_CLASSIC_CONVERTER,
    ZONE,
}

export function getNodeFamily(node: SimulationNodeType): NodeFamily {
    if (node === SimulationNodeType.CLASSICAL_HOST || node === SimulationNodeType.CLASSICAL_ROUTER || node === SimulationNodeType.CLASSICAL_NETWORK || node === SimulationNodeType.INTERNET_EXCHANGE) {
        return NodeFamily.CLASSICAL;
    } else if (node === SimulationNodeType.QUANTUM_HOST || node === SimulationNodeType.QUANTUM_REPEATER) {
        return NodeFamily.QUANTUM;
    }
    return NodeFamily.HYBRID;
}

export enum NodeFamily {
    CLASSICAL,
    QUANTUM,
    HYBRID
}