import * as fabric from 'fabric';
import { SimulatorNode, SimulatorNodeOptions } from '../baseNode';
import { SimulationNodeType } from '../enums';

export interface QuantumRepeaterOptions extends SimulatorNodeOptions {
}

export class QuantumRepeater extends SimulatorNode {
    captionPadding = 40;
    constructor(options: Partial<QuantumRepeaterOptions>) {
        super({ ...options, nodeType: SimulationNodeType.QUANTUM_REPEATER } as SimulatorNodeOptions);
    }

    async getNodeShape() {
                const img = await fabric.FabricImage.fromURL('/svgs/quantum_repeater.png');
                img.top = this.top;
                img.left = this.left - (50 / 2);
                img.scaleToHeight(50);
                img.scaleToWidth(50);
                
                return img;
    }
}