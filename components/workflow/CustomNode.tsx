import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface CustomNodeProps {
  data: {
    name: string;
    prompt: string;
  };
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  return (
    <div className="bg-card text-card-foreground p-4 rounded-lg shadow-md w-48">
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-accent" />
      <div className="text-sm font-semibold mb-2">{data.name}</div>
      <div className="text-sm">{data.prompt}</div>
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-accent" />
    </div>
  );
};

export default CustomNode;
