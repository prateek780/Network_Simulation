import * as fabric from 'fabric';
import { SimulatorNode } from '../base/baseNode';
import { isLineInObject } from './utils';
import { NodeFamily } from '../base/enums';
import { ConnectionI } from '@/services/export.interface';

export interface LineMetaData {
    from: SimulatorNode;
    to?: SimulatorNode;
    connectionType: NodeFamily;
}

export class SimulatorConnection extends fabric.Line {
    metaData: LineMetaData;
    isConnected = false;
    selectable = false;

    constructor([x1, y1, x2, y2] = [0, 0, 0, 0], metadata: LineMetaData, options: fabric.TOptions<fabric.FabricObjectProps> = {}) {
        if(metadata.from === metadata.to) {
            throw new Error('Cannot connect to itself');
        }
        
        if(metadata.connectionType === NodeFamily.QUANTUM) {
            options.stroke = 'blue';
        }

        super([x1, y1, x2, y2], options);
        this.metaData = metadata;
    }

    updateMetaData(metaData: Partial<LineMetaData>) {
        Object.keys(metaData).forEach((k) => {
            (this.metaData as any)[k] = (metaData as any)[k];
        });
    }

    isInsideOf(node: SimulatorNode): boolean {
        return isLineInObject(this.x1, this.y1, this.x2, this.y2, node.getX(), node.getY(), node.width, node.height);
    }

    toExportJson(): ConnectionI {
        return {
            "from": this.metaData.from.name,
            "to": this.metaData.to?.name,
            "bandwidth": 1000,
            "latency": 10,
            "length": 10,
            "loss_per_km": 0.1,
            "noise_model": "default",
            "name": `${this.metaData.from.name}-${this.metaData.to?.name}`
        }
    }
}