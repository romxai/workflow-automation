import React from "react";
import { Handle, Position, NodeProps } from "reactflow";

interface CustomNodeData {
  name: string;
  prompt: string;
  role?: string;
  description?: string;
  onClick?: () => void;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({
  data,
  selected,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onClick) {
      console.log("CustomNode clicked:", data.name);
      data.onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-card text-card-foreground 
        p-4 rounded-lg shadow-md 
        w-64 h-40
        flex flex-col 
        border-2 transition-all duration-200
        hover:shadow-lg cursor-pointer
        ${selected ? "border-primary" : "border-border"}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-background"
      />

      <div className="flex flex-col h-full">
        <div className="text-base font-semibold mb-1">{data.name}</div>
        {data.role && (
          <div className="text-xs text-muted-foreground mb-2">{data.role}</div>
        )}
        <div className="text-xs overflow-hidden flex-grow">
          {data.description ||
            data.prompt.substring(0, 100) +
              (data.prompt.length > 100 ? "..." : "")}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
    </div>
  );
};

export default CustomNode;
