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
  useReactFlow,
  ConnectionMode,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Palette, Square, Circle, Diamond, Trash2, Plus, RotateCcw, FileText, Image, Code, X,
  Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut, Move,
  Layers, Settings, Save, FolderOpen, Copy, Scissors, Clipboard, RotateCw, Maximize, Link,
  Search, Eye, EyeOff, Grid, List, MousePointer, Pen, Eraser, Highlighter, Focus,
  ChevronDown, ChevronRight, Share2, Users, MessageCircle, Tag, Upload, History
} from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import { MermaidParser, MermaidGenerator } from './MermaidParser';
import SimpleAdvancedNode, { SimpleAdvancedNodeData as AdvancedNodeData } from './SimpleAdvancedNode';
import '@xyflow/react/dist/style.css';

// Register node types
const nodeTypes = {
  advanced: SimpleAdvancedNode,
};

// History System
interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

// Search Result
interface SearchResult {
  nodeId: string;
  label: string;
  matches: number;
}

// Comprehensive Mind Map Editor Component
export const ComprehensiveMindMapEditor: React.FC<{
  initialData?: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}> = ({ initialData, onSave, onClose }) => {
  
  // Core States
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, zoomIn, zoomOut, setCenter, getZoom } = useReactFlow();
  
  // History System
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // UI States
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentTool, setCurrentTool] = useState<'select' | 'pen' | 'highlighter' | 'eraser'>('select');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  
  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  // Styling Panel
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [nodeStyle, setNodeStyle] = useState<Partial<AdvancedNodeData>>({
    shape: 'rectangle',
    color: '#6B46C1',
    textColor: '#FFFFFF',
    borderColor: '#4C1D95',
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: 8,
    shadow: 'medium',
    rotation: 0,
  });
  
  // Edge Styling
  const [edgeStyle, setEdgeStyle] = useState({
    stroke: '#374151',
    strokeWidth: 2,
    strokeDasharray: 'none',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#374151' },
  });
  
  // Templates
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPaths, setDrawingPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  
  // Save to History
  const saveToHistory = useCallback(() => {
    const state: HistoryState = {
      nodes: [...nodes],
      edges: [...edges],
      timestamp: Date.now(),
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);
  
  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);
  
  // Node Operations
  const addNode = useCallback((position?: { x: number; y: number }) => {
    console.log('Add node clicked!');
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: position || { x: Math.random() * 400 + 200, y: Math.random() * 300 + 200 },
      data: {
        label: 'New Node',
      },
    };
    
    console.log('Creating node:', newNode);
    setNodes((nds) => {
      console.log('Current nodes:', nds.length);
      const newNodes = [...nds, newNode];
      console.log('New nodes count:', newNodes.length);
      return newNodes;
    });
    saveToHistory();
  }, [setNodes, saveToHistory]);
  
  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode));
      setEdges((eds) => eds.filter((edge) => 
        edge.source !== selectedNode && edge.target !== selectedNode
      ));
      setSelectedNode(null);
      saveToHistory();
    }
  }, [selectedNode, setNodes, setEdges, saveToHistory]);
  
  const duplicateNode = useCallback(() => {
    if (selectedNode) {
      const nodeToClone = nodes.find(n => n.id === selectedNode);
      if (nodeToClone) {
        const newNode: Node = {
          ...nodeToClone,
          id: `node-${Date.now()}`,
          position: {
            x: nodeToClone.position.x + 50,
            y: nodeToClone.position.y + 50,
          },
        };
        setNodes((nds) => [...nds, newNode]);
        saveToHistory();
      }
    }
  }, [selectedNode, nodes, setNodes, saveToHistory]);
  
  // Edge Operations
  const onConnect = useCallback((params: Connection) => {
    const newEdge: Edge = {
      ...params,
      id: `edge-${Date.now()}`,
      style: edgeStyle,
      markerEnd: edgeStyle.markerEnd,
    };
    setEdges((eds) => addEdge(newEdge, eds));
    saveToHistory();
  }, [edgeStyle, setEdges, saveToHistory]);
  
  // Search Function
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results: SearchResult[] = [];
    nodes.forEach(node => {
      const label = node.data.label.toLowerCase();
      const searchTerm = query.toLowerCase();
      
      if (label.includes(searchTerm)) {
        const matches = (label.match(new RegExp(searchTerm, 'g')) || []).length;
        results.push({
          nodeId: node.id,
          label: node.data.label,
          matches,
        });
      }
    });
    
    setSearchResults(results.sort((a, b) => b.matches - a.matches));
  }, [nodes]);
  
  // Navigate to Search Result
  const navigateToNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 800 });
      setSelectedNode(nodeId);
    }
  }, [nodes, setCenter]);
  
  // Auto Layout
  const autoLayout = useCallback(() => {
    // Simple radial layout algorithm
    const centerNode = nodes.find(n => n.data.label.toLowerCase().includes('root') || 
                                      n.data.label.toLowerCase().includes('center')) || nodes[0];
    
    if (!centerNode) return;
    
    const updatedNodes = nodes.map((node, index) => {
      if (node.id === centerNode.id) {
        return { ...node, position: { x: 400, y: 300 } };
      }
      
      const angle = (index * 2 * Math.PI) / (nodes.length - 1);
      const radius = 200;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      
      return { ...node, position: { x, y } };
    });
    
    setNodes(updatedNodes);
    saveToHistory();
  }, [nodes, setNodes, saveToHistory]);
  
  // Export Functions
  const exportToPNG = useCallback(async () => {
    if (!canvasRef.current) return;
    
    try {
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = 'mindmap.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('PNG export failed:', error);
    }
  }, []);
  
  const exportToSVG = useCallback(async () => {
    if (!canvasRef.current) return;
    
    try {
      const svgData = await toSvg(canvasRef.current);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'mindmap.svg';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('SVG export failed:', error);
    }
  }, []);

  // Mermaid Integration
  const mermaidParser = new MermaidParser();
  const mermaidGenerator = new MermaidGenerator();
  
  const importFromMermaid = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mmd,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const mermaidCode = event.target?.result as string;
        try {
          const { nodes: parsedNodes, edges: parsedEdges } = mermaidParser.parseMermaidMindmap(mermaidCode);
          setNodes(parsedNodes);
          setEdges(parsedEdges);
          saveToHistory();
        } catch (error) {
          console.error('Failed to parse Mermaid:', error);
          alert('Failed to parse Mermaid file. Please check the syntax.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [mermaidParser, setNodes, setEdges, saveToHistory]);
  
  const exportToMermaid = useCallback(() => {
    try {
      const mermaidCode = mermaidGenerator.generateMermaidMindmap(nodes, edges);
      const blob = new Blob([mermaidCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'mindmap.mmd';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Mermaid export failed:', error);
    }
  }, [nodes, edges, mermaidGenerator]);
  
  const loadMermaidFromText = useCallback((mermaidText: string) => {
    try {
      const { nodes: parsedNodes, edges: parsedEdges } = mermaidParser.parseMermaidMindmap(mermaidText);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
      saveToHistory();
    } catch (error) {
      console.error('Failed to parse Mermaid text:', error);
      throw error;
    }
  }, [mermaidParser, setNodes, setEdges, saveToHistory]);
  
  // Drawing Functions
  const startDrawing = useCallback((e: React.MouseEvent) => {
    if (currentTool !== 'pen') return;
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPath(`M${x},${y}`);
    }
  }, [currentTool]);
  
  const continueDrawing = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || currentTool !== 'pen') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPath(prev => `${prev} L${x},${y}`);
    }
  }, [isDrawing, currentTool]);
  
  const endDrawing = useCallback(() => {
    if (isDrawing && currentPath) {
      setDrawingPaths(prev => [...prev, currentPath]);
      setCurrentPath('');
    }
    setIsDrawing(false);
  }, [isDrawing, currentPath]);
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'c':
            if (selectedNode) {
              e.preventDefault();
              // Copy functionality
            }
            break;
          case 'v':
            e.preventDefault();
            // Paste functionality
            break;
          case 'f':
            e.preventDefault();
            setShowSearch(true);
            break;
          case 's':
            e.preventDefault();
            onSave?.({ nodes, edges });
            break;
        }
      } else {
        switch (e.key) {
          case 'Delete':
            if (selectedNode) {
              deleteNode();
            }
            break;
          case 'Tab':
            e.preventDefault();
            addNode();
            break;
          case 'Escape':
            setSelectedNode(null);
            setFocusMode(false);
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, undo, redo, deleteNode, addNode, onSave, nodes, edges]);
  
  // Initialize with sample data
  useEffect(() => {
    if (nodes.length === 0) {
      const initialNodes = [
        {
          id: '1',
          type: 'default',
          position: { x: 400, y: 300 },
          data: {
            label: 'Central Topic'
          },
        },
      ];
      setNodes(initialNodes);
    }
  }, [nodes.length, setNodes]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header Toolbar */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 flex items-center justify-between relative z-50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">Comprehensive Mind Map Editor</h2>
            
            {/* Core Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addNode();
                }}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                title="Add Node (Tab)"
              >
                <Plus className="w-4 h-4" />
              </button>
              
              <button
                onClick={deleteNode}
                disabled={!selectedNode}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors disabled:opacity-50"
                title="Delete Node (Del)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="w-px h-6 bg-white bg-opacity-30" />
              
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors disabled:opacity-50"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors disabled:opacity-50"
                title="Redo (Ctrl+Shift+Z)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Right Side Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Search (Ctrl+F)"
            >
              <Search className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowStylePanel(!showStylePanel)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Style Panel"
            >
              <Palette className="w-4 h-4" />
            </button>
            
            {/* Export Dropdown */}
            <div className="relative group">
              <button
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                title="Export Options"
              >
                <Download className="w-4 h-4" />
              </button>
              
              {/* Export Menu */}
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-2 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={exportToPNG}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <Image className="w-4 h-4" />
                  Export as PNG
                </button>
                <button
                  onClick={exportToSVG}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export as SVG
                </button>
                <button
                  onClick={exportToMermaid}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  Export as Mermaid
                </button>
              </div>
            </div>
            
            {/* Import Mermaid */}
            <button
              onClick={importFromMermaid}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Import Mermaid File"
            >
              <Upload className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Side Panel */}
          <AnimatePresence>
            {showStylePanel && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 300 }}
                exit={{ width: 0 }}
                className="bg-gray-50 border-r overflow-y-auto relative z-40"
              >
                <div className="p-4">
                  <h3 className="font-semibold mb-4">Style Panel</h3>
                  
                  {/* Node Shapes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Shape</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['rectangle', 'circle', 'diamond'].map((shape) => (
                        <button
                          key={shape}
                          onClick={() => setNodeStyle(prev => ({ ...prev, shape: shape as any }))}
                          className={`p-3 border rounded-lg hover:bg-gray-100 ${
                            nodeStyle.shape === shape ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                          }`}
                        >
                          {shape === 'rectangle' && <Square className="w-5 h-5 mx-auto" />}
                          {shape === 'circle' && <Circle className="w-5 h-5 mx-auto" />}
                          {shape === 'diamond' && <Diamond className="w-5 h-5 mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Colors */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Background Color</label>
                    <div className="grid grid-cols-5 gap-2">
                      {['#6B46C1', '#F97316', '#EF4444', '#10B981', '#3B82F6', 
                        '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16'].map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            console.log('Color clicked:', color);
                            setNodeStyle(prev => ({ ...prev, color }));
                            
                            // Apply color to selected node immediately
                            if (selectedNode) {
                              setNodes(nds => nds.map(node => 
                                node.id === selectedNode 
                                  ? { ...node, style: { ...node.style, backgroundColor: color } }
                                  : node
                              ));
                            }
                          }}
                          className={`w-8 h-8 rounded border-2 ${
                            nodeStyle.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Font Size */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Font Size</label>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      value={nodeStyle.fontSize || 14}
                      onChange={(e) => {
                        const fontSize = parseInt(e.target.value);
                        setNodeStyle(prev => ({ ...prev, fontSize }));
                        
                        // Apply font size to selected node immediately
                        if (selectedNode) {
                          setNodes(nds => nds.map(node => 
                            node.id === selectedNode 
                              ? { ...node, style: { ...node.style, fontSize: `${fontSize}px` } }
                              : node
                          ));
                        }
                      }}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600 mt-1">{nodeStyle.fontSize || 14}px</div>
                  </div>
                  
                  {/* Font Weight */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Font Weight</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNodeStyle(prev => ({ ...prev, fontWeight: 'normal' }))}
                        className={`px-3 py-1 border rounded ${
                          nodeStyle.fontWeight === 'normal' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        onClick={() => setNodeStyle(prev => ({ ...prev, fontWeight: 'bold' }))}
                        className={`px-3 py-1 border rounded font-bold ${
                          nodeStyle.fontWeight === 'bold' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        Bold
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Canvas */}
          <div 
            className="flex-1 relative" 
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={continueDrawing}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
          >
            {/* Drawing Overlay */}
            {(currentTool === 'pen' || drawingPaths.length > 0) && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-30"
                style={{ pointerEvents: currentTool === 'pen' ? 'auto' : 'none' }}
              >
                {/* Existing paths */}
                {drawingPaths.map((path, index) => (
                  <path
                    key={index}
                    d={path}
                    stroke="#000"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {/* Current drawing path */}
                {currentPath && (
                  <path
                    d={currentPath}
                    stroke="#000"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            )}
            
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              connectionMode={ConnectionMode.Loose}
              fitView
              className="bg-gray-50"
              nodesDraggable={currentTool === 'select'}
              nodesConnectable={true}
              elementsSelectable={true}
              selectNodesOnDrag={false}
              panOnDrag={currentTool === 'select'}
              zoomOnDoubleClick={false}
              onPaneClick={() => setSelectedNode(null)}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              
              {showMiniMap && (
                <MiniMap
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                  zoomable
                  pannable
                />
              )}
              
              <Controls showZoom showFitView showInteractive />
              
              {/* Custom Panels */}
              <Panel position="top-left">
                <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
                  <button
                    onClick={() => setCurrentTool('select')}
                    className={`p-2 rounded ${currentTool === 'select' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Select Tool"
                  >
                    <MousePointer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentTool('pen')}
                    className={`p-2 rounded ${currentTool === 'pen' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Draw Tool"
                  >
                    <Pen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentTool('highlighter')}
                    className={`p-2 rounded ${currentTool === 'highlighter' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Highlighter"
                  >
                    <Highlighter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentTool('eraser')}
                    className={`p-2 rounded ${currentTool === 'eraser' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Eraser"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>
              </Panel>
              
              <Panel position="bottom-right">
                <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
                  <button
                    onClick={() => setShowMiniMap(!showMiniMap)}
                    className={`p-2 rounded ${showMiniMap ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Toggle Minimap"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={autoLayout}
                    className="p-2 rounded hover:bg-gray-100"
                    title="Auto Layout"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fitView()}
                    className="p-2 rounded hover:bg-gray-100"
                    title="Fit to View"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </Panel>
            </ReactFlow>
            
            {/* Search Overlay */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 min-w-80 z-10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search nodes..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        performSearch(e.target.value);
                      }}
                      className="flex-1 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => setShowSearch(false)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.nodeId}
                          onClick={() => navigateToNode(result.nodeId)}
                          className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center justify-between"
                        >
                          <span>{result.label}</span>
                          <span className="text-xs text-gray-500">{result.matches} matches</span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveMindMapEditor; 