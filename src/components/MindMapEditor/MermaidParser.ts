import { Node, Edge, MarkerType } from '@xyflow/react';
import { SimpleAdvancedNodeData as AdvancedNodeData } from './SimpleAdvancedNode';

export interface MermaidParseResult {
  nodes: Node<AdvancedNodeData>[];
  edges: Edge[];
}

export class MermaidParser {
  private nodeCounter = 0;
  private edgeCounter = 0;

  /**
   * Parse Mermaid mindmap syntax and convert to React Flow format
   */
  parseMermaidMindmap(mermaidCode: string): MermaidParseResult {
    const nodes: Node<AdvancedNodeData>[] = [];
    const edges: Edge[] = [];
    
    // Reset counters
    this.nodeCounter = 0;
    this.edgeCounter = 0;

    // Split into lines and clean up
    const lines = mermaidCode
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('%%') && !line.includes('mindmap') && !line.includes('init'));

    let rootNode: Node<AdvancedNodeData> | null = null;
    const nodeMap = new Map<string, Node<AdvancedNodeData>>();
    const parentStack: { node: Node<AdvancedNodeData>; indent: number }[] = [];

    for (const line of lines) {
      if (line.startsWith('root(')) {
        // Parse root node
        rootNode = this.parseRootNode(line);
        if (rootNode) {
          nodes.push(rootNode);
          nodeMap.set('root', rootNode);
          parentStack.push({ node: rootNode, indent: 0 });
        }
        continue;
      }

      // Calculate indentation level
      const indent = this.getIndentLevel(line);
      const content = line.trim();
      
      if (!content) continue;

      // Create node from content
      const node = this.createNodeFromContent(content, indent);
      if (!node) continue;

      nodes.push(node);
      nodeMap.set(node.id, node);

      // Find parent based on indentation
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].indent >= indent) {
        parentStack.pop();
      }

      if (parentStack.length > 0) {
        const parent = parentStack[parentStack.length - 1].node;
        
        // Create edge from parent to this node
        const edge: Edge = {
          id: `edge-${this.edgeCounter++}`,
          source: parent.id,
          target: node.id,
          type: 'smoothstep',
          style: { stroke: '#374151', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#374151' },
        };
        edges.push(edge);

        // Update parent's children
        if (!parent.data.children) {
          parent.data.children = [];
        }
        parent.data.children.push(node.id);
        node.data.parentId = parent.id;
      }

      parentStack.push({ node, indent });
    }

    // Apply layout to nodes
    this.applyRadialLayout(nodes, edges);

    return { nodes, edges };
  }

  /**
   * Parse root node from Mermaid syntax
   */
  private parseRootNode(line: string): Node<AdvancedNodeData> | null {
    const match = line.match(/root\(\((.*?)\)\)/);
    if (!match) return null;

    const label = this.extractLabelFromText(match[1]);
    
    return {
      id: 'root',
      type: 'advanced',
      position: { x: 400, y: 300 },
      data: {
        label,
        shape: 'circle',
        color: '#6B46C1',
        textColor: '#FFFFFF',
        borderColor: '#4C1D95',
        fontSize: 16,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        borderWidth: 3,
        borderStyle: 'solid',
        borderRadius: 50,
        shadow: 'large',
        rotation: 0,
        layer: 1,
        children: [],
      },
    };
  }

  /**
   * Create a node from Mermaid content line
   */
  private createNodeFromContent(content: string, indent: number): Node<AdvancedNodeData> | null {
    const label = this.extractLabelFromText(content);
    if (!label) return null;

    // Determine node properties based on content and indentation
    const nodeId = `node-${this.nodeCounter++}`;
    const isMainBranch = indent === 1;
    const isSubTopic = indent === 2;
    
    let shape: AdvancedNodeData['shape'] = 'rectangle';
    let color = '#F59E0B';
    let textColor = '#FFFFFF';
    let borderColor = '#D97706';

    if (isMainBranch) {
      shape = 'rectangle';
      color = '#F97316';
      borderColor = '#EA580C';
    } else if (isSubTopic) {
      color = '#F59E0B';
      borderColor = '#D97706';
    } else {
      color = '#EAB308';
      borderColor = '#CA8A04';
      textColor = '#000000';
    }

    return {
      id: nodeId,
      type: 'advanced',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        label,
        shape,
        color,
        textColor,
        borderColor,
        fontSize: isMainBranch ? 15 : 13,
        fontWeight: isMainBranch ? 'bold' : 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        borderWidth: 2,
        borderStyle: 'solid',
        borderRadius: 8,
        shadow: 'medium',
        rotation: 0,
        layer: 1,
        children: [],
      },
    };
  }

  /**
   * Extract clean label text from Mermaid content
   */
  private extractLabelFromText(text: string): string {
    // Clean up various Mermaid syntax elements
    let cleanText = text
      // Remove Mermaid node shapes and brackets
      .replace(/[\[\](){}]/g, '')
      // Remove CSS-like styling
      .replace(/[a-z-]+:[^;]+;?/gi, '')
      // Remove HTML-like tags
      .replace(/<[^>]*>/g, '')
      // Remove extra quotes
      .replace(/['"]/g, '')
      // Remove pic_l, pic_r and other Mermaid artifacts
      .replace(/pic_[lr]/g, '')
      // Remove CSS selectors and properties
      .replace(/te:|stroke-width:|fill:|color:/gi, '')
      // Remove numbers and special characters at the beginning
      .replace(/^[^a-zA-Z]+/, '')
      // Remove emojis but keep meaningful text
      .replace(/[📚⚡🔬📊💭🎯]/g, '')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    // If we end up with empty text, provide a default
    if (!cleanText) {
      cleanText = 'Node';
    }
    
    return cleanText;
  }

  /**
   * Calculate indentation level
   */
  private getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? Math.floor(match[1].length / 2) : 0;
  }

  /**
   * Apply radial layout to nodes
   */
  private applyRadialLayout(nodes: Node<AdvancedNodeData>[], edges: Edge[]): void {
    const rootNode = nodes.find(n => n.id === 'root');
    if (!rootNode) return;

    // Get all first-level children (main branches)
    const mainBranches = nodes.filter(node => 
      edges.some(edge => edge.source === 'root' && edge.target === node.id)
    );

    // Position main branches in a circle around root
    const radius = 250;
    const angleStep = (2 * Math.PI) / mainBranches.length;

    mainBranches.forEach((branch, index) => {
      const angle = index * angleStep - (Math.PI / 2); // Start at 12 o'clock
      branch.position = {
        x: rootNode.position.x + radius * Math.cos(angle),
        y: rootNode.position.y + radius * Math.sin(angle),
      };

      // Position children of this branch
      this.positionBranchChildren(branch, nodes, edges, angle, 150);
    });
  }

  /**
   * Position children of a branch
   */
  private positionBranchChildren(
    parentNode: Node<AdvancedNodeData>, 
    allNodes: Node<AdvancedNodeData>[], 
    edges: Edge[], 
    parentAngle: number, 
    distance: number
  ): void {
    const children = allNodes.filter(node =>
      edges.some(edge => edge.source === parentNode.id && edge.target === node.id)
    );

    if (children.length === 0) return;

    const angleSpread = Math.PI / 3; // 60 degrees spread
    const startAngle = parentAngle - angleSpread / 2;
    const angleStep = children.length > 1 ? angleSpread / (children.length - 1) : 0;

    children.forEach((child, index) => {
      const angle = startAngle + (index * angleStep);
      child.position = {
        x: parentNode.position.x + distance * Math.cos(angle),
        y: parentNode.position.y + distance * Math.sin(angle),
      };

      // Recursively position grandchildren
      this.positionBranchChildren(child, allNodes, edges, angle, distance * 0.7);
    });
  }
}

/**
 * Generate Mermaid mindmap syntax from React Flow nodes and edges
 */
export class MermaidGenerator {
  generateMermaidMindmap(nodes: Node<AdvancedNodeData>[], edges: Edge[]): string {
    let mermaidCode = 'mindmap\n';
    
    // Find root node
    const rootNode = nodes.find(n => n.id === 'root' || n.data.label.toLowerCase().includes('root'));
    if (!rootNode) {
      // Create a default root if none exists
      mermaidCode += '  root((Central Topic))\n';
    } else {
      const rootLabel = this.addEmojiToLabel(rootNode.data.label, '🎯');
      mermaidCode += `  root((${rootLabel}))\n`;
    }

    // Build hierarchy
    const hierarchy = this.buildHierarchy(nodes, edges, rootNode?.id || 'root');
    mermaidCode += this.generateHierarchyString(hierarchy, 1);

    return mermaidCode;
  }

  private buildHierarchy(
    nodes: Node<AdvancedNodeData>[], 
    edges: Edge[], 
    rootId: string
  ): { [key: string]: any } {
    const hierarchy: { [key: string]: any } = {};
    
    // Get direct children of root
    const rootChildren = edges
      .filter(edge => edge.source === rootId)
      .map(edge => nodes.find(n => n.id === edge.target))
      .filter(Boolean);

    rootChildren.forEach((child, index) => {
      if (!child) return;
      
      // Add emoji based on position/content
      const emojis = ['📚', '⚡', '🔬', '📊'];
      const emoji = emojis[index % emojis.length];
      const label = this.addEmojiToLabel(child.data.label, emoji);
      
      hierarchy[label] = this.getNodeChildren(child, nodes, edges);
    });

    return hierarchy;
  }

  private getNodeChildren(
    node: Node<AdvancedNodeData>, 
    allNodes: Node<AdvancedNodeData>[], 
    edges: Edge[]
  ): { [key: string]: any } {
    const children: { [key: string]: any } = {};
    
    const nodeChildren = edges
      .filter(edge => edge.source === node.id)
      .map(edge => allNodes.find(n => n.id === edge.target))
      .filter(Boolean);

    nodeChildren.forEach(child => {
      if (!child) return;
      children[child.data.label] = this.getNodeChildren(child, allNodes, edges);
    });

    return children;
  }

  private generateHierarchyString(hierarchy: { [key: string]: any }, depth: number): string {
    let result = '';
    const indent = '  '.repeat(depth);

    Object.entries(hierarchy).forEach(([key, value]) => {
      result += `${indent}${key}\n`;
      
      if (typeof value === 'object' && Object.keys(value).length > 0) {
        result += this.generateHierarchyString(value, depth + 1);
      }
    });

    return result;
  }

  private addEmojiToLabel(label: string, emoji: string): string {
    // Don't add emoji if it already has one
    if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(label)) {
      return label;
    }
    return `${emoji} ${label}`;
  }
} 