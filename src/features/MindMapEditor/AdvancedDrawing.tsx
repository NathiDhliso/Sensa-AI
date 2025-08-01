// Phase 3: Rich Media & Advanced Collaboration - Advanced Drawing Tools
// Freehand drawing and sketching capabilities for collaborative mindmaps

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pen, Eraser, Palette, Square, Circle, ArrowRight, Type,
  Undo, Redo, Trash2, Download, Upload, Eye, EyeOff,
  Minus, Plus, RotateCcw, Move, MousePointer, Highlighter,
  Triangle, Star, Heart, Hexagon, X, Save, Settings
} from 'lucide-react';
import { useCollaborationStore } from '../../stores/collaborationStore';

interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
}

interface DrawingStroke {
  id: string;
  tool: DrawingTool;
  points: DrawingPoint[];
  color: string;
  size: number;
  opacity: number;
  timestamp: number;
  userId: string;
}

interface DrawingShape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'star' | 'heart' | 'hexagon';
  startPoint: DrawingPoint;
  endPoint: DrawingPoint;
  color: string;
  strokeWidth: number;
  fillColor?: string;
  opacity: number;
  timestamp: number;
  userId: string;
}

interface DrawingText {
  id: string;
  text: string;
  position: DrawingPoint;
  fontSize: number;
  color: string;
  fontFamily: string;
  timestamp: number;
  userId: string;
}

type DrawingTool = 'pen' | 'eraser' | 'highlighter' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'text' | 'select' | 'move';

interface AdvancedDrawingProps {
  width?: number;
  height?: number;
  onSave?: (drawingData: DrawingData) => void;
  onClose?: () => void;
  initialData?: DrawingData;
}

interface DrawingData {
  strokes: DrawingStroke[];
  shapes: DrawingShape[];
  texts: DrawingText[];
  background: string;
}

export const AdvancedDrawing: React.FC<AdvancedDrawingProps> = ({
  width = 800,
  height = 600,
  onSave,
  onClose,
  initialData
}) => {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState(3);
  const [currentOpacity, setCurrentOpacity] = useState(1);
  const [fillColor, setFillColor] = useState('#ffffff');
  
  // Drawing data
  const [strokes, setStrokes] = useState<DrawingStroke[]>(initialData?.strokes || []);
  const [shapes, setShapes] = useState<DrawingShape[]>(initialData?.shapes || []);
  const [texts, setTexts] = useState<DrawingText[]>(initialData?.texts || []);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [currentShape, setCurrentShape] = useState<{ start: DrawingPoint; end: DrawingPoint } | null>(null);
  
  // History for undo/redo
  const [history, setHistory] = useState<DrawingData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // UI state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showToolSettings, setShowToolSettings] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<DrawingPoint | null>(null);
  
  // Text input state
  const [textInput, setTextInput] = useState<{ position: DrawingPoint; text: string } | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  
  // Collaboration
  const { currentUser, addOperation } = useCollaborationStore();
  
  // Color palette
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];
  
  // Tools configuration
  const tools = [
    { id: 'select', icon: MousePointer, name: 'Select' },
    { id: 'pen', icon: Pen, name: 'Pen' },
    { id: 'highlighter', icon: Highlighter, name: 'Highlighter' },
    { id: 'eraser', icon: Eraser, name: 'Eraser' },
    { id: 'rectangle', icon: Square, name: 'Rectangle' },
    { id: 'circle', icon: Circle, name: 'Circle' },
    { id: 'triangle', icon: Triangle, name: 'Triangle' },
    { id: 'arrow', icon: ArrowRight, name: 'Arrow' },
    { id: 'text', icon: Type, name: 'Text' },
    { id: 'move', icon: Move, name: 'Move' }
  ];
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    
    if (canvas && overlayCanvas) {
      const ctx = canvas.getContext('2d');
      const overlayCtx = overlayCanvas.getContext('2d');
      
      if (ctx && overlayCtx) {
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        overlayCanvas.width = width;
        overlayCanvas.height = height;
        
        // Set initial background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Redraw existing content
        redrawCanvas();
      }
    }
  }, [width, height]);
  
  // Redraw canvas with all strokes, shapes, and texts
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.globalAlpha = stroke.opacity;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });
    
    // Draw all shapes
    shapes.forEach(shape => {
      ctx.globalAlpha = shape.opacity;
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.globalCompositeOperation = 'source-over';
      
      const startX = shape.startPoint.x;
      const startY = shape.startPoint.y;
      const endX = shape.endPoint.x;
      const endY = shape.endPoint.y;
      const width = endX - startX;
      const height = endY - startY;
      
      if (shape.fillColor) {
        ctx.fillStyle = shape.fillColor;
      }
      
      switch (shape.type) {
        case 'rectangle':
          if (shape.fillColor) ctx.fillRect(startX, startY, width, height);
          ctx.strokeRect(startX, startY, width, height);
          break;
          
        case 'circle':
          const radius = Math.sqrt(width * width + height * height) / 2;
          const centerX = startX + width / 2;
          const centerY = startY + height / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          if (shape.fillColor) ctx.fill();
          ctx.stroke();
          break;
          
        case 'arrow':
          drawArrow(ctx, startX, startY, endX, endY);
          break;
          
        // Add more shapes as needed
      }
    });
    
    // Draw all texts
    texts.forEach(text => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = text.color;
      ctx.font = `${text.fontSize}px ${text.fontFamily}`;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillText(text.text, text.position.x, text.position.y);
    });
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [strokes, shapes, texts, width, height]);
  
  // Draw arrow helper function
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 20;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };
  
  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom - pan.x,
      y: (e.clientY - rect.top) / zoom - pan.y
    };
  }, [zoom, pan]);
  
  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    if (currentTool === 'move') {
      setIsPanning(true);
      setLastPanPoint(pos);
      return;
    }
    
    if (currentTool === 'text') {
      setTextInput({ position: pos, text: '' });
      return;
    }
    
    setIsDrawing(true);
    
    if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
      setCurrentStroke([pos]);
    } else if (['rectangle', 'circle', 'triangle', 'arrow'].includes(currentTool)) {
      setCurrentShape({ start: pos, end: pos });
    }
  }, [currentTool, getMousePos]);
  
  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    if (isPanning && lastPanPoint) {
      setPan(prev => ({
        x: prev.x + (pos.x - lastPanPoint.x),
        y: prev.y + (pos.y - lastPanPoint.y)
      }));
      setLastPanPoint(pos);
      return;
    }
    
    if (!isDrawing) return;
    
    if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
      setCurrentStroke(prev => [...prev, pos]);
      
      // Draw current stroke on overlay canvas
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const ctx = overlayCanvas.getContext('2d');
        if (ctx && currentStroke.length > 0) {
          ctx.clearRect(0, 0, width, height);
          
          ctx.globalAlpha = currentOpacity;
          ctx.strokeStyle = currentColor;
          ctx.lineWidth = currentSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          if (currentTool === 'highlighter') {
            ctx.globalCompositeOperation = 'multiply';
          } else if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
          } else {
            ctx.globalCompositeOperation = 'source-over';
          }
          
          ctx.beginPath();
          ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
          
          for (let i = 1; i < currentStroke.length; i++) {
            ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
          }
          ctx.lineTo(pos.x, pos.y);
          
          ctx.stroke();
        }
      }
    } else if (currentShape) {
      setCurrentShape(prev => prev ? { ...prev, end: pos } : null);
      
      // Draw current shape on overlay canvas
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const ctx = overlayCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          
          ctx.globalAlpha = currentOpacity;
          ctx.strokeStyle = currentColor;
          ctx.lineWidth = currentSize;
          ctx.globalCompositeOperation = 'source-over';
          
          const startX = currentShape.start.x;
          const startY = currentShape.start.y;
          const endX = pos.x;
          const endY = pos.y;
          const shapeWidth = endX - startX;
          const shapeHeight = endY - startY;
          
          switch (currentTool) {
            case 'rectangle':
              ctx.strokeRect(startX, startY, shapeWidth, shapeHeight);
              break;
              
            case 'circle':
              const radius = Math.sqrt(shapeWidth * shapeWidth + shapeHeight * shapeHeight) / 2;
              const centerX = startX + shapeWidth / 2;
              const centerY = startY + shapeHeight / 2;
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.stroke();
              break;
              
            case 'arrow':
              drawArrow(ctx, startX, startY, endX, endY);
              break;
          }
        }
      }
    }
  }, [isDrawing, isPanning, lastPanPoint, currentTool, currentStroke, currentShape, currentColor, currentSize, currentOpacity, getMousePos, width, height]);
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanPoint(null);
      return;
    }
    
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    // Save current stroke or shape
    if (currentStroke.length > 1 && (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser')) {
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        tool: currentTool,
        points: currentStroke,
        color: currentColor,
        size: currentSize,
        opacity: currentOpacity,
        timestamp: Date.now(),
        userId: currentUser?.id || 'anonymous'
      };
      
      setStrokes(prev => [...prev, newStroke]);
      
      // Send collaboration event
      addOperation({
        operation_type: 'add_drawing_stroke',
        operation_data: newStroke,
        applied: false
      });
    } else if (currentShape && ['rectangle', 'circle', 'triangle', 'arrow'].includes(currentTool)) {
      const newShape: DrawingShape = {
        id: `shape-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        type: currentTool as 'rectangle' | 'circle' | 'triangle' | 'arrow',
        startPoint: currentShape.start,
        endPoint: currentShape.end,
        color: currentColor,
        strokeWidth: currentSize,
        fillColor: fillColor !== '#ffffff' ? fillColor : undefined,
        opacity: currentOpacity,
        timestamp: Date.now(),
        userId: currentUser?.id || 'anonymous'
      };
      
      setShapes(prev => [...prev, newShape]);
      
      // Send collaboration event
      addOperation({
        operation_type: 'add_drawing_shape',
        operation_data: newShape,
        applied: false
      });
    }
    
    // Clear overlay canvas
    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const ctx = overlayCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    }
    
    setCurrentStroke([]);
    setCurrentShape(null);
    
    // Save to history
    saveToHistory();
  }, [isDrawing, isPanning, currentStroke, currentShape, currentTool, currentColor, currentSize, currentOpacity, fillColor, currentUser, addOperation, width, height]);
  
  // Save current state to history
  const saveToHistory = useCallback(() => {
    const currentState: DrawingData = {
      strokes,
      shapes,
      texts,
      background: '#ffffff'
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      return newHistory.slice(-50); // Keep last 50 states
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [strokes, shapes, texts, historyIndex]);
  
  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setStrokes(previousState.strokes);
      setShapes(previousState.shapes);
      setTexts(previousState.texts);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);
  
  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setStrokes(nextState.strokes);
      setShapes(nextState.shapes);
      setTexts(nextState.texts);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);
  
  // Clear canvas
  const clearCanvas = useCallback(() => {
    setStrokes([]);
    setShapes([]);
    setTexts([]);
    saveToHistory();
  }, [saveToHistory]);
  
  // Handle text input
  const handleTextSubmit = useCallback(() => {
    if (textInput && textInput.text.trim()) {
      const newText: DrawingText = {
        id: `text-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        text: textInput.text,
        position: textInput.position,
        fontSize,
        color: currentColor,
        fontFamily,
        timestamp: Date.now(),
        userId: currentUser?.id || 'anonymous'
      };
      
      setTexts(prev => [...prev, newText]);
      
      // Send collaboration event
      addOperation({
        operation_type: 'add_drawing_text',
        operation_data: newText,
        applied: false
      });
      
      saveToHistory();
    }
    
    setTextInput(null);
  }, [textInput, fontSize, currentColor, fontFamily, currentUser, addOperation, saveToHistory]);
  
  // Save drawing
  const saveDrawing = useCallback(() => {
    const drawingData: DrawingData = {
      strokes,
      shapes,
      texts,
      background: '#ffffff'
    };
    
    onSave?.(drawingData);
  }, [strokes, shapes, texts, onSave]);
  
  // Export as image
  const exportAsImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `drawing-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  }, []);
  
  // Redraw when data changes
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Pen className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Advanced Drawing</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={saveDrawing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          {/* Tools */}
          <div className="flex items-center gap-2">
            {tools.map(tool => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setCurrentTool(tool.id as DrawingTool)}
                  className={`p-2 rounded-lg transition-colors ${
                    currentTool === tool.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={tool.name}
                >
                  <IconComponent className="w-5 h-5" />
                </button>
              );
            })}
          </div>
          
          {/* Color picker */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Color:</span>
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-8 h-8 rounded border-2 border-gray-300"
                  style={{ backgroundColor: currentColor }}
                />
                
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute top-10 left-0 bg-white rounded-lg shadow-lg border p-3 z-10"
                    >
                      <div className="grid grid-cols-8 gap-1 mb-3">
                        {colors.map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              setCurrentColor(color);
                              setShowColorPicker(false);
                            }}
                            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                        className="w-full h-8 rounded border"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Size slider */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Size:</span>
              <input
                type="range"
                min="1"
                max="50"
                value={currentSize}
                onChange={(e) => setCurrentSize(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-500 w-8">{currentSize}</span>
            </div>
            
            {/* Opacity slider */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Opacity:</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={currentOpacity}
                onChange={(e) => setCurrentOpacity(parseFloat(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-500 w-8">{Math.round(currentOpacity * 100)}%</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Undo"
            >
              <Undo className="w-5 h-5" />
            </button>
            
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Redo"
            >
              <Redo className="w-5 h-5" />
            </button>
            
            <button
              onClick={clearCanvas}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear All"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={exportAsImage}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export as Image"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center bg-gray-100"
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'center'
            }}
          >
            <div className="relative border border-gray-300 bg-white shadow-lg">
              <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="absolute inset-0"
              />
              <canvas
                ref={overlayCanvasRef}
                width={width}
                height={height}
                className="absolute inset-0 cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>
          
          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
              className="p-2 bg-white rounded-lg shadow border hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-sm text-center bg-white px-2 py-1 rounded shadow border">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.1))}
              className="p-2 bg-white rounded-lg shadow border hover:bg-gray-50 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-2 bg-white rounded-lg shadow border hover:bg-gray-50 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Text input modal */}
        <AnimatePresence>
          {textInput && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold mb-4">Add Text</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Text</label>
                    <textarea
                      value={textInput.text}
                      onChange={(e) => setTextInput(prev => prev ? { ...prev, text: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter your text..."
                      autoFocus
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Font Size</label>
                      <input
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="8"
                        max="72"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Font Family</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setTextInput(null)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTextSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Text
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AdvancedDrawing;