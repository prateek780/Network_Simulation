import { QuantumAdapter } from "../components/node/base/quantum/quantumAdapter";
import { NetworkManager } from "../components/node/network/networkManager";
import { getLogger } from "../helpers/simLogger";
import { ExportDataI, ZoneI } from "./export.interface";

export function exportToJSON(): ExportDataI | undefined {
    const logger = getLogger("ExportService");
    const networks = NetworkManager.getInstance()?.getAllNetworks();

    if (!networks || networks.length === 0) {
        logger.warn("No networks found, returning empty topology.");
        return getEmptyTopology();
    }

    const exportData: ExportDataI = {
        // networks: networks.map(network => network.toExportJson())
        "name": "My World",
        "size": [100, 100],
        "zones": networks.map((network, i) => {
            const adapters: Array<QuantumAdapter> = [];
            NetworkManager.getInstance()?.canvas.getObjects().forEach((obj) => {
                // If a QuantumAdapter is found and it is connected to this channel, add it to the export data in this zone.
                if (obj instanceof QuantumAdapter && obj.quantumHost && network.connectedNodes.has(obj.quantumHost)) {
                    adapters.push(obj);
                }
            });
            const zone: ZoneI = {
                "name": "Zone " + i,
                "type": "SECURE",
                "size": [network.getX() + network.width, network.getY() + network.height],
                "position": [network.getX(), network.getY()],
                'networks': [network.toExportJson()],
                "adapters": adapters.map(adapter => adapter.toExportJson()).filter(x => x != undefined)
            }
            return zone
        })
    }
    let maxWidth = 0;
    let maxHeight = 0;


    exportData.zones.forEach((zone) => {
        if (zone.size[0] + zone.position[0] > maxWidth) {
            maxWidth = zone.size[0] + zone.position[0];
        }
        if (zone.size[1] + zone.position[1] > maxHeight) {
            maxHeight = zone.size[1] + zone.position[1];
        }
    });

    exportData.size = [maxWidth + 100, maxHeight + 100];

    // downloadJson(exportData, "network");
    return exportData;
}

/**
 * Returns an empty network topology
 */
export function getEmptyTopology(): ExportDataI {
    return {
        "name": "Empty Network",
        "size": [100, 100],
        "zones": [] 
    };
}

/**
 * Clears the exported data by creating an empty network structure
 * and attempting to reset the NetworkManager state
 */
export function clearExportedData(): ExportDataI {
    const logger = getLogger("ExportService");
    logger.info("Clearing exported data");
    
    // Try to reset the NetworkManager
    try {
        const networkManager = NetworkManager.getInstance();
        if (networkManager && networkManager.canvas) {
            // Clear all objects on the canvas
            const canvas = networkManager.canvas;
            const allObjects = canvas.getObjects();
            logger.info(`Clearing ${allObjects.length} objects from canvas`);
            
            // Remove each object individually
            for (let i = allObjects.length - 1; i >= 0; i--) {
                canvas.remove(allObjects[i]);
            }
            
            // Clear the whole canvas
            canvas.clear();
            canvas.renderAll();
            
            // Force any internal NetworkManager reset needed
            try {
                // @ts-ignore - accessing private property
                networkManager.existingNetworks = new Set();
            } catch (e) {
                logger.error("Failed to reset internal NetworkManager state", e);
            }
        }
    } catch (e) {
        logger.error("Error while clearing NetworkManager", e);
    }
    
    // Return an empty topology
    return getEmptyTopology();
}

export function downloadJson(storageObj: any, exportName: string) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storageObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}