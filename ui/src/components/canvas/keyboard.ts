import { Canvas } from "fabric";
import { ConnectionManager } from "../node/connections/connectionManager";
import { SimulatorNode } from "../node/base/baseNode";
import { getLogger } from "../../helpers/simLogger";

export class KeyboardListener {
    static #instance: KeyboardListener;
    canvas;
    logger = getLogger("KeyboardListener");

    constructor(canvas: Canvas) {
        this.canvas = canvas;
        this.listenEvents();
    }
    public static getInstance(canvas?: Canvas): KeyboardListener {
        if (!KeyboardListener.#instance && canvas) {
            console.info("Initialized keyboard listener!");
            KeyboardListener.#instance = new KeyboardListener(canvas);
        }

        return KeyboardListener.#instance;
    }

    listenEvents() {
        document.addEventListener("keydown", (event) => {
            if (event.key === "Delete") {
                this.onDelete(event);
            }
        });
    }

    onDelete(_: KeyboardEvent) {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            this.logger.info("Deleting object", (activeObject as any)?.name);
            this.canvas.remove(activeObject);
            ConnectionManager.getInstance(this.canvas).removeAllConnectionsIfExists(activeObject as SimulatorNode);
        }
    }
}