import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mermaid from 'mermaid';
import {
  Download,
  Code,
  Eye,
  Copy,
  // Save,
  FileText,
  Image,
  X,
  Play,
  // RotateCcw,
  Settings,
  // Maximize,
  // Minimize,
  Split,
  // Edit3,
  Palette,
  // Type,
  // Layers
} from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';

interface MermaidNativeEditorProps {
  initialData?: {
    mermaid_code: string;
    node_data: Record<string, { node_name: string; sensa_insight: unknown }>;
  };
  onSave?: (data: { mermaid_code: string; node_data: Record<string, unknown> }) => void;
  onClose?: () => void;
}

export const MermaidNativeEditor: React.FC<MermaidNativeEditorProps> = ({
  initialData,
  // onSave,
  onClose,
}) => {
  const [mermaidCode, setMermaidCode] = useState(() => {
    if (initialData?.mermaid_code) {
      return initialData.mermaid_code;
    }
    return `mindmap
  root((🎯 Azure Cloud Computing))
    🔐 Identity & Governance
      Microsoft Entra Users
      User Properties
      Licenses
      External Users
      SSPR
    💾 Storage Management
      Storage Accounts
      Access Control
      Redundancy
      File Shares
      Blob Storage
    🖥️ Compute Resources
      Virtual Machines
      ARM Templates
      Containers
      App Service
    🌐 Virtual Networking
      Virtual Networks
      Network Security
      Load Balancing
      DNS Configuration
    📊 Monitoring & Backup
      Azure Monitor
      Backup Policies
      Site Recovery
      Alerts & Reports`;
  });

  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [theme, setTheme] = useState('default');
  const [showSettings, setShowSettings] = useState(false);
  
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mermaid configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme as 'default' | 'dark' | 'forest' | 'neutral',
      mindmap: {
        primaryColor: '#6B46C1',
        primaryTextColor: '#FFFFFF',
        primaryBorderColor: '#5B21B6',
        lineColor: '#E5E7EB',
        secondaryColor: '#F97316',
        tertiaryColor: '#FBBF24',
        background: '#FFFFFF',
        mainBkg: '#6B46C1',
        secondBkg: '#F97316',
      },
      flowchart: {
        htmlLabels: true,
        curve: 'cardinal',
      },
      securityLevel: 'loose',
    });
  }, [theme]);

  // Render Mermaid diagram
  const renderMermaid = useCallback(async () => {
    if (!previewRef.current || !mermaidCode.trim()) return;

    setIsRendering(true);
    setRenderError(null);

    try {
      // Clear previous content
      previewRef.current.innerHTML = '';
      
      // Sanitize code: strip Markdown ``` fences (e.g., ```mermaid ... ```)
      const sanitizedCode = mermaidCode
        .replace(/^\s*```(?:mermaid)?\s*/i, '') // opening fence with optional mermaid
        .replace(/\s*```\s*$/i, ''); // closing fence

      // Generate unique ID
      const id = `mermaid-${Date.now()}`;
      
      // Validate and render
      const isValid = await mermaid.parse(sanitizedCode);
      if (!isValid) {
        throw new Error('Invalid Mermaid syntax');
      }

      const { svg } = await mermaid.render(id, sanitizedCode);
      previewRef.current.innerHTML = svg;

      // Add interactivity
      const svgElement = previewRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.cursor = 'grab';
        
        // Add zoom and pan capabilities
        let scale = 1;
        const translateX = 0;
        const translateY = 0;
        
        svgElement.addEventListener('wheel', (e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          scale *= delta;
          svgElement.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        });
      }
    } catch (error) {
      console.error('Mermaid render error:', error);
      setRenderError(error instanceof Error ? error.message : 'Rendering failed');
      previewRef.current.innerHTML = `
        <div class="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
          <div class="text-center">
            <div class="text-red-600 mb-2">⚠️ Rendering Error</div>
            <div class="text-red-500 text-sm">${error instanceof Error ? error.message : 'Unknown error'}</div>
          </div>
        </div>
      `;
    } finally {
      setIsRendering(false);
    }
  }, [mermaidCode]);

  // Auto-render on code change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (viewMode !== 'code') {
        renderMermaid();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [mermaidCode, viewMode, renderMermaid]);

  // Initial render
  useEffect(() => {
    renderMermaid();
  }, [renderMermaid]);

  // Export functions
  const exportToPNG = useCallback(async () => {
    if (!previewRef.current) return;
    
    try {
      const dataUrl = await toPng(previewRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        quality: 1,
      });
      
      const link = document.createElement('a');
      link.download = 'azure-mindmap.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('PNG export failed:', error);
    }
  }, []);

  const exportToSVG = useCallback(async () => {
    if (!previewRef.current) return;
    
    try {
      const svgData = await toSvg(previewRef.current, {
        backgroundColor: '#ffffff',
      });
      
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'azure-mindmap.svg';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('SVG export failed:', error);
    }
  }, []);

  const exportMermaidCode = useCallback(() => {
    const blob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'azure-mindmap.mmd';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [mermaidCode]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(mermaidCode);
  }, [mermaidCode]);

  // Predefined Azure templates
  const azureTemplates = {
    comprehensive: `mindmap
  root((🎯 Azure AZ-104))
    🔐 Identity & Governance
      Microsoft Entra ID
        Users & Groups
        Licenses
        External Users
        SSPR
      Access Management
        Built-in Roles
        Role Assignments
        Scope Management
      Governance
        Azure Policy
        Resource Locks
        Tags
        Management Groups
    💾 Storage Solutions
      Storage Accounts
        Creation & Config
        Redundancy Options
        Encryption
      Access Control
        Firewalls & VNets
        SAS Tokens
        Access Policies
        Identity-based Access
      File & Blob Storage
        File Shares
        Blob Containers
        Lifecycle Management
        Soft Delete
    🖥️ Compute Resources
      Virtual Machines
        Creation & Config
        Disk Encryption
        Availability Zones
        Scale Sets
      ARM & Bicep
        Template Interpretation
        Resource Deployment
        Template Export
      Containers
        Container Registry
        Container Instances
        Container Apps
      App Service
        App Service Plans
        SSL/TLS Certificates
        Custom Domains
        Deployment Slots
    🌐 Virtual Networking
      Network Infrastructure
        VNets & Subnets
        Network Peering
        Public IP Addresses
        Custom Routes
      Security
        Network Security Groups
        Application Security Groups
        Azure Bastion
        Service Endpoints
        Private Endpoints
      Load Balancing
        Load Balancer Config
        Azure DNS
        Traffic Distribution
        Health Monitoring
    📊 Monitoring & Recovery
      Azure Monitor
        Metrics & Logs
        Alert Rules
        Action Groups
        Network Watcher
      Backup & Recovery
        Recovery Services Vault
        Backup Policies
        Site Recovery
        Cross-region Failover`,
    
    simple: `mindmap
  root((Azure Cloud))
    Identity
      Users
      Groups
      Roles
    Storage
      Accounts
      Files
      Blobs
    Compute
      VMs
      Containers
      Apps
    Network
      VNets
      Security
      DNS
    Monitor
      Logs
      Alerts
      Backup`,
    
    certification: `mindmap
  root((🏆 AZ-104 Certification))
    📚 Study Areas
      Identity (20-25%)
        Entra ID Management
        Access Control
        Governance
      Storage (15-20%)
        Account Management
        Data Management
        Security
      Compute (20-25%)
        VM Management
        ARM Templates
        Containers
        App Services
      Networking (15-20%)
        Virtual Networks
        Security Groups
        Load Balancing
      Monitoring (10-15%)
        Azure Monitor
        Backup & Recovery
        Alerts & Reports
    🎯 Exam Strategy
      Practice Labs
      Mock Exams
      Documentation
      Hands-on Experience`
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code className="w-6 h-6" />
              <h2 className="text-xl font-bold">Mermaid Mind Map Editor</h2>
              <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm">Native Mermaid Support</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* View Mode */}
            <div className="flex bg-white bg-opacity-10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'code' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'}`}
              >
                <Code className="w-4 h-4 inline mr-1" />
                Code
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'split' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'}`}
              >
                <Split className="w-4 h-4 inline mr-1" />
                Split
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'preview' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'}`}
              >
                <Eye className="w-4 h-4 inline mr-1" />
                Preview
              </button>
            </div>

            {/* Actions */}
            <div className="flex bg-white bg-opacity-10 rounded-lg p-1 gap-1">
              <button
                onClick={renderMermaid}
                disabled={isRendering}
                className="px-3 py-1 hover:bg-white hover:bg-opacity-20 rounded text-sm transition-colors disabled:opacity-50"
                title="Render"
              >
                <Play className="w-4 h-4 inline mr-1" />
                {isRendering ? 'Rendering...' : 'Render'}
              </button>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 hover:bg-white hover:bg-opacity-20 rounded text-sm transition-colors"
                title="Copy Code"
              >
                <Copy className="w-4 h-4 inline mr-1" />
                Copy
              </button>
            </div>

            {/* Templates */}
            <div className="flex bg-white bg-opacity-10 rounded-lg p-1">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setMermaidCode(azureTemplates[e.target.value as keyof typeof azureTemplates]);
                    e.target.value = '';
                  }
                }}
                className="bg-transparent text-white text-sm px-2 py-1 rounded border-none outline-none"
                defaultValue=""
              >
                <option value="" className="text-gray-800">📋 Templates</option>
                <option value="comprehensive" className="text-gray-800">🎯 Comprehensive Azure</option>
                <option value="simple" className="text-gray-800">⚡ Simple Layout</option>
                <option value="certification" className="text-gray-800">🏆 Certification Focus</option>
              </select>
            </div>

            {/* Export */}
            <div className="flex bg-white bg-opacity-10 rounded-lg p-1 gap-1">
              <button
                onClick={exportToPNG}
                className="px-3 py-1 hover:bg-white hover:bg-opacity-20 rounded text-sm transition-colors"
                title="Export PNG"
              >
                <Image className="w-4 h-4 inline mr-1" />
                PNG
              </button>
              <button
                onClick={exportToSVG}
                className="px-3 py-1 hover:bg-white hover:bg-opacity-20 rounded text-sm transition-colors"
                title="Export SVG"
              >
                <FileText className="w-4 h-4 inline mr-1" />
                SVG
              </button>
              <button
                onClick={exportMermaidCode}
                className="px-3 py-1 hover:bg-white hover:bg-opacity-20 rounded text-sm transition-colors"
                title="Export Mermaid"
              >
                <Download className="w-4 h-4 inline mr-1" />
                Mermaid
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="bg-gray-50 border-b overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gray-600" />
                    <label className="text-sm font-medium text-gray-700">Theme:</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="default">Default</option>
                      <option value="dark">Dark</option>
                      <option value="forest">Forest</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden">
          {/* Code Editor */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} border-r border-gray-200 flex flex-col`}>
              <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Mermaid Code</span>
                <div className="text-xs text-gray-500">
                  Lines: {mermaidCode.split('\n').length} | Characters: {mermaidCode.length}
                </div>
              </div>
              <textarea
                ref={codeEditorRef}
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
                className="flex-1 p-4 font-mono text-sm border-none outline-none resize-none bg-gray-50"
                placeholder="Enter your Mermaid diagram code here..."
                spellCheck={false}
              />
            </div>
          )}

          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
              <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Live Preview</span>
                {renderError && (
                  <span className="text-xs text-red-600">⚠️ Syntax Error</span>
                )}
                {isRendering && (
                  <span className="text-xs text-blue-600">🔄 Rendering...</span>
                )}
              </div>
              <div className="flex-1 overflow-auto bg-white p-4">
                <div
                  ref={previewRef}
                  className="w-full h-full flex items-center justify-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-gray-100 px-4 py-2 border-t text-xs text-gray-600 flex items-center justify-between">
          <div>Mermaid Native Editor • Supports all Mermaid diagram types</div>
          <div className="flex items-center gap-4">
            <span>Theme: {theme}</span>
            <span>View: {viewMode}</span>
            {renderError && <span className="text-red-600">Error detected</span>}
          </div>
        </div>
      </div>
    </div>
  );
}; 