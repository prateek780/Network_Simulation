import React from "react";
import "./toolbar.scss";

interface ToolbarProps {
    onCreateClassicalHost: () => void;
    onCreateClassicalRouter: () => void;
    onCreateQuantumHost: () => void;
    onCreateQuantumRepeater: () => void;
    onCreateQuantumAdapter: () => void;
    onCreateInternetExchange: () => void;
    onCreateClassicToQuantumConverter: () => void;
    onCreateQuantumToClassicalConverter: () => void;
    onCreateZone: () => void;
    onCreateNetwork: () => void;
    onExportClick: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    onCreateClassicalHost,
    onCreateClassicalRouter,
    onCreateQuantumHost,
    onCreateQuantumRepeater,
    onCreateQuantumAdapter,
    onCreateInternetExchange,
    onCreateClassicToQuantumConverter,
    onCreateQuantumToClassicalConverter,
    onCreateZone,
    onCreateNetwork,
    onExportClick
}) => {
    return (
        <div className="simulation-toolbar">
            <h3>Nodes</h3>
            <div className="button-group">
                <button className="toolbar-button classical-button" onClick={onCreateClassicalHost}>
                    Classical Host
                </button>
                <button className="toolbar-button classical-button" onClick={onCreateClassicalRouter}>
                    Classical Router
                </button>
                <button className="toolbar-button quantum-button" onClick={onCreateQuantumHost}>
                    Quantum Host
                </button>
                {/* <button className="toolbar-button quantum-button" onClick={onCreateQuantumRepeater}>
                    Quantum Repeater
                </button> */}
                <button className="toolbar-button quantum-button" onClick={onCreateQuantumAdapter}>
                    Quantum Adapter
                </button>
                <button className="toolbar-button converter-button" onClick={onExportClick}>
                    Export
                </button>
            </div>
            
            {/* 
            <div className="button-group">
                <button className="toolbar-button network-button" onClick={onCreateInternetExchange}>
                    Internet Exchange
                </button> 
                <button className="toolbar-button network-button" onClick={onCreateZone}>
                    Add Zone
                </button>
                <button className="toolbar-button network-button" onClick={onCreateNetwork}>
                    Add Classical Network
                </button>
            </div>
            */}

            {/* <div className="button-group">
                <button className="toolbar-button converter-button" onClick={onCreateClassicToQuantumConverter}>
                    C2Q Converter
                </button>
                <button className="toolbar-button converter-button" onClick={onCreateQuantumToClassicalConverter}>
                    Q2C Converter
                </button>
                <button className="toolbar-button converter-button" onClick={onExportClick}>
                    Export
                </button>
            </div> */}
        </div>
    );
};

export default Toolbar;