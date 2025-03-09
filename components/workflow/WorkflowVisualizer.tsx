import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Connection,
  ConnectionLineType,
  Controls,
  Edge,
  MarkerType,
  Node,
  Panel,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomNode from "./CustomNode";
import { Agent, Workflow } from "../../lib/models/workflow";
import dagre from "dagre";

// Define node types
const nodeTypes = {
  subagent: CustomNode,
};

// Layout algorithm configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) => {
  dagreGraph.setGraph({ rankdir: direction });

  // Set nodes
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 500, height: 200 });
  });

  // Set edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply layout to nodes
  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x,
          y: nodeWithPosition.y,
        },
      };
    }),
    edges,
  };
};

interface WorkflowVisualizerProps {
  workflow: Workflow;
  onNodeClick?: (agent: Agent) => void;
}

const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  workflow,
  onNodeClick,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(var(--primary))" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "hsl(var(--primary))",
        },
      };
      setEdges((eds: any) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  useEffect(() => {
    const initializeFlow = async () => {
      try {
        const { agents, flow } = workflow;

        // Create nodes with initial positions
        const initialNodes = agents.map((agent: Agent) => ({
          id: agent.id,
          type: "subagent",
          data: {
            name: agent.name,
            prompt: agent.prompt,
            role: agent.role,
            description: agent.description,
            onClick: () => onNodeClick && onNodeClick(agent),
          },
          position: { x: 0, y: 0 }, // Initial positions will be calculated by dagre
        }));

        // Create edges with styling
        const initialEdges = flow.connections.map(
          (
            connection: { from: string; to: string; description: string },
            index: number
          ) => ({
            id: `e${index}`,
            source: connection.from,
            target: connection.to,
            label: connection.description,
            type: "smoothstep",
            animated: true,
            labelStyle: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
            style: { stroke: "hsl(var(--primary))" },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "hsl(var(--primary))",
            },
          })
        );

        // Apply layout
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(initialNodes, initialEdges);

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setLoading(false);
      } catch (error) {
        console.error("Error initializing workflow:", error);
        setLoading(false);
      }
    };

    initializeFlow();
  }, [workflow, onNodeClick, setNodes, setEdges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading workflow...
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.1 }}
      minZoom={0.2}
      maxZoom={2.5}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      connectionLineType={ConnectionLineType.SmoothStep}
      connectionLineStyle={{ stroke: "hsl(var(--primary))" }}
      className="bg-background"
    >
      <Background color="hsl(var(--muted-foreground))" gap={16} size={1} />
      <Controls className="bg-card border border-border shadow-md" />
      <Panel
        position="top-right"
        className="bg-card p-2 rounded-md shadow-md border border-border"
      >
        <div className="text-xs text-muted-foreground">
          {workflow.agents.length} Agents • {workflow.flow.connections.length}{" "}
          Connections
        </div>
      </Panel>
    </ReactFlow>
  );
};

const WorkflowVisualizerWithProvider: React.FC<WorkflowVisualizerProps> = (
  props
) => (
  <ReactFlowProvider>
    <WorkflowVisualizer {...props} />
  </ReactFlowProvider>
);

export default WorkflowVisualizerWithProvider;
