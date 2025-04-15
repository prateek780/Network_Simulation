import { NetworkManager } from "@/components/node/network/networkManager";
import { getLogger } from "@/helpers/simLogger";
import { AdapterI, ExportDataI, NetworkI } from "./export.interface";
import { SimulatorNode } from "@/components/node/base/baseNode";
import * as fabric from "fabric";
import { ConnectionManager } from "@/components/node/connections/connectionManager";
import { QuantumAdapter } from "@/components/node/base/quantum/quantumAdapter";
import { ClassicalHost } from "@/components/node/classical/classicalHost";
import { QuantumHost } from "@/components/node/base/quantum/quantumHost";


export function importFromJSON(jsonData: ExportDataI | string, networkCanvas: fabric.Canvas) {
    const logger = getLogger("ImportService");

    try {
        // Parse JSON if string is provided
        const data: ExportDataI = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        const networkManager = NetworkManager.getInstance(networkCanvas);
        const connectionManager= ConnectionManager.getInstance(networkCanvas);

        if (!networkManager) {
            logger.error("NetworkManager instance not found.");
            return false;
        }

        // Clear existing networks and objects
        // networkManager.clearAll();

        let hostInfo = new Map<string, SimulatorNode>();

        // Process zones
        if (data.zones && Array.isArray(data.zones)) {
            data.zones.forEach(zone => {
                    
                // Import networks within the zone
                if (zone.networks && Array.isArray(zone.networks)) {
                    zone.networks.forEach(networkData => {
                        const zoneHostInfo = createNetworkFromData(networkData, networkCanvas);
                        if(zoneHostInfo) {
                            hostInfo = new Map([...hostInfo, ...zoneHostInfo]);
                        }
                    });
                }

                // Import adapters within the zone
                if (zone.adapters && Array.isArray(zone.adapters)) {
                    zone.adapters.forEach(adapterData => {
                        const adapter = createAdapterFromData(adapterData, networkCanvas);
                        if (adapter) {
                            // Connect adapter to appropriate network/host
                            // connectAdapter(adapter, adapterData, networkManager);
                            // networkManager.canvas.add(adapter);
                            const cHost = hostInfo.get(adapterData.classicalHost) as ClassicalHost;
                            const qHost = hostInfo.get(adapterData.quantumHost) as QuantumHost;
                            
                            connectionManager.updateConnection(cHost, {x: adapter.getX(), y: adapter.getY()}, true);
                            
                            connectionManager.updateConnection(qHost, {x: adapter.getX(), y: adapter.getY()}, true);
                        }
                    });
                }
            });
        }
        //  else if (data.networks && Array.isArray(data.networks)) {
        //     // Handle legacy format without zones
        //     data.networks.forEach(networkData => {
        //         const network = createNetworkFromData(networkData);
        //         if (network) {
        //             networkManager.addNetwork(network);
        //         }
        //     });
        // }

        // Refresh canvas
        networkManager.canvas.renderAll();

        logger.info("Successfully imported network configuration.");
        return true;
    } catch (error) {
        logger.error("Failed to import network configuration:", error);
        return false;
    }
}

// Helper functions for import process

function createNetworkFromData(networkData: NetworkI, networkCanvas: fabric.Canvas) {
    try {
        const hostInfo = new Map<string, SimulatorNode>();
        networkData.hosts.forEach((host) => {
            const newNode = SimulatorNode.importFromJSON(host, networkCanvas);
            if (newNode) {
                networkCanvas.add(newNode);
                hostInfo.set(newNode.name, newNode);
            }
        })
        const connectionManager = ConnectionManager.getInstance(networkCanvas);
        
        networkData.connections.forEach((conn) => {
            if(!conn?.to) {return}
            const from = hostInfo.get(conn.from);
            const to = hostInfo.get(conn.to);

            if(!(from && to)){
                console.log('Node not found for connection', conn, from, to);
                return
            }

            connectionManager.updateConnection(from, {x: to.getX(), y: to.getY()});
        })
        networkCanvas.requestRenderAll();
        return hostInfo;
    } catch (error) {
        getLogger("ImportService").error("Error creating network:", error);
        return null;
    }
}

// function createNodeFromData(nodeData) {
//     try {
//         const node = new Node(
//             nodeData.id || generateUniqueId(),
//             nodeData.name || "Imported Node"
//         );

//         // Set node position
//         if (nodeData.position) {
//             node.setPosition(nodeData.position[0], nodeData.position[1]);
//         }

//         // Set node type
//         if (nodeData.type) {
//             node.setType(nodeData.type);
//         }

//         // Set any additional properties
//         if (nodeData.properties) {
//             Object.keys(nodeData.properties).forEach(key => {
//                 node[key] = nodeData.properties[key];
//             });
//         }

//         return node;
//     } catch (error) {
//         getLogger("ImportService").error("Error creating node:", error);
//         return null;
//     }
// }

function createAdapterFromData(adapterData: AdapterI, canvas:fabric.Canvas) {
    try {
        const adapter = QuantumAdapter.importFromJSON(adapterData, canvas);
        if (adapter) {
            canvas.add(adapter);
            
            return adapter as QuantumAdapter;
        }
    } catch (error) {
        getLogger("ImportService").error("Error creating adapter:", error);
        return null;
    }
}

// function connectAdapter(adapter, adapterData, networkManager) {
//     try {
//         // Connect adapter to host if hostId is provided
//         if (adapterData.hostId) {
//             const networks = networkManager.getAllNetworks();
//             for (const network of networks) {
//                 const host = network.getNodeById(adapterData.hostId);
//                 if (host) {
//                     adapter.connectToHost(host);
//                     break;
//                 }
//             }
//         }

//         // Connect adapter to network if networkId is provided
//         if (adapterData.networkId) {
//             const network = networkManager.getNetworkById(adapterData.networkId);
//             if (network) {
//                 adapter.connectToNetwork(network);
//             }
//         }
//     } catch (error) {
//         getLogger("ImportService").error("Error connecting adapter:", error);
//     }
// }

function generateUniqueId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}