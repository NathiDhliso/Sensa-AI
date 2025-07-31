import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Eye, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { usePageTheme } from '../../../contexts/themeUtils';

// Import Graphviz library for rendering
// Note: We'll use @hpcc-js/wasm for client-side Graphviz rendering
import { Graphviz } from '@hpcc-js/wasm';

interface GraphvizViewerProps {
  isOpen: boolean;
  onClose: () => void;
  dotCode: string;
  title?: string;
}

export const GraphvizViewer: React.FC<GraphvizViewerProps> = ({
  isOpen,
  onClose,
  dotCode,
  title = 'Workflow Diagram'
}) => {
  const pageTheme = usePageTheme('businessLens');
  const svgRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [graphviz, setGraphviz] = useState<any>(null);

  // Initialize Graphviz
  useEffect(() => {
    const initGraphviz = async () => {
      try {
        const graphvizInstance = await Graphviz.load();
        setGraphviz(graphvizInstance);
      } catch (err) {
        console.error('Failed to load Graphviz:', err);
        setError('Failed to initialize diagram renderer');
      }
    };

    if (isOpen && !graphviz) {
      initGraphviz();
    }
  }, [isOpen, graphviz]);

  // Render DOT code to SVG
  useEffect(() => {
    const renderDiagram = async () => {
      if (!graphviz || !dotCode || !isOpen) return;

      setIsLoading(true);
      setError('');

      try {
        console.log('Rendering DOT code:', dotCode);
        const svg = graphviz.dot(dotCode);
        console.log('Generated SVG length:', svg.length);
        setSvgContent(svg);
      } catch (err) {
        console.error('Graphviz rendering error:', err);
        console.error('DOT code that failed:', dotCode);
        setError(`Failed to render diagram: ${err.message || 'Please check the Graphviz code syntax.'}`);
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [graphviz, dotCode, isOpen]);

  // Download as SVG
  const downloadSVG = () => {
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_workflow.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download as PNG
  const downloadPNG = async () => {
    if (!svgContent || !svgRef.current) return;

    try {
      // Create a temporary canvas to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width * 2; // Higher resolution
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${title.replace(/\s+/g, '_')}_workflow.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
          }
        }, 'image/png');

        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (err) {
      console.error('PNG download error:', err);
      setError('Failed to download PNG. Please try SVG instead.');
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.2));
  const handleResetZoom = () => setZoom(1);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`${pageTheme.background} rounded-2xl shadow-2xl max-w-[95vw] max-h-[95vh] w-full flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`${pageTheme.card} border-b ${pageTheme.accent} px-6 py-4 rounded-t-2xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${pageTheme.button} rounded-lg`}>
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                  <p className="text-sm text-gray-600">Interactive workflow visualization</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={zoom <= 0.2}
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-3 py-1 text-sm hover:bg-gray-100 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadSVG}
                disabled={!svgContent || isLoading}
                className={`flex items-center gap-2 px-4 py-2 ${pageTheme.button} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                <Download className="w-4 h-4" />
                SVG
              </button>
              <button
                onClick={downloadPNG}
                disabled={!svgContent || isLoading}
                className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50`}
              >
                <Download className="w-4 h-4" />
                PNG
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Rendering diagram...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-red-600">
                  <p className="mb-2">⚠️ {error}</p>
                  <p className="text-sm text-gray-500">
                    You can still copy the Graphviz code and use an external renderer.
                  </p>
                </div>
              </div>
            )}

            {svgContent && !isLoading && !error && (
              <div 
                ref={svgRef}
                className="flex justify-center items-start min-h-[400px] overflow-auto"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                  className="w-auto h-auto"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 rounded-b-2xl">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>Use mouse wheel or zoom controls to adjust view</p>
              <p>Click outside to close</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GraphvizViewer;