import * as fabric from 'fabric';
import { ConnectionManager } from '../node/connections/connectionManager';
import { NetworkManager } from '../node/network/networkManager';
import { SimulatorNode } from '../node/base/baseNode';
import { SocketEvents, SocketIOClient } from '@/services/socket';
import { getLogger } from '@/helpers/simLogger';
import { TransmiTPacketI } from '@/services/socket.interface';
import { toast } from "sonner"
import { convertEventToLog } from '../metrics/log-parser';

enum AnimationType {
    NODE_ACTIVE,
    PACKET_ANIMATION,
    QKD_INIT,
    Q_CLASSICAL_DATA
}

// Main animation controller
export class NetworkAnimationController {
    static #instance: NetworkAnimationController;
    connectionManager: ConnectionManager;
    networkManager: NetworkManager;
    activeAnimationsByType: Map<AnimationType, any[]> = new Map();
    activeAnimations: Map<any, any>;
    animationSpeed: number;
    canvas: fabric.Canvas;
    logger = getLogger('AnimationController');

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
        this.connectionManager = ConnectionManager.getInstance();
        this.networkManager = NetworkManager.getInstance();
        this.activeAnimations = new Map();
        this.animationSpeed = 1.0;

        SocketIOClient.getInstance().onMessage(SocketEvents.SimulationEvent, (event) => {
            this.processEvent(event);
        })

        this.activeAnimationsByType = new Map([[AnimationType.NODE_ACTIVE, []], [AnimationType.PACKET_ANIMATION, []], [AnimationType.QKD_INIT, []], [AnimationType.Q_CLASSICAL_DATA, []]])

        this.animationReaderThread();
    }

    public static getInstance(canvas?: fabric.Canvas): NetworkAnimationController {
        if (!NetworkAnimationController.#instance && canvas) {
            console.log("Initialized Connection Manager!");
            NetworkAnimationController.#instance = new NetworkAnimationController(canvas);
        }

        return NetworkAnimationController.#instance;
    }

    // Process a simulation event and trigger appropriate animation
    processEvent(event: any) {
        const eventType = event.event_type;

        switch (eventType) {
            case 'packet_transmitted':
                this.activeAnimationsByType.get(AnimationType.PACKET_ANIMATION)?.push(event);
                break
            case 'data_sent':
                this.activeAnimationsByType.get(AnimationType.NODE_ACTIVE)?.push(event);
                // return this.animateDataSent(event);
                break
            case 'packet_received':
                this.activeAnimationsByType.get(AnimationType.NODE_ACTIVE)?.push(event);
                // return this.animatePacketReceived(event);
                break
            case 'qkd_initiated':
                this.activeAnimationsByType.get(AnimationType.QKD_INIT)?.push(event);
                // return this.animateQKDInitiation(event);
                break
            case 'classical_data_received':
                
            this.activeAnimationsByType.get(AnimationType.Q_CLASSICAL_DATA)?.push(event);
                // return this.animateClassicalDataReceived(event);
                break;
            default:
                // console.log(`No animation defined for event type: ${eventType}`);
                return null;
        }
    }

    async animationReaderThread() {
        setTimeout(() => {
            Array.from(this.activeAnimationsByType.keys()).forEach(type => {
                if (this.activeAnimationsByType.get(type)) {
                    const event = this.activeAnimationsByType.get(type)?.shift();
                    if (event) {
                        const eventType = event.event_type;


                        try {
                            const parsed = convertEventToLog(event);
                            if(parsed?.message)
                            toast(parsed?.message);
                        } catch (_) {
                            this.logger.error(_);
                        }
                        
                        switch (eventType) {
                            case 'packet_transmitted':
                                return this.animatePacketTransmission(event);
                            case 'data_sent':
                                return this.animateDataSent(event);
                            case 'packet_received':
                                return this.animatePacketReceived(event);
                            case 'qkd_initiated':
                                return this.animateQKDInitiation(event);
                            // case 'classical_data_received':
                            //     return this.animateClassicalDataReceived(event);
                            default:
                                // console.log(`No animation defined for event type: ${eventType}`);
                                return null;
                        }
                    }
                }
            })
            this.animationReaderThread();
        }, 1000)
    }

    // Animation for packet transmission between nodes
    animatePacketTransmission(event: TransmiTPacketI) {
        try {
            // Parse the packet data which is now directly JSON
            const packetData = event.data.packet;

            let fromName = packetData.hops[packetData.hops.length - 1] || packetData.from
            // Special Case for QC_Router_QuantumAdapter-7
            if (fromName.includes('QC_Router_QuantumAdapter')) {
                fromName = fromName.split('QC_Router_')[1];
            }

            const fromNode = this.findNodeByName(this.extractNodeName(fromName));

            let toName = packetData.to;
            // Special Case for QC_Router_QuantumAdapter-7
            if (toName.includes('QC_Router_QuantumAdapter')) {
                toName = toName.split('QC_Router_')[1];
            }

            const toNode = this.findNodeByName(this.extractNodeName(toName));

            
            if (!fromNode || !toNode) {
                this.logger.warn("Could not find nodes for animation \n[ ", fromName, '(', fromNode?.name, ')\n', toName, '(', toNode?.name, ')]');
                return null;
            }


            // Determine if this is quantum or classical data
            const isQuantum = packetData.type.includes('quantum_network');
            const isEncrypted = typeof packetData.data === 'object' ||
                (typeof packetData.data === 'string' &&
                    packetData.data.includes('bytearray'));

            // Create and animate the packet
            return this.createMovingPacket(fromNode, toNode, {
                color: isQuantum ? 'blue' : (isEncrypted ? 'green' : 'red'),
                data: packetData.data,
                size: 10,
                duration: 1000 / this.animationSpeed
            });

        } catch (error) {
            console.error("Error animating packet transmission:", error);
            return null;
        }
    }

    // Animation for data being sent from a source
    animateDataSent(event: any) {
        const sourceNode = this.findNodeByName(event.node);
        if (!sourceNode) {
            this.logger.error(`Source Log not found with name (${event.node}) for animation data sent!`);
            return null
        };

        // Create a highlight effect around the source node
        return this.animationStoreColorCHange(sourceNode, {
            color: 'orange',
            duration: 1000 / this.animationSpeed
        });
    }

    // Animation for packet being received at destination
    animatePacketReceived(event: any) {
        const destinationNode = this.findNodeByName(event.node);
        if (!destinationNode) return null;

        // Create a highlight effect around the destination node
        return this.animationStoreColorCHange(destinationNode, {
            color: 'green',
            duration: 500 / this.animationSpeed
        });
    }

    // Animation for QKD process initiation
    animateQKDInitiation(event: any) {
        try {
            const sourceAdapter = this.findNodeByName(event.node);
            const targetAdapter = this.findNodeByName(event.data.with_adapter.name);

            if (!sourceAdapter || !targetAdapter) {
                console.warn("Could not find adapters for QKD animation");
                return null;
            }

            // Create entanglement animation
            return this.createQuantumEntanglement(sourceAdapter, targetAdapter, {
                duration: 2000 / this.animationSpeed
            });
        } catch (error) {
            console.error("Error animating QKD initiation:", error);
            return null;
        }
    }

    // Animation for classical data reception (used in QKD protocol)
    animateClassicalDataReceived(event: any) {
        try {
            const node = this.findNodeByName(event.node);
            if (!node) return null;

            // Determine what type of classical data was received
            let animationType = 'default';
            let color = 'purple';

            if (event.data.message && event.data.message.type) {
                switch (event.data.message.type) {
                    case 'reconcile_bases':
                        animationType = 'bases';
                        color = 'blue';
                        break;
                    case 'shared_bases_indices':
                        animationType = 'indices';
                        color = 'cyan';
                        break;
                    case 'estimate_error_rate':
                        animationType = 'error';
                        color = 'orange';
                        break;
                    case 'complete':
                        animationType = 'complete';
                        color = 'green';
                        break;
                }
            }

            // Create appropriate animation based on QKD stage
            return this.createQKDStageAnimation(node, {
                type: animationType,
                color: color,
                duration: 1000 / this.animationSpeed
            });
        } catch (error) {
            console.error("Error animating classical data received:", error);
            return null;
        }
    }

    // Helper function to create a moving packet animation
    createMovingPacket(fromNode: SimulatorNode, toNode: SimulatorNode, options: any = {}) {
        const fromPos = { x: fromNode.left, y: fromNode.top };
        const toPos = { x: toNode.left, y: toNode.top };

        // Create packet circle
        const packet = new fabric.Circle({
            left: fromPos.x,
            top: fromPos.y,
            radius: options?.size || 10,
            fill: options?.color || 'red',
            opacity: 0.8,
            selectable: false,
            evented: false
        });

        this.canvas.add(packet);

        // Animate packet movement
        const animationId = `packet_${Date.now()}`;
        this.activeAnimations.set(AnimationType.NODE_ACTIVE, packet);

        fabric.util.animate({
            startValue: 0,
            endValue: 1,
            duration: options.duration || 1000,
            onChange: (value) => {
                packet.left = fromPos.x + (toPos.x - fromPos.x) * value;
                packet.top = fromPos.y + (toPos.y - fromPos.y) * value;
                this.canvas.renderAll();
            },
            onComplete: () => {
                this.canvas.remove(packet);
                this.activeAnimations.delete(animationId);
            }
        });

        return animationId;
    }

    // Helper function to create node highlight/pulse effect
    pulseNode(node: SimulatorNode, options: any = {}) {
        const circle = new fabric.Circle({
            left: node.left + (node.width / 2),
            top: node.top + (node.width / 2),
            radius: node.width * 0.75,
            fill: 'transparent',
            stroke: options.color || 'blue',
            strokeWidth: 3,
            selectable: false,
            evented: false,
            opacity: 0.8
        });

        this.canvas.add(circle);

        // Animate the pulse effect
        const animationId = `pulse_${Date.now()}`;
        this.activeAnimations.set(animationId, circle);

        fabric.util.animate({
            startValue: 0.1,
            endValue: 1.5,
            duration: options.duration || 500,
            onChange: (value) => {
                circle.scaleX = value;
                circle.scaleY = value;
                circle.opacity = 1 - value / 2;
                this.canvas.renderAll();
            },
            onComplete: () => {
                this.canvas.remove(circle);
                this.activeAnimations.delete(animationId);
            }
        });

        return animationId;
    }

    animationStoreColorCHange(node: SimulatorNode, options: any = {}) {
        const animationId = `bg_animate_${Date.now()}`;
        this.activeAnimations.set(animationId, node);
        const originalColor = node.backgroundColor;
        const originalOpacity = node.opacity;
        fabric.util.animate({
            startValue: 0.1,
            endValue: 10,
            duration: options.duration || 500,
            onChange: (value) => {
                node.backgroundColor = node.backgroundColor === originalColor ? options.color || 'blue' : originalColor;
                node.opacity = 1 - value / 2;
                this.canvas.requestRenderAll();
            },
            onComplete: () => {
                this.activeAnimations.delete(animationId);
                node.backgroundColor = originalColor;
                node.opacity = originalOpacity;
                this.canvas.requestRenderAll();
            }
        })
    }

    // Helper function to create quantum entanglement animation
    createQuantumEntanglement(sourceNode: SimulatorNode, targetNode: SimulatorNode, options = {}) {
        // Calculate connection line between nodes
        const line = new fabric.Line(
            [sourceNode.left, sourceNode.top, targetNode.left, targetNode.top],
            {
                stroke: 'blue',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false
            }
        );

        this.canvas.add(line);

        // Create pulsing particles along the line
        const particles: fabric.FabricObject[] = [];
        for (let i = 0; i < 5; i++) {
            const particle = new fabric.Circle({
                radius: 4,
                fill: 'cyan',
                stroke: 'blue',
                strokeWidth: 1,
                opacity: 0.8,
                selectable: false,
                evented: false
            });

            particles.push(particle);
            this.canvas.add(particle);
        }

        // Animate the entanglement
        const animationId = `entanglement_${Date.now()}`;
        this.activeAnimations.set(animationId, [line, ...particles]);

        let step = 0;
        const totalSteps = 20;

        const animateStep = () => {
            if (step >= totalSteps) {
                // Clean up
                this.canvas.remove(line);
                particles.forEach(p => this.canvas.remove(p));
                this.activeAnimations.delete(animationId);
                return;
            }

            // Update particles positions
            particles.forEach((particle, idx) => {
                const t = (step / totalSteps) + (idx / particles.length);
                const normT = t - Math.floor(t); // Normalize to [0, 1]

                particle.left = sourceNode.left + (targetNode.left - sourceNode.left) * normT;
                particle.top = sourceNode.top + (targetNode.top - sourceNode.top) * normT;

                // Make particles pulse
                particle.opacity = 0.3 + Math.sin(normT * Math.PI) * 0.7;
                particle.scaleX = 0.5 + Math.sin(normT * Math.PI) * 0.5;
                particle.scaleY = 0.5 + Math.sin(normT * Math.PI) * 0.5;
            });

            // Pulse the line
            line.strokeDashOffset = step * 2;
            line.opacity = 0.6 + Math.sin(step / totalSteps * Math.PI) * 0.4;

            this.canvas.renderAll();
            step++;

            requestAnimationFrame(animateStep);
        };

        animateStep();
        return animationId;
    }

    // Helper function to create QKD stage animation
    createQKDStageAnimation(node: SimulatorNode, options: any = {}) {
        // Animation based on QKD stage
        let animationElement;

        switch (options.type) {
            case 'bases':
                // Visualize quantum bases reconciliation
                animationElement = new fabric.FabricText('⟨Z|X⟩', {
                    left: node.left,
                    top: node.top - 30,
                    fontSize: 16,
                    fill: options.color,
                    textAlign: 'center',
                    selectable: false,
                    evented: false
                });
                break;

            case 'indices':
                // Visualize shared indices
                animationElement = new fabric.FabricText('[i1,i2,...]', {
                    left: node.left,
                    top: node.top - 30,
                    fontSize: 16,
                    fill: options.color,
                    textAlign: 'center',
                    selectable: false,
                    evented: false
                });
                break;

            case 'error':
                // Visualize error estimation
                animationElement = new fabric.FabricText('ε', {
                    left: node.left,
                    top: node.top - 30,
                    fontSize: 16,
                    fill: options.color,
                    textAlign: 'center',
                    selectable: false,
                    evented: false
                });
                break;

            case 'complete':
                // Visualize key generation complete
                animationElement = new fabric.FabricText('🔑', {
                    left: node.left,
                    top: node.top - 30,
                    fontSize: 20,
                    textAlign: 'center',
                    selectable: false,
                    evented: false
                });
                break;

            default:
                // Default animation
                animationElement = new fabric.Circle({
                    left: node.left - 15,
                    top: node.top - 15,
                    radius: 15,
                    fill: options.color || 'purple',
                    opacity: 0.8,
                    selectable: false,
                    evented: false
                });
        }

        this.canvas.add(animationElement);

        // Animate the QKD stage
        const animationId = `qkd_${options.type}_${Date.now()}`;
        this.activeAnimations.set(animationId, animationElement);

        fabric.util.animate({
            startValue: 0,
            endValue: 1,
            duration: options.duration || 1000,
            onChange: (value) => {
                animationElement.opacity = Math.sin(value * Math.PI);
                if (options.type === 'complete') {
                    animationElement.scaleX = 1 + value * 0.5;
                    animationElement.scaleY = 1 + value * 0.5;
                }
                this.canvas.renderAll();
            },
            onComplete: () => {
                this.canvas.remove(animationElement);
                this.activeAnimations.delete(animationId);
            }
        });

        return animationId;
    }

    // Helper function to extract node name from string
    extractNodeName(nodeStr: string) {
        if (typeof nodeStr !== 'string') return nodeStr;

        // Extract name from formats like "Host - 'ClassicalHost-1'" or "Router - 'ClassicalRouter-3'"
        const match = nodeStr.match(/'([^']+)'/);
        return match ? match[1] : nodeStr;
    }

    // Helper function to find node by name
    findNodeByName(name: string) {
        return this.canvas.getObjects().filter(x => x instanceof SimulatorNode).find(node => node.name === name);
    }

    // Set animation speed
    setSpeed(speed: number) {
        this.animationSpeed = speed;
    }

    // Stop all active animations
    stopAllAnimations() {
        this.activeAnimations.forEach((element, id) => {
            if (Array.isArray(element)) {
                element.forEach(e => this.canvas.remove(e));
            } else {
                this.canvas.remove(element);
            }
        });

        this.activeAnimations.clear();
        this.canvas.renderAll();
    }
}
