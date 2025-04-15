import * as fabric from 'fabric';
import { SimulatorNode, SimulatorNodeOptions } from '../baseNode';
import { getNodeFamily, NodeFamily, SimulationNodeType } from '../enums';
import { QuantumHost } from './quantumHost';
import { ClassicalHost } from '../../classical/classicalHost';
import { getLogger } from '../../../../helpers/simLogger';
import { NetworkManager } from '../../network/networkManager';
import { AdapterI } from '@/services/export.interface';

export interface QuantumAdapterOptions extends SimulatorNodeOptions {
}

export class QuantumAdapter extends SimulatorNode {
    captionPadding = 35;
    quantumHost?: QuantumHost;
    classicalHost?: ClassicalHost;
    logger = getLogger('QuantumAdapter');

    constructor(options: Partial<QuantumAdapterOptions>) {
        super({ ...options, nodeType: SimulationNodeType.QUANTUM_ADAPTER } as SimulatorNodeOptions);
        this.logger = options.name ? getLogger(options.name) : this.logger;
    }

    assignClassicalHost(host: ClassicalHost) {
        this.classicalHost = host;
    }

    assignQuantumHost(host: QuantumHost) {
        this.quantumHost = host;
    }

    assignAdapterNode(node: SimulatorNode) {
        if (getNodeFamily(node.nodeType) === NodeFamily.CLASSICAL) {
            console.log('Assig c', node.name);
            this.assignClassicalHost(node as ClassicalHost);
        } else {
            console.log('Assig q', node.name);
            this.assignQuantumHost(node as QuantumHost);
        }
    }

    isConnectionAcceptable(from: SimulatorNode): boolean {
        if (getNodeFamily(from.nodeType) === NodeFamily.CLASSICAL) {
            this.logger.debug('Connection from Classical Family', this.classicalHost !== undefined);
            return this.classicalHost === undefined;
        } else {
            this.logger.debug('Connection from QuantumHost', this.quantumHost !== undefined);
            return this.quantumHost === undefined;
        }
    }

    toExportJson(): AdapterI | undefined {
        if (this.quantumHost && this.classicalHost) {
            const classicalNetwork = NetworkManager.getInstance()?.getNetworkForNode(this.classicalHost);
            if (!classicalNetwork) {
                this.logger.error('Classical network not found for adapter');
                return
            }
            const quantumNetwork = NetworkManager.getInstance()?.getNetworkForNode(this.quantumHost);
            if (!quantumNetwork) {
                this.logger.error('Quantum network not found for adapter');
                return
            }

            const nodeData = super.toExportJson();
            if (!nodeData) {
                this.logger.error('Base Node Data not found for adapter');
                return
            }

            return {
                ...nodeData,
                quantumHost: this.quantumHost.name,
                classicalHost: this.classicalHost.name,
                classicalNetwork: classicalNetwork.name,
                quantumNetwork: quantumNetwork.name,
            }
        }
    }

    async getNodeShape() {
        const img = await fabric.FabricImage.fromURL('/svgs/adapter.webp');
        img.top = this.top;
        img.left = this.left - (50 / 2);
        img.scaleToHeight(50);
        img.scaleToWidth(50);

        return img;
    }
}