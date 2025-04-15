import * as fabric from 'fabric';
import { SimulatorNode } from "../base/baseNode";
import { ClassicalNetwork } from "./classicalNetwork";
import { getLogger } from '../../../helpers/simLogger';

/**
 * Manages the creation, retrieval, and manipulation of network objects within the simulator.
 * Implements the logic for automatic network creation and merging based on node connections.
 */
export class NetworkManager {
    /**
     * The singleton instance of the NetworkManager class.
     * @private
     * @static
     * @type {NetworkManager}
     */
    static #instance: NetworkManager;

    private logger = getLogger('NetworkManager');

    /**
     * The Fabric.js canvas instance where network elements are rendered.
     * @public
     * @type {fabric.Canvas}
     */
    canvas: fabric.Canvas;

    /**
     * A Map to store existing ClassicalNetwork instances, keyed by a unique identifier (e.g., a Set of nodes).
     * @private
     * @type {Map<Set<SimulatorNode>, ClassicalNetwork>}
     */
    private existingNetworks = new Set<ClassicalNetwork>();

    padding = 15;

    /**
     * Creates a new NetworkManager instance. **Private constructor to enforce singleton pattern.**
     *
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance for rendering networks.
     * @private
     */
    private constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    /**
     * Gets the singleton instance of the NetworkManager.
     * Initializes the instance if it does not already exist.
     *
     * @param {fabric.Canvas} [canvas] - The Fabric.js canvas instance (only needed for the initial call).
     * @returns {NetworkManager} The singleton NetworkManager instance.
     * @static
     */
    public static getInstance(canvas?: fabric.Canvas): NetworkManager {
        if (!NetworkManager.#instance && canvas) {
            console.log("Initialized Network Manager!");
            NetworkManager.#instance = new NetworkManager(canvas);
        }
        return NetworkManager.#instance;
    }

    /**
     * Handles the creation of a connection between two nodes and automatically manages network creation/merging.
     * Implements the logic from the pseudocode to infer network structure based on connections.
     *
     * @param {SimulatorNode} node1 - The first node involved in the connection.
     * @param {SimulatorNode} node2 - The second node involved in the connection.
     */
    onConnectionCreated(node1: SimulatorNode, node2: SimulatorNode) {
        const network1 = this.getNetworkForNode(node1);
        const network2 = this.getNetworkForNode(node2);

        if (!network1 && !network2) {
            // Case 1: Both Nodes NOT in Networks - Create a new network
            const newNetwork = this.createNewNetwork([node1, node2]);
            this.visuallyGroupNodesInNetwork(newNetwork);
        } else if (network1 && !network2) {
            // Case 2: One Node in a Network, the Other NOT - Expand network1
            this.addNodesToNetwork(network1, node2);
            this.visuallyGroupNodesInNetwork(network1);
        } else if (!network1 && network2) {
            // Case 2: One Node in a Network, the Other NOT - Expand network2
            this.addNodesToNetwork(network2, node1);
            this.visuallyGroupNodesInNetwork(network2);
        } else if (network1 && network2 && network1 !== network2) {
            // Case 3: Both Nodes in DIFFERENT Networks - Merge Networks
            const mergedNetwork = this.mergeNetworks(network1, network2);
            this.visuallyGroupNodesInNetwork(mergedNetwork);
        } else if (network1 && network2 && network1 === network2) {
            // Case 4: Both Nodes in the SAME Network - No change needed for network structure
            this.logger.debug("Nodes already in the same network, no network change.");
        }
    }

    onConnectionRemoved(node1: SimulatorNode, node2: SimulatorNode) {
        const network1 = this.getNetworkForNode(node1);
        const network2 = this.getNetworkForNode(node2);

        if (network1 && network2 && network1 === network2) {
            // Case 1: Both Nodes in the SAME Network - Check if network needs to be split
            const network = network1;
            // TODO: Implement network splitting logic
            // network.removeConnection(node1, node2);
            if (network.connectedNodes.size === 1) {
                // If network has only one node, remove the network
                this.deleteNetwork(network);
            } else {
                this.visuallyGroupNodesInNetwork(network);
            }
        } else {
            // Case 2: Nodes are NOT in the same network - No change needed for network structure
            this.logger.debug("Nodes not in the same network, no network change.");
        }
    }

    /**
     * Retrieves the ClassicalNetwork object that a node belongs to, if any.
     *
     * @param {SimulatorNode} node - The node to check for network membership.
     * @returns {ClassicalNetwork | undefined} The ClassicalNetwork object the node belongs to, or undefined if none.
     */
    getNetworkForNode(node: SimulatorNode): ClassicalNetwork | undefined {
        for (const network of this.existingNetworks.values()) {
            if (network.connectedNodes.has(node)) {
                return network;
            }
        }
        return undefined;
    }

    /**
     * Creates a new ClassicalNetwork object and adds it to the simulation.
     *
     * @param {SimulatorNode[]} nodes - An array of nodes to initially include in the new network.
     * @returns {ClassicalNetwork} The newly created ClassicalNetwork object.
     * @private
     */
    private createNewNetwork(nodes: SimulatorNode[]): ClassicalNetwork {
        const newNetwork = new ClassicalNetwork(nodes, `Network-${this.existingNetworks.size + 1}`, { canvas: this.canvas });
        this.existingNetworks.add(newNetwork); // Keyed by a Set of nodes for easy lookup
        this.logger.debug(`Created new network with nodes: ${nodes.map(n => n.name).join(', ')}`);
        return newNetwork;
    }

    /**
     * Adds nodes to an existing ClassicalNetwork.
     *
     * @param {ClassicalNetwork} network - The network to expand.
     * @param {...SimulatorNode} nodes - Nodes to add to the network.
     * @private
     */
    private addNodesToNetwork(network: ClassicalNetwork, ...nodes: SimulatorNode[]) {
        network.addNodes(...nodes);
        nodes.forEach(node => node.parentNetworkName = network.name);
        this.existingNetworks.add(network); // Update the key in case the node set changed
        this.logger.debug(`Expanded network to include nodes: ${nodes.map(n => n.name).join(', ')}`);
    }

    /**
     * Merges two ClassicalNetwork objects into a new network, combining their nodes and connections.
     *
     * @param {ClassicalNetwork} network1 - The first network to merge.
     * @param {ClassicalNetwork} network2 - The second network to merge.
     * @returns {ClassicalNetwork} The newly created merged ClassicalNetwork object.
     * @private
     */
    private mergeNetworks(network1: ClassicalNetwork, network2: ClassicalNetwork): ClassicalNetwork {
        const mergedNodes = new Set<SimulatorNode>([...network1.connectedNodes, ...network2.connectedNodes]);
        const mergedNetwork = this.createNewNetwork(Array.from(mergedNodes)); // Create a new network with merged nodes

        // this.existingNetworks.delete(network1.connectedNodes); // Remove the original networks
        // this.existingNetworks.delete(network2.connectedNodes);
        this.deleteNetwork(network1);
        this.deleteNetwork(network2);

        this.existingNetworks.add(mergedNetwork); // Add the merged network

        this.logger.debug(`Merged networks ${network1} and ${network2} into a new network.`);
        return mergedNetwork;
    }

    private deleteNetwork(network: ClassicalNetwork) {
        this.existingNetworks.delete(network);
        this.canvas.remove(network);
    }

    /**
     * Visually groups the nodes belonging to a network in the UI (Placeholder for UI integration).
     *
     * @param {ClassicalNetwork} network - The network to visually group.
     * @private
     */
    private visuallyGroupNodesInNetwork(network: ClassicalNetwork): void {
        if (!this.canvas.getObjects().includes(network)) {
            this.canvas.add(network); // Add the network object to the canvas
        }

        let x1 = Infinity;
        let y1 = Infinity;
        let x2 = 0;
        let y2 = 0;

        network.connectedNodes.forEach(node => {
            x1 = Math.min(x1, node.left);
            y1 = Math.min(y1, node.top);
            x2 = Math.max(x2, node.left + node.width);
            y2 = Math.max(y2, node.top + node.height);
        });

        network.set({
            left: x1 - this.padding,
            top: y1 - this.padding,
            width: x2 - x1 + this.padding,
            height: y2 - y1 + this.padding
        });
    }
    onNodeMoved(node: SimulatorNode) {
        const network = this.getNetworkForNode(node);
        if (network) {
            this.visuallyGroupNodesInNetwork(network);
        }
    }

    getAllNetworks(): ClassicalNetwork[] {
        return Array.from(this.existingNetworks.values());
    }
}