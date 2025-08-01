// Phase 3: Rich Media & Advanced Collaboration - Enhanced Export System
// Advanced export capabilities with multiple formats and collaborative features

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, FileText, Image, Code, Share2, Mail, Link2, Cloud,
  Settings, Palette, Layers, Grid, Type, Zap, Clock, Users,
  CheckCircle, AlertCircle, X, Play, Pause, RotateCcw, Eye
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { toPng, toJpeg, toSvg, toPdf } from 'html-to-image';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { Button } from '../../components';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  extension: string;
  mimeType: string;
  supportsCustomization: boolean;
  supportsBatch: boolean;
}

interface ExportOptions {
  format: string;
  quality: number;
  scale: number;
  backgroundColor: string;
  includeWatermark: boolean;
  includeMetadata: boolean;
  includeCollaborators: boolean;
  customSize?: { width: number; height: number };
  margins: { top: number; right: number; bottom: number; left: number };
  compression: number;
  colorProfile: 'sRGB' | 'AdobeRGB' | 'P3';
}

interface ExportJob {
  id: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  estimatedTime?: number;
}

interface EnhancedExportProps {
  nodes: Node[];
  edges: Edge[];
  canvasRef?: React.RefObject<HTMLDivElement>;
  onClose?: () => void;
  sessionId?: string;
}

export const EnhancedExport: React.FC<EnhancedExportProps> = ({
  nodes,
  edges,
  canvasRef,
  onClose,
  sessionId
}) => {
  // State management
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 0.9,
    scale: 2,
    backgroundColor: '#ffffff',
    includeWatermark: false,
    includeMetadata: true,
    includeCollaborators: true,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    compression: 0.8,
    colorProfile: 'sRGB'
  });
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareOptions, setShareOptions] = useState({
    email: '',
    message: '',
    expiration: '7d',
    allowDownload: true,
    requireAuth: false
  });
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Collaboration store
  const { currentSession, participants, currentUser } = useCollaborationStore();
  
  // Export formats
  const exportFormats: ExportFormat[] = [
    {
      id: 'png',
      name: 'PNG Image',
      description: 'High-quality raster image with transparency support',
      icon: Image,
      extension: 'png',
      mimeType: 'image/png',
      supportsCustomization: true,
      supportsBatch: true
    },
    {
      id: 'jpg',
      name: 'JPEG Image',
      description: 'Compressed raster image, smaller file size',
      icon: Image,
      extension: 'jpg',
      mimeType: 'image/jpeg',
      supportsCustomization: true,
      supportsBatch: true
    },
    {
      id: 'svg',
      name: 'SVG Vector',
      description: 'Scalable vector graphics, perfect for print',
      icon: Code,
      extension: 'svg',
      mimeType: 'image/svg+xml',
      supportsCustomization: true,
      supportsBatch: false
    },
    {
      id: 'pdf',
      name: 'PDF Document',
      description: 'Professional document format with metadata',
      icon: FileText,
      extension: 'pdf',
      mimeType: 'application/pdf',
      supportsCustomization: true,
      supportsBatch: false
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Raw mindmap data for import/export',
      icon: Code,
      extension: 'json',
      mimeType: 'application/json',
      supportsCustomization: false,
      supportsBatch: false
    },
    {
      id: 'mermaid',
      name: 'Mermaid Diagram',
      description: 'Mermaid syntax for documentation',
      icon: Code,
      extension: 'mmd',
      mimeType: 'text/plain',
      supportsCustomization: false,
      supportsBatch: false
    }
  ];
  
  // Preset export configurations
  const presets = [
    {
      name: 'Web Optimized',
      options: { scale: 1, quality: 0.8, compression: 0.9, backgroundColor: '#ffffff' }
    },
    {
      name: 'Print Quality',
      options: { scale: 3, quality: 1, compression: 0.5, backgroundColor: '#ffffff' }
    },
    {
      name: 'Presentation',
      options: { scale: 2, quality: 0.9, compression: 0.7, backgroundColor: '#f8fafc' }
    },
    {
      name: 'Social Media',
      options: { scale: 2, quality: 0.85, compression: 0.8, customSize: { width: 1200, height: 630 } }
    }
  ];
  
  // Apply preset configuration
  const applyPreset = useCallback((preset: typeof presets[0]) => {
    setExportOptions(prev => ({ ...prev, ...preset.options }));
  }, []);
  
  // Generate preview
  const generatePreview = useCallback(async () => {
    if (!canvasRef?.current) return;
    
    try {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size for preview (smaller scale)
      canvas.width = 400;
      canvas.height = 300;
      
      // Generate preview image
      const dataUrl = await toPng(canvasRef.current, {
        quality: 0.8,
        backgroundColor: exportOptions.backgroundColor,
        pixelRatio: 1
      });
      
      setPreviewUrl(dataUrl);
      
      // Draw preview on canvas
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = exportOptions.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
      img.src = dataUrl;
      
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  }, [canvasRef, exportOptions.backgroundColor]);
  
  // Export mindmap
  const exportMindmap = useCallback(async () => {
    if (!canvasRef?.current) return;
    
    setIsExporting(true);
    
    const jobId = `export-${Date.now()}`;
    const newJob: ExportJob = {
      id: jobId,
      format: selectedFormat,
      status: 'processing',
      progress: 0,
      createdAt: new Date(),
      estimatedTime: 5000 // 5 seconds estimate
    };
    
    setExportJobs(prev => [newJob, ...prev]);
    
    try {
      let dataUrl: string;
      let filename: string;
      
      const format = exportFormats.find(f => f.id === selectedFormat);
      if (!format) throw new Error('Invalid format');
      
      // Update progress
      setExportJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, progress: 25 } : job
      ));
      
      // Generate export based on format
      switch (selectedFormat) {
        case 'png':
          dataUrl = await toPng(canvasRef.current, {
            quality: exportOptions.quality,
            backgroundColor: exportOptions.backgroundColor,
            pixelRatio: exportOptions.scale,
            width: exportOptions.customSize?.width,
            height: exportOptions.customSize?.height
          });
          filename = `mindmap-${Date.now()}.png`;
          break;
          
        case 'jpg':
          dataUrl = await toJpeg(canvasRef.current, {
            quality: exportOptions.quality,
            backgroundColor: exportOptions.backgroundColor,
            pixelRatio: exportOptions.scale,
            width: exportOptions.customSize?.width,
            height: exportOptions.customSize?.height
          });
          filename = `mindmap-${Date.now()}.jpg`;
          break;
          
        case 'svg':
          dataUrl = await toSvg(canvasRef.current, {
            backgroundColor: exportOptions.backgroundColor,
            width: exportOptions.customSize?.width,
            height: exportOptions.customSize?.height
          });
          filename = `mindmap-${Date.now()}.svg`;
          break;
          
        case 'pdf':
          // For PDF, we'll use a library like jsPDF
          dataUrl = await toPng(canvasRef.current, {
            quality: 1,
            backgroundColor: exportOptions.backgroundColor,
            pixelRatio: exportOptions.scale
          });
          filename = `mindmap-${Date.now()}.pdf`;
          break;
          
        case 'json':
          const jsonData = {
            nodes,
            edges,
            metadata: {
              exportedAt: new Date().toISOString(),
              exportedBy: currentUser?.id,
              sessionId,
              collaborators: exportOptions.includeCollaborators ? participants.map(p => p.user_id) : undefined
            }
          };
          dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(jsonData, null, 2))}`;
          filename = `mindmap-${Date.now()}.json`;
          break;
          
        case 'mermaid':
          const mermaidCode = generateMermaidCode(nodes, edges);
          dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(mermaidCode)}`;
          filename = `mindmap-${Date.now()}.mmd`;
          break;
          
        default:
          throw new Error('Unsupported format');
      }
      
      // Update progress
      setExportJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, progress: 75 } : job
      ));
      
      // Create download link
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      // Complete job
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed', progress: 100, downloadUrl: dataUrl }
          : job
      ));
      
      // TODO: If collaborative session, notify other participants
      if (sessionId && currentSession) {
        // Send export notification through collaboration system
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' }
          : job
      ));
    } finally {
      setIsExporting(false);
    }
  }, [canvasRef, selectedFormat, exportOptions, nodes, edges, currentUser, sessionId, currentSession, participants, exportFormats]);
  
  // Generate Mermaid code
  const generateMermaidCode = useCallback((nodes: Node[], edges: Edge[]) => {
    let mermaidCode = 'graph TD\n';
    
    // Add nodes
    nodes.forEach(node => {
      const label = node.data?.label || node.id;
      mermaidCode += `    ${node.id}["${label}"]\n`;
    });
    
    // Add edges
    edges.forEach(edge => {
      mermaidCode += `    ${edge.source} --> ${edge.target}\n`;
    });
    
    return mermaidCode;
  }, []);
  
  // Share export
  const shareExport = useCallback(async () => {
    // TODO: Implement sharing functionality
    // This would upload the export to cloud storage and generate a shareable link
    console.log('Sharing export with options:', shareOptions);
  }, [shareOptions]);
  
  // Get format info
  const getFormatInfo = (formatId: string) => {
    return exportFormats.find(f => f.id === formatId) || exportFormats[0];
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  // Estimate file size
  const estimateFileSize = useCallback(() => {
    const baseSize = nodes.length * 1000 + edges.length * 500; // Rough estimate
    const scaleFactor = exportOptions.scale * exportOptions.scale;
    const qualityFactor = exportOptions.quality;
    
    return Math.round(baseSize * scaleFactor * qualityFactor);
  }, [nodes.length, edges.length, exportOptions.scale, exportOptions.quality]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Export Mindmap</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={generatePreview}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            
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
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Format selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Export Format</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {exportFormats.map(format => {
                  const IconComponent = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        selectedFormat === format.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">{format.name}</span>
                      </div>
                      <p className="text-sm text-gray-500">{format.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Quick presets */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Quick Presets</h3>
              <div className="flex flex-wrap gap-2">
                {presets.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Export options */}
            {getFormatInfo(selectedFormat).supportsCustomization && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Export Options</h3>
                  <button
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Settings className="w-4 h-4" />
                    {showAdvancedOptions ? 'Hide' : 'Show'} Advanced
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quality */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Quality</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={exportOptions.quality}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>{Math.round(exportOptions.quality * 100)}%</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  {/* Scale */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Scale</label>
                    <input
                      type="range"
                      min="0.5"
                      max="4"
                      step="0.5"
                      value={exportOptions.scale}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.5x</span>
                      <span>{exportOptions.scale}x</span>
                      <span>4x</span>
                    </div>
                  </div>
                  
                  {/* Background color */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={exportOptions.backgroundColor}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-12 h-8 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={exportOptions.backgroundColor}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* File size estimate */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Estimated Size</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                      {formatFileSize(estimateFileSize())}
                    </div>
                  </div>
                </div>
                
                {/* Advanced options */}
                <AnimatePresence>
                  {showAdvancedOptions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Custom size */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Custom Size (px)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Width"
                              value={exportOptions.customSize?.width || ''}
                              onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                customSize: {
                                  width: parseInt(e.target.value) || 0,
                                  height: prev.customSize?.height || 0
                                }
                              }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <span className="self-center text-gray-500">×</span>
                            <input
                              type="number"
                              placeholder="Height"
                              value={exportOptions.customSize?.height || ''}
                              onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                customSize: {
                                  width: prev.customSize?.width || 0,
                                  height: parseInt(e.target.value) || 0
                                }
                              }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* Compression */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Compression</label>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={exportOptions.compression}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, compression: parseFloat(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>High</span>
                            <span>{Math.round(exportOptions.compression * 100)}%</span>
                            <span>Low</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Checkboxes */}
                      <div className="mt-4 space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeMetadata}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Include metadata (creation date, author, etc.)</span>
                        </label>
                        
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeCollaborators}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, includeCollaborators: e.target.checked }))}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Include collaborator information</span>
                        </label>
                        
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeWatermark}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, includeWatermark: e.target.checked }))}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Include Sensa AI watermark</span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {/* Export button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={exportMindmap}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export {getFormatInfo(selectedFormat).name}
                  </>
                )}
              </Button>
              
              <Button
                onClick={shareExport}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
            {/* Preview */}
            {previewUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Preview</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
            
            {/* Export history */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Export History</h3>
              {exportJobs.length === 0 ? (
                <p className="text-gray-500 text-sm">No exports yet</p>
              ) : (
                <div className="space-y-3">
                  {exportJobs.slice(0, 5).map(job => (
                    <div key={job.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {getFormatInfo(job.format).name}
                        </span>
                        <div className="flex items-center gap-1">
                          {job.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {job.status === 'failed' && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          {job.status === 'processing' && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          )}
                        </div>
                      </div>
                      
                      {job.status === 'processing' && (
                        <div className="mb-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {job.progress}% complete
                          </p>
                        </div>
                      )}
                      
                      {job.status === 'failed' && job.error && (
                        <p className="text-xs text-red-600 mb-2">{job.error}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{job.createdAt.toLocaleTimeString()}</span>
                        {job.status === 'completed' && job.downloadUrl && (
                          <a
                            href={job.downloadUrl}
                            download
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedExport;