import * as fabric from 'fabric';
import { SimulatorNode, SimulatorNodeOptions } from '../base/baseNode';
import { SimulationNodeType } from '../base/enums';

export interface InternetExchangeOptions extends SimulatorNodeOptions {
}

export class InternetExchange extends SimulatorNode {
    constructor(options: Partial<InternetExchangeOptions>) {
        super({ ...options, nodeType: SimulationNodeType.QUANTUM_ADAPTER } as SimulatorNodeOptions);
    }

    getNodeShape() {
        return new fabric.Circle({
            top: this.top,
            left: this.left,
            radius: 35,
            fill: '#F0F0F0', // Light Gray or White
            stroke: '#4285F4', // Google Blue color for border
            strokeWidth: 3,
            selectable: true,
            originX: 'center',
            originY: 'center',
            centeredScaling: true,
            padding: 3,
            hasRotatingPoint: false,
            borderColor: 'black',
            cornerColor: 'black',
        });
    }
}