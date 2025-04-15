import time
from classical_network.connection import ClassicConnection
from classical_network.host import ClassicalHost
from classical_network.router import ClassicalRouter
from core.base_classes import World, Zone
from core.enums import NetworkType, ZoneType
from core.network import Network
from quantum_network.adapter import QuantumAdapter
from quantum_network.channel import QuantumChannel
from quantum_network.host import QuantumHost
from quantum_network.repeater import QuantumRepeater
from utils.visualize import visualize_network


def build_network_1(zone1):
    # Create a classical network within zone1
    classical_net = Network(
        network_type=NetworkType.CLASSICAL_NETWORK,
        location=(0, 0),
        zone=zone1,
        name="Classical Network1",
    )
    zone1.add_network(classical_net)

    # Create a classical host
    alice = ClassicalHost(
        address="192.168.1.1",
        location=(10, 10),
        network=classical_net,
        zone=zone1,
        name="Alice",
    )
    classical_net.add_hosts(alice)

    # Create another classical host
    bob = ClassicalHost(
        address="192.168.1.2",
        location=(30, 30),
        network=classical_net,
        zone=zone1,
        name="Bob",
    )
    classical_net.add_hosts(bob)

    router = ClassicalRouter(
        address="192.168.1.3",
        location=(20, 20),
        network=classical_net,
        zone=zone1,
        name="Router_Zone1",
    )
    classical_net.add_hosts(router)

    # Create a connection between Alice and Bob
    connection_ar = ClassicConnection(
        node_1=alice,
        node_2=router,
        bandwidth=1000,
        latency=10,
        name="Alice-Router_Zone1 Connection",
    )
    connection_rb = ClassicConnection(
        node_1=router,
        node_2=bob,
        bandwidth=1000,
        latency=10,
        name="Router_Zone1-Bob Connection",
    )
    alice.add_connection(connection_ar)
    router.add_connection(connection_ar)
    router.add_connection(connection_rb)
    bob.add_connection(
        connection_rb
    )  # Assuming bidirectional connection for simplicity

    return classical_net, alice, bob, router


def build_network_2(zone1):
    # Create a classical network within zone1
    classical_net = Network(
        network_type=NetworkType.CLASSICAL_NETWORK,
        location=(0, 0),
        zone=zone1,
        name="Classical Network2",
    )
    zone1.add_network(classical_net)

    # Create a classical host
    charlie = ClassicalHost(
        address="192.168.10.1",
        location=(10, 10),
        network=classical_net,
        zone=zone1,
        name="Charlie",
    )
    classical_net.add_hosts(charlie)

    # Create another classical host
    dave = ClassicalHost(
        address="192.168.10.2",
        location=(30, 30),
        network=classical_net,
        zone=zone1,
        name="Dave",
    )
    classical_net.add_hosts(dave)

    router = ClassicalRouter(
        address="192.168.10.3",
        location=(20, 20),
        network=classical_net,
        zone=zone1,
        name="Router_Zone1.1",
    )
    classical_net.add_hosts(router)

    # Create a connection between Alice and Bob
    connection_ar = ClassicConnection(
        node_1=charlie,
        node_2=router,
        bandwidth=1000,
        latency=10,
        name="Alice-Router_Zone1 Connection",
    )
    connection_rb = ClassicConnection(
        node_1=router,
        node_2=dave,
        bandwidth=1000,
        latency=10,
        name="Router_Zone1-Bob Connection",
    )
    charlie.add_connection(connection_ar)
    router.add_connection(connection_ar)
    router.add_connection(connection_rb)
    dave.add_connection(
        connection_rb
    )  # Assuming bidirectional connection for simplicity

    return classical_net, charlie, dave, router


def build_quantum_1(zone):

    # Create a quantum network
    quantum_net = Network(
        network_type=NetworkType.QUANTUM_NETWORK,
        location=(0, 0),
        zone=zone,
        name="Quantum Network",
    )
    zone.add_network(quantum_net)

    # Create a quantum host
    q_alice = QuantumHost(
        address="q_alice",
        location=(10, 10),
        network=quantum_net,
        zone=zone,
        name="Qubit Alice",
        send_classical_fn=lambda x: q_dave.receive_classical_data(x),
    )
    quantum_net.add_hosts(q_alice)

    # Create another classical host
    q_dave = QuantumHost(
        address="q_dave",
        location=(30, 30),
        network=quantum_net,
        zone=zone,
        name="Qubit Dave",
        send_classical_fn=lambda x: q_alice.receive_classical_data(x),
    )
    quantum_net.add_hosts(q_dave)

    channel_qb_rep = QuantumChannel(
        node_1=q_dave,
        node_2=q_alice,
        length=40,
        loss_per_km=0,
        noise_model="simple",
        name="QChannel Bob-Repeater",
    )
    q_dave.add_quantum_channel(channel_qb_rep)
    q_alice.add_quantum_channel(channel_qb_rep)

    # q_alice.perform_qkd()
    return quantum_net, q_alice, q_dave


def add_hybrid(world: World):
    # Create zones
    classical_zone1 = Zone(
        size=(40, 40),
        position=(5, 50),
        zone_type=ZoneType.SECURE,
        parent_zone=world,
        name="Classical Zone 1",
    )
    network_1, alice, bob, classic_router1 = build_network_1(classical_zone1)
    world.add_zone(classical_zone1)

    classical_zone2 = Zone(
        size=(40, 40),
        position=(50, 50),
        zone_type=ZoneType.SECURE,
        parent_zone=world,
        name="Classical Zone 2",
    )
    network_2, charlie, dave, classic_router2 = build_network_2(classical_zone2)
    world.add_zone(classical_zone2)

    quantum_zone1 = Zone(
        size=(40, 40),
        position=(25, 5),
        zone_type=ZoneType.SECURE,
        parent_zone=world,
        name="Quantum Zone 2",
    )
    world.add_zone(quantum_zone1)

    quantum_network1, q_alice, q_dave = build_quantum_1(quantum_zone1)

    adapter1 = QuantumAdapter(
        "AdAdd1",
        network_1,
        quantum_network1,
        (10, 13),
        None,
        q_alice,
        quantum_zone1,
        "QAdapter1",
    )

    adapter_network1_connection = ClassicConnection(
        classic_router1,
        adapter1.local_classical_router,
        10,
        10,
        name="Router1 Adapter1 Connection",
    )
    adapter1.local_classical_router.add_connection(adapter_network1_connection)
    classic_router1.add_connection(adapter_network1_connection)
    quantum_network1.add_hosts(adapter1)
    alice.add_quantum_adapter(adapter1)

    adapter2 = QuantumAdapter(
        "AdAdd2",
        network_2,
        quantum_network1,
        (30, 33),
        adapter1,
        q_dave,
        quantum_zone1,
        "QAdapter2",
    )

    adapter1.add_paired_adapter(adapter2)

    adapter_network2_connection = ClassicConnection(
        classic_router2,
        adapter2.local_classical_router,
        10,
        10,
        name="Router2 Adapter2 Connection",
    )
    adapter2.local_classical_router.add_connection(adapter_network2_connection)
    classic_router2.add_connection(adapter_network2_connection)
    quantum_network1.add_hosts(adapter2)
    dave.add_quantum_adapter(adapter2)

    alice.send_data("HELLO WORLD", dave)


def simulate():
    # Create a world
    world = World(size=(100, 100), name="My World")
    
    # Reset log file to ensure fresh logs for each simulation run
    with open("log.txt", "w") as f:
        f.write("# Simulation started\n")
    
    add_hybrid(world)

    visualize_network(world, "out.png")

    world.start()


if __name__ == "__main__":
    simulate()
