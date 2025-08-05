import React, { useRef, useEffect, useCallback, useState } from 'react';

interface DrawingPoint {
  x: number;
  y: number;
}

interface DrawingStroke {
  points: DrawingPoint[];
  color: string;
  size: number;
  opacity: number;
  tool: 'pen' | 'highlighter' | 'eraser';
}

interface DrawingShape {
  type: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line';
  startPoint: DrawingPoint;
  endPoint: DrawingPoint;
  color: string;
  strokeWidth: number;
  opacity: number;
  fillColor?: string;
}

interface DrawingText {
  text: string;
  position: DrawingPoint;
  color: string;
  fontSize: number;
  fontFamily: string;
}

interface DrawingOverlayProps {
  isActive: boolean;
  currentTool: 'select' | 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'text';
  color: string;
  size: number;
  onDrawingChange?: (data: { strokes: DrawingStroke[]; shapes: DrawingShape[]; texts: DrawingText[] }) => void;
}

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({
  isActive,
  currentTool,
  color,
  size,
  onDrawingChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [currentShape, setCurrentShape] = useState<{ start: DrawingPoint; end: DrawingPoint } | null>(null);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [shapes, setShapes] = useState<DrawingShape[]>([]);
  const [texts, setTexts] = useState<DrawingText[]>([]);
  const [textInput, setTextInput] = useState<{ position: DrawingPoint; text: string } | null>(null);

  // Get canvas dimensions
  const getCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { width: 0, height: 0 };
    return { width: canvas.offsetWidth, height: canvas.offsetHeight };
  }, []);

  // Update canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      const { width, height } = getCanvasDimensions();
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = width;
        overlayCanvasRef.current.height = height;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [getCanvasDimensions]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getCanvasDimensions();
    ctx.clearRect(0, 0, width, height);

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

        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(startX + width / 2, startY);
          ctx.lineTo(startX, endY);
          ctx.lineTo(endX, endY);
          ctx.closePath();
          if (shape.fillColor) ctx.fill();
          ctx.stroke();
          break;
          
        case 'arrow':
          drawArrow(ctx, startX, startY, endX, endY);
          break;

        case 'line':
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          break;
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
  }, [strokes, shapes, texts, getCanvasDimensions]);

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
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive || currentTool === 'select') return;
    
    const pos = getMousePos(e);
    
    if (currentTool === 'text') {
      setTextInput({ position: pos, text: '' });
      return;
    }
    
    setIsDrawing(true);
    
    if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
      setCurrentStroke([pos]);
    } else if (['rectangle', 'circle', 'triangle', 'arrow', 'line'].includes(currentTool)) {
      setCurrentShape({ start: pos, end: pos });
    }
  }, [currentTool, getMousePos, isActive]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive || !isDrawing || currentTool === 'select') return;
    
    const pos = getMousePos(e);
    
    if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
      setCurrentStroke(prev => [...prev, pos]);
      
      // Draw current stroke on overlay canvas
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const ctx = overlayCanvas.getContext('2d');
        if (ctx && currentStroke.length > 0) {
          const { width, height } = getCanvasDimensions();
          ctx.clearRect(0, 0, width, height);
          
          ctx.globalAlpha = 0.8;
          ctx.strokeStyle = color;
          ctx.lineWidth = size;
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
          const { width, height } = getCanvasDimensions();
          ctx.clearRect(0, 0, width, height);
          
          ctx.globalAlpha = 0.8;
          ctx.strokeStyle = color;
          ctx.lineWidth = size;
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

            case 'triangle':
              ctx.beginPath();
              ctx.moveTo(startX + shapeWidth / 2, startY);
              ctx.lineTo(startX, endY);
              ctx.lineTo(endX, endY);
              ctx.closePath();
              ctx.stroke();
              break;
              
            case 'arrow':
              drawArrow(ctx, startX, startY, endX, endY);
              break;

            case 'line':
              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.lineTo(endX, endY);
              ctx.stroke();
              break;
          }
        }
      }
    }
  }, [isActive, isDrawing, currentTool, getMousePos, currentStroke, currentShape, color, size, getCanvasDimensions]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!isActive || !isDrawing || currentTool === 'select') return;
    
    setIsDrawing(false);
    
    // Clear overlay canvas
    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const ctx = overlayCanvas.getContext('2d');
      if (ctx) {
        const { width, height } = getCanvasDimensions();
        ctx.clearRect(0, 0, width, height);
      }
    }
    
    if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
      if (currentStroke.length > 1) {
        const newStroke: DrawingStroke = {
          points: currentStroke,
          color,
          size,
          opacity: 0.8,
          tool: currentTool
        };
        setStrokes(prev => [...prev, newStroke]);
      }
      setCurrentStroke([]);
    } else if (currentShape && ['rectangle', 'circle', 'triangle', 'arrow', 'line'].includes(currentTool)) {
      const newShape: DrawingShape = {
        type: currentTool as 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line',
        startPoint: currentShape.start,
        endPoint: currentShape.end,
        color,
        strokeWidth: size,
        opacity: 0.8
      };
      setShapes(prev => [...prev, newShape]);
      setCurrentShape(null);
    }
  }, [isActive, isDrawing, currentTool, currentStroke, currentShape, color, size, getCanvasDimensions]);

  // Handle text input
  const handleTextSubmit = useCallback((text: string) => {
    if (textInput && text.trim()) {
      const newText: DrawingText = {
        text: text.trim(),
        position: textInput.position,
        color,
        fontSize: size * 2,
        fontFamily: 'Arial'
      };
      setTexts(prev => [...prev, newText]);
    }
    setTextInput(null);
  }, [textInput, color, size]);

  // Redraw when data changes
  useEffect(() => {
    redrawCanvas();
    if (onDrawingChange) {
      onDrawingChange({ strokes, shapes, texts });
    }
  }, [strokes, shapes, texts, redrawCanvas, onDrawingChange]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0" style={{ zIndex: 500, pointerEvents: currentTool === 'select' ? 'none' : 'auto' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
      <canvas
        ref={overlayCanvasRef}
        className={`absolute inset-0 w-full h-full ${currentTool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ pointerEvents: currentTool === 'select' ? 'none' : 'auto' }}
      />
      
      {/* Text input modal */}
      {textInput && (
        <div 
          className="absolute bg-white border rounded p-2 shadow-lg"
          style={{
            left: textInput.position.x,
            top: textInput.position.y,
            zIndex: 1001
          }}
        >
          <input
            type="text"
            autoFocus
            className="border rounded px-2 py-1 text-sm"
            placeholder="Enter text..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTextSubmit(e.currentTarget.value);
              } else if (e.key === 'Escape') {
                setTextInput(null);
              }
            }}
            onBlur={(e) => handleTextSubmit(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default DrawingOverlay;