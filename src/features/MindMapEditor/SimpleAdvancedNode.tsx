import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface SimpleAdvancedNodeData {
  label: string;
  color?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  borderWidth?: number;
  borderRadius?: number;
  [key: string]: unknown; // Index signature for Record compatibility
}

const SimpleAdvancedNode: React.FC<NodeProps<SimpleAdvancedNodeData>> = ({ 
  data,
  selected 
}) => {
  const style: React.CSSProperties = {
    backgroundColor: data.color || '#6B46C1',
    color: data.textColor || '#FFFFFF',
    border: `${data.borderWidth || 2}px solid ${data.borderColor || '#4C1D95'}`,
    fontSize: `${data.fontSize || 14}px`,
    fontWeight: data.fontWeight || 'normal',
    borderRadius: `${data.borderRadius || 8}px`,
    padding: '12px 16px',
    minWidth: '120px',
    minHeight: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: selected ? '0 0 0 2px #3B82F6' : '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
  };

  return (
    <div style={style}>
      <Handle type="target" position={Position.Top} />
      <div style={{ textAlign: 'center', wordBreak: 'break-word' }}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default SimpleAdvancedNode; 