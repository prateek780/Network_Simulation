import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, ZoomIn, ZoomOut, RotateCcw, Grid, Layers, Download, RefreshCw, Trash2 } from "lucide-react"
import { downloadJson, exportToJSON } from "@/services/exportService"
import { networkStorage } from "@/services/storage"
import api from "@/services/api"

interface TopBarProps {
  onReset?: () => void;
  onClearNetwork?: () => void;
}

export function TopBar({ onReset, onClearNetwork }: TopBarProps) {

  const exportJSONFile = () => {
    const jsonData = exportToJSON();

    if(!jsonData)  return;

    downloadJson(jsonData, "network")
  }

  const saveCurrentNetwork = () => {
    const jsonData = exportToJSON();

    if(!jsonData)  return;
    api.saveTopology(jsonData);
  }

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  }
  
  const handleClearNetwork = () => {
    if (onClearNetwork) {
      onClearNetwork();
    }
  }

  return (
    <div className="h-12 border-b border-slate-700 bg-slate-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          Quantum Network Simulator
        </h1>

        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                File <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>New Project</DropdownMenuItem>
              <DropdownMenuItem>Open Project</DropdownMenuItem>
              <DropdownMenuItem onClick={saveCurrentNetwork}>Save</DropdownMenuItem>
              {/* <DropdownMenuItem>Save As...</DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportJSONFile}>Export...</DropdownMenuItem>
              <DropdownMenuItem>Import...</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                Edit <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Undo</DropdownMenuItem>
              <DropdownMenuItem>Redo</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Cut</DropdownMenuItem>
              <DropdownMenuItem>Copy</DropdownMenuItem>
              <DropdownMenuItem>Paste</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Select All</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                View <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Zoom In</DropdownMenuItem>
              <DropdownMenuItem>Zoom Out</DropdownMenuItem>
              <DropdownMenuItem>Fit to Screen</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Show Grid</DropdownMenuItem>
              <DropdownMenuItem>Show Labels</DropdownMenuItem>
              <DropdownMenuItem>Show Quantum States</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                Simulation <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Run</DropdownMenuItem>
              {/* <DropdownMenuItem>Pause</DropdownMenuItem> */}
              <DropdownMenuItem>Stop</DropdownMenuItem>
              <DropdownMenuItem onClick={handleReset}>Reset</DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearNetwork}>Clear Network</DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem>Configure Parameters...</DropdownMenuItem>
              <DropdownMenuItem>Export Results...</DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="destructive" 
          size="sm" 
          className="mr-2 flex items-center gap-1"
          onClick={handleReset}
        >
          <RefreshCw className="h-4 w-4" /> Reset Simulation
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-4 flex items-center gap-1"
          onClick={handleClearNetwork}
        >
          <Trash2 className="h-4 w-4" /> Clear Network
        </Button>

        <div className="flex items-center border rounded-md overflow-hidden">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Input type="text" defaultValue={"100%"} className="h-8 w-16 border-0 rounded-none text-center" />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-l">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* <Button variant="ghost" size="icon" className="h-8 w-8">
          <Grid className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Layers className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button> */}
      </div>
    </div>
  )
}

