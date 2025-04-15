import { SimulatorNode } from "./base/baseNode";
import { QuantumAdapter, QuantumAdapterOptions } from "./base/quantum/quantumAdapter";
import { QuantumHost, QuantumHostOptions } from "./base/quantum/quantumHost";
import { QuantumRepeater, QuantumRepeaterOptions } from "./base/quantum/quantumRepeater";
import { ClassicalHost, ClassicalHostOptions } from "./classical/classicalHost";
import { ClassicalRouter, ClassicalRouterOptions } from "./classical/classicalRouter";
import { InternetExchange, InternetExchangeOptions } from "./classical/internetExchange";
import { ClassicToQuantumConverter, ClassicToQuantumConverterOptions } from "./converters/classicToQuantumConverter copy";
import { QuantumToClassicConverter, QuantumToClassicConverterOptions } from "./converters/quantumToClassicConverter";
// import { ClassicalNetwork, ClassicalNetworkOptions } from "./wrappers/network";
import { SimulatorZone, ZoneOptions } from "./wrappers/zone";

export class NodeManager {
    private nodes: Map<string, SimulatorNode>; // Store nodes by name or ID (string key to SimulatorNode value)

    constructor() {
        this.nodes = new Map<string, SimulatorNode>();
    }

    createClassicalHost(name: string, x: number, y: number, opts?: Partial<ClassicalHostOptions>): SimulatorNode {
        const nodeName = (opts && opts.name) || name;
        const options: Partial<ClassicalHostOptions> = {
            name: nodeName,
            top: x,
            left: y,
            ...opts
        }
        const newNode = new ClassicalHost(options);
        this.nodes.set(name, newNode); // Store node in the map
        return newNode;
    }
    createClassicalRouter(name: string, x: number, y: number, opts?: Partial<ClassicalRouterOptions>): ClassicalRouter {
        const options: Partial<ClassicalRouterOptions> = { // Use specific options interface
            name,
            left: x,
            top: y,
            ...opts // Spread opts, ensuring it's not undefined
        };
        const newNode = new ClassicalRouter(options);
        this.nodes.set(name, newNode);
        return newNode;
    }

    createQuantumHost(name: string, x: number, y: number, opts?: Partial<QuantumHostOptions>): QuantumHost {
        const options: Partial<QuantumHostOptions> = { // Use specific options interface
            name,
            left: x,
            top: y,
            ...(opts || {}) // Spread opts, ensuring it's not undefined
        };
        const newNode = new QuantumHost(options);
        this.nodes.set(name, newNode);
        return newNode;
    }

    createQuantumAdapter(name: string, x: number, y: number, opts?: Partial<QuantumAdapterOptions>): QuantumAdapter {
        const options: Partial<QuantumAdapterOptions> = { // Use specific options interface
            name,
            left: x,
            top: y,
            ...(opts || {}) // Spread opts, ensuring it's not undefined
        };
        const newNode = new QuantumAdapter(options);
        this.nodes.set(name, newNode);
        return newNode;
    }

    createQuantumRepeater(name: string, x: number, y: number, opts?: Partial<QuantumRepeaterOptions>): QuantumRepeater {
        const options: Partial<QuantumRepeaterOptions> = { // Use specific options interface
            name,
            left: x,
            top: y,
            ...(opts || {}) // Spread opts, ensuring it's not undefined
        };
        const newNode = new QuantumRepeater(options);
        this.nodes.set(name, newNode);
        return newNode;
    }

     createInternetExchange(name: string, x: number, y: number, opts?: Partial<InternetExchangeOptions>): InternetExchange {
        const options: Partial<InternetExchangeOptions> = { // Use specific options interface
            name,
            left: x,
            top: y,
            ...(opts || {}) // Spread opts, ensuring it's not undefined
        };
        const newNode = new InternetExchange(options);
        this.nodes.set(name, newNode);
        return newNode;
    }

    createClassicToQuantumConverter(name: string, x: number, y: number, opts?: Partial<ClassicToQuantumConverterOptions>): ClassicToQuantumConverter {
        const options: Partial<ClassicToQuantumConverterOptions> = { // Use specific options interface
            name,
            left: x,
            top: y,
            ...(opts || {}) // Spread opts, ensuring it's not undefined
        };
        const newNode = new ClassicToQuantumConverter(options);
        this.nodes.set(name, newNode);
        return newNode;
    }

    createQuantumToClassicalConverter(name: string, x: number, y: number, opts?: Partial<QuantumToClassicConverterOptions>): QuantumToClassicConverter {
        const options: Partial<QuantumToClassicConverterOptions> = { // Use specific options interface
            name,
            left: x,
            top: y,
            ...(opts || {}) // Spread opts, ensuring it's not undefined
        };
        const newNode = new QuantumToClassicConverter(options);
        this.nodes.set(name, newNode);
        return newNode;
    }

    createZone(name: string, x: number, y: number, opts?: Partial<ZoneOptions>): SimulatorZone {
        const options: Partial<ZoneOptions> = { // Use specific options interface
            name,
            left: x,
            top: y,
            ...(opts || {}) // Spread opts, ensuring it's not undefined
        };
        const newNode = new SimulatorZone(options);
        this.nodes.set(name, newNode);
        return newNode;
    }

    getNodeByName(name: string): SimulatorNode | undefined {
        return this.nodes.get(name);
    }

    getAllNodes(): SimulatorNode[] {
        return Array.from(this.nodes.values());
    }

    removeNode(nodeId: string): void {
        this.nodes.delete(nodeId);
    }
}

export const manager = new NodeManager();
(window as any).nodeManager = manager;