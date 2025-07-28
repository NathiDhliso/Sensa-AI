import { parse } from '@mermaid-js/parser';
// import { Node, Edge } from '@xyflow/react';

export interface ParsedNode {
  id: string;
  label: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'rounded';
  parentId?: string;
  level: number;
}

export interface ParsedEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ParsedMindMap {
  nodes: ParsedNode[];
  edges: ParsedEdge[];
  rootId: string;
}

/**
 * Official Mermaid parser using @mermaid-js/parser
 */
export function parseMermaidMindMap(mermaidCode: string): ParsedMindMap {
  try {
    console.log('🔍 Starting official Mermaid parsing');
    
    // Parse using the official Mermaid parser
    const ast = parse('mindmap', mermaidCode);
    console.log('✅ Official parsing completed:', ast);
    
    // Extract nodes and edges from the AST
    return extractMindMapFromAST(ast);
    
  } catch (error) {
    console.error('❌ Official parsing failed, falling back to manual parsing:', error);
    
    // Fallback to manual parsing if official parser fails
    return manualParseMindMap(mermaidCode);
  }
}

/**
 * Extract mind map data from the official parser AST
 */
function extractMindMapFromAST(ast: Record<string, unknown>): ParsedMindMap {
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  let rootId = '';
  
  try {
    // The AST structure may vary, let's handle different possibilities
    const mindmapData = ast.body || ast.children || ast;
    
    if (Array.isArray(mindmapData)) {
      processMindMapNodes(mindmapData, nodes, edges, null, 0);
    } else if (mindmapData && typeof mindmapData === 'object') {
      // Single root node case
      const nodeId = `node-0`;
      const label = extractLabel(mindmapData) || 'Root';
      
      nodes.push({
        id: nodeId,
        label,
        shape: 'circle',
        level: 0
      });
      
      rootId = nodeId;
      
      // Process children if they exist
      if (mindmapData.children && Array.isArray(mindmapData.children)) {
        processMindMapNodes(mindmapData.children, nodes, edges, nodeId, 1);
      }
    }
    
    if (nodes.length === 0) {
      throw new Error('No nodes found in AST');
    }
    
    rootId = rootId || nodes[0].id;
    
  } catch (error) {
    console.error('❌ AST extraction failed:', error);
    throw error;
  }
  
  return { nodes, edges, rootId };
}

/**
 * Process mind map nodes recursively from AST
 */
function processMindMapNodes(
  astNodes: Record<string, unknown>[],
  nodes: ParsedNode[],
  edges: ParsedEdge[],
  parentId: string | null,
  level: number
): void {
  astNodes.forEach((astNode) => {
    const nodeId = `node-${nodes.length}`;
    const label = extractLabel(astNode) || `Node ${nodes.length}`;
    const shape = determineShapeFromAST(astNode, level);
    
    // Create node
    const node: ParsedNode = {
      id: nodeId,
      label,
      shape,
      level,
      parentId: parentId || undefined
    };
    
    nodes.push(node);
    
    // Create edge if not root
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId
      });
    }
    
    // Process children recursively
    if (astNode.children && Array.isArray(astNode.children)) {
      processMindMapNodes(astNode.children, nodes, edges, nodeId, level + 1);
    }
  });
}

/**
 * Extract label from AST node
 */
function extractLabel(astNode: Record<string, unknown> | string): string {
  if (typeof astNode === 'string') return astNode;
  
  // Try different possible label properties
  if (astNode.label) return astNode.label;
  if (astNode.text) return astNode.text;
  if (astNode.value) return astNode.value;
  if (astNode.id) return astNode.id;
  if (astNode.name) return astNode.name;
  
  return '';
}

/**
 * Determine node shape from AST
 */
function determineShapeFromAST(astNode: Record<string, unknown>, level: number): ParsedNode['shape'] {
  // Check if the AST node has shape information
  if (astNode.shape) {
    switch (astNode.shape) {
      case 'circle': return 'circle';
      case 'diamond': return 'diamond';
      case 'rectangle': return 'rectangle';
      case 'rounded': return 'rounded';
    }
  }
  
  // Default shapes based on level
  if (level === 0) return 'circle';
  if (level === 1) return 'rounded';
  return 'rectangle';
}

/**
 * Fallback manual parser (simplified version of the previous implementation)
 */
function manualParseMindMap(mermaidCode: string): ParsedMindMap {
  const lines = mermaidCode
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim() && !line.trim().startsWith('```'));
  
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const nodeStack: { id: string; level: number }[] = [];
  let rootId = '';
  
  for (const line of lines) {
    // Skip mindmap declaration
    if (line.trim().toLowerCase().startsWith('mindmap')) {
      continue;
    }
    
    // Calculate indentation level
    const indentLevel = Math.floor((line.match(/^(\s*)/)?.[1].length || 0) / 2);
    const content = line.trim().replace(/^[-*+]\s*/, '');
    
    if (!content) continue;
    
    // Create node
    const nodeId = `node-${nodes.length}`;
    const cleanLabel = cleanLabel(content);
    const shape = determineShapeFromContent(content, indentLevel);
    
    const node: ParsedNode = {
      id: nodeId,
      label: cleanLabel,
      shape,
      level: indentLevel
    };
    
    // Adjust node stack
    while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].level >= indentLevel) {
      nodeStack.pop();
    }
    
    // Set parent relationship
    if (nodeStack.length > 0) {
      const parentId = nodeStack[nodeStack.length - 1].id;
      node.parentId = parentId;
      
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId
      });
    } else {
      rootId = nodeId;
    }
    
    nodes.push(node);
    nodeStack.push({ id: nodeId, level: indentLevel });
  }
  
  return {
    nodes,
    edges,
    rootId: rootId || (nodes[0]?.id ?? '')
  };
}

/**
 * Clean label by removing shape indicators
 */
// function cleanLabel(content: string): string {
//   let label = content;
//
//   // Remove shape indicators
//   if (label.includes('((') && label.includes('))')) {
//     label = label.replace(/^\(\(/, '').replace(/\)\)$/, '');
//   } else if (label.includes('(') && label.includes(')')) {
//     label = label.replace(/^\(/, '').replace(/\)$/, '');
//   } else if (label.includes('[') && label.includes(']')) {
//     label = label.replace(/^\[/, '').replace(/\]$/, '');
//   } else if (label.includes('{') && label.includes('}')) {
//     label = label.replace(/^\{/, '').replace(/\}$/, '');
//   }
//
//   return label.trim();
// }

/**
 * Determine node shape from content
 */
function determineShapeFromContent(content: string, level: number): ParsedNode['shape'] {
  // Shape based on bracket type
  if (content.includes('((') && content.includes('))')) {
    return 'circle';
  }
  if (content.includes('{') && content.includes('}')) {
    return 'diamond';
  }
  if (content.includes('[') && content.includes(']')) {
    return 'rectangle';
  }
  
  // Default shapes based on level
  if (level === 0) return 'circle';
  if (level === 1) return 'rounded';
  return 'rectangle';
}

/**
 * Create sample mind map for testing
 */
export function createSampleMindMapCode(): string {
  return `mindmap
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
}

/**
 * Test the parser with sample data
 */
export function testMermaidParser(): ParsedMindMap {
  const sampleCode = createSampleMindMapCode();
  console.log('🧪 Testing official parser with sample data');
  const result = parseMermaidMindMap(sampleCode);
  console.log('🧪 Test result:', result);
  return result;
}

/**
 * Validate parsed mind map structure
 */
export function validateParsedMindMap(parsedMindMap: ParsedMindMap): boolean {
  if (!parsedMindMap.nodes || parsedMindMap.nodes.length === 0) {
    console.error('❌ No nodes found in parsed mind map');
    return false;
  }
  
  if (!parsedMindMap.rootId) {
    console.error('❌ No root node identified');
    return false;
  }
  
  const rootExists = parsedMindMap.nodes.some(node => node.id === parsedMindMap.rootId);
  if (!rootExists) {
    console.error('❌ Root node ID does not match any existing node');
    return false;
  }
  
  console.log('✅ Mind map validation passed');
  return true;
} 