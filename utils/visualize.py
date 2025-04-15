from classical_network.node import ClassicalNode
from classical_network.routing import InternetExchange
from core.base_classes import World
import matplotlib.pyplot as plt
import matplotlib.patches as patches

from core.enums import NodeType
from quantum_network.host import QuantumHost
from quantum_network.node import QuantumNode
from quantum_network.repeater import QuantumRepeater

def visualize_network(world: World, filename="network_visualization.png"):
    """Visualizes the network topology and saves it as an image."""

    fig, ax = plt.subplots()
    ax.set_xlim([0, world.size[0]])
    ax.set_ylim([0, world.size[1]])

    # Draw zones
    for zone in world.zones:
        rect = patches.Rectangle(
            zone.position,
            zone.size[0],
            zone.size[1],
            linewidth=1,
            edgecolor="r",
            facecolor="none",
        )
        ax.add_patch(rect)
        ax.text(
            zone.position[0] + 1,
            zone.position[1] + 1,
            zone.name,
            fontsize=9,
            color="red",
        )

        # Draw nodes within the zone
        for network in zone.networks:
            for node in network.nodes:
                if node.type in [NodeType.CLASSICAL_HOST, NodeType.CLASSICAL_ROUTER]:
                    marker = "o"  # Circle for classical hosts and routers
                    color = "blue"
                elif node.type in [NodeType.QUANTUM_HOST, NodeType.QUANTUM_REPEATER]:
                    marker = "s"  # Square for quantum hosts and repeaters
                    color = "green"
                elif node.type in [
                    NodeType.C2Q_CONVERTER,
                    NodeType.Q2C_CONVERTER,
                    NodeType.QUANTUM_ADAPTER,
                ]:
                    marker = "*"  # Diamond for converters
                    color = "black"
                else:
                    marker = "*"
                    color = "black"

                # Adjust node position to be within the zone
                node_x = zone.position[0] + node.location[0]
                node_y = zone.position[1] + node.location[1]

                ax.plot(node_x, node_y, marker, color=color, markersize=8)
                ax.text(node_x + 1, node_y + 1, node.name, fontsize=8)

    # Draw networks (if not already drawn within zones)
    for network in world.networks:
        if network.zone is None:  # Draw only if not already drawn within a zone
            for node in network.nodes:
                if node.type in [
                    NodeType.CLASSICAL_HOST,
                    NodeType.CLASSICAL_ROUTER,
                ]:
                    marker = "o"  # Circle for classical hosts and routers
                    color = "blue"
                elif node.type in [
                    NodeType.QUANTUM_HOST,
                    NodeType.QUANTUM_REPEATER,
                ]:
                    marker = "s"  # Square for quantum hosts and repeaters
                    color = "green"
                elif node.type in [
                    NodeType.C2Q_CONVERTER,
                    NodeType.Q2C_CONVERTER,
                    NodeType.QUANTUM_ADAPTER,
                ]:
                    marker = "*"  # Diamond for converters
                    color = "black"
                else:
                    marker = "?"
                    color = "black"

                ax.plot(
                    node.location[0],
                    node.location[1],
                    marker,
                    color=color,
                    markersize=8,
                )
                ax.text(
                    node.location[0] + 1,
                    node.location[1] + 1,
                    node.name,
                    fontsize=8,
                )

    # Draw connections (basic lines for now)
    for network in world.networks:
        for node in network.nodes:
            if isinstance(node, ClassicalNode):
                for connection in node.connections:
                    start_node = connection.node_1
                    end_node = connection.node_2
                    if type(start_node) == InternetExchange or type(end_node) == InternetExchange:
                        continue
                    if start_node.zone and end_node.zone:
                        ax.plot(
                            [start_node.zone.position[0] + start_node.location[0],end_node.zone.position[0] + end_node.location[0]],
                            [start_node.zone.position[1] + start_node.location[1],end_node.zone.position[1] +  end_node.location[1]],
                            "k-",
                            linewidth=0.5,
                        )
            elif isinstance(node, QuantumNode):
                if isinstance(node, QuantumRepeater):
                    for channel in node.quantum_channels_in:
                        start_node = channel.node_1
                        end_node = channel.node_2
                        ax.plot(
                            [start_node.zone.position[0] + start_node.location[0],end_node.zone.position[0] + end_node.location[0]],
                            [start_node.zone.position[1] + start_node.location[1], end_node.zone.position[1] + end_node.location[1]],
                            "g-",
                            linewidth=0.5,
                        )
                    for channel in node.quantum_channels_out:
                        start_node = channel.node_1
                        end_node = channel.node_2
                        ax.plot(
                            [start_node.zone.position[0] + start_node.location[0],end_node.zone.position[0] + end_node.location[0]],
                            [start_node.zone.position[1] + start_node.location[1], end_node.zone.position[1] + end_node.location[1]],
                            "g-",
                            linewidth=0.5,
                        )
                elif isinstance(node, QuantumHost):
                    for channel in node.quantum_channels:
                        start_node = channel.node_1
                        end_node = channel.node_2
                        ax.plot(
                            [start_node.zone.position[0] + start_node.location[0],end_node.zone.position[0] + end_node.location[0]],
                            [start_node.zone.position[1] + start_node.location[1], end_node.zone.position[1] + end_node.location[1]],
                            "g-",
                            linewidth=0.5,
                        )

    plt.title("Network Visualization")
    plt.xlabel("X-coordinate")
    plt.ylabel("Y-coordinate")
    plt.savefig(filename)
    plt.close()
    
