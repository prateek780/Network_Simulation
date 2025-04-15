import * as fabric from 'fabric';
import { SimulatorNode, SimulatorNodeOptions } from '../base/baseNode';
import { SimulationNodeType } from '../base/enums';

export interface ClassicalHostOptions extends SimulatorNodeOptions {
    radius?: number;
}

export class ClassicalHost extends SimulatorNode {
    declare options: ClassicalHostOptions;

    constructor(options: Partial<ClassicalHostOptions>) {
        super({ ...options, nodeType: SimulationNodeType.CLASSICAL_HOST } as SimulatorNodeOptions); // Call NetworkNode constructor with type
    }

    get groupSize() {
        return {
            height: this.options.height || (this.getRadius() * 2),
            width: this.options.width || (this.getRadius() * 2)
        }
    }

    getRadius(): number {
        return this.options.radius || 30;
    }

    async getNodeShape() {
        const img = await fabric.FabricImage.fromURL('/svgs/classical_host.svg');
        img.top = this.top;
        img.left = this.left - (50 / 2);
        img.scaleToHeight(50);
        img.scaleToWidth(50);
        
        return img;
    }
}