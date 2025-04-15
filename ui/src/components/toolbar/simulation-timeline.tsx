"use client"

import { useState, useEffect, useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Flag, Zap, AlertTriangle } from "lucide-react"

interface SimulationTimelineProps {
  currentTime: number
  onTimeChange: (time: number) => void
  isRunning: boolean
}

export function SimulationTimeline({ currentTime, onTimeChange, isRunning }: SimulationTimelineProps) {
  const [events, setEvents] = useState([
    { time: 5, type: "entanglement", label: "Entanglement Created" },
    { time: 15, type: "measurement", label: "Qubit Measured" },
    { time: 30, type: "error", label: "Decoherence Error" },
    { time: 45, type: "teleportation", label: "Teleportation" },
    { time: 60, type: "measurement", label: "Qubit Measured" },
  ])

  const timelineRef = useRef<HTMLDivElement>(null)

  // Auto-scroll timeline when running
  useEffect(() => {
    if (isRunning && timelineRef.current) {
      const scrollPosition = (currentTime / 100) * timelineRef.current.scrollWidth
      timelineRef.current.scrollLeft = scrollPosition - timelineRef.current.clientWidth / 2
    }
  }, [currentTime, isRunning])

  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Simulation Timeline</div>
        <div className="text-sm font-mono">{currentTime.toFixed(2)}s</div>
      </div>

      <div ref={timelineRef} className="flex-1 overflow-x-auto relative border-t border-slate-700 pt-6">
        <div className="absolute top-0 left-0 right-0 h-6 flex">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="flex-1 relative">
              <div className="absolute bottom-0 left-0 w-px h-2 bg-slate-700"></div>
              <div className="absolute bottom-0 left-0 text-xs text-slate-500 transform -translate-x-1/2">
                {i * 10}s
              </div>
            </div>
          ))}
        </div>

        <div className="relative min-h-[60px]">
          {/* Current time indicator */}
          <div className="absolute top-0 bottom-0 w-px bg-blue-500 z-10" style={{ left: `${currentTime}%` }}>
            <div className="w-3 h-3 rounded-full bg-blue-500 -translate-x-1/2"></div>
          </div>

          {/* Event markers */}
          {events.map((event, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute top-1/2 -translate-y-1/2 cursor-pointer" style={{ left: `${event.time}%` }}>
                    {event.type === "entanglement" && (
                      <Badge className="bg-purple-600 hover:bg-purple-700">
                        <Zap className="h-3 w-3 mr-1" />
                      </Badge>
                    )}
                    {event.type === "measurement" && (
                      <Badge className="bg-green-600 hover:bg-green-700">
                        <Flag className="h-3 w-3 mr-1" />
                      </Badge>
                    )}
                    {event.type === "error" && (
                      <Badge className="bg-red-600 hover:bg-red-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      </Badge>
                    )}
                    {event.type === "teleportation" && (
                      <Badge className="bg-blue-600 hover:bg-blue-700">
                        <Zap className="h-3 w-3 mr-1" />
                      </Badge>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {event.label} at {event.time}s
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      <div className="mt-2">
        <Slider
          value={[currentTime]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={(values) => onTimeChange(values[0])}
          disabled={isRunning}
        />
      </div>
    </div>
  )
}

