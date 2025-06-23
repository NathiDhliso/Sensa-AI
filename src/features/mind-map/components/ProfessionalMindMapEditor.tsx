import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  NodeTypes,
  MarkerType,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Palette,
  Square,
  Circle,
  Diamond,
  Trash2,
  Plus,
  RotateCcw,
  FileText,
  Image,
  Code,
  X,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  Move,
  Layers,
  Settings,
  Save,
  FolderOpen,
  Copy,
  Scissors,
  Clipboard,
  RotateCw,
  Maximize,
  Link,
  Unlink,
  Hexagon,
  Triangle,
  Star,
  Heart
} from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import '@xyflow/react/dist/style.css';

// Enhanced Custom Node Data Interface
interface ProfessionalNodeData {
  label: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'hexagon' | 'triangle' | 'star' | 'heart';
  color: string;
  textColor: string;
  borderColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderRadius: number;
  shadow: 'none' | 'small' | 'medium' | 'large';
  rotation: number;
  isEditing?: boolean;
  layer: number;
  icon?: string;
  gradient?: {
    enabled: boolean;
    startColor: string;
    endColor: string;
    direction: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-tr' | 'to-bl';
  };
}

// Professional Custom Node Component
const ProfessionalNode = ({ data, id }: { data: ProfessionalNodeData; id: string }) => {
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [label, setLabel] = useState(data.label);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('updateNode', {
        detail: { id, updates: { label } }
      }));
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel(data.label);
    }
  };

  const getShadowClass = () => {
    switch (data.shadow) {
      case 'small': return 'shadow-sm';
      case 'medium': return 'shadow-md';
      case 'large': return 'shadow-lg';
      default: return '';
    }
  };

  const getShapeStyle = () => {
    const baseStyle = {
      backgroundColor: data.gradient?.enabled 
        ? `linear-gradient(${data.gradient.direction}, ${data.gradient.startColor}, ${data.gradient.endColor})`
        : data.color,
      color: data.textColor,
      border: `${data.borderWidth}px ${data.borderStyle} ${data.borderColor}`,
      fontSize: `${data.fontSize}px`,
      fontWeight: data.fontWeight,
      fontStyle: data.fontStyle,
      textDecoration: data.textDecoration,
      textAlign: data.textAlign as 'left' | 'center' | 'right',
      borderRadius: `${data.borderRadius}px`,
      transform: `rotate(${data.rotation}deg)`,
      padding: '12px 20px',
      minWidth: '100px',
      minHeight: '40px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      zIndex: data.layer,
    };

    // Shape-specific adjustments
    const shapeAdjustments = {
      circle: {
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      diamond: {
        transform: `rotate(${45 + data.rotation}deg)`,
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      hexagon: {
        clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
        width: '120px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      triangle: {
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        width: '100px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      star: {
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        width: '100px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      heart: {
        position: 'relative' as const,
        width: '100px',
        height: '90px',
        transform: `rotate(${-45 + data.rotation}deg)`,
      },
      rectangle: {},
    };

    return { ...baseStyle, ...shapeAdjustments[data.shape] };
  };

  return (
    <div
      style={getShapeStyle()}
      onDoubleClick={handleDoubleClick}
      className={`hover:shadow-lg hover:scale-105 transition-all ${getShadowClass()}`}
    >
      {data.shape === 'heart' ? (
        <div className="heart-shape" style={{ color: data.textColor }}>
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
                color: data.textColor,
                fontSize: `${data.fontSize}px`,
                textAlign: 'center',
                width: '80px',
              }}
            />
          ) : (
            <span style={data.shape === 'diamond' ? { transform: 'rotate(-45deg)' } : {}}>
              {label}
            </span>
          )}
        </div>
      ) : (
        <>
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
                color: data.textColor,
                fontSize: `${data.fontSize}px`,
                textAlign: data.textAlign,
                width: '100%',
                fontWeight: data.fontWeight,
                fontStyle: data.fontStyle,
                textDecoration: data.textDecoration,
              }}
            />
          ) : (
            <span style={data.shape === 'diamond' ? { transform: 'rotate(-45deg)' } : {}}>
              {label}
            </span>
          )}
        </>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  professional: ProfessionalNode,
};

interface ProfessionalMindMapEditorProps {
  initialData?: {
    mermaid_code: string;
    node_data: Record<string, { node_name: string; sensa_insight: unknown }>;
  };
  onSave?: (data: unknown) => void;
  onClose?: () => void;
}

export const ProfessionalMindMapEditor: React.FC<ProfessionalMindMapEditorProps> = ({
  initialData,
  onSave,
  onClose,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Professional state management
  const [showAdvancedTools, setShowAdvancedTools] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<Node[]>([]);
  const [currentLayer, setCurrentLayer] = useState(1);
  
  // Advanced styling state
  const [nodeStyle, setNodeStyle] = useState<Partial<ProfessionalNodeData>>({
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: 8,
    shadow: 'none',
    rotation: 0,
    fontSize: 14,
    shape: 'rectangle',
    color: '#F3F4F6',
    textColor: '#111827',
    borderColor: '#D1D5DB',
    layer: 1,
  });

  // Professional color palette
  const colors = [
    '#6B46C1', '#F97316', '#F59E0B', '#EAB308', '#10B981',
    '#3B82F6', '#EF4444', '#8B5CF6', '#F472B6', '#06B6D4',
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#FFFFFF',
    '#FEF3C7', '#FECACA', '#DBEAFE', '#D1FAE5', '#E0E4FF',
    '#FEE2E2', '#FEF7FF', '#F0FDF4', '#FFFBEB', '#F8FAFC',
  ];

  // Professional shapes
  const shapes = [
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'circle', name: 'Circle', icon: Circle },
    { id: 'diamond', name: 'Diamond', icon: Diamond },
    { id: 'hexagon', name: 'Hexagon', icon: Hexagon },
    { id: 'triangle', name: 'Triangle', icon: Triangle },
    { id: 'star', name: 'Star', icon: Star },
    { id: 'heart', name: 'Heart', icon: Heart },
  ];

  const initialNodes: Node[] = [{
    id: '1',
    type: 'professional',
    position: { x: 400, y: 300 },
    data: {
      label: 'Central Topic',
      shape: 'circle',
      color: '#6B46C1',
      textColor: '#FFFFFF',
      borderColor: '#4C1D95',
      fontSize: 16,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      borderWidth: 3,
      borderStyle: 'solid',
      borderRadius: 50,
      shadow: 'medium',
      rotation: 0,
      layer: 1,
    } as ProfessionalNodeData,
  }];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Enhanced node operations
  const addNode = useCallback(() => {
    const newNodeId = `${nodes.length + 1}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'professional',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 200 },
      data: {
        ...nodeStyle,
        label: 'New Node',
        layer: currentLayer,
      } as ProfessionalNodeData,
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes, nodeStyle, currentLayer]);

  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode));
      setEdges((eds) => eds.filter((edge) => 
        edge.source !== selectedNode && edge.target !== selectedNode
      ));
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  const updateNodeStyle = useCallback((property: string, value: unknown) => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode
            ? { ...node, data: { ...node.data, [property]: value } }
            : node
        )
      );
    }
    // Also update the default style for new nodes
    setNodeStyle(prev => ({ ...prev, [property]: value }));
  }, [selectedNode, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#374151',
        },
        style: {
          stroke: '#374151',
          strokeWidth: 2,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
    // Update current style based on selected node
    setNodeStyle(node.data as Partial<ProfessionalNodeData>);
  }, []);

  // Export functions
  const exportToPNG = useCallback(async () => {
    if (reactFlowWrapper.current) {
      try {
        const pngData = await toPng(reactFlowWrapper.current, {
          backgroundColor: '#ffffff',
          width: 1600,
          height: 1200,
          pixelRatio: 2,
        });
        const link = document.createElement('a');
        link.href = pngData;
        link.download = 'professional-mindmap.png';
        link.click();
      } catch (error) {
        console.error('PNG export failed:', error);
      }
    }
  }, []);

  const exportToSVG = useCallback(async () => {
    if (reactFlowWrapper.current) {
      try {
        const svgData = await toSvg(reactFlowWrapper.current, {
          backgroundColor: '#ffffff',
          width: 1600,
          height: 1200,
        });
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'professional-mindmap.svg';
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('SVG export failed:', error);
      }
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Professional Mind Map Editor</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLayerPanel(!showLayerPanel)}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Layers"
              >
                <Layers size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Professional Toolbar */}
          <div className="px-4 py-3 bg-black bg-opacity-10">
            <div className="flex items-center gap-2 flex-wrap">
              {/* File Operations */}
              <div className="flex items-center gap-1 bg-white bg-opacity-10 rounded-lg px-3 py-1">
                <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded" title="Save">
                  <Save size={16} />
                </button>
                <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded" title="Open">
                  <FolderOpen size={16} />
                </button>
              </div>

              {/* Edit Operations */}
              <div className="flex items-center gap-1 bg-white bg-opacity-10 rounded-lg px-3 py-1">
                <button 
                  onClick={() => {
                    if (selectedNode) {
                      const node = nodes.find(n => n.id === selectedNode);
                      if (node) setClipboard([node]);
                    }
                  }}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded" 
                  title="Copy"
                >
                  <Copy size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (selectedNode) {
                      const node = nodes.find(n => n.id === selectedNode);
                      if (node) {
                        setClipboard([node]);
                        deleteNode();
                      }
                    }
                  }}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded" 
                  title="Cut"
                >
                  <Scissors size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (clipboard.length > 0) {
                      const pastedNode = {
                        ...clipboard[0],
                        id: `${nodes.length + 1}`,
                        position: { 
                          x: clipboard[0].position.x + 50, 
                          y: clipboard[0].position.y + 50 
                        }
                      };
                      setNodes(nds => [...nds, pastedNode]);
                    }
                  }}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded" 
                  title="Paste"
                >
                  <Clipboard size={16} />
                </button>
              </div>

              {/* Node Operations */}
              <div className="flex items-center gap-1 bg-white bg-opacity-10 rounded-lg px-3 py-1">
                <button onClick={addNode} className="p-1 hover:bg-white hover:bg-opacity-20 rounded" title="Add Node">
                  <Plus size={16} />
                </button>
                <button onClick={deleteNode} disabled={!selectedNode} className="p-1 hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-40" title="Delete Node">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Text Formatting */}
              <div className="flex items-center gap-1 bg-white bg-opacity-10 rounded-lg px-3 py-1">
                <button 
                  onClick={() => updateNodeStyle('fontWeight', nodeStyle.fontWeight === 'bold' ? 'normal' : 'bold')}
                  className={`p-1 rounded ${nodeStyle.fontWeight === 'bold' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'}`}
                  title="Bold"
                >
                  <Bold size={16} />
                </button>
                <button 
                  onClick={() => updateNodeStyle('fontStyle', nodeStyle.fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={`p-1 rounded ${nodeStyle.fontStyle === 'italic' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'}`}
                  title="Italic"
                >
                  <Italic size={16} />
                </button>
                <button 
                  onClick={() => updateNodeStyle('textDecoration', nodeStyle.textDecoration === 'underline' ? 'none' : 'underline')}
                  className={`p-1 rounded ${nodeStyle.textDecoration === 'underline' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'}`}
                  title="Underline"
                >
                  <Underline size={16} />
                </button>
              </div>

              {/* Alignment */}
              <div className="flex items-center gap-1 bg-white bg-opacity-10 rounded-lg px-3 py-1">
                <button onClick={() => updateNodeStyle('textAlign', 'left')} className={`p-1 rounded ${nodeStyle.textAlign === 'left' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'}`} title="Left">
                  <AlignLeft size={16} />
                </button>
                <button onClick={() => updateNodeStyle('textAlign', 'center')} className={`p-1 rounded ${nodeStyle.textAlign === 'center' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'}`} title="Center">
                  <AlignCenter size={16} />
                </button>
                <button onClick={() => updateNodeStyle('textAlign', 'right')} className={`p-1 rounded ${nodeStyle.textAlign === 'right' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'}`} title="Right">
                  <AlignRight size={16} />
                </button>
              </div>

              {/* Tools */}
              <div className="flex items-center gap-1 bg-white bg-opacity-10 rounded-lg px-3 py-1">
                <button onClick={() => setShowShapePicker(!showShapePicker)} className="p-1 hover:bg-white hover:bg-opacity-20 rounded" title="Shapes">
                  <Square size={16} />
                </button>
                <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-1 hover:bg-white hover:bg-opacity-20 rounded" title="Colors">
                  <Palette size={16} />
                </button>
              </div>

              {/* Export */}
              <div className="flex items-center gap-1 bg-white bg-opacity-10 rounded-lg px-3 py-1">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-1 hover:bg-white hover:bg-opacity-20 rounded" title="Export">
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex relative" style={{ height: 'calc(100vh - 200px)' }}>
          {/* ReactFlow Canvas */}
          <div ref={reactFlowWrapper} className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-50"
            >
              <MiniMap className="!bg-white !border-2 !border-gray-200" />
              <Controls className="!bg-white !border !border-gray-200" />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
              
              {/* Selection Info Panel */}
              {selectedNode && (
                <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border">
                  <h3 className="font-semibold mb-2">Node Properties</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="block font-medium">Font Size:</label>
                      <input
                        type="range"
                        min="10"
                        max="24"
                        value={nodeStyle.fontSize || 14}
                        onChange={(e) => updateNodeStyle('fontSize', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block font-medium">Border Width:</label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={nodeStyle.borderWidth || 2}
                        onChange={(e) => updateNodeStyle('borderWidth', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block font-medium">Border Radius:</label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={nodeStyle.borderRadius || 8}
                        onChange={(e) => updateNodeStyle('borderRadius', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>

          {/* Side Panels */}
          <AnimatePresence>
            {/* Color Picker Panel */}
            {showColorPicker && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto"
              >
                <h3 className="text-lg font-semibold mb-4">Colors</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Background</label>
                    <div className="grid grid-cols-5 gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateNodeStyle('color', color)}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Text Color</label>
                    <div className="grid grid-cols-5 gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateNodeStyle('textColor', color)}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Border Color</label>
                    <div className="grid grid-cols-5 gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateNodeStyle('borderColor', color)}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Shape Picker Panel */}
            {showShapePicker && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-80 bg-white border-l border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Shapes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {shapes.map((shape) => {
                    const IconComponent = shape.icon;
                    return (
                      <button
                        key={shape.id}
                        onClick={() => updateNodeStyle('shape', shape.id)}
                        className={`p-4 border-2 rounded-lg hover:border-blue-500 transition-colors ${
                          nodeStyle.shape === shape.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <IconComponent size={24} className="mx-auto mb-2" />
                        <span className="text-sm font-medium">{shape.name}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Export Menu Panel */}
            {showExportMenu && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-80 bg-white border-l border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Export Options</h3>
                <div className="space-y-3">
                  <button
                    onClick={exportToPNG}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Image size={18} />
                    Export as PNG
                  </button>
                  <button
                    onClick={exportToSVG}
                    className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Code size={18} />
                    Export as SVG
                  </button>
                  <button
                    onClick={() => {
                      const data = { nodes, edges };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'mindmap-data.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={18} />
                    Export as JSON
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Custom CSS for heart shape */}
      <style jsx>{`
        .heart-shape::before {
          content: '';
          width: 52px;
          height: 40px;
          position: absolute;
          left: 50px;
          top: 0;
          background: currentColor;
          border-radius: 25px 25px 0 0;
          transform: rotate(-45deg);
          transform-origin: 0 100%;
        }
        .heart-shape::after {
          content: '';
          width: 52px;
          height: 40px;
          position: absolute;
          left: 50px;
          top: 0;
          background: currentColor;
          border-radius: 25px 25px 0 0;
          transform: rotate(45deg);
          transform-origin: 100% 100%;
        }
      `}</style>
    </div>
  );
}; 