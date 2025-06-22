import React, { useState, useCallback, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  ChevronDown, ChevronRight, Link, Paperclip, MessageCircle, 
  Tag, Star, Eye, EyeOff, Edit3, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Advanced Node Data Interface
export interface AdvancedNodeData {
  label: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'hexagon' | 'triangle' | 'star' | 'cloud';
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
  layer: number;
  icon?: string;
  isCollapsed?: boolean;
  isHighlighted?: boolean;
  hyperlink?: string;
  notes?: string;
  attachments?: string[];
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  isEditing?: boolean;
  children?: string[];
  parentId?: string;
}

const AdvancedNode: React.FC<NodeProps<AdvancedNodeData>> = ({ 
  data, 
  id, 
  selected 
}) => {
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [label, setLabel] = useState(data.label);
  const [showDetails, setShowDetails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

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

  const getShadowClass = () => {
    switch (data.shadow) {
      case 'small': return 'shadow-sm';
      case 'medium': return 'shadow-md';
      case 'large': return 'shadow-lg';
      default: return '';
    }
  };

  const getPriorityColor = () => {
    switch (data.priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return '';
    }
  };

  const getShapeStyle = () => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: data.color,
      color: data.textColor,
      border: `${data.borderWidth}px ${data.borderStyle} ${data.borderColor}`,
      fontSize: `${data.fontSize}px`,
      fontWeight: data.fontWeight,
      fontStyle: data.fontStyle,
      textDecoration: data.textDecoration,
      textAlign: data.textAlign,
      borderRadius: `${data.borderRadius}px`,
      transform: `rotate(${data.rotation}deg)`,
      padding: '12px 16px',
      minWidth: '120px',
      minHeight: '50px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      zIndex: data.layer,
      position: 'relative',
    };

    // Shape-specific adjustments
    const shapeAdjustments: Record<string, React.CSSProperties> = {
      circle: {
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
      },
      diamond: {
        transform: `rotate(${45 + data.rotation}deg)`,
        width: '90px',
        height: '90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      hexagon: {
        clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
        width: '140px',
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
        width: '110px',
        height: '110px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      cloud: {
        borderRadius: '50px',
        position: 'relative',
        padding: '16px 24px',
      },
      rectangle: {},
    };

    return { ...baseStyle, ...shapeAdjustments[data.shape] };
  };

  const hasExtras = data.hyperlink || data.notes || (data.attachments && data.attachments.length > 0) || 
                   (data.tags && data.tags.length > 0);

  return (
    <div className="relative">
      {/* Main Node */}
      <div
        style={getShapeStyle()}
        onDoubleClick={handleDoubleClick}
        className={`
          ${getShadowClass()} 
          ${selected ? 'ring-2 ring-blue-500' : ''} 
          ${data.isHighlighted ? 'ring-2 ring-yellow-400' : ''}
          ${getPriorityColor()}
          hover:shadow-lg hover:scale-105 transition-all
          ${data.isCollapsed ? 'opacity-50' : ''}
        `}
      >
        {/* Node Content */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {data.icon && (
              <span className="mr-2" style={{ fontSize: `${data.fontSize + 2}px` }}>
                {data.icon}
              </span>
            )}
            
            {isEditing ? (
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={() => setIsEditing(false)}
                className="bg-transparent border-none outline-none w-full"
                style={{
                  color: data.textColor,
                  fontSize: `${data.fontSize}px`,
                  fontWeight: data.fontWeight,
                  fontStyle: data.fontStyle,
                }}
                autoFocus
              />
            ) : (
              <span>{data.label}</span>
            )}
          </div>
          
          {/* Collapse Button */}
          {data.children && data.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('toggleCollapse', {
                  detail: { id }
                }));
              }}
              className="ml-2 p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              {data.isCollapsed ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
        
        {/* Priority Indicator */}
        {data.priority && data.priority !== 'low' && (
          <div className="absolute -top-2 -right-2">
            <Star 
              className={`w-4 h-4 ${
                data.priority === 'high' ? 'text-red-500 fill-red-500' : 'text-yellow-500 fill-yellow-500'
              }`} 
            />
          </div>
        )}
        
        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-white bg-opacity-20 rounded-full"
              >
                {tag}
              </span>
            ))}
            {data.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-white bg-opacity-20 rounded-full">
                +{data.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Extra Features Indicator */}
      {hasExtras && (
        <div className="absolute -bottom-2 -right-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors"
          >
            {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>
      )}
      
      {/* Details Panel */}
      <AnimatePresence>
        {showDetails && hasExtras && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border p-3 min-w-64 z-50"
          >
            {/* Hyperlink */}
            {data.hyperlink && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Link className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Link</span>
                </div>
                <a
                  href={data.hyperlink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm truncate block"
                >
                  {data.hyperlink}
                </a>
              </div>
            )}
            
            {/* Attachments */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Attachments</span>
                </div>
                <div className="space-y-1">
                  {data.attachments.map((attachment, index) => (
                    <div key={index} className="text-sm text-gray-600 truncate">
                      {attachment}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Notes */}
            {data.notes && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Notes</span>
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="ml-auto text-xs text-blue-600 hover:underline"
                  >
                    {showNotes ? 'Hide' : 'Show'}
                  </button>
                </div>
                <AnimatePresence>
                  {showNotes && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-sm text-gray-700 bg-gray-50 p-2 rounded overflow-hidden"
                    >
                      {data.notes}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {/* All Tags */}
            {data.tags && data.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(AdvancedNode); 