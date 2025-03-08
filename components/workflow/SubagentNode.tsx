import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface SubagentNodeProps {
  data: {
    name: string;
    prompt: string;
  };
}

const SubagentNode: React.FC<SubagentNodeProps> = ({ data }) => {
  return (
    <div className="subagent-node">
      <Handle type="target" position={Position.Top} />
      <div className="subagent-node-content">
        <h3>{data.name}</h3>
        <p>{data.prompt}</p>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default SubagentNode;
