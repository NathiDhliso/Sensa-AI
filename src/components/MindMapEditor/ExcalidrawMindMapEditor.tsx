import React, { useState, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { 
  Download, Upload, X, Save, FileText, Image, Code 
} from 'lucide-react';

interface ExcalidrawMindMapEditorProps {
  initialData?: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

const ExcalidrawMindMapEditor: React.FC<ExcalidrawMindMapEditorProps> = ({
  onSave,
  onClose
}) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(() => {
    if (!excalidrawAPI) return;
    
    const data = {
      elements: excalidrawAPI.getSceneElements(),
      appState: excalidrawAPI.getAppState(),
      files: excalidrawAPI.getFiles(),
    };
    
    onSave?.(data);
  }, [excalidrawAPI, onSave]);

  const exportToJSON = useCallback(() => {
    if (!excalidrawAPI) return;
    
    const data = {
      type: 'excalidraw',
      version: 2,
      source: 'https://sensa-ai.com',
      elements: excalidrawAPI.getSceneElements(),
      appState: excalidrawAPI.getAppState(),
      files: excalidrawAPI.getFiles(),
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'mindmap.excalidraw';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [excalidrawAPI]);

  const importFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.excalidraw,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !excalidrawAPI) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.elements) {
            excalidrawAPI.updateScene({
              elements: data.elements,
              appState: data.appState || {},
            });
          }
        } catch (error) {
          console.error('Failed to import file:', error);
          alert('Failed to import file. Please check the format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [excalidrawAPI]);

  const resetView = useCallback(() => {
    if (!excalidrawAPI) return;
    
    // Reset zoom and center the view
    excalidrawAPI.updateScene({
      appState: {
        zoom: { value: 0.8 as any },
        scrollX: 0,
        scrollY: 0,
      },
    });
  }, [excalidrawAPI]);

  const insertMindMapTemplate = useCallback(() => {
    if (!excalidrawAPI) return;
    
    // Create a beautiful, professional mind map template
    const centerX = 400;
    const centerY = 300;
    
    const elements = [
      // Central topic - larger and more prominent
      {
        id: 'central-1',
        type: 'ellipse',
        x: centerX - 120,
        y: centerY - 60,
        width: 240,
        height: 120,
        angle: 0,
        strokeColor: '#ffffff',
        backgroundColor: '#6366f1',
        fillStyle: 'solid',
        strokeWidth: 3,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 1,
        versionNonce: 1,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: { type: 3 },
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
      },
      // Central text - larger and more prominent
      {
        id: 'text-1',
        type: 'text',
        x: centerX - 80,
        y: centerY - 20,
        width: 160,
        height: 40,
        angle: 0,
        strokeColor: '#ffffff',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 2,
        versionNonce: 2,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        text: 'Learning Topic',
        fontSize: 24,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        containerId: 'central-1',
        originalText: 'Learning Topic',
        lineHeight: 1.25,
      },
      // Branch 1 - Foundations (12 o'clock)
      {
        id: 'branch-1',
        type: 'rectangle',
        x: centerX - 70,
        y: centerY - 220,
        width: 140,
        height: 70,
        angle: 0,
        strokeColor: '#ffffff',
        backgroundColor: '#10b981',
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 3,
        versionNonce: 3,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: { type: 3 },
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
      },
      // Branch 1 text
      {
        id: 'text-2',
        type: 'text',
        x: centerX - 50,
        y: centerY - 195,
        width: 100,
        height: 20,
        angle: 0,
        strokeColor: '#ffffff',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 4,
        versionNonce: 4,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        text: 'Foundations',
        fontSize: 16,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        containerId: 'branch-1',
        originalText: 'Foundations',
        lineHeight: 1.25,
      },
      
      // Branch 2 - Applications (3 o'clock)
      {
        id: 'branch-2',
        type: 'rectangle',
        x: centerX + 150,
        y: centerY - 35,
        width: 140,
        height: 70,
        angle: 0,
        strokeColor: '#ffffff',
        backgroundColor: '#f59e0b',
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 5,
        versionNonce: 5,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: { type: 3 },
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
      },
      // Branch 2 text
      {
        id: 'text-3',
        type: 'text',
        x: centerX + 170,
        y: centerY - 10,
        width: 100,
        height: 20,
        angle: 0,
        strokeColor: '#ffffff',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 6,
        versionNonce: 6,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        text: 'Applications',
        fontSize: 16,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        containerId: 'branch-2',
        originalText: 'Applications',
        lineHeight: 1.25,
      },
      
      // Branch 3 - Assessment (6 o'clock)
      {
        id: 'branch-3',
        type: 'rectangle',
        x: centerX - 70,
        y: centerY + 150,
        width: 140,
        height: 70,
        angle: 0,
        strokeColor: '#ffffff',
        backgroundColor: '#ef4444',
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 7,
        versionNonce: 7,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: { type: 3 },
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
      },
      // Branch 3 text
      {
        id: 'text-4',
        type: 'text',
        x: centerX - 50,
        y: centerY + 175,
        width: 100,
        height: 20,
        angle: 0,
        strokeColor: '#ffffff',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 8,
        versionNonce: 8,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        text: 'Assessment',
        fontSize: 16,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        containerId: 'branch-3',
        originalText: 'Assessment',
        lineHeight: 1.25,
      },
      
      // Branch 4 - Advanced (9 o'clock)
      {
        id: 'branch-4',
        type: 'rectangle',
        x: centerX - 290,
        y: centerY - 35,
        width: 140,
        height: 70,
        angle: 0,
        strokeColor: '#ffffff',
        backgroundColor: '#8b5cf6',
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 9,
        versionNonce: 9,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: { type: 3 },
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
      },
      // Branch 4 text
      {
        id: 'text-5',
        type: 'text',
        x: centerX - 270,
        y: centerY - 10,
        width: 100,
        height: 20,
        angle: 0,
        strokeColor: '#ffffff',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 10,
        versionNonce: 10,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        text: 'Advanced',
        fontSize: 16,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        containerId: 'branch-4',
        originalText: 'Advanced',
        lineHeight: 1.25,
      },
      
      // Connecting lines
      // Line to Foundations
      {
        id: 'line-1',
        type: 'line',
        x: centerX,
        y: centerY - 60,
        width: 0,
        height: 90,
        angle: 0,
        strokeColor: '#6b7280',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 3,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 11,
        versionNonce: 11,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: { type: 2 },
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        points: [[0, 0], [0, -90]],
        lastCommittedPoint: null,
        startBinding: null,
        endBinding: null,
        startArrowhead: null,
        endArrowhead: 'arrow',
      },
      
      // Line to Applications
      {
        id: 'line-2',
        type: 'line',
        x: centerX + 120,
        y: centerY,
        width: 30,
        height: 0,
        angle: 0,
        strokeColor: '#6b7280',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 3,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 12,
        versionNonce: 12,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: { type: 2 },
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        points: [[0, 0], [30, 0]],
        lastCommittedPoint: null,
        startBinding: null,
        endBinding: null,
        startArrowhead: null,
        endArrowhead: 'arrow',
      },
      
      // Line to Assessment
      {
        id: 'line-3',
        type: 'line',
        x: centerX,
        y: centerY + 60,
        width: 0,
        height: 90,
        angle: 0,
        strokeColor: '#6b7280',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 3,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 13,
        versionNonce: 13,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: { type: 2 },
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        points: [[0, 0], [0, 90]],
        lastCommittedPoint: null,
        startBinding: null,
        endBinding: null,
        startArrowhead: null,
        endArrowhead: 'arrow',
      },
      
      // Line to Advanced
      {
        id: 'line-4',
        type: 'line',
        x: centerX - 120,
        y: centerY,
        width: -30,
        height: 0,
        angle: 0,
        strokeColor: '#6b7280',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 3,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        seed: 14,
        versionNonce: 14,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        roundness: { type: 2 },
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        points: [[0, 0], [-30, 0]],
        lastCommittedPoint: null,
        startBinding: null,
        endBinding: null,
        startArrowhead: null,
        endArrowhead: 'arrow',
      },
    ];
    
    excalidrawAPI.updateScene({ elements });
  }, [excalidrawAPI]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header Toolbar */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-4 flex items-center justify-between relative z-50 shadow-lg">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Sensa Mind Map Studio</h2>
              <p className="text-blue-100 text-sm opacity-90">Visual Learning Made Simple</p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={insertMindMapTemplate}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
                title="Insert Professional Mind Map Template"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Learning Template
              </button>
              
              <button
                onClick={resetView}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all hover:scale-105"
                title="Reset View & Zoom"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              <button
                onClick={handleSave}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all hover:scale-105"
                title="Save Mind Map (Ctrl+S)"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Right Side Tools */}
          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            <div className="relative group">
              <button
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                title="Export Options"
                disabled={isLoading}
              >
                <Download className="w-4 h-4" />
              </button>
              
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-2 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={exportToJSON}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                >
                  <Code className="w-4 h-4" />
                  Export Excalidraw
                </button>
              </div>
            </div>
            
            {/* Import */}
            <button
              onClick={importFromFile}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Import File"
            >
              <Upload className="w-4 h-4" />
            </button>
            
            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Excalidraw Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span>Processing...</span>
              </div>
            </div>
          )}
          
          <Excalidraw
            excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
            initialData={{
              appState: {
                viewBackgroundColor: '#f8fafc',
                theme: 'light',
                zoom: {
                  value: 0.8 as any,
                },
                scrollX: 0,
                scrollY: 0,
                currentItemFontFamily: 1,
                currentItemFontSize: 16,
                currentItemStrokeColor: '#1e1e1e',
                currentItemBackgroundColor: '#6366f1',
                currentItemFillStyle: 'solid',
                currentItemStrokeWidth: 2,
                currentItemRoughness: 1,
                exportBackground: true,
                exportWithDarkMode: false,
              },
            }}
            UIOptions={{
              canvasActions: {
                saveToActiveFile: false,
                loadScene: false,
                export: {
                  saveFileToDisk: false,
                },
                toggleTheme: false,
                clearCanvas: true,
              },
              tools: {
                image: false,
              },
              dockedSidebarBreakpoint: 0,
            }}
            theme="light"
            viewModeEnabled={false}
            zenModeEnabled={false}
            gridModeEnabled={false}
          />
        </div>
      </div>
    </div>
  );
};

export default ExcalidrawMindMapEditor; 