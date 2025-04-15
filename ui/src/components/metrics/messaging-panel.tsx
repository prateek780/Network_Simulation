"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Send, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { NetworkManager } from "../node/network/networkManager"
import { ClassicalHost } from "../node/classical/classicalHost"

interface MessagingPanelProps {
  selectedNode: any
  // availableNodes: any[]
  onSendMessage: (source: string, target: string, message: string, protocol: string) => void
  isSimulationRunning: boolean
}

export function MessagingPanel({ 
  selectedNode, 
  onSendMessage,
  isSimulationRunning
}: MessagingPanelProps) {
  const [targetNode, setTargetNode] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [protocol, setProtocol] = useState("classical")
  const networkManager = NetworkManager.getInstance();
  const [targetOptions, setTargetOptions] = useState<ClassicalHost[]>([]);
  
  // Reset target node when selected node changes
  useEffect(() => {
    setTargetNode("")
    let options: ClassicalHost[] = [];
    networkManager.getAllNetworks().forEach(network => {
      const hosts = Array.from(network.connectedNodes).filter(x => (x instanceof ClassicalHost) && (x != selectedNode)) as ClassicalHost[];
      options = [...options, ...hosts] ;
    })
    setTargetOptions(options);
  }, [selectedNode])
  
  // Sample message history - would be replaced with actual message data
  const messageHistory = [
    { 
      id: 1, 
      timestamp: "00:00:15.200", 
      source: "ClassicalHost1", 
      target: "ClassicalHost2", 
      content: "Hello from Host 1", 
      protocol: "classical",
      status: "delivered",
      deliveryTime: "00:00:15.250"
    },
    { 
      id: 2, 
      timestamp: "00:00:18.100", 
      source: "ClassicalHost2", 
      target: "ClassicalHost1", 
      content: "Response from Host 2", 
      protocol: "classical",
      status: "delivered",
      deliveryTime: "00:00:18.150"
    },
    { 
      id: 3, 
      timestamp: "00:00:20.300", 
      source: "QuantumHost1", 
      target: "QuantumHost2", 
      content: "Quantum key: 0110", 
      protocol: "quantum",
      status: "delivered",
      deliveryTime: "00:00:20.450"
    },
    { 
      id: 4, 
      timestamp: "00:00:25.700", 
      source: "ClassicalHost1", 
      target: "ClassicalHost3", 
      content: "Encrypted message with quantum key", 
      protocol: "hybrid",
      status: "failed",
      error: "Network congestion"
    },
    { 
      id: 5, 
      timestamp: "00:00:30.200", 
      source: "ClassicalHost3", 
      target: "ClassicalHost1", 
      content: "Request for new quantum key", 
      protocol: "classical",
      status: "pending"
    }
  ]
  
  // Filter messages related to the selected node
  const filteredMessages = messageHistory.filter(
    msg => msg.source === selectedNode?.name || msg.target === selectedNode?.name
  )
  
  // Filter available target nodes (exclude the selected node itself)
  // const targetNodes = availableNodes.filter(node => node.name !== selectedNode?.name)
  
  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return { 
          color: "bg-green-900/30 text-green-400 hover:bg-green-900/40",
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />
        }
      case "pending":
        return { 
          color: "bg-amber-900/30 text-amber-400 hover:bg-amber-900/40",
          icon: <Clock className="h-3 w-3 mr-1" />
        }
      case "failed":
        return { 
          color: "bg-red-900/30 text-red-400 hover:bg-red-900/40",
          icon: <XCircle className="h-3 w-3 mr-1" />
        }
      default:
        return { 
          color: "bg-slate-800 hover:bg-slate-700",
          icon: <AlertCircle className="h-3 w-3 mr-1" />
        }
    }
  }
  
  // Get protocol badge styling
  const getProtocolBadge = (protocol: string) => {
    switch (protocol) {
      case "classical":
        return "bg-blue-900/30 text-blue-400 hover:bg-blue-900/40"
      case "quantum":
        return "bg-purple-900/30 text-purple-400 hover:bg-purple-900/40"
      case "hybrid":
        return "bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/40"
      default:
        return "bg-slate-800 hover:bg-slate-700"
    }
  }
  
  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-slate-400">Select a host to send messages</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-5 w-5 text-slate-400" />
        <h3 className="text-lg font-medium">Messaging {isSimulationRunning ? '' : '(Start Simulation)'}</h3>
      </div>
      
      <Tabs defaultValue="compose" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="source-node" className="text-sm font-medium">Source</label>
                <Badge className="bg-slate-700">{selectedNode.name}</Badge>
              </div>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="target-node" className="text-sm font-medium">Target</label>
              <Select 
                value={targetNode} 
                onValueChange={setTargetNode}
                disabled={!isSimulationRunning}
              >
                <SelectTrigger id="target-node">
                  <SelectValue placeholder="Select target node" />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.map(node => (
                    <SelectItem key={node.name} value={node.name}>
                      {node.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* <div className="grid gap-2">
              <label htmlFor="protocol" className="text-sm font-medium">Protocol</label>
              <Select 
                value={protocol} 
                onValueChange={setProtocol}
                disabled={!isSimulationRunning}
              >
                <SelectTrigger id="protocol">
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="quantum">Quantum</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Quantum + Classical)</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
            
            <div className="grid gap-2">
              <label htmlFor="message-content" className="text-sm font-medium">Message</label>
              <Textarea 
                id="message-content" 
                placeholder="Enter your message here..." 
                className="min-h-[100px] resize-none"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                disabled={!isSimulationRunning}
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => {
                if (targetNode && messageContent) {
                  onSendMessage(selectedNode.name, targetNode, messageContent, protocol)
                  setMessageContent("")
                }
              }}
              disabled={!targetNode || !messageContent || !isSimulationRunning}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            
            {!isSimulationRunning && (
              <div className="text-center text-amber-400 text-sm">
                Start the simulation to send messages
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="pt-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <Card key={message.id} className={`border-l-4 ${
                    message.source === selectedNode.name 
                      ? "border-l-blue-500" 
                      : "border-l-green-500"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {message.source === selectedNode.name ? "To: " : "From: "}
                            {message.source === selectedNode.name ? message.target : message.source}
                          </span>
                          <Badge className={getProtocolBadge(message.protocol)}>
                            {message.protocol}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadge(message.status).color}>
                            {getStatusBadge(message.status).icon}
                            {message.status}
                          </Badge>
                          <span className="text-xs text-slate-400 font-mono">
                            {message.timestamp}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      {message.status === "delivered" && (
                        <div className="mt-2 text-xs text-slate-400">
                          Delivered at {message.deliveryTime} (latency: {
                            (message.deliveryTime ? parseFloat(message.deliveryTime.replace(":", "")): 0 - 
                             parseFloat(message.timestamp.replace(":", ""))).toFixed(3)
                          }s)
                        </div>
                      )}
                      {message.status === "failed" && message.error && (
                        <div className="mt-2 text-xs text-red-400">
                          Error: {message.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                  <p>No message history for this node</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
