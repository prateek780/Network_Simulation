import { exportToJSON, getEmptyTopology } from "@/services/exportService";
import ReactJsonView from '@microlink/react-json-view';
import { NetworkManager } from "../node/network/networkManager";
import { ExportDataI } from "@/services/export.interface";

export function JSONFormatViewer() {
    const networks = NetworkManager.getInstance()?.getAllNetworks();
    let jsonFormat: ExportDataI | Object = exportToJSON() || getEmptyTopology();
    
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">JSON View</h3>
            </div>

            <ReactJsonView src={jsonFormat} theme={"tomorrow"}/>
        </div>
    )
}