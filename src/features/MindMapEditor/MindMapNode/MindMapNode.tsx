import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { RotateCw, RotateCcw, Palette } from 'lucide-react';

export interface MindMapNodeData {
  label: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'rounded' | 'orange-diamond' | 'green-circle' | 'blue-square' | 'purple-triangle' | 'red-hexagon';
  level: number;
  isRoot: boolean;
  category?: string;
  emoji?: string;
  rotation?: number; // Rotation angle in degrees
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
  const { label, shape, level, isRoot, category, emoji, rotation = 0 } = data;
  const [showControls, setShowControls] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(rotation);

  // Handle rotation
  const handleRotate = useCallback((direction: 'left' | 'right') => {
    const newRotation = direction === 'left' 
      ? currentRotation - 15 
      : currentRotation + 15;
    setCurrentRotation(newRotation);
    
    // Dispatch event to update node data
    window.dispatchEvent(new CustomEvent('updateNode', {
      detail: { id, updates: { rotation: newRotation } }
    }));
  }, [currentRotation, id]);

  // Handle shape change
  const handleShapeChange = useCallback((newShape: MindMapNodeData['shape']) => {
    window.dispatchEvent(new CustomEvent('updateNode', {
      detail: { id, updates: { shape: newShape } }
    }));
  }, [id]);

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
      borderRadius: shape === 'circle' || shape === 'green-circle' ? '50%' : shape === 'rounded' ? '12px' : '4px',
      padding: '8px 12px',
      minWidth: '120px',
      textAlign: 'center',
      boxShadow: selected 
        ? '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 2px #3b82f6' 
        : '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      cursor: 'grab',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '4px',
      transform: `rotate(${currentRotation}deg)`
    };

    // Shape-specific colors or level-based colors
    if (shape === 'orange-diamond') {
      baseStyle.background = 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)';
      baseStyle.borderColor = '#ea580c';
      baseStyle.color = 'white';
    } else if (shape === 'green-circle') {
      baseStyle.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
      baseStyle.borderColor = '#059669';
      baseStyle.color = 'white';
    } else if (shape === 'blue-square') {
      baseStyle.background = 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
      baseStyle.borderColor = '#2563eb';
      baseStyle.color = 'white';
    } else if (shape === 'purple-triangle') {
      baseStyle.background = 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)';
      baseStyle.borderColor = '#7c3aed';
      baseStyle.color = 'white';
    } else if (shape === 'red-hexagon') {
      baseStyle.background = 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)';
      baseStyle.borderColor = '#dc2626';
      baseStyle.color = 'white';
    } else if (isRoot) {
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
    if (shape === 'circle' || shape === 'green-circle') {
      baseStyle.width = '100px';
      baseStyle.height = '100px';
      baseStyle.borderRadius = '50%';
    } else if (shape === 'diamond' || shape === 'orange-diamond') {
      baseStyle.width = '80px';
      baseStyle.height = '80px';
      baseStyle.transform = `rotate(${45 + currentRotation}deg)`;
      // Inner content needs counter-rotation
    } else if (shape === 'purple-triangle') {
      baseStyle.width = '0';
      baseStyle.height = '0';
      baseStyle.borderLeft = '40px solid transparent';
      baseStyle.borderRight = '40px solid transparent';
      baseStyle.borderBottom = '70px solid';
      baseStyle.borderBottomColor = baseStyle.borderColor;
      baseStyle.background = 'transparent';
      baseStyle.padding = '0';
      baseStyle.minWidth = '80px';
    } else if (shape === 'red-hexagon') {
      baseStyle.width = '80px';
      baseStyle.height = '80px';
      baseStyle.clipPath = 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)';
    }

    // Hover effects via CSS-in-JS
    return baseStyle;
  };

  const renderContent = () => {
    if (shape === 'diamond' || shape === 'orange-diamond') {
      return (
        <div style={{ transform: `rotate(-${45 + currentRotation}deg)` }}>
          {emoji && <span style={{ fontSize: '16px', marginBottom: '4px' }}>{emoji}</span>}
          <div style={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
            {label}
          </div>
        </div>
      );
    }

    if (shape === 'purple-triangle') {
      return (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '10px',
          fontWeight: 'bold',
          textAlign: 'center',
          width: '60px'
        }}>
          {emoji && <span style={{ fontSize: '12px', display: 'block' }}>{emoji}</span>}
          <div>{label}</div>
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

  const renderControls = () => {
    if (!showControls || !selected) return null;

    return (
      <div style={{
        position: 'absolute',
        top: '-40px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '4px',
        background: 'white',
        padding: '4px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <button
          onClick={() => handleRotate('left')}
          style={{
            padding: '4px',
            border: 'none',
            background: '#f3f4f6',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Rotate Left"
        >
          <RotateCcw size={12} />
        </button>
        <button
          onClick={() => handleRotate('right')}
          style={{
            padding: '4px',
            border: 'none',
            background: '#f3f4f6',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Rotate Right"
        >
          <RotateCw size={12} />
        </button>
        <select
          value={shape}
          onChange={(e) => handleShapeChange(e.target.value as MindMapNodeData['shape'])}
          style={{
            padding: '4px',
            border: 'none',
            background: '#f3f4f6',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
          title="Change Shape"
        >
          <option value="rectangle">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="diamond">Diamond</option>
          <option value="rounded">Rounded</option>
          <option value="orange-diamond">🔶 Orange Diamond</option>
          <option value="green-circle">🟢 Green Circle</option>
          <option value="blue-square">🟦 Blue Square</option>
          <option value="purple-triangle">🔺 Purple Triangle</option>
          <option value="red-hexagon">🔴 Red Hexagon</option>
        </select>
      </div>
    );
  };

  return (
    <div 
      className={getNodeClasses()} 
      style={getNodeStyle()}
      data-node-id={id}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onMouseDown={(e) => {
        e.currentTarget.style.cursor = 'grabbing';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.cursor = 'grab';
      }}
    >
      {/* Rotation and Shape Controls */}
      {renderControls()}
      
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
  // id
}) => {
  const { label, shape, level, isRoot, emoji } = data;

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