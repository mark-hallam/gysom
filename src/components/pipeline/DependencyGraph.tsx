"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DAG } from "@/lib/types";

interface DependencyGraphProps {
  dag: DAG;
}

const LAYER_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
];

const NODE_WIDTH = 200;
const LAYER_GAP_X = 280;
const NODE_GAP_Y = 90;

function CustomNode({ data }: { data: { label: string; layer: number; type: string } }) {
  const color = LAYER_COLORS[data.layer % LAYER_COLORS.length];

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-md"
      style={{
        borderColor: color,
        backgroundColor: `${color}15`,
        minWidth: NODE_WIDTH,
        maxWidth: NODE_WIDTH,
      }}
    >
      <div className="font-medium text-white" style={{ color }}>
        {data.label}
      </div>
      <div className="mt-0.5 text-[10px] text-gray-500">
        Layer {data.layer} &middot; {data.type}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export default function DependencyGraph({ dag }: DependencyGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // Position nodes by layer
    const layerCounts = new Map<number, number>();

    for (const node of dag.nodes) {
      const layer = node.layer || 0;
      const yIndex = layerCounts.get(layer) || 0;
      layerCounts.set(layer, yIndex + 1);

      flowNodes.push({
        id: node.id,
        type: "custom",
        position: {
          x: layer * LAYER_GAP_X,
          y: yIndex * NODE_GAP_Y,
        },
        data: {
          label: node.label,
          layer: node.layer,
          type: node.type,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }

    for (const edge of dag.edges) {
      flowEdges.push({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: edge.type === "blocking",
        style: {
          stroke: edge.type === "blocking" ? "#ef4444" : "#4b5563",
          strokeWidth: edge.type === "blocking" ? 2 : 1,
        },
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [dag]);

  const onInit = useCallback(() => {
    // ReactFlow initialized
  }, []);

  return (
    <div className="h-[500px] w-full rounded-xl border border-gray-800 bg-gray-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#1a1a1a" gap={20} />
        <Controls className="[&>button]:border-gray-700 [&>button]:bg-gray-900 [&>button]:text-gray-400" />
        <MiniMap
          nodeColor={(node) => {
            const layer = (node.data as { layer: number }).layer || 0;
            return LAYER_COLORS[layer % LAYER_COLORS.length];
          }}
          className="rounded-lg border border-gray-800 bg-gray-950"
        />
      </ReactFlow>
    </div>
  );
}
