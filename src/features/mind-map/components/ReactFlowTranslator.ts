import { Node, Edge, MarkerType } from '@xyflow/react';
import { ParsedNode, ParsedEdge, ParsedMindMap } from './MermaidParser';
import { applyAutoLayout, applyRadialLayout, LayoutedNode, LayoutedEdge } from './MindMapLayouter';

export interface MindMapNodeData {
  label: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'rounded';
  level: number;
  isRoot: boolean;
  category?: string;
  emoji?: string;
}

export type ReactFlowMindMapNode = Node<MindMapNodeData>;
export type ReactFlowMindMapEdge = Edge;

export interface TranslationOptions {
  layoutType: 'hierarchical' | 'radial';
  nodeWidth: number;
  nodeHeight: number;
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  centerX?: number;
  centerY?: number;
  radiusIncrement?: number;
}

const defaultTranslationOptions: TranslationOptions = {
  layoutType: 'hierarchical',
  nodeWidth: 200,
  nodeHeight: 80,
  direction: 'TB',
  centerX: 400,
  centerY: 300,
  radiusIncrement: 150
};

/**
 * Main translation function: Mermaid AST → React Flow data
 */
export function translateToReactFlow(
  parsedMindMap: ParsedMindMap,
  options: Partial<TranslationOptions> = {}
): { nodes: ReactFlowMindMapNode[]; edges: ReactFlowMindMapEdge[] } {
  
  const translationOptions = { ...defaultTranslationOptions, ...options };
  
  console.log('🔄 Translating parsed mind map to React Flow format');
  console.log('📊 Input:', parsedMindMap);
  
  // Step 1: Convert parsed nodes to React Flow nodes (without positions)
  const reactFlowNodes = parsedMindMap.nodes.map(parsedNode => 
    convertParsedNodeToReactFlow(parsedNode, parsedMindMap.rootId)
  );
  
  // Step 2: Convert parsed edges to React Flow edges
  const reactFlowEdges = parsedMindMap.edges.map(parsedEdge => 
    convertParsedEdgeToReactFlow(parsedEdge)
  );
  
  console.log('📋 Pre-layout nodes:', reactFlowNodes.length);
  console.log('🔗 Pre-layout edges:', reactFlowEdges.length);
  
  // Step 3: Apply auto-layout to calculate positions
  let layoutResult: { nodes: LayoutedNode[]; edges: LayoutedEdge[] };
  
  if (translationOptions.layoutType === 'radial') {
    layoutResult = applyRadialLayout(
      reactFlowNodes,
      reactFlowEdges,
      translationOptions.centerX,
      translationOptions.centerY,
      translationOptions.radiusIncrement
    );
  } else {
    layoutResult = applyAutoLayout(reactFlowNodes, reactFlowEdges, {
      direction: translationOptions.direction,
      nodeWidth: translationOptions.nodeWidth,
      nodeHeight: translationOptions.nodeHeight,
      rankSeparation: 120,
      nodeSeparation: 80
    });
  }
  
  console.log('✅ Layout applied successfully');
  console.log('📍 Final nodes with positions:', layoutResult.nodes.length);
  
  return {
    nodes: layoutResult.nodes as ReactFlowMindMapNode[],
    edges: layoutResult.edges as ReactFlowMindMapEdge[]
  };
}

/**
 * Convert a single parsed node to React Flow format
 */
function convertParsedNodeToReactFlow(
  parsedNode: ParsedNode,
  rootId: string
): ReactFlowMindMapNode {
  
  const isRoot = parsedNode.id === rootId;
  
  // Add emoji based on content or level
  const emoji = getNodeEmoji(parsedNode.label, parsedNode.level, isRoot);
  
  // Determine category for styling
  const category = determineNodeCategory(parsedNode.label, parsedNode.level);
  
  return {
    id: parsedNode.id,
    type: 'mindMapNode', // Custom node type we'll create
    position: { x: 0, y: 0 }, // Will be set by layout algorithm
    data: {
      label: parsedNode.label,
      shape: parsedNode.shape,
      level: parsedNode.level,
      isRoot,
      category,
      emoji
    },
    draggable: true,
    selectable: true,
    // Style based on level and type
    style: getNodeStyle(parsedNode.shape, parsedNode.level, isRoot),
    className: `mind-map-node level-${parsedNode.level} ${isRoot ? 'root-node' : ''}`
  };
}

/**
 * Convert a single parsed edge to React Flow format
 */
function convertParsedEdgeToReactFlow(parsedEdge: ParsedEdge): ReactFlowMindMapEdge {
  return {
    id: parsedEdge.id,
    source: parsedEdge.source,
    target: parsedEdge.target,
    type: 'smoothstep', // Use smooth curved edges for mind maps
    animated: false,
    style: {
      stroke: '#64748b',
      strokeWidth: 2
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#64748b'
    },
    label: parsedEdge.label,
    labelStyle: {
      fontSize: '12px',
      fontWeight: 500
    }
  };
}

/**
 * Generate appropriate emoji for nodes
 */
function getNodeEmoji(label: string, level: number, isRoot: boolean): string {
  const lowerLabel = label.toLowerCase();
  
  if (isRoot) return '🧠';
  
  // Content-based emojis
  if (lowerLabel.includes('learning')) return '📚';
  if (lowerLabel.includes('machine')) return '🤖';
  if (lowerLabel.includes('data')) return '📊';
  if (lowerLabel.includes('algorithm')) return '⚙️';
  if (lowerLabel.includes('neural')) return '🕸️';
  if (lowerLabel.includes('classification')) return '🏷️';
  if (lowerLabel.includes('regression')) return '📈';
  if (lowerLabel.includes('cluster')) return '🎯';
  if (lowerLabel.includes('deep')) return '🔍';
  if (lowerLabel.includes('natural language')) return '💬';
  if (lowerLabel.includes('vision')) return '👁️';
  if (lowerLabel.includes('reinforcement')) return '🎮';
  
  // Level-based emojis as fallback
  const levelEmojis = ['🎯', '⭐', '💡', '🔧', '📋'];
  return levelEmojis[Math.min(level - 1, levelEmojis.length - 1)] || '📌';
}

/**
 * Determine node category for styling
 */
function determineNodeCategory(label: string, level: number): string {
  const lowerLabel = label.toLowerCase();
  
  if (level === 0) return 'root';
  if (level === 1) return 'primary';
  if (level === 2) return 'secondary';
  
  // Content-based categories
  if (lowerLabel.includes('supervised') || lowerLabel.includes('unsupervised')) {
    return 'category';
  }
  if (lowerLabel.includes('algorithm') || lowerLabel.includes('method')) {
    return 'method';
  }
  if (lowerLabel.includes('example') || lowerLabel.includes('application')) {
    return 'example';
  }
  
  return 'default';
}

/**
 * Generate node styles based on shape, level, and type
 */
function getNodeStyle(
  shape: ParsedNode['shape'],
  level: number,
  isRoot: boolean
): React.CSSProperties {
  
  // Base styles
  const baseStyle: React.CSSProperties = {
    fontSize: isRoot ? '16px' : level === 1 ? '14px' : '12px',
    fontWeight: isRoot ? 'bold' : level === 1 ? '600' : '500',
    color: '#1f2937',
    border: '2px solid',
    borderRadius: shape === 'circle' ? '50%' : shape === 'rounded' ? '12px' : '4px',
    padding: '8px 12px',
    minWidth: '120px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease'
  };
  
  // Level-based colors
  if (isRoot) {
    baseStyle.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    baseStyle.borderColor = '#4c51bf';
    baseStyle.color = 'white';
  } else if (level === 1) {
    baseStyle.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    baseStyle.borderColor = '#e53e3e';
    baseStyle.color = 'white';
  } else if (level === 2) {
    baseStyle.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    baseStyle.borderColor = '#3182ce';
    baseStyle.color = 'white';
  } else {
    baseStyle.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    baseStyle.borderColor = '#38a169';
    baseStyle.color = '#1a202c';
  }
  
  // Shape-specific adjustments
  if (shape === 'circle') {
    baseStyle.width = '80px';
    baseStyle.height = '80px';
    baseStyle.display = 'flex';
    baseStyle.alignItems = 'center';
    baseStyle.justifyContent = 'center';
  } else if (shape === 'diamond') {
    baseStyle.transform = 'rotate(45deg)';
    baseStyle.width = '60px';
    baseStyle.height = '60px';
  }
  
  return baseStyle;
}

/**
 * Helper function to validate translation input
 */
export function validateParsedMindMap(parsedMindMap: ParsedMindMap): boolean {
  if (!parsedMindMap.nodes || parsedMindMap.nodes.length === 0) {
    console.error('❌ No nodes found in parsed mind map');
    return false;
  }
  
  if (!parsedMindMap.rootId) {
    console.error('❌ No root node identified in parsed mind map');
    return false;
  }
  
  const rootExists = parsedMindMap.nodes.some(node => node.id === parsedMindMap.rootId);
  if (!rootExists) {
    console.error('❌ Root node ID does not match any existing node');
    return false;
  }
  
  console.log('✅ Parsed mind map validation passed');
  return true;
}

/**
 * Create sample mind map data for testing
 */
export function createSampleMindMapData(): { nodes: ReactFlowMindMapNode[]; edges: ReactFlowMindMapEdge[] } {
  const sampleParsedData: ParsedMindMap = {
    nodes: [
      { id: 'root', label: 'Machine Learning', shape: 'circle', level: 0 },
      { id: 'supervised', label: 'Supervised Learning', shape: 'rounded', parentId: 'root', level: 1 },
      { id: 'unsupervised', label: 'Unsupervised Learning', shape: 'rounded', parentId: 'root', level: 1 },
      { id: 'classification', label: 'Classification', shape: 'rectangle', parentId: 'supervised', level: 2 },
      { id: 'regression', label: 'Regression', shape: 'rectangle', parentId: 'supervised', level: 2 },
      { id: 'clustering', label: 'Clustering', shape: 'rectangle', parentId: 'unsupervised', level: 2 }
    ],
    edges: [
      { id: 'e1', source: 'root', target: 'supervised' },
      { id: 'e2', source: 'root', target: 'unsupervised' },
      { id: 'e3', source: 'supervised', target: 'classification' },
      { id: 'e4', source: 'supervised', target: 'regression' },
      { id: 'e5', source: 'unsupervised', target: 'clustering' }
    ],
    rootId: 'root'
  };
  
  return translateToReactFlow(sampleParsedData);
} 