import * as fabric from 'fabric';
import { SimulatorNodeOptions } from '../base/baseNode';
import { getRandomColor } from '../../../helpers/utils/color';

export interface ClassicalNetworkOptions extends SimulatorNodeOptions {
    // Add any specific options for ClassicalHost here, if needed
}

/**
 * Represents a Zone in the network simulator project as a Fabric.js Object.
 * Extends the `SimulatorObject` class, which in turn extends `fabric.Group`.
 *
 * @class
 * @extends SimulatorObject
 */
export class ClassicalNetworkObject extends fabric.FabricObject {
    selectable = false;
    color;
    name;

    constructor(name: string, options: Partial<fabric.FabricObjectProps>) {
        super(options);
        this.width = this.width || 200;
        this.height = this.height || 100;
        this.color = getRandomColor();
        this.name = name;
    }

    /**
     * Renders the visual representation of the Zone on the canvas.
     *
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
     *
     * @override
     */
    _render(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = this.color; // Red border for zones
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed border

        // Draw the rectangle for the zone
        ctx.strokeRect(
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
        ctx.fillText(this.name, -this.width / 2, -this.height / 2);
    }
}