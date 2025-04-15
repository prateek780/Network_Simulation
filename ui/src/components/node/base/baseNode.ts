import * as fabric from 'fabric';
import { getNodeFamily, SimulationNodeType } from './enums';
import { debounce } from '../../../helpers/utils/debounce';
import { NodeI } from '@/services/export.interface';
import { manager } from '../nodeManager';
import { getNewNode } from '@/components/canvas/utils';
// import { getConnectionInstance } from '../connections/instance';

export interface SimulatorNodeOptions extends fabric.GroupProps {
    nodeType: SimulationNodeType;
    name: string;
    parentNetworkName?: string | null;
    canvas: fabric.Canvas;
}

const typeToJsonTypeMap = {
    [SimulationNodeType.CLASSICAL_HOST]: 'ClassicalHost',
    [SimulationNodeType.CLASSICAL_ROUTER]: 'ClassicalRouter',
    [SimulationNodeType.QUANTUM_HOST]: 'QuantumHost',
    [SimulationNodeType.QUANTUM_REPEATER]: 'QuantumRepeater',
    [SimulationNodeType.QUANTUM_ADAPTER]: 'QuantumAdapter',
    [SimulationNodeType.CLASSIC_TO_QUANTUM_CONVERTER]: 'ClassicToQuantumConverter',
    [SimulationNodeType.QUANTUM_TO_CLASSIC_CONVERTER]: 'QuantumToClassicConverter',
    [SimulationNodeType.INTERNET_EXCHANGE]: 'InternetExchange',
    [SimulationNodeType.CLASSICAL_NETWORK]: 'ClassicalNetwork',
    [SimulationNodeType.ZONE]: 'Zone',
}

function getJsonToTypeMap(json: string): SimulationNodeType {
    let convertedType: SimulationNodeType = SimulationNodeType.ZONE;
    Object.keys(typeToJsonTypeMap).forEach((type) => {
        if ((typeToJsonTypeMap as any)[type] === json) {

            convertedType = type as any
            return
        }
    })

    return +convertedType
}

const deleteImg = document.createElement('img');
deleteImg.src = '/arrow.svg';


/**
 * Represents a simulator node in the network simulator project.
 * Extends the `fabric.Group` class from Fabric.js.
 * 
 * @class
 * @extends fabric.Group
 */
export class SimulatorNode extends fabric.Group {
    lockScalingX = true;
    lockScalingY = true;
    lockScalingFlip = true;

    /**
     * The type of the node.
     * @type {string}
     */
    nodeType: SimulationNodeType;

    /**
     * The text object representing the node's name.
     * @type {fabric.Text}
     */
    nodeText!: fabric.Text;

    /**
     * The actual shape displayed in node
     */
    nodeShape!: fabric.FabricObject;

    /**
     * The name of the node.
     * @type {string}
     */
    _name!: string;

    ip: string = '';

    /**
     * The name of the parent network, if any.
     * @type {string | null}
     */
    parentNetworkName!: string | null; // Add parentNetworkName property

    /**
     * An array of Fabric.js objects contained within this node.
     * @type {Array<fabric.FabricObject>}
     * @private
     */
    _objects: Array<fabric.FabricObject> = [];

    /**
     * The padding between the node's caption and the node's shape.
     * @type {number}
     */
    captionPadding = 25;

    options: SimulatorNodeOptions;

    /**
     * Creates an instance of SimulatorNode.
     * 
     * @constructor
     * @param {SimulatorNodeOptions} options - The options for the simulator node.
     */
    constructor(options: SimulatorNodeOptions) {
        options.lockRotation = true;
        super([], options);
        this.options = options;
        this.nodeType = options.nodeType;
        this.name = options.name;

        this.height = this.groupSize.height;
        this.width = this.groupSize.width;

        const shape = this.getNodeShape();

        if (shape instanceof Promise) {
            shape.then((resolvedShape) => {
                this.nodeShape = resolvedShape;
                this.processNodeShape(options);
                options.canvas.requestRenderAll();
            })
        } else {
            this.nodeShape = shape;
            this.processNodeShape(options);
        }
    }

    setIP(ipCount: number) {
        this.ip = `192.168.1.${ipCount}`;
    }

    processNodeShape(options: SimulatorNodeOptions) {
        const labels = this.addTextLabels();

        this.height = Math.max(this.nodeShape.height, 100);
        this.width = Math.max(this.nodeShape.width, 100);

        // Only show diagonal controls
        this.setControlsVisibility({
            mt: false,
            mb: false,
            ml: false,
            mr: false,
            bl: false,
            br: false,
            tl: false,
            tr: false,
            mtr: false,
        });

        this.add(this.nodeShape);
        this.add(...labels);

        if (options.parentNetworkName)
            this.parentNetworkName = options.parentNetworkName; // Initialize parentNetworkName

        this.transparentCorners = false;
        this.objectCaching = false;

        this.set('name', this.name);
        this.set('parentNetworkName', this.parentNetworkName); // Set parentNetworkName as Fabric.js property

        this.renderConnectionControls();
    }

    get name() {
        return this._name;
    }

    set name(newName: string) {
        this._name = newName;
        if (this.nodeText) {
            this.nodeText.set('text', newName);
            this.canvas?.requestRenderAll();
        }
    }

    renderConnectionControls() {

        const onMouseUp = (
            e: fabric.TPointerEvent, t: fabric.Transform, x: number, y: number
        ): fabric.ControlActionHandler | undefined => {
            (window as any).getConnectionManager().cancelConnection(this);
            return
        }

        const onClick = (eventData: fabric.TPointerEvent, fabricObject: this, control: fabric.Control): fabric.ControlActionHandler | undefined => {
            control.cursorStyle = 'grabbing';
            return control.mouseDownHandler;
        }

        const cursorHandler = (eventData: fabric.TPointerEvent, control: fabric.Control, fabricObject: this): string => {
            if (eventData.type === 'mouseup') {
                return 'grab'
            }

            return 'pointer';
        }

        const onAction = debounce<fabric.TransformActionHandler>((e: fabric.TPointerEvent, t: fabric.Transform, x: number, y: number): boolean => {
            if (e.type === 'mousemove') {
                (window as any).getConnectionManager().updateConnection(this, { x, y });
            }
            return false;
        }, 0);

        const renderIcon = (
            ctx: CanvasRenderingContext2D,
            left: number,
            top: number,
            styleOverride: object,
            fabricObject: this,
        ) => {
            styleOverride = styleOverride || {};
            const xSize = 25,
                ySize = 25,
                xSizeBy2 = xSize / 2,
                ySizeBy2 = ySize / 2;

            ctx.save();
            ctx.translate(left, top);

            const angle = fabricObject.getTotalAngle();
            ctx.rotate(fabric.util.degreesToRadians(angle + 90));
            ctx.drawImage(deleteImg, -xSizeBy2, -ySizeBy2, xSize, ySize)

            ctx.restore();
        }

        this.controls.nodeConnector = new fabric.Control({
            x: 0.5,
            y: 0,
            cursorStyle: 'pointer',
            mouseUpHandler: onMouseUp,
            getMouseDownHandler: onClick,
            render: renderIcon,
            // cursorStyleHandler: cursorHandler,
            actionHandler: onAction
        });
    }

    get groupSize() {
        return {
            height: 30,
            width: 30
        }
    }

    /**
     * Draws the shape of the node.
     * 
     * @returns {fabric.Circle} The shape of the node.
     * 
     * @remarks
     * This method is intended to be overridden by inherited classes to provide custom shapes.
     * 
     * @override
     */
    getNodeShape(): fabric.FabricObject | Promise<fabric.FabricObject> {
        // Place Holder Code
        return new fabric.Circle({
            left: this.left,
            top: this.top,
            radius: 80,
            fill: '#5afffa',
            stroke: '#666',
            selectable: true,
            centeredScaling: true,
            padding: 2,
            hasRotatingPoint: false,
            borderColor: 'black',
            cornerColor: 'black',
        });
    }

    /**
     * Draws the objects contained within the node.
     * 
     * @returns {Array<fabric.FabricObject>} An array of Fabric.js objects.
     */
    addTextLabels(): Array<fabric.FabricObject> {
        this.nodeText = new fabric.FabricText(this.name, {
            left: this.left,
            top: this.top + this.height / 2 + this.captionPadding,
            fontSize: 11,
            textAlign: 'left',
            originX: 'center',
            originY: 'top',
            fill: 'black',
            selectable: false,
            evented: false,
        });

        return [this.nodeText];
    }

    /**
     * Retrieves information about the node.
     * 
     * @returns {any} An object containing the node's information.
     */
    getNodeInfo(): any {
        return {
            id: this.name,
            type: this.type,
            x: this.left,
            y: this.top,
            name: this.name,
            parentNetworkName: this.parentNetworkName, // Include parentNetworkName in getNodeInfo
        };
    }

    isConnectionAcceptable(from: SimulatorNode): boolean {
        if (from == this) return false;

        if (getNodeFamily(from.nodeType) !== getNodeFamily(this.nodeType)) return false;
        return true;
    }

    toExportJson(): NodeI | undefined {
        return {
            name: this.name,
            type: typeToJsonTypeMap[this.nodeType],
            "address": this.ip,
            "location": [this.getX(), this.getY()],
            parentNetworkName: this.parentNetworkName || undefined, // Include parentNetworkName in toExportJson
        }
    }


    static importFromJSON(data: NodeI, canvas: fabric.Canvas): SimulatorNode | undefined {
        const tType = getJsonToTypeMap(data.type);
        return getNewNode(tType, data.location[0], data.location[1], canvas, {
            name: data.name
        });;
    }

    static load() {
        console.log('Load Node');
    }
}