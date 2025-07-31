import { SensaAPI } from './api';
import { memoryService } from './supabaseServices';
// NOTE: To fix the import errors, you must add the `export` keyword
// to each of these type/interface definitions within your `./api.ts` file.
import type { 
    MermaidStudyMap, 
    UserMemory, 
    CourseAnalysisResult,
    ADKAgentResponse
} from './api'; 

/**
 * Integration service for Sensa AI Mindmap Generation.
 * Connects the frontend UI with the SensaAPI backend services.
 */
export class SensaMindmapIntegration {

  /**
   * Generate a personalized mindmap using the Sensa AI backend.
   * @param subject - The main topic/subject for the mindmap.
   * @param content - The content to analyze and create the mindmap from.
   * @param userId - User ID for personalization.
   * @param options - Additional options for mindmap generation.
   */
  static async generateMindmap({
    subject,
    content,
    userId,
    options = {}
  }: {
    subject: string;
    content: string;
    userId: string; // This is kept for potential future use or logging
    options?: {
      format?: string;
      style?: string;
      includeMemories?: boolean;
    };
  }): Promise<MermaidStudyMap> {
    try {
      // Get user memories for personalization if requested.
      let userMemories: UserMemory[] = [];
      
      if (options.includeMemories !== false) {
        try {
          // FIX: Calling getUserMemories without arguments to match its definition.
          const memories = await memoryService.getUserMemories();
          userMemories = (memories || []).map(memory => ({
            id: memory.id,
            category: memory.category || 'general',
            text_content: memory.text_content || '',
            sensa_analysis: memory.sensa_analysis || {}
          }));
        } catch (memoryError) {
          console.warn('Failed to fetch user memories, proceeding without them:', memoryError);
        }
      }

      // Call the Sensa AI backend using the dedicated mind map generation method.
      const mindmapData = await SensaAPI.generatePersonalizedMindMap({
          subject,
          content,
          user_memories: userMemories,
          format: options.format || 'default',
          style: options.style || 'default'
      });

      // Validate and return the mindmap data.
      if (SensaMindmapIntegration.validateMindmapData(mindmapData)) {
        return mindmapData;
      } else {
        console.error('Invalid mindmap data received from backend:', mindmapData);
        throw new Error('Invalid mindmap data received from backend');
      }
    } catch (error) {
      console.error('Sensa mindmap generation failed:', error);
      
      // Fallback to a basic mindmap structure on error.
      return {
        mermaid_code: `mindmap\n  root((${subject}))\n    Error\n      Failed to generate mindmap`,
        node_data: {
          error: 'Failed to generate personalized mindmap',
          fallback: true
        },
        legend_html: '<p style="color: #dc2626;">⚠️ Mindmap generation failed. Please try again.</p>'
      };
    }
  }

  /**
   * Generate a mindmap from existing course analysis data.
   * @param courseTitle - Title of the course.
   * @param analysisResult - The existing analysis result for the course.
   * @param userId - User ID for personalization.
   */
  static async generateFromCourseAnalysis({
    courseTitle,
    analysisResult,
    userId
  }: {
    courseTitle: string;
    analysisResult: CourseAnalysisResult;
    userId: string;
  }): Promise<MermaidStudyMap> {
    try {
      // Call the Sensa AI backend to generate a study map based on the course.
      const result = await SensaAPI.callADKAgents({
        agent_type: 'orchestrator',
        task: 'generate_ai_mind_map',
        payload: {
          subject: courseTitle,
          content: `Course: ${courseTitle}. Key topics: ${analysisResult.keyTopics ? analysisResult.keyTopics.join(', ') : 'No topics available'}`,
          memories: [],
          format: 'mermaid',
          style: 'mindmap'
        }
      });

      // Transform the result into mindmap format.
      const mindmapData = SensaMindmapIntegration.transformToMindmapData(result, {
        sourceType: 'course_analysis',
        courseId: analysisResult.courseId
      });

      return mindmapData;
    } catch (error) {
      console.error('Error generating mindmap from course analysis:', error);
      
      // Fallback to a basic mindmap structure.
      return {
        mermaid_code: `mindmap\n  root((${courseTitle}))\n    Error\n      Please try again`,
        node_data: {
          error: 'Failed to generate course analysis mindmap',
          fallback: true
        },
        legend_html: '<p style="color: #dc2626;">⚠️ Course analysis mindmap generation failed.</p>'
      };
    }
  }

  /**
   * Generate a mindmap from an uploaded document.
   * @param document - Document data with subject and content.
   * @param userId - User ID for personalization.
   */
  static async generateFromDocument({
    document,
    userId
  }: {
    document: {
      fileName: string;
      subject: string;
      content: string;
      topics?: string[];
    };
    userId: string;
  }): Promise<MermaidStudyMap> {
    try {
      // FIX: Calling getUserMemories without arguments to match its definition.
      let userMemories: UserMemory[] = [];
      try {
        const memories = await memoryService.getUserMemories();
        userMemories = (memories || []).map(memory => ({
            id: memory.id,
            category: memory.category || 'general',
            text_content: memory.text_content || '',
            sensa_analysis: memory.sensa_analysis || {}
        }));
      } catch (memoryError) {
        console.warn('Failed to fetch user memories for document mindmap, proceeding without them:', memoryError);
      }

      // Use the dedicated method for generating a mind map from content.
      const mindmapData = await SensaAPI.generatePersonalizedMindMap({
          subject: document.subject,
          content: document.content,
          user_memories: userMemories,
          format: 'document_style',
          style: 'detailed'
      });

      return mindmapData;
    } catch (error) {
      console.error('Error generating mindmap from document:', error);
      
      // Fallback to a basic mindmap structure.
      return {
        mermaid_code: `mindmap\n  root((${document.subject}))\n    Error\n      Please try again`,
        node_data: {
          error: 'Failed to generate document mindmap',
          fallback: true
        },
        legend_html: '<p style="color: #dc2626;">⚠️ Document mindmap generation failed.</p>'
      };
    }
  }

  /**
   * Validate the structure of the mindmap data.
   * @param mindmapData - The mindmap data to validate.
   */
  static validateMindmapData(mindmapData: any): mindmapData is MermaidStudyMap {
    return (
      mindmapData &&
      typeof mindmapData.mermaid_code === 'string' &&
      mindmapData.mermaid_code.trim().length > 0 &&
      typeof mindmapData.node_data === 'object' &&
      mindmapData.node_data !== null && // Ensure it's not null
      typeof mindmapData.legend_html === 'string'
    );
  }

  /**
   * Transform the raw ADK agent result into a structured mindmap format.
   * Handles both legacy mermaid_code format and new JSON schema-enforced node/edge structure.
   * @param result - The result from ADK agents.
   * @param metadata - Additional metadata for the transformation.
   */
  static transformToMindmapData(
    result: ADKAgentResponse, 
    metadata: Record<string, any> = {}
  ): MermaidStudyMap {
    console.log('🔍 [transformToMindmapData] Input result:', result);
    console.log('🔍 [transformToMindmapData] Input metadata:', metadata);
    
    // Safely access nested data from the API response.
    const data = result.data || result;
    console.log('🔍 [transformToMindmapData] Extracted data:', data);
    
    const studyMap = data.study_map || data.mindmap || data;
    console.log('🔍 [transformToMindmapData] Study map:', studyMap);
    
    // Check if we have the new JSON schema-enforced structure
    if (studyMap.nodes && studyMap.edges && Array.isArray(studyMap.nodes) && Array.isArray(studyMap.edges)) {
      console.log('✅ [transformToMindmapData] Using nodes/edges structure');
      console.log('🔍 [transformToMindmapData] Nodes:', studyMap.nodes);
      console.log('🔍 [transformToMindmapData] Edges:', studyMap.edges);
      
      // Convert nodes/edges structure to Mermaid mindmap format
      const mermaidCode = this.convertNodesToMermaidMindmap(studyMap.nodes, studyMap.edges, metadata);
      const nodeData = this.convertNodesToNodeData(studyMap.nodes);
      
      const result = {
        mermaid_code: mermaidCode,
        node_data: nodeData,
        legend_html: studyMap.legend_html || this.generateLegendFromNodes(studyMap.nodes)
      };
      
      console.log('✅ [transformToMindmapData] Final result (nodes/edges):', result);
      return result;
    }
    
    console.log('⚠️ [transformToMindmapData] Using fallback to legacy format');
    console.log('🔍 [transformToMindmapData] studyMap.mermaid_code:', studyMap.mermaid_code);
    
    // Fallback to legacy format
    const fallbackResult = {
      mermaid_code: studyMap.mermaid_code || `mindmap\n  root((${metadata.sourceType || 'Error'}))\n    Invalid data received`,
      node_data: studyMap.node_data || {},
      legend_html: studyMap.legend_html || '<p>Generated study map</p>'
    };
    
    console.log('✅ [transformToMindmapData] Final result (fallback):', fallbackResult);
    return fallbackResult;
  }

  /**
   * Convert nodes and edges arrays to Mermaid mindmap syntax.
   * @param nodes - Array of node objects with id, label, description
   * @param edges - Array of edge objects with source, target, label
   * @param metadata - Additional metadata for the conversion
   */
  private static convertNodesToMermaidMindmap(
    nodes: Array<{id: string, label: string, description: string, level?: number, parent_id?: string}>,
    edges: Array<{source: string, target: string, label?: string}>,
    metadata: Record<string, any> = {}
  ): string {
    try {
      // Find root nodes (nodes with no incoming edges or level 0)
      const targetIds = new Set(edges.map(edge => edge.target));
      const rootNodes = nodes.filter(node => 
        !targetIds.has(node.id) || node.level === 0 || node.parent_id === null
      );
      
      if (rootNodes.length === 0 && nodes.length > 0) {
        // If no clear root, use the first node
        rootNodes.push(nodes[0]);
      }
      
      let mermaidCode = 'mindmap\n';
      
      // Build hierarchical structure
      const processedNodes = new Set<string>();
      
      for (const rootNode of rootNodes) {
        mermaidCode += `  root((${rootNode.label}))\n`;
        mermaidCode = this.addChildrenToMermaid(rootNode.id, nodes, edges, mermaidCode, 2, processedNodes);
      }
      
      return mermaidCode;
    } catch (error) {
      console.error('Error converting nodes to Mermaid mindmap:', error);
      return `mindmap\n  root((${metadata.subject || 'Mindmap'}))\n    Error processing data`;
    }
  }

  /**
   * Recursively add children nodes to Mermaid mindmap code.
   */
  private static addChildrenToMermaid(
    parentId: string,
    nodes: Array<{id: string, label: string, description: string}>,
    edges: Array<{source: string, target: string, label?: string}>,
    mermaidCode: string,
    indentLevel: number,
    processedNodes: Set<string>
  ): string {
    let updatedCode = mermaidCode;
    const children = edges
      .filter(edge => edge.source === parentId)
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter(node => node && !processedNodes.has(node.id));
    
    for (const child of children) {
      if (child) {
        processedNodes.add(child.id);
        const indent = '  '.repeat(indentLevel);
        updatedCode += `${indent}${child.label}\n`;
        
        // Recursively add children (with depth limit to prevent infinite loops)
        if (indentLevel < 8) {
          updatedCode = this.addChildrenToMermaid(child.id, nodes, edges, updatedCode, indentLevel + 1, processedNodes);
        }
      }
    }
    
    return updatedCode;
  }

  /**
   * Convert nodes array to node_data object format.
   */
  private static convertNodesToNodeData(
    nodes: Array<{id: string, label: string, description: string, x?: number, y?: number}>
  ): Record<string, any> {
    const nodeData: Record<string, any> = {};
    
    for (const node of nodes) {
      nodeData[node.id] = {
        id: node.id,
        label: node.label,
        description: node.description,
        x: node.x || 0,
        y: node.y || 0
      };
    }
    
    return nodeData;
  }

  /**
   * Generate HTML legend from nodes array.
   */
  private static generateLegendFromNodes(
    nodes: Array<{id: string, label: string, description: string}>
  ): string {
    const nodeCount = nodes.length;
    const categories = [...new Set(nodes.map(node => node.label.split(' ')[0]))];
    
    return `
      <div class="mindmap-legend">
        <h4>Mindmap Overview</h4>
        <p><strong>Total Concepts:</strong> ${nodeCount}</p>
        <p><strong>Main Categories:</strong> ${categories.slice(0, 5).join(', ')}${categories.length > 5 ? '...' : ''}</p>
        <p><em>Generated with advanced AI prompt engineering and JSON schema enforcement</em></p>
      </div>
    `;
  }

  /**
   * Get the mindmap generation service status for debugging purposes.
   */
  static async getGenerationStatus(): Promise<{
    backendAvailable: boolean;
    lastError?: string;
    timestamp: string;
  }> {
    try {
      const healthCheck = await SensaAPI.healthCheck();
      return {
        backendAvailable: healthCheck.success,
        lastError: healthCheck.success ? undefined : healthCheck.error,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        backendAvailable: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default SensaMindmapIntegration;
