import React, { useState, useCallback, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, Connection, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Import our custom components and utilities
import { MindMapNode, AdvancedMindMapNode, MindMapNodeData } from './MindMapNode';
import { parseMermaidMindMap, testMermaidParser, createSampleMindMapCode } from './OfficialMermaidParser';
import { translateToReactFlow, validateParsedMindMap, createSampleMindMapData } from './ReactFlowTranslator';

interface MindMapImporterProps {
  onImportSuccess?: (nodes: any[], edges: any[]) => void;
  onImportError?: (error: string) => void;
  className?: string;
  defaultLayout?: 'hierarchical' | 'radial';
}

export const MindMapImporter: React.FC<MindMapImporterProps> = ({
  onImportSuccess,
  onImportError,
  className = '',
  defaultLayout = 'hierarchical'
}) => {
  // State management
  const [mermaidInput, setMermaidInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [layoutType, setLayoutType] = useState<'hierarchical' | 'radial'>(defaultLayout);
  const [nodeType, setNodeType] = useState<'basic' | 'advanced'>('basic');

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Node types for React Flow
  const nodeTypes = useMemo(() => ({
    mindMapNode: MindMapNode,
    advancedMindMapNode: AdvancedMindMapNode
  }), []);

  // Sample Mermaid mind map for testing
  const sampleMermaidCode = `mindmap
  root((Machine Learning))
    Supervised Learning
      Classification
        Decision Trees
        SVM
        Neural Networks
      Regression
        Linear Regression
        Polynomial Regression
    Unsupervised Learning
      Clustering
        K-Means
        Hierarchical
      Dimensionality Reduction
        PCA
        t-SNE
    Reinforcement Learning
      Q-Learning
      Policy Gradient`;

  // Import process handler
  const handleImport = useCallback(async () => {
    if (!mermaidInput.trim()) {
      setErrorMessage('Please enter Mermaid mind map syntax');
      setImportStatus('error');
      onImportError?.('Please enter Mermaid mind map syntax');
      return;
    }

    setIsImporting(true);
    setImportStatus('idle');
    setErrorMessage('');

    try {
      console.log('🚀 Starting mind map import process...');
      
      // Step 1: Parse Mermaid syntax
      console.log('📝 Parsing Mermaid syntax...');
      const parsedMindMap = parseMermaidMindMap(mermaidInput);
      console.log('✅ Parsing completed:', parsedMindMap);

      // Step 2: Validate parsed data
      if (!validateParsedMindMap(parsedMindMap)) {
        throw new Error('Invalid mind map structure detected');
      }

      // Step 3: Translate to React Flow format with layout
      console.log('🔄 Translating to React Flow format...');
      const { nodes: newNodes, edges: newEdges } = translateToReactFlow(parsedMindMap, {
        layoutType,
        nodeWidth: 200,
        nodeHeight: 80,
        direction: 'TB'
      });

      // Update node types based on selection
      const updatedNodes = newNodes.map(node => ({
        ...node,
        type: nodeType === 'advanced' ? 'advancedMindMapNode' : 'mindMapNode'
      }));

      console.log('✅ Translation completed');
      console.log('📊 Final result:', { nodes: updatedNodes.length, edges: newEdges.length });

      // Step 4: Update React Flow state
      setNodes(updatedNodes);
      setEdges(newEdges);

      // Step 5: Success callback
      setImportStatus('success');
      onImportSuccess?.(updatedNodes, newEdges);

    } catch (error) {
      console.error('❌ Mind map import failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown import error';
      setErrorMessage(errorMsg);
      setImportStatus('error');
      onImportError?.(errorMsg);
    } finally {
      setIsImporting(false);
    }
  }, [mermaidInput, layoutType, nodeType, setNodes, setEdges, onImportSuccess, onImportError]);

  // Load sample data
  const handleLoadSample = useCallback(() => {
    setMermaidInput(sampleMermaidCode);
  }, [sampleMermaidCode]);

  // Test parser functionality
  const handleTestParser = useCallback(() => {
    try {
      const result = testMermaidParser();
      console.log('🧪 Parser test result:', result);
      alert('Parser test completed! Check console for details.');
    } catch (error) {
      console.error('❌ Parser test failed:', error);
      alert('Parser test failed! Check console for details.');
    }
  }, []);

  // Load sample React Flow data
  const handleLoadSampleData = useCallback(() => {
    try {
      const { nodes: sampleNodes, edges: sampleEdges } = createSampleMindMapData();
      const updatedNodes = sampleNodes.map(node => ({
        ...node,
        type: nodeType === 'advanced' ? 'advancedMindMapNode' : 'mindMapNode'
      }));
      
      setNodes(updatedNodes);
      setEdges(sampleEdges);
      setImportStatus('success');
    } catch (error) {
      console.error('❌ Failed to load sample data:', error);
    }
  }, [nodeType, setNodes, setEdges]);

  // Clear the canvas
  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setMermaidInput('');
    setImportStatus('idle');
    setErrorMessage('');
  }, [setNodes, setEdges]);

  // Handle edge connections
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className={`mind-map-importer ${className}`}>
      {/* Control Panel */}
      <div className="control-panel" style={{ 
        padding: '16px', 
        background: '#f8fafc', 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Input Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="mermaid-input" style={{ fontWeight: '600', fontSize: '14px' }}>
            Mermaid Mind Map Syntax:
          </label>
          <textarea
            id="mermaid-input"
            value={mermaidInput}
            onChange={(e) => setMermaidInput(e.target.value)}
            placeholder="Paste your Mermaid mind map syntax here..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'Monaco, Consolas, monospace',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Options Row */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Layout Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>Layout:</label>
            <select 
              value={layoutType} 
              onChange={(e) => setLayoutType(e.target.value as 'hierarchical' | 'radial')}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="hierarchical">Hierarchical</option>
              <option value="radial">Radial</option>
            </select>
          </div>

          {/* Node Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>Style:</label>
            <select 
              value={nodeType} 
              onChange={(e) => setNodeType(e.target.value as 'basic' | 'advanced')}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="basic">Basic</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleImport}
            disabled={isImporting || !mermaidInput.trim()}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              opacity: isImporting || !mermaidInput.trim() ? 0.6 : 1
            }}
          >
            {isImporting ? '🔄 Importing...' : '🚀 Import Mind Map'}
          </button>

          <button
            onClick={handleLoadSample}
            style={{
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            📋 Load Sample
          </button>

          <button
            onClick={handleLoadSampleData}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            🎨 Sample Data
          </button>

          <button
            onClick={handleTestParser}
            style={{
              padding: '8px 16px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            🧪 Test Parser
          </button>

          <button
            onClick={handleClear}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear
          </button>
        </div>

        {/* Status Display */}
        {importStatus !== 'idle' && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            background: importStatus === 'success' ? '#dcfce7' : '#fef2f2',
            color: importStatus === 'success' ? '#166534' : '#dc2626',
            border: `1px solid ${importStatus === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            {importStatus === 'success' ? (
              `✅ Successfully imported ${nodes.length} nodes and ${edges.length} edges`
            ) : (
              `❌ Import failed: ${errorMessage}`
            )}
          </div>
        )}
      </div>

      {/* React Flow Canvas */}
      <div style={{ height: '600px', background: '#ffffff' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Background color="#f1f5f9" gap={16} />
          <Controls />
          <MiniMap 
            style={{
              height: 120,
              background: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
            nodeColor={(node) => {
              const nodeData = node.data as MindMapNodeData;
              if (nodeData.isRoot) return '#667eea';
              if (nodeData.level === 1) return '#f093fb';
              if (nodeData.level === 2) return '#4facfe';
              return '#43e97b';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default MindMapImporter; 