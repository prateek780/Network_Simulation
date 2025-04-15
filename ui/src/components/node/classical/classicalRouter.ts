import * as fabric from 'fabric';
import { SimulatorNode, SimulatorNodeOptions } from '../base/baseNode';
import { SimulationNodeType } from '../base/enums';

export interface ClassicalRouterOptions extends SimulatorNodeOptions {
}

export class ClassicalRouter extends SimulatorNode {
    captionPadding = 35;

    constructor(options: Partial<ClassicalRouterOptions>) {
        super({ ...options, nodeType: SimulationNodeType.CLASSICAL_ROUTER } as SimulatorNodeOptions);
    }

    async getNodeShape() {
        const img = await fabric.FabricImage.fromURL('/svgs/classical_router.svg');
        img.top = this.top;
        img.left = this.left - (50 / 2);
        img.scaleToHeight(50);
        img.scaleToWidth(50);

        return img;
    }
}