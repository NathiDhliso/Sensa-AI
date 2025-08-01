// Phase 3: Rich Media & Advanced Collaboration - Multimedia Node Component
// Enhanced node component that supports images, videos, audio, and documents

import React, { useState, useCallback, useRef, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, Download, ExternalLink, FileText,
  Image as ImageIcon, Video, Music, Paperclip, Eye, EyeOff, Maximize2,
  Edit3, Trash2, Copy, Share2, MoreHorizontal
} from 'lucide-react';
import { MultimediaFile } from '../../services/multimediaUploadService';

// Enhanced node data interface with multimedia support
export interface MultimediaNodeData {
  label: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'rounded';
  color: string;
  textColor: string;
  borderColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  borderWidth: number;
  borderRadius: number;
  
  // Multimedia properties
  mediaFiles?: MultimediaFile[];
  primaryMedia?: MultimediaFile;
  showMediaPreview?: boolean;
  mediaLayout?: 'thumbnail' | 'preview' | 'full';
  
  // Enhanced properties
  notes?: string;
  tags?: string[];
  hyperlink?: string;
  isCollapsed?: boolean;
  isEditing?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

// Media preview component
const MediaPreview: React.FC<{
  media: MultimediaFile;
  layout: 'thumbnail' | 'preview' | 'full';
  onExpand?: () => void;
}> = ({ media, layout, onExpand }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = useCallback(() => {
    if (media.mediaType === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (media.mediaType === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, media.mediaType]);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    } else if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const getMediaIcon = () => {
    switch (media.mediaType) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <Paperclip className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (layout === 'thumbnail') {
    return (
      <div className="relative group cursor-pointer" onClick={onExpand}>
        {media.thumbnailUrl ? (
          <img 
            src={media.thumbnailUrl} 
            alt={media.file.name}
            className="w-12 h-12 object-cover rounded border"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
            {getMediaIcon()}
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded transition-all duration-200 flex items-center justify-center">
          <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  }

  if (layout === 'preview') {
    return (
      <div className="relative bg-gray-50 rounded-lg p-3 border">
        <div className="flex items-start gap-3">
          {/* Media thumbnail/icon */}
          <div className="flex-shrink-0">
            {media.thumbnailUrl ? (
              <img 
                src={media.thumbnailUrl} 
                alt={media.file.name}
                className="w-16 h-16 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                {getMediaIcon()}
              </div>
            )}
          </div>
          
          {/* Media info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {media.file.name}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(media.size)}
              {media.duration && ` • ${formatDuration(media.duration)}`}
              {media.dimensions && ` • ${media.dimensions.width}×${media.dimensions.height}`}
            </p>
            
            {/* Media controls */}
            {(media.mediaType === 'video' || media.mediaType === 'audio') && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handlePlayPause}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <button
                  onClick={handleMuteToggle}
                  className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={onExpand}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            {media.url && (
              <a
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
        
        {/* Hidden media elements for playback */}
        {media.mediaType === 'video' && media.url && (
          <video
            ref={videoRef}
            className="hidden"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={media.url} type={media.mimeType} />
          </video>
        )}
        
        {media.mediaType === 'audio' && media.url && (
          <audio
            ref={audioRef}
            className="hidden"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={media.url} type={media.mimeType} />
          </audio>
        )}
      </div>
    );
  }

  // Full layout - show actual media content
  return (
    <div className="relative bg-white rounded-lg border overflow-hidden">
      {media.mediaType === 'image' && media.url && (
        <img 
          src={media.url} 
          alt={media.file.name}
          className="w-full h-auto max-h-64 object-contain"
        />
      )}
      
      {media.mediaType === 'video' && media.url && (
        <div 
          className="relative"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            className="w-full h-auto max-h-64 object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            poster={media.thumbnailUrl}
          >
            <source src={media.url} type={media.mimeType} />
          </video>
          
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 rounded p-2 flex items-center gap-2"
              >
                <button
                  onClick={handlePlayPause}
                  className="p-1 bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleMuteToggle}
                  className="p-1 bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {media.mediaType === 'audio' && media.url && (
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Music className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{media.file.name}</h4>
              {media.duration && (
                <p className="text-sm text-gray-500">{formatDuration(media.duration)}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePlayPause}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={handleMuteToggle}
                className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <audio
            ref={audioRef}
            className="hidden"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={media.url} type={media.mimeType} />
          </audio>
        </div>
      )}
      
      {media.mediaType === 'document' && (
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{media.file.name}</h4>
              <p className="text-sm text-gray-500">{formatFileSize(media.size)}</p>
              {media.extractedText && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {media.extractedText.substring(0, 100)}...
                </p>
              )}
            </div>
            {media.url && (
              <a
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main multimedia node component
export const MultimediaNode: React.FC<NodeProps<MultimediaNodeData>> = memo(({ 
  data, 
  selected,
  id 
}) => {
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [label, setLabel] = useState(data.label);
  const [showMediaExpanded, setShowMediaExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleLabelChange = useCallback((newLabel: string) => {
    setLabel(newLabel);
    // TODO: Update node data through collaboration store
  }, []);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      handleLabelChange(label);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel(data.label);
    }
  }, [label, data.label, handleLabelChange]);

  const getNodeStyle = () => {
    const baseStyle: React.CSSProperties = {
      background: data.color,
      color: data.textColor,
      borderColor: data.borderColor,
      borderWidth: `${data.borderWidth}px`,
      borderStyle: 'solid',
      borderRadius: `${data.borderRadius}px`,
      fontSize: `${data.fontSize}px`,
      fontWeight: data.fontWeight,
      minWidth: '200px',
      maxWidth: '400px'
    };

    if (data.shape === 'circle') {
      baseStyle.borderRadius = '50%';
      baseStyle.width = '150px';
      baseStyle.height = '150px';
      baseStyle.display = 'flex';
      baseStyle.alignItems = 'center';
      baseStyle.justifyContent = 'center';
    }

    if (selected) {
      baseStyle.boxShadow = '0 0 0 2px #3b82f6';
    }

    return baseStyle;
  };

  const primaryMedia = data.primaryMedia || (data.mediaFiles && data.mediaFiles[0]);
  const hasMultipleMedia = data.mediaFiles && data.mediaFiles.length > 1;

  return (
    <div 
      className="multimedia-node relative group"
      style={getNodeStyle()}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      {/* Node content */}
      <div className="p-3 space-y-3">
        {/* Label */}
        <div className="text-center">
          {isEditing ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                setIsEditing(false);
                handleLabelChange(label);
              }}
              className="bg-transparent border-none outline-none text-center w-full"
              style={{ color: data.textColor, fontSize: `${data.fontSize}px` }}
              autoFocus
            />
          ) : (
            <div className="font-medium">{data.label}</div>
          )}
        </div>
        
        {/* Primary media preview */}
        {primaryMedia && data.showMediaPreview !== false && (
          <div className="flex justify-center">
            <MediaPreview 
              media={primaryMedia}
              layout={data.mediaLayout || 'thumbnail'}
              onExpand={() => setShowMediaExpanded(true)}
            />
          </div>
        )}
        
        {/* Multiple media indicator */}
        {hasMultipleMedia && (
          <div className="text-center">
            <span className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded-full">
              +{data.mediaFiles!.length - 1} more
            </span>
          </div>
        )}
        
        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {data.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {data.tags.length > 3 && (
              <span className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded-full">
                +{data.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-2 -right-2 flex gap-1"
          >
            <button
              onClick={() => setIsEditing(true)}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              title="Edit"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Priority indicator */}
      {data.priority && data.priority !== 'low' && (
        <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${
          data.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
        }`} />
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      {/* Expanded media modal */}
      <AnimatePresence>
        {showMediaExpanded && primaryMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={() => setShowMediaExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{primaryMedia.file.name}</h3>
                  <button
                    onClick={() => setShowMediaExpanded(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <MediaPreview 
                  media={primaryMedia}
                  layout="full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

MultimediaNode.displayName = 'MultimediaNode';

export default MultimediaNode;