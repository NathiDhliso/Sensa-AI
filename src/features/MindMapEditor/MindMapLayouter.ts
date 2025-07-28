import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

export interface LayoutedNode extends Node {
  position: { x: number; y: number };
}

export interface LayoutedEdge extends Edge {
  id: string;
}

export interface LayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodeWidth: number;
  nodeHeight: number;
  rankSeparation: number;
  nodeSeparation: number;
}

const defaultLayoutOptions: LayoutOptions = {
  direction: 'TB', // Top to Bottom for mind maps
  nodeWidth: 200,
  nodeHeight: 80,
  rankSeparation: 100,
  nodeSeparation: 50
};

/**
 * Apply automatic layout to nodes and edges using Dagre
 */
export function applyAutoLayout(
  nodes: Node[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): { nodes: LayoutedNode[]; edges: LayoutedEdge[] } {
  
  const layoutOptions = { ...defaultLayoutOptions, ...options };
  
  // Create a new directed graph
  const dagreGraph = new dagre.graphlib.Graph();
  
  // Set graph properties
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: layoutOptions.direction,
    ranksep: layoutOptions.rankSeparation,
    nodesep: layoutOptions.nodeSeparation,
    edgesep: 30,
    marginx: 20,
    marginy: 20
  });

  // Add nodes to the graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: layoutOptions.nodeWidth,
      height: layoutOptions.nodeHeight
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Apply the layout
  dagre.layout(dagreGraph);

  // Update nodes with calculated positions
  const layoutedNodes: LayoutedNode[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - layoutOptions.nodeWidth / 2,
        y: nodeWithPosition.y - layoutOptions.nodeHeight / 2
      }
    };
  });

  // Edges don't need position updates, just return them as LayoutedEdges
  const layoutedEdges: LayoutedEdge[] = edges.map(edge => ({ ...edge }));

  return {
    nodes: layoutedNodes,
    edges: layoutedEdges
  };
}

/**
 * Apply radial layout for mind maps (alternative to hierarchical)
 */
export function applyRadialLayout(
  nodes: Node[],
  edges: Edge[],
  centerX: number = 400,
  centerY: number = 300,
  radiusIncrement: number = 150
): { nodes: LayoutedNode[]; edges: LayoutedEdge[] } {
  
  // Find root node (assuming it's the first node or one without incoming edges)
  const rootNode = findRootNode(nodes, edges);
  
  if (!rootNode) {
    // Fallback to dagre layout if no root found
    return applyAutoLayout(nodes, edges);
  }

  // Build tree structure
  const tree = buildTree(nodes, edges, rootNode.id);
  
  // Apply radial positioning
  const layoutedNodes: LayoutedNode[] = [];
  
  // Position root at center
  layoutedNodes.push({
    ...rootNode,
    position: { x: centerX, y: centerY }
  });

  // Position children in circles around root
  positionChildrenRadially(tree, layoutedNodes, centerX, centerY, radiusIncrement);

  const layoutedEdges: LayoutedEdge[] = edges.map(edge => ({ ...edge }));

  return {
    nodes: layoutedNodes,
    edges: layoutedEdges
  };
}

/**
 * Helper function to find root node
 */
function findRootNode(nodes: Node[], edges: Edge[]): Node | undefined {
  // Find node with no incoming edges
  const targetIds = new Set(edges.map(edge => edge.target));
  return nodes.find(node => !targetIds.has(node.id));
}

/**
 * Build tree structure from nodes and edges
 */
interface TreeNode {
  id: string;
  node: Node;
  children: TreeNode[];
  level: number;
}

function buildTree(nodes: Node[], edges: Edge[], rootId: string): TreeNode {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const childrenMap = new Map<string, string[]>();
  
  // Build children map
  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
  });

  // Recursively build tree
  function buildSubtree(nodeId: string, level: number): TreeNode {
    const node = nodeMap.get(nodeId)!;
    const childIds = childrenMap.get(nodeId) || [];
    
    return {
      id: nodeId,
      node,
      children: childIds.map(childId => buildSubtree(childId, level + 1)),
      level
    };
  }

  return buildSubtree(rootId, 0);
}

/**
 * Position children radially around their parents
 */
function positionChildrenRadially(
  tree: TreeNode,
  layoutedNodes: LayoutedNode[],
  centerX: number,
  centerY: number,
  radiusIncrement: number,
  currentRadius: number = radiusIncrement
) {
  
  if (tree.children.length === 0) return;

  const angleIncrement = (2 * Math.PI) / Math.max(tree.children.length, 1);
  
  tree.children.forEach((child, index) => {
    const angle = index * angleIncrement;
    const x = centerX + Math.cos(angle) * currentRadius;
    const y = centerY + Math.sin(angle) * currentRadius;
    
    layoutedNodes.push({
      ...child.node,
      position: { x, y }
    });

    // Recursively position grandchildren
    if (child.children.length > 0) {
      positionChildrenRadially(
        child,
        layoutedNodes,
        x,
        y,
        radiusIncrement * 0.7, // Reduce radius for deeper levels
        radiusIncrement * 0.7
      );
    }
  });
}

/**
 * Optimize layout for better visual appearance
 */
export function optimizeLayout(
  nodes: LayoutedNode[],
  edges: LayoutedEdge[]
): { nodes: LayoutedNode[]; edges: LayoutedEdge[] } {
  
  // Add some randomization to avoid overlapping
  const optimizedNodes = nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x + (Math.random() - 0.5) * 20,
      y: node.position.y + (Math.random() - 0.5) * 20
    }
  }));

  return {
    nodes: optimizedNodes,
    edges
  };
}

/**
 * Calculate bounds of the laid out nodes
 */
export function calculateBounds(nodes: LayoutedNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const positions = nodes.map(node => node.position);
  const minX = Math.min(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxX = Math.max(...positions.map(p => p.x));
  const maxY = Math.max(...positions.map(p => p.y));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
} 