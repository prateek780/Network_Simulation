export interface ExportDataI {
    name: string
    size: number[]
    zones: ZoneI[]
}

export interface NodeI {
    name: string
    type: string
    address: string
    location: number[]
    parentNetworkName?: string
}

export interface ZoneI {
    name: string
    type: string
    size: number[]
    position: number[]
    networks: NetworkI[]
    adapters: AdapterI[]
}

export interface NetworkI extends NodeI  {
    hosts: HostI[]
    connections: ConnectionI[]
}

export interface HostI extends NodeI {};

export interface ConnectionI {
    from: string
    to?: string
    bandwidth: number
    latency: number
    length: number
    loss_per_km: number
    noise_model: string
    name: string
}

export interface AdapterI extends NodeI  {
    quantumHost: string
    classicalHost: string
    classicalNetwork: string
    quantumNetwork: string
}
