export interface TransmiTPacketI {
    event_type: string
    node: string
    timestamp: number
    data: PacketData
  }
  
  export interface PacketData {
    packet: Packet
  }
  
  export interface Packet {
    type: string
    from: string
    to: string
    hops: string[]
    data: string
    destination_address: string
  }
  