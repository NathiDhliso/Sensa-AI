import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Target, MoreHorizontal } from 'lucide-react';

export interface SimpleAdvancedNodeData {
  label: string;
  color?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  borderWidth?: number;
  borderRadius?: number;
  rootProblem?: string; // Store attached root problem
  [key: string]: unknown; // Index signature for Record compatibility
}

const SimpleAdvancedNode: React.FC<NodeProps<SimpleAdvancedNodeData>> = ({ 
  data,
  selected,
  id
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      // Dispatch custom event to update node
      window.dispatchEvent(new CustomEvent('updateNode', {
        detail: { id, updates: { label } }
      }));
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel(data.label);
    }
  }, [id, label, data.label]);

  const handleRootProblemAnalysis = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    // Dispatch custom event to open root problem modal
    window.dispatchEvent(new CustomEvent('openRootProblemModal', {
      detail: { nodeId: id, nodeLabel: label }
    }));
  }, [id, label]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(!showContextMenu);
  }, [showContextMenu]);
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
    <div 
      style={style} 
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      className="relative group"
    >
      <Handle type="target" position={Position.Top} />
      
      {/* Main content */}
      <div style={{ textAlign: 'center', wordBreak: 'break-word' }}>
        {isEditing ? (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={() => setIsEditing(false)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              textAlign: 'center',
              width: '100%',
              color: data.textColor || '#FFFFFF',
              fontSize: `${data.fontSize || 14}px`,
              fontWeight: data.fontWeight || 'normal'
            }}
            autoFocus
          />
        ) : (
          <>
            <div>{label}</div>
            {data.rootProblem && (
              <div 
                style={{
                  fontSize: '10px',
                  opacity: 0.8,
                  marginTop: '4px',
                  fontStyle: 'italic',
                  maxWidth: '200px',
                  wordWrap: 'break-word',
                  cursor: 'pointer'
                }}
                title={`Root Problem: ${data.rootProblem}`}
                onClick={(e) => {
                  e.stopPropagation();
                  // Show full root problem in a tooltip or modal
                  alert(`Root Problem Analysis Result:\n\n${data.rootProblem}`);
                }}
              >
                🎯 {selected ? data.rootProblem.substring(0, 50) + (data.rootProblem.length > 50 ? '...' : '') : 'Root Problem Attached'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Context menu button */}
      <button
        onClick={handleContextMenu}
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#6B46C1',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: selected ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
        className="group-hover:opacity-100"
      >
        <MoreHorizontal size={12} color="white" />
      </button>

      {/* Context menu */}
      {showContextMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '8px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '180px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleRootProblemAnalysis}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            className="hover:bg-gray-50"
          >
            <Target size={16} color="#6B46C1" />
            Root Problem Analysis
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default SimpleAdvancedNode;