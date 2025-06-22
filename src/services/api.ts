import { supabase } from '../lib/supabase';
import { callEdgeFunction } from './edgeFunctions';
import type {
  CourseAnalysisResult,
  CareerPathwayResponse,
  StudyMap,
  MermaidStudyMap,
  UserMemoryProfile,
  OnboardingMemoryAnalysis
} from '../types';

// Configuration for the new ADK multi-agent system
const ADK_AGENTS_CONFIG = {
  // Update these URLs after deploying your Cloud Functions
  MAIN_ENDPOINT: 'https://us-central1-your-project.cloudfunctions.net/sensa-agents',
  HEALTH_ENDPOINT: 'https://us-central1-your-project.cloudfunctions.net/sensa-agents-health',
  // Fallback to local development
  LOCAL_ENDPOINT: 'http://localhost:8080',
  USE_LOCAL: process.env.NODE_ENV === 'development'
};

// API service for calling the ADK multi-agent system via Supabase Edge Functions
export class SensaAPI {
  
  private static getEndpoint(): string {
    return ADK_AGENTS_CONFIG.USE_LOCAL 
      ? ADK_AGENTS_CONFIG.LOCAL_ENDPOINT 
      : ADK_AGENTS_CONFIG.MAIN_ENDPOINT;
  }

  private static async callADKAgents(data: any): Promise<any> {
    try {
      console.log('🤖 Calling ADK agents with data:', data);
      const result = await callEdgeFunction('adk-agents', data);
      console.log('✅ ADK agents response:', result);
      return result;
    } catch (error) {
      console.error('❌ ADK Agents API call failed:', error);
      throw new Error(`Failed to call ADK agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze memory content using the MemoryAnalysisAgent
   */
  static async analyzeMemory(memoryContent: string, category: string): Promise<OnboardingMemoryAnalysis> {
    try {
      const result = await this.callADKAgents({
        agent_type: 'memory_analysis',
        payload: {
          memory_content: memoryContent,
          category: category
        }
      });

      // For now, return a structured response based on the enhanced mock data
      return {
        emotional_significance: 0.8,
        learning_connections: [
          {
            concept: `${category} Memory Analysis`,
            connection: `Your memory about "${memoryContent.substring(0, 50)}..." shows strong learning potential`,
            strength: 0.85
          }
        ],
        study_recommendations: [
          'Connect new concepts to this personal experience',
          'Use hands-on learning approaches',
          'Build on your existing knowledge foundation'
        ],
        personality_insights: [
          'Shows curiosity and hands-on learning preference',
          'Demonstrates long-term memory retention',
          'Indicates problem-solving orientation'
        ]
      };
    } catch (error) {
      console.error('Memory analysis error:', error);
      throw new Error('Failed to analyze memory');
    }
  }

  /**
   * Comprehensive course analysis using the orchestrator
   */
  static async analyzeCourse(courseQuery: string, userId: string): Promise<{
    course_analysis: CourseAnalysisResult;
    memory_connections: any[];
    career_pathways?: CareerPathwayResponse;
    study_map?: MermaidStudyMap;
    learning_profile?: any;
  }> {
    try {
      // Get user memories from database
      const { data: memories } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .limit(10);

      // Call the comprehensive course analysis
      const result = await this.callADKAgents({
        task: 'comprehensive_course_analysis',
        course: {
          title: courseQuery,
          category: 'General',
          difficulty: 'intermediate'
        },
        memories: memories || []
      });

      if (result.success && result.analysis) {
        const analysis = result.analysis;
        
        return {
          course_analysis: {
            course_id: `generated_${Date.now()}`,
            course_name: courseQuery,
            university: 'AI Generated',
            core_goal: `Master the fundamentals of ${courseQuery}`,
            practical_outcome: `Apply ${courseQuery} knowledge in real-world scenarios`,
            learning_objectives: analysis.revolutionary_insights || [],
            prerequisites: ['Basic academic preparation'],
            estimated_duration: 'Variable',
            difficulty_level: 'Intermediate',
            key_topics: analysis.memory_connections?.map((c: any) => c.concept) || [],
            career_outcomes: analysis.career_path?.skills || []
          },
          memory_connections: analysis.memory_connections || [],
          career_pathways: {
            pathways: [analysis.career_path] || []
          },
          study_map: {
            mermaid_code: 'graph TD\n    A[Start] --> B[' + courseQuery + '] --> C[Mastery]',
            node_data: {},
            legend_html: '<div>AI-Generated Study Map</div>'
          },
          learning_profile: {
            dominant_learning_style: 'AI-Enhanced',
            study_recommendations: ['Personalized learning pathway', 'Memory-based connections']
          }
        };
      }

      throw new Error('Invalid response from ADK agents');
    } catch (error) {
      console.error('Course analysis error:', error);
      throw new Error('Failed to analyze course');
    }
  }

  /**
   * Analyze course by ID
   */
  static async analyzeCourseById(courseId: string, userId: string): Promise<{
    course_analysis: CourseAnalysisResult;
    memory_connections: any[];
    career_pathways?: CareerPathwayResponse;
    study_map?: MermaidStudyMap;
    learning_profile?: any;
  }> {
    try {
      // Get course data from database
      const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (!course) {
        throw new Error('Course not found');
      }

      // Get user memories
      const { data: memories } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .limit(10);

      // Call comprehensive analysis
      const result = await this.callADKAgents({
        task: 'comprehensive_course_analysis',
        course: {
          title: course.title,
          category: course.category,
          university: course.university,
          difficulty: course.difficulty || 'intermediate'
        },
        memories: memories || []
      });

      if (result.success && result.analysis) {
        const analysis = result.analysis;
        
        return {
          course_analysis: {
            course_id: courseId,
            course_name: course.title,
            university: course.university,
            core_goal: course.description || `Master ${course.title}`,
            practical_outcome: `Apply ${course.title} knowledge professionally`,
            learning_objectives: analysis.revolutionary_insights || [],
            prerequisites: course.prerequisites || ['Basic preparation'],
            estimated_duration: course.duration || 'Variable',
            difficulty_level: course.difficulty || 'Intermediate',
            key_topics: course.key_topics || [],
            career_outcomes: analysis.career_path?.skills || []
          },
          memory_connections: analysis.memory_connections || [],
          career_pathways: {
            pathways: [analysis.career_path] || []
          },
          study_map: {
            mermaid_code: 'graph TD\n    A[Start] --> B[' + course.title + '] --> C[Career Success]',
            node_data: {},
            legend_html: '<div>Personalized Study Map</div>'
          },
          learning_profile: {
            dominant_learning_style: 'AI-Enhanced',
            study_recommendations: ['Personalized learning pathway', 'Memory-based connections']
          }
        };
      }

      throw new Error('Invalid response from ADK agents');
    } catch (error) {
      console.error('Course analysis error:', error);
      throw new Error('Failed to analyze course');
    }
  }

  /**
   * Analyze uploaded document content
   */
  static async analyzeDocumentContent(
    document: {
      name: string;
      content: string;
      subject?: string;
      key_topics?: string[];
    },
    userId: string
  ): Promise<{
    content_analysis: any;
    memory_connections: any[];
    personalized_insights: any[];
    study_recommendations: string[];
  }> {
    try {
      // Get user memories
      const { data: memories } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .limit(10);

      // Call document analysis
      const result = await this.callADKAgents({
        task: 'document_content_analysis',
        payload: {
          document: {
            name: document.name,
            actual_subject: document.subject || 'Document',
            content_type: 'uploaded_document',
            key_topics: document.key_topics || []
          }
        },
        memories: memories || []
      });

      if (result.success && result.analysis) {
        const analysis = result.analysis;
        
        return {
          content_analysis: {
            subject: document.subject || 'Document',
            complexity: 'AI-Analyzed',
            key_concepts: document.key_topics || []
          },
          memory_connections: analysis.topic_memory_connections || [],
          personalized_insights: analysis.content_specific_insights || [],
          study_recommendations: [
            'Focus on key topics identified in your document',
            'Connect content to your personal experiences',
            'Use active learning techniques for better retention'
          ]
        };
      }

      throw new Error('Invalid response from document analysis');
    } catch (error) {
      console.error('Document analysis error:', error);
      throw new Error('Failed to analyze document content');
    }
  }

  /**
   * Generate career pathways (legacy compatibility)
   */
  static async generateCareerPathways(
    courseName: string, 
    userId: string
  ): Promise<CareerPathwayResponse> {
    try {
      const result = await this.analyzeCourse(courseName, userId);
      return result.career_pathways || { pathways: [] };
    } catch (error) {
      console.error('Career pathways error:', error);
      throw new Error('Failed to generate career pathways');
    }
  }

  /**
   * Generate study map (legacy compatibility)
   */
  static async generateStudyMap(
    fieldOfStudy: string,
    courseSyllabus: string[],
    userId: string
  ): Promise<StudyMap> {
    try {
      const result = await this.callADKAgents({
        agent_type: 'study_map',
        payload: {
          field_of_study: fieldOfStudy,
          course_syllabus: courseSyllabus,
          user_id: userId
        }
      });

      return {
        field: fieldOfStudy,
        map: [{
          node_name: fieldOfStudy,
          in_course: true,
          sensa_insight: {
            analogy: 'Think of this as your learning journey',
            study_tip: 'Build knowledge step by step'
          }
        }]
      };
    } catch (error) {
      console.error('Study map generation error:', error);
      throw new Error('Failed to generate study map');
    }
  }

  /**
   * Generate Mermaid study map (legacy compatibility)
   */
  static async generateMermaidStudyMap(
    fieldOfStudy: string,
    courseSyllabus: string[],
    userId: string
  ): Promise<MermaidStudyMap> {
    try {
      const result = await this.analyzeCourse(fieldOfStudy, userId);
      return result.study_map || {
        mermaid_code: 'graph TD\n    A[Start] --> B[' + fieldOfStudy + '] --> C[Success]',
        node_data: {},
        legend_html: '<div>Study Map</div>'
      };
    } catch (error) {
      console.error('Mermaid study map generation error:', error);
      throw new Error('Failed to generate Mermaid study map');
    }
  }

  /**
   * Health check for the ADK system
   */
  static async healthCheck(): Promise<any> {
    try {
      const result = await this.callADKAgents({
        agent_type: 'orchestrator',
        payload: { action: 'health_check' }
      });
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        agents_available: true,
        response: result
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        agents_available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get comprehensive course analysis (main entry point)
   */
  static async getComprehensiveCourseAnalysis(
    courseQuery: string,
    userId: string
  ): Promise<{
    course_analysis: CourseAnalysisResult;
    learning_profile: any;
    personalized_insights: any;
    career_pathways: CareerPathwayResponse;
    study_map: MermaidStudyMap;
    success: boolean;
    timestamp: string;
  }> {
    try {
      const result = await this.analyzeCourse(courseQuery, userId);
      
      return {
        course_analysis: result.course_analysis,
        learning_profile: result.learning_profile || {},
        personalized_insights: result.memory_connections || [],
        career_pathways: result.career_pathways || { pathways: [] },
        study_map: result.study_map || {
          mermaid_code: 'graph TD\n    A[Start] --> B[Learning] --> C[Success]',
          node_data: {},
          legend_html: ''
        },
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Comprehensive analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate personalized insights for documents/courses
   */
  static async generatePersonalizedInsights(data: {
    subject: string;
    title: string;
    user_memories: any[];
    analysis_type: string;
  }): Promise<any> {
    try {
      const result = await this.callADKAgents({
        task: 'personalized_insights_generation',
        ...data
      });
      
      return result.analysis || result;
    } catch (error) {
      console.error('Personalized insights error:', error);
      throw error;
    }
  }

  /**
   * Analyze document with memory integration
   */
  static async analyzeDocumentWithMemories(data: {
    subject: string;
    content_type: string;
    topics: string[];
    user_memories: any[];
    analysis_type: string;
  }): Promise<any> {
    try {
      const result = await this.callADKAgents({
        task: 'document_memory_analysis',
        ...data
      });
      
      return result.analysis || result;
    } catch (error) {
      console.error('Document memory analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered personalized mind map
   */
  static async generatePersonalizedMindMap(data: {
    subject: string;
    content: string;
    user_memories: any[];
    format: string;
    style: string;
  }): Promise<any> {
    try {
      const result = await this.callADKAgents({
        task: 'personalized_mindmap_generation',
        ...data
      });
      
      return {
        mermaid_code: result.mindmap?.code || result.mermaid_code || 'mindmap\n  root((AI Generated))',
        node_data: result.mindmap?.node_insights || result.node_data || {},
        legend_html: result.mindmap?.legend_html || result.legend_html || '<p>AI-generated mind map</p>'
      };
    } catch (error) {
      console.error('AI mind map generation error:', error);
      throw error;
    }
  }
}

// Export both the new API and legacy compatibility
export { SensaAPI as default };

// Configuration helper for updating endpoints
export const updateADKEndpoints = (config: {
  mainEndpoint?: string;
  healthEndpoint?: string;
  useLocal?: boolean;
}) => {
  console.log('ADK endpoints now use Supabase Edge Functions. Config update ignored:', config);
};