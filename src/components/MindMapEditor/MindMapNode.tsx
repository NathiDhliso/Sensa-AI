import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface MindMapNodeData {
  label: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'rounded';
  level: number;
  isRoot: boolean;
  category?: string;
  emoji?: string;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

/**
 * Custom Mind Map Node Component
 */
export const MindMapNode: React.FC<NodeProps<MindMapNodeData>> = ({ 
  data, 
  selected,
  id
}) => {
  const { label, shape, level, isRoot, category, emoji } = data;

  // Dynamic styling based on node properties
  const getNodeClasses = () => {
    const baseClasses = [
      'mind-map-node',
      `level-${level}`,
      `shape-${shape}`,
      `category-${category || 'default'}`
    ];
    
    if (isRoot) baseClasses.push('root-node');
    if (selected) baseClasses.push('selected');
    
    return baseClasses.join(' ');
  };

  const getNodeStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontSize: isRoot ? '16px' : level === 1 ? '14px' : '12px',
      fontWeight: isRoot ? 'bold' : level === 1 ? '600' : '500',
      color: '#1f2937',
      border: '2px solid',
      borderRadius: shape === 'circle' ? '50%' : shape === 'rounded' ? '12px' : '4px',
      padding: '8px 12px',
      minWidth: '120px',
      textAlign: 'center',
      boxShadow: selected 
        ? '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 2px #3b82f6' 
        : '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '4px'
    };

    // Level-based colors
    if (isRoot) {
      baseStyle.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      baseStyle.borderColor = '#4c51bf';
      baseStyle.color = 'white';
    } else if (level === 1) {
      baseStyle.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      baseStyle.borderColor = '#e53e3e';
      baseStyle.color = 'white';
    } else if (level === 2) {
      baseStyle.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      baseStyle.borderColor = '#3182ce';
      baseStyle.color = 'white';
    } else {
      baseStyle.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      baseStyle.borderColor = '#38a169';
      baseStyle.color = '#1a202c';
    }

    // Shape-specific adjustments
    if (shape === 'circle') {
      baseStyle.width = '100px';
      baseStyle.height = '100px';
      baseStyle.borderRadius = '50%';
    } else if (shape === 'diamond') {
      baseStyle.width = '80px';
      baseStyle.height = '80px';
      baseStyle.transform = 'rotate(45deg)';
      // Inner content needs counter-rotation
    }

    // Hover effects via CSS-in-JS
    return baseStyle;
  };

  const renderContent = () => {
    if (shape === 'diamond') {
      return (
        <div style={{ transform: 'rotate(-45deg)' }}>
          {emoji && <span style={{ fontSize: '16px', marginBottom: '4px' }}>{emoji}</span>}
          <div style={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
            {label}
          </div>
        </div>
      );
    }

    return (
      <>
        {emoji && (
          <span 
            style={{ 
              fontSize: isRoot ? '20px' : '16px', 
              marginBottom: '2px',
              display: 'block'
            }}
          >
            {emoji}
          </span>
        )}
        <div style={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
          {label}
        </div>
      </>
    );
  };

  return (
    <div 
      className={getNodeClasses()} 
      style={getNodeStyle()}
      data-node-id={id}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#64748b',
          width: '8px',
          height: '8px',
          border: '2px solid white',
          opacity: isRoot ? 0 : 1 // Hide target handle for root
        }}
      />
      
      {/* Node content */}
      {renderContent()}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#64748b',
          width: '8px',
          height: '8px',
          border: '2px solid white'
        }}
      />
    </div>
  );
};

/**
 * Alternative Mind Map Node with more advanced styling
 */
export const AdvancedMindMapNode: React.FC<NodeProps<MindMapNodeData>> = ({ 
  data, 
  selected,
  id
}) => {
  const { label, shape, level, isRoot, category, emoji } = data;

  return (
    <div className={`advanced-mind-map-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="custom-handle"
        style={{ opacity: isRoot ? 0 : 1 }}
      />
      
      <div className={`node-content ${shape} level-${level}`}>
        <div className="emoji-container">
          {emoji && <span className="node-emoji">{emoji}</span>}
        </div>
        
        <div className="label-container">
          <span className="node-label">{label}</span>
        </div>
        
        {level > 0 && (
          <div className="level-indicator">
            <span>L{level}</span>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="custom-handle"
      />
      
      <style jsx>{`
        .advanced-mind-map-node {
          position: relative;
        }
        
        .node-content {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          min-width: 120px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .node-content:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }
        
        .node-content.circle {
          border-radius: 50%;
          width: 100px;
          height: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .node-content.diamond {
          transform: rotate(45deg);
          width: 80px;
          height: 80px;
        }
        
        .node-content.diamond .emoji-container,
        .node-content.diamond .label-container {
          transform: rotate(-45deg);
        }
        
        .node-content.level-0 {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #4c51bf;
        }
        
        .node-content.level-1 {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border-color: #e53e3e;
        }
        
        .node-content.level-2 {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          border-color: #3182ce;
        }
        
        .emoji-container {
          font-size: 18px;
          margin-bottom: 4px;
        }
        
        .node-label {
          font-size: 13px;
          font-weight: 500;
          line-height: 1.2;
        }
        
        .level-indicator {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #64748b;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: bold;
        }
        
        .selected .node-content {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 2px #3b82f6;
        }
        
        .custom-handle {
          background: #64748b;
          width: 8px;
          height: 8px;
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
};

// Export both components
export default MindMapNode; 