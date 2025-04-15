import * as fabric from 'fabric';
import { SimulatorNode, SimulatorNodeOptions } from '../base/baseNode';
import { SimulationNodeType } from '../base/enums';

export interface QuantumToClassicConverterOptions extends SimulatorNodeOptions {
}

export class QuantumToClassicConverter extends SimulatorNode {
    constructor(options: Partial<QuantumToClassicConverterOptions>) {
        super({ ...options, nodeType: SimulationNodeType.QUANTUM_TO_CLASSIC_CONVERTER } as SimulatorNodeOptions);
    }

    getNodeShape() {
        return new fabric.Polygon([
            { x: -10, y: 10 },
            { x: 15, y: 5 },
            { x: 40, y: 10 },
            { x: -10, y: 80 },
            { x: 40, y: 80 }
        ], {
            top: this.top,
            left: this.left,
            // radius: 30,
            // sides: 5, // Pentagon
            fill: '#9C27B0', // Google Purple color
            stroke: '#7B1FA2', // A slightly darker shade for border
            strokeWidth: 3,
            selectable: true,
            originX: 'center',
            originY: 'center',
            centeredScaling: true,
            padding: 3,
            // hasRotatingPoint: false,
            borderColor: 'black',
            cornerColor: 'black',
            height: 50
        });
    }
}