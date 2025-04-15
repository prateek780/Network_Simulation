// Placeholder for API calls (implementation will be added later)

import { getLogger } from "@/helpers/simLogger";
import { exportToJSON } from "./exportService";
import { ServerSimulationStatus } from "./api.interface";
import { ExportDataI } from "./export.interface";

// Blank for current host
const SERVER_HOST = '/api'

function makeFetchCall(url: string, method = 'GET', body?: any, headers: any = {}) {
    if (body) {
        body = typeof body === "string" ? body : JSON.stringify(body)
    }
    if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }
    return fetch(url, {
        method,
        headers,
        body,
    });
}

const logger = getLogger("API")

const api = {
    createNode: async (nodeData: any): Promise<any> => {
        // Placeholder - replace with actual API call later
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ node_id: Math.random().toString(36).substr(2, 9), name: nodeData.name }); // Simulate success
            }, 500);
        });
    },
    startAutoUpdateNetworkTopology() {
        let previousTopology: string | null = null;
        const logger = getLogger('Auto Updater');

        const scheduleUpdateCycle = () => {
            // logger.log("Scheduled auto update cycle");

            setTimeout(async () => {
                const topology = exportToJSON();

                if (!previousTopology || (JSON.stringify(topology) != previousTopology)) {
                    const resp = await this.saveTopology(topology);

                    if (resp)
                        previousTopology = resp;
                }
                scheduleUpdateCycle();
            }, 2e3);
        }

        scheduleUpdateCycle();
    },
    saveTopology: async(topology:ExportDataI | undefined) => {
        try {
            const body = JSON.stringify(topology);
            // const response = await fetch(SERVER_HOST + `/topology/`, {
            //     method: 'PUT',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body,
            // });
            const response = await makeFetchCall(SERVER_HOST + `/topology/`, 'PUT', body)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to update data:', error);
        }
    },
    getTopology: async () => {
        const response = await makeFetchCall(SERVER_HOST + `/topology/`)

        try {
            return await response.json() as ExportDataI
        } catch (e) {
            return null
        }
    },
    startSimulation: async () => {
        const topology = exportToJSON();
        if (!topology) {
            logger.error(`Topology does not exists to start simulator`);
            return false;
        }


        const response = await makeFetchCall(SERVER_HOST + `/simulation/`, 'POST')
        if (response.status === 201) {
            return true
        }

        return false
    },
    stopSimulation: async () => {
        const response = await makeFetchCall(SERVER_HOST + `/simulation/`, 'DELETE')
        if (response.status === 200) {
            return true
        }

        return false
    },
    sendMessageCommand: async (from_node_name: string, to_node_name: string, message: string) => {
        const response = await makeFetchCall(SERVER_HOST + '/simulation/message/', 'POST', {
            from_node_name, to_node_name, message
        })

        return response.status == 200;
    },
    getSimulationStatus: async () => {
        const response = await makeFetchCall(SERVER_HOST + `/simulation/status/`);

        return (await response.json()) as ServerSimulationStatus;
    }
};

export default api;