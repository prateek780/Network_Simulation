"use client"

import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward, ChevronRight, RotateCcw } from "lucide-react"

interface SimulationControlsProps {
  isRunning: boolean
  onPlayPause: () => void
  onReset?: () => void
  speed: number
  onSpeedChange: (value: number) => void
  currentTime: number
  onTimeChange: (value: number) => void
}

export function SimulationControls({
  isRunning,
  onPlayPause,
  onReset,
  speed,
  onSpeedChange,
  currentTime,
  onTimeChange,
}: SimulationControlsProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm p-2 rounded-lg border border-slate-700">
      <Button variant="ghost" size="icon" onClick={() => onTimeChange(0)}>
        <SkipBack className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" onClick={() => onTimeChange(Math.max(0, currentTime - 1))}>
        <ChevronRight className="h-4 w-4 rotate-180" />
      </Button>

      <Button variant={isRunning ? "secondary" : "outline"} size="icon" onClick={onPlayPause}>
        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <Button variant="ghost" size="icon" onClick={() => onTimeChange(currentTime + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onTimeChange(100)} // Go to end
      >
        <SkipForward className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-slate-700 mx-1" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Speed:</span>
        <Slider
          value={[speed]}
          min={0.25}
          max={4}
          step={0.25}
          className="w-24"
          onValueChange={(values) => onSpeedChange(values[0])}
        />
        <span className="text-xs font-mono w-8">{speed}x</span>
      </div>

      <div className="h-6 w-px bg-slate-700 mx-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (onReset) {
            onReset();
          } else {
            onTimeChange(0);
            if (isRunning) onPlayPause();
          }
        }}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  )
}

