import React, { useEffect, useState } from 'react';
import { ReactFlow, ReactFlowProvider, addEdge, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import SubagentNode from './SubagentNode';
import { analyzeProblemStatement } from '../../lib/services/architect';
import { Node, Edge, Connection } from '@xyflow/react';
import { Workflow, Agent, WorkflowFlow } from '../../lib/models/workflow';

import CustomNode from './CustomNode';

const nodeTypes = {
  subagent: CustomNode,
};

interface WorkflowVisualizerProps {
  workflow: Workflow;
}

const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ workflow }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkflow = async (workflow: Workflow) => {
      try {
        const { agents, flow } = workflow;
        const initialNodes: Node[] = agents.map((agent: Agent, index: number) => ({
          id: agent.id,
          type: 'subagent',
          data: { name: agent.name, prompt: agent.prompt },
          position: { x: 100, y: index * 200 },
          style: {
            backgroundColor: '#74372f', // Apply background color from globals.css
            borderRadius: 'var(--radius)', // Apply border radius from globals.css
            padding: '1rem', // Add padding for better appearance
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Add shadow for depth
          },
        }));

        const initialEdges: Edge[] = flow.connections.map((connection: { from: string; to: string }, index: number) => ({
          id: `e${index}`,
          source: connection.from,
          target: connection.to,
        }));

        setNodes(initialNodes);
        setEdges(initialEdges);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching workflow:', error);
        setLoading(false);
      }
    };

    fetchWorkflow(workflow);
  }, [workflow]);

  const onConnect = (params: Connection) => setEdges((eds) => addEdge(params, eds));

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </ReactFlowProvider>
  );
};

export default WorkflowVisualizer;
