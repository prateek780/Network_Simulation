import React from "react";
import "./node.scss";
import { ClassicalRouter } from "./classical/classicalRouter";

export enum NodeType {
    CLASSICAL_NODE
}

interface NodeProps {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    name: string;
    canvas: fabric.Canvas;
    updateNode: (id: string, updates: any) => void;
    onRemove: (id: string, shape: any, text: any, deleteButton: any) => void; // Type 'any' for POC
}

interface nodeMapping {
    [key: number]: any;
}


export const nodeTypeToNodeMapping: nodeMapping = {
    [NodeType.CLASSICAL_NODE]: ClassicalRouter
}

const Node: React.FC<NodeProps> = ({ id, type, x, y, name, canvas, updateNode, onRemove }) => {
    const nodeClass = nodeTypeToNodeMapping[type];

    if (!nodeClass) {
        return
    }



    return (
        <>
            {/* Fabric.js shape and text will be rendered here programmatically */}
        </>
    );
};

export default Node;