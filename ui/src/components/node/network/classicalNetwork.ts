import { NetworkI } from "@/services/export.interface";
import { SimulatorNode } from "../base/baseNode";
import { getNodeFamily, NodeFamily } from "../base/enums";
import { ConnectionManager } from "../connections/connectionManager";
import { ClassicalNetworkObject } from "../wrappers/network";
import * as fabric from 'fabric';

export class ClassicalNetwork extends ClassicalNetworkObject {
    connectedNodes = new Set<SimulatorNode>();
    isClassicalNetwork: boolean | null= null;
    private _ip = 1;

    constructor(nodes: SimulatorNode[], name: string, options: Partial<fabric.FabricObjectProps>) {
        super(name, options);
        console.log(`Initialized Classical Network - ${name}!`);
        this.addNodes(...nodes);
    }

    get nextIP(){
        return this._ip++;
    }

    addNodes(...nodes: SimulatorNode[]) {
        if(this.isClassicalNetwork === null)
            this.isClassicalNetwork = nodes.every(node => getNodeFamily(node.nodeType) === NodeFamily.CLASSICAL);
        else if(this.isClassicalNetwork && !nodes.every(node => getNodeFamily(node.nodeType) === NodeFamily.CLASSICAL))
            throw new Error('Cannot add non-classical nodes to a classical network');

        nodes.forEach(node => {
            if(this.isClassicalNetwork)
                node.setIP(this.nextIP);
            this.connectedNodes.add(node);
        });
    }


    toExportJson(): NetworkI {
        const connections = ConnectionManager.getInstance().getAllConnections()
            .filter(connection => this.connectedNodes.has(connection.metaData.from) &&
                (connection.metaData.to && this.connectedNodes.has(connection.metaData.to))
            )
            .map(connection => connection.toExportJson());

        return {
            name: this.name,
            address: '',
            type: this.isClassicalNetwork ? 'CLASSICAL_NETWORK' : 'QUANTUM_NETWORK',
            // "size": [this.getX() + this.width, this.getY() + this.height],
            "location": [this.getX(), this.getY()],
            hosts: Array.from(this.connectedNodes).map(node => node.toExportJson()).filter(h => h !== undefined),
            connections
        }
    }
}