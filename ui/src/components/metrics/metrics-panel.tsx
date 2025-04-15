"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function MetricsPanel() {
  const [timeRange, setTimeRange] = useState("1m")

  // Sample data - would be replaced with actual simulation metrics
  const fidelityData = [
    { time: 0, value: 100 },
    { time: 10, value: 98 },
    { time: 20, value: 95 },
    { time: 30, value: 92 },
    { time: 40, value: 90 },
    { time: 50, value: 89 },
    { time: 60, value: 88 },
  ]

  const errorRateData = [
    { time: 0, value: 0 },
    { time: 10, value: 0.5 },
    { time: 20, value: 1.2 },
    { time: 30, value: 1.8 },
    { time: 40, value: 2.1 },
    { time: 50, value: 2.3 },
    { time: 60, value: 2.4 },
  ]

  const throughputData = [
    { time: 0, value: 0 },
    { time: 10, value: 12 },
    { time: 20, value: 18 },
    { time: 30, value: 15 },
    { time: 40, value: 22 },
    { time: 50, value: 20 },
    { time: 60, value: 25 },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Simulation Metrics</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">1m</SelectItem>
            <SelectItem value="5m">5m</SelectItem>
            <SelectItem value="15m">15m</SelectItem>
            <SelectItem value="1h">1h</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="fidelity" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="fidelity">Fidelity</TabsTrigger>
          <TabsTrigger value="error">Error Rate</TabsTrigger>
          <TabsTrigger value="throughput">Throughput</TabsTrigger>
        </TabsList>

        <TabsContent value="fidelity" className="p-2">
          <div className="h-64 bg-slate-900 rounded-md p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fidelityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="time"
                  label={{ value: "Time (s)", position: "insideBottom", offset: -5 }}
                  stroke="#94a3b8"
                />
                <YAxis label={{ value: "Fidelity (%)", angle: -90, position: "insideLeft" }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-slate-800 p-3 rounded-md">
              <div className="text-xs text-slate-400">Average</div>
              <div className="text-lg font-medium">93.1%</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-md">
              <div className="text-xs text-slate-400">Min</div>
              <div className="text-lg font-medium">88.0%</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-md">
              <div className="text-xs text-slate-400">Max</div>
              <div className="text-lg font-medium">100.0%</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="error" className="p-2">
          <div className="h-64 bg-slate-900 rounded-md p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={errorRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="time"
                  label={{ value: "Time (s)", position: "insideBottom", offset: -5 }}
                  stroke="#94a3b8"
                />
                <YAxis label={{ value: "Error Rate (%)", angle: -90, position: "insideLeft" }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-slate-800 p-3 rounded-md">
              <div className="text-xs text-slate-400">Average</div>
              <div className="text-lg font-medium">1.5%</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-md">
              <div className="text-xs text-slate-400">Min</div>
              <div className="text-lg font-medium">0.0%</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-md">
              <div className="text-xs text-slate-400">Max</div>
              <div className="text-lg font-medium">2.4%</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="throughput" className="p-2">
          <div className="h-64 bg-slate-900 rounded-md p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="time"
                  label={{ value: "Time (s)", position: "insideBottom", offset: -5 }}
                  stroke="#94a3b8"
                />
                <YAxis label={{ value: "Qubits/s", angle: -90, position: "insideLeft" }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-slate-800 p-3 rounded-md">
              <div className="text-xs text-slate-400">Average</div>
              <div className="text-lg font-medium">15.3</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-md">
              <div className="text-xs text-slate-400">Min</div>
              <div className="text-lg font-medium">0</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-md">
              <div className="text-xs text-slate-400">Max</div>
              <div className="text-lg font-medium">25</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

