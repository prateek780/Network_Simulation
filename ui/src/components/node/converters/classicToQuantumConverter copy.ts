import * as fabric from 'fabric';
import { SimulatorNode, SimulatorNodeOptions } from '../base/baseNode';
import { SimulationNodeType } from '../base/enums';

export interface ClassicToQuantumConverterOptions extends SimulatorNodeOptions {
}

export class ClassicToQuantumConverter extends SimulatorNode {
    constructor(options: Partial<ClassicToQuantumConverterOptions>) {
        super({ ...options, nodeType: SimulationNodeType.CLASSIC_TO_QUANTUM_CONVERTER } as SimulatorNodeOptions);
    }

    getNodeShape() {
        return new fabric.Triangle({
            top: this.top,
            left: this.left,
            width: 60,
            height: 60,
            fill: '#9C27B0', // Google Purple color
            stroke: '#333',
            strokeWidth: 2,
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