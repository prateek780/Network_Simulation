import * as fabric from 'fabric';
import { SimulatorNode, SimulatorNodeOptions } from '../baseNode';
import { SimulationNodeType } from '../enums';

export interface QuantumHostOptions extends SimulatorNodeOptions {
}

export class QuantumHost extends SimulatorNode {
    captionPadding = 35;
    
    constructor(options: Partial<QuantumHostOptions>) {
        super({ ...options, nodeType: SimulationNodeType.QUANTUM_HOST } as SimulatorNodeOptions);
    }

    async getNodeShape() {
        const img = await fabric.FabricImage.fromURL('/svgs/quantum_host.svg');
        img.top = this.top;
        img.left = this.left - (50 / 2);
        img.scaleToHeight(50);
        img.scaleToWidth(50);

        return img;
    }
}