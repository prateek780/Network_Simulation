"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface QuantumStateViewerProps {
  selectedNode: any
}

function BlochSphereVisualization({ qubitIndex }: { qubitIndex: number }) {
  return (
    <div className="flex items-center justify-center h-[300px] bg-slate-900 rounded-md">
      <div className="text-center">
        <div className="text-sm text-slate-400 mb-2">Bloch Sphere Visualization</div>
        <div className="w-48 h-48 rounded-full border-2 border-blue-500 mx-auto relative">
          {/* This would be replaced with an actual 3D Bloch sphere */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs">|0⟩</div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-xs">|1⟩</div>
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs">-X</div>
          <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 text-xs">+X</div>
        </div>
        <div className="mt-4 text-sm">
          <div>θ: 45°</div>
          <div>φ: 90°</div>
        </div>
      </div>
    </div>
  )
}

function DensityMatrixVisualization({ qubitIndex }: { qubitIndex: number }) {
  return (
    <div className="flex items-center justify-center h-[300px] bg-slate-900 rounded-md">
      <div className="text-center">
        <div className="text-sm text-slate-400 mb-4">Density Matrix</div>
        <div className="grid grid-cols-2 gap-2 w-48 mx-auto">
          <div className="bg-blue-900/50 p-2 rounded">0.5</div>
          <div className="bg-blue-900/50 p-2 rounded">0.5</div>
          <div className="bg-blue-900/50 p-2 rounded">0.5</div>
          <div className="bg-blue-900/50 p-2 rounded">0.5</div>
        </div>
      </div>
    </div>
  )
}

function CircuitVisualization({ qubitIndex }: { qubitIndex: number }) {
  return (
    <div className="flex items-center justify-center h-[300px] bg-slate-900 rounded-md">
      <div className="text-center">
        <div className="text-sm text-slate-400 mb-4">Quantum Circuit</div>
        <div className="flex items-center gap-2 justify-center">
          <div className="p-2 border rounded">|0⟩</div>
          <div className="p-2 border rounded">H</div>
          <div className="p-2 border rounded">X</div>
          <div className="p-2 border rounded">Z</div>
          <div className="p-2 border rounded">M</div>
        </div>
      </div>
    </div>
  )
}

function HistogramVisualization({ qubitIndex }: { qubitIndex: number }) {
  return (
    <div className="flex items-center justify-center h-[300px] bg-slate-900 rounded-md">
      <div className="text-center w-full px-8">
        <div className="text-sm text-slate-400 mb-4">Measurement Probabilities</div>
        <div className="flex items-end justify-center gap-8 h-40">
          <div className="flex flex-col items-center">
            <div className="bg-blue-500 w-16" style={{ height: "70%" }}></div>
            <div className="mt-2">|0⟩</div>
            <div className="text-sm text-slate-400">70%</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-purple-500 w-16" style={{ height: "30%" }}></div>
            <div className="mt-2">|1⟩</div>
            <div className="text-sm text-slate-400">30%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EntangledStateVisualization({ viewType }: { viewType: string }) {
  return (
    <div className="flex items-center justify-center h-[300px] bg-slate-900 rounded-md">
      <div className="text-center">
        <div className="text-sm text-slate-400 mb-4">Entangled State</div>
        <div className="text-lg mb-4">|Ψ⟩ = (1/√2)(|00⟩ + |11⟩)</div>
        <div className="flex justify-center gap-8">
          <div className="p-3 border border-purple-500 rounded-md">
            <div className="text-sm">Bell State</div>
            <div className="text-xs text-slate-400">Φ+</div>
          </div>
          <div className="p-3 border border-slate-500 rounded-md">
            <div className="text-sm">Concurrence</div>
            <div className="text-xs text-slate-400">1.0</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function QuantumStateViewer({ selectedNode }: QuantumStateViewerProps) {
  const [viewType, setViewType] = useState("bloch")

  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-slate-400">Select a quantum node to view its state</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Quantum State</h3>
        <Select value={viewType} onValueChange={setViewType}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="View Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bloch">Bloch Sphere</SelectItem>
            <SelectItem value="matrix">Density Matrix</SelectItem>
            <SelectItem value="circuit">Circuit View</SelectItem>
            <SelectItem value="histogram">Histogram</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="qubit1" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="qubit1">Qubit 1</TabsTrigger>
          <TabsTrigger value="qubit2">Qubit 2</TabsTrigger>
          <TabsTrigger value="entangled">Entangled</TabsTrigger>
        </TabsList>

        <TabsContent value="qubit1" className="p-4 min-h-[300px]">
          {viewType === "bloch" && <BlochSphereVisualization qubitIndex={0} />}
          {viewType === "matrix" && <DensityMatrixVisualization qubitIndex={0} />}
          {viewType === "circuit" && <CircuitVisualization qubitIndex={0} />}
          {viewType === "histogram" && <HistogramVisualization qubitIndex={0} />}
        </TabsContent>

        <TabsContent value="qubit2" className="p-4 min-h-[300px]">
          {viewType === "bloch" && <BlochSphereVisualization qubitIndex={1} />}
          {viewType === "matrix" && <DensityMatrixVisualization qubitIndex={1} />}
          {viewType === "circuit" && <CircuitVisualization qubitIndex={1} />}
          {viewType === "histogram" && <HistogramVisualization qubitIndex={1} />}
        </TabsContent>

        <TabsContent value="entangled" className="p-4 min-h-[300px]">
          <EntangledStateVisualization viewType={viewType} />
        </TabsContent>
      </Tabs>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Fidelity</span>
          <span>98.2%</span>
        </div>
        <Slider value={[98.2]} disabled className="w-full" />
      </div>
    </div>
  )
}

