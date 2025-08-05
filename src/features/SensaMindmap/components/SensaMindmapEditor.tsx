import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Node,
  Edge,
  NodeProps,
  EdgeProps,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  EdgeChange,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Node Component with accessibility and performance optimizations
const MindmapNode = memo<NodeProps>(({ data, selected, id }) => {
  const [isEditing, setIsEditing] = useState(data?.isEditing || false);
  const [label, setLabel] = useState(data?.label || 'Untitled Node');
  const nodeDescription = data?.description || '';
  const nodeLevel = data?.level || 0;
  
  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('updateNode', {
        detail: { id, updates: { label } }
      }));
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel(data?.label || 'Untitled Node');
    }
  }, [id, label, data?.label]);
  
  // Generate accessible label
  const ariaLabel = useMemo(() => {
    const levelText = nodeLevel > 0 ? `, level ${nodeLevel}` : '';
    const selectedText = selected ? ', selected' : '';
    const descriptionText = nodeDescription ? `, ${nodeDescription}` : '';
    return `Mind map node: ${label}${levelText}${selectedText}${descriptionText}`;
  }, [label, nodeLevel, selected, nodeDescription]);

  return (
    <div
      className={`mindmap-node ${
        selected ? 'mindmap-node--selected' : ''
      } mindmap-node--level-${nodeLevel}`}
      role="treeitem"
      aria-label={ariaLabel}
      aria-selected={selected}
      tabIndex={0}
      onDoubleClick={handleDoubleClick}
      style={
        {
          padding: '12px 16px',
          background: selected ? '#e3f2fd' : '#ffffff',
          border: `2px solid ${selected ? '#1976d2' : '#e0e0e0'}`,
          borderRadius: '8px',
          boxShadow: selected
            ? '0 4px 12px rgba(25, 118, 210, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
          minWidth: '120px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: nodeLevel === 0 ? '600' : '400',
          color: '#333333',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
        } as React.CSSProperties
      }
    >
      <div className="mindmap-node__content">
        <div className="mindmap-node__label">
          {isEditing ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => setIsEditing(false)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#333333',
                fontSize: '14px',
                fontWeight: nodeLevel === 0 ? '600' : '400',
                textAlign: 'center',
                width: '100%',
              }}
            />
          ) : (
            label
          )}
        </div>
        {nodeDescription && (
          <div 
            className="mindmap-node__description"
            style={{
              fontSize: '12px',
              color: '#666666',
              marginTop: '4px',
            }}
          >
            {nodeDescription}
          </div>
        )}
      </div>
    </div>
  );
});

MindmapNode.displayName = 'MindmapNode';

// Custom Edge Component with accessibility
const MindmapEdge = memo<EdgeProps>(({ id, sourceX, sourceY, targetX, targetY, data }) => {
  const edgeLabel = data?.label || '';
  const ariaLabel = `Connection from ${data?.sourceLabel || 'node'} to ${data?.targetLabel || 'node'}${edgeLabel ? `, labeled: ${edgeLabel}` : ''}`;

  return (
    <g role="img" aria-label={ariaLabel}>
      <path
        id={id}
        d={`M${sourceX},${sourceY} L${targetX},${targetY}`}
        stroke="#b0b0b0"
        strokeWidth={2}
        fill="none"
        markerEnd="url(#arrowhead)"
      />
      {edgeLabel && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#666666"
          dy="-5"
        >
          {edgeLabel}
        </text>
      )}
    </g>
  );
});

MindmapEdge.displayName = 'MindmapEdge';

// Define node and edge types
const nodeTypes: NodeTypes = {
  mindmapNode: MindmapNode,
};

const edgeTypes: EdgeTypes = {
  mindmapEdge: MindmapEdge,
};

// Props interface for the main component
export interface SensaMindmapEditorProps {
  nodes: Node[];
  edges: Edge[];
  className?: string;
  ariaLabel?: string;
}

// Main Editor Component - Interactive mindmap editor
const SensaMindmapEditorInternal = memo<SensaMindmapEditorProps>(({ 
  nodes, 
  edges, 
  className = '',
  ariaLabel = 'Interactive mind map visualization'
}) => {
  // Initialize React Flow state with provided nodes and edges
  const [flowNodes, setNodes, onNodesChange] = useNodesState(
    useMemo(() => {
      return nodes.map(node => ({
        ...node,
        type: node.type || 'mindmapNode',
      }));
    }, [nodes])
  );

  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(
    useMemo(() => {
      return edges.map(edge => ({
        ...edge,
        type: edge.type || 'mindmapEdge',
      }));
    }, [edges])
  );

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Listen for updateNode events from MindmapNode components
  useEffect(() => {
    const handleUpdateNode = (event: CustomEvent) => {
      const { nodeId, newLabel } = event.detail;
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, nodeLabel: newLabel } }
            : node
        )
      );
    };

    document.addEventListener('updateNode', handleUpdateNode as EventListener);
    return () => {
      document.removeEventListener('updateNode', handleUpdateNode as EventListener);
    };
  }, [setNodes]);

  // Accessibility configuration
  const ariaLabelConfig = useMemo(() => ({
    // Customize default ARIA labels for better accessibility
    node: 'Mind map node',
    edge: 'Mind map connection',
    flow: ariaLabel,
  }), [ariaLabel]);

  return (
    <div 
      className={`sensa-mindmap-editor ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // Accessibility props
        nodesFocusable={true}
        edgesFocusable={true}
        // Interactive props
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectNodesOnDrag={true}
        // Performance props
        onlyRenderVisibleElements={true}
        // Layout props
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        // ARIA configuration
        aria-label={ariaLabel}
        role="application"
        aria-describedby="mindmap-instructions"
      >
        {/* Background with subtle pattern */}
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#f0f0f0"
        />
        
        {/* Controls for zoom, fit view, etc. */}
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          position="bottom-right"
        />
        
        {/* Hidden instructions for screen readers */}
        <div 
          id="mindmap-instructions" 
          className="sr-only"
          aria-live="polite"
        >
          Use arrow keys to navigate between nodes. Press Enter to select a node. 
          Use Tab to move between interactive elements. Press Escape to deselect.
        </div>
        
        {/* SVG definitions for custom markers */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#b0b0b0"
              />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </div>
  );
});

SensaMindmapEditorInternal.displayName = 'SensaMindmapEditorInternal';

// Main component with ReactFlowProvider wrapper
export const SensaMindmapEditor = memo<SensaMindmapEditorProps>((props) => {
  return (
    <ReactFlowProvider>
      <SensaMindmapEditorInternal {...props} />
    </ReactFlowProvider>
  );
});

SensaMindmapEditor.displayName = 'SensaMindmapEditor';

// CSS-in-JS styles for better encapsulation (optional - can be moved to CSS file)
const styles = `
  .sensa-mindmap-editor {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }
  
  .mindmap-node {
    transition: all 0.2s ease-in-out;
  }
  
  .mindmap-node:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
  }
  
  .mindmap-node:focus {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }
  
  .mindmap-node--selected {
    transform: translateY(-1px);
  }
  
  .mindmap-node--level-0 {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
  }
  
  .mindmap-node--level-1 {
    border-color: #4caf50 !important;
  }
  
  .mindmap-node--level-2 {
    border-color: #ff9800 !important;
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

// Inject styles (in a real app, this would be in a CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default SensaMindmapEditor;