import * as fabric from 'fabric';
import { SimulatorNode, SimulatorNodeOptions } from '../base/baseNode';
import { SimulationNodeType } from '../base/enums';

export interface ZoneOptions extends SimulatorNodeOptions {
    // Add any specific options for ClassicalHost here, if needed
}

/**
 * Represents a Zone in the network simulator project as a Fabric.js Object.
 * Extends the `SimulatorObject` class, which in turn extends `fabric.Group`.
 *
 * @class
 * @extends SimulatorObject
 */
export class ZoneObject extends fabric.FabricObject {
    constructor(options: Partial<fabric.FabricObjectProps>) {
        super(options);
        this.width = this.width || 400;
        this.height = this.height || 200;
    }
    /**
     * Renders the visual representation of the Zone on the canvas.
     *
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
     *
     * @override
     */
    _render(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = 'gray'; // Red border for zones
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed border

        // Draw the rectangle for the zone
        ctx.strokeRect(
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
        super._render(ctx); // Call superclass render for any group rendering
    }
}

export class SimulatorZone extends SimulatorNode {
    constructor(options: Partial<ZoneOptions>) {
        super({ ...options, nodeType: SimulationNodeType.ZONE } as SimulatorNodeOptions); // Call NetworkNode constructor with type
    }

    getNodeShape() {
        return new ZoneObject({
            top: this.top,
            left: this.left,
        });
    }
}