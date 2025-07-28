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

// API-specific interfaces
interface ADKAgentRequest {
  agent_type: string;
  payload: Record<string, unknown>;
}

interface ADKAgentResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown;
}

interface MemoryConnection {
  memory_id: string;
  relevance_score: number;
  connection_type: string;
  description?: string;
}

interface ContentAnalysis {
  subject: string;
  complexity_level: string;
  key_concepts: string[];
  learning_objectives: string[];
  [key: string]: unknown;
}

interface PersonalizedInsight {
  insight_type: string;
  content: string;
  relevance_score: number;
  memory_connection?: string;
  [key: string]: unknown;
}

interface UserMemory {
  id: string;
  category: string;
  text_content: string;
  sensa_analysis?: Record<string, unknown>;
  [key: string]: unknown;
}

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

  private static async callADKAgents(data: ADKAgentRequest): Promise<ADKAgentResponse> {
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
      // Call ADK agents for memory analysis
      await this.callADKAgents({
        agent_type: 'memory_analysis',
        payload: {
          memory_content: memoryContent,
          category: category
        }
      });

      // For now, return a structured response based on the enhanced mock data
      return {
        themes: [category, 'Personal Experience'],
        emotionalTone: 'Positive',
        learningIndicators: [
          'Shows curiosity and hands-on learning preference',
          'Demonstrates long-term memory retention',
          'Indicates problem-solving orientation'
        ],
        followUpSuggestions: [
          'Connect new concepts to this personal experience',
          'Use hands-on learning approaches',
          'Build on your existing knowledge foundation'
        ],
        confidence: 0.8
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
    memory_connections: MemoryConnection[];
    career_pathways?: CareerPathwayResponse;
    study_map?: MermaidStudyMap;
    learning_profile?: UserMemoryProfile;
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
        agent_type: 'orchestrator',
        task: 'comprehensive_course_analysis',
        payload: {
          course: {
            title: courseQuery,
            category: 'General',
            difficulty: 'intermediate'
          },
          memories: memories || []
        }
      });

      // Handle both successful AI responses and fallback responses
      if (result.success) {
        // Check if we have a fallback response from failed AI generation
        if (result.data && !result.data.success && result.data.fallback_guide) {
          const fallbackGuide = result.data.fallback_guide;
                     return {
             course_analysis: {
               courseId: `generated_${Date.now()}`,
               courseName: courseQuery,
               university: 'AI Generated',
               coreGoal: (result.data as any)?.fallback_guide?.framework?.description || `Master the fundamentals of ${courseQuery}`,
               practicalOutcome: `Apply ${courseQuery} knowledge in real-world scenarios`,
               learningObjectives: (result.data as any)?.fallback_guide?.pillars?.map((p: any) => p.studyFocus) || [`Master the fundamentals of ${courseQuery}`],
               prerequisites: ['Basic academic preparation'],
               estimatedDuration: 'Variable',
               difficultyLevel: 'Intermediate' as const,
               keyTopics: (result.data as any)?.fallback_guide?.pillars?.flatMap((p: any) => p.subTopics?.map((st: any) => st.conceptPair) || []) || [],
               careerOutcomes: ['Professional development', 'Enhanced skills']
             },
            memory_connections: [],
            career_pathways: {
              pathways: []
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
        
        // Handle normal successful response with analysis
        if (result.analysis) {
          const analysis = result.analysis;
          
                     return {
             course_analysis: {
               courseId: `generated_${Date.now()}`,
               courseName: courseQuery,
               university: 'AI Generated',
               coreGoal: `Master the fundamentals of ${courseQuery}`,
               practicalOutcome: `Apply ${courseQuery} knowledge in real-world scenarios`,
               learningObjectives: (analysis as any)?.revolutionary_insights || [`Master the fundamentals of ${courseQuery}`],
               prerequisites: ['Basic academic preparation'],
               estimatedDuration: 'Variable',
               difficultyLevel: 'Intermediate' as const,
               keyTopics: (analysis as any)?.memory_connections?.map((c: any) => c.description || 'Topic') || [],
               careerOutcomes: (analysis as any)?.career_path?.skills || []
             },
             memory_connections: (analysis as any)?.memory_connections || [],
             career_pathways: {
               pathways: (analysis as any)?.career_path ? [(analysis as any).career_path] : []
             },
             study_map: {
               mermaid_code: 'graph TD\n    A[Start] --> B[' + courseQuery + '] --> C[Mastery]',
               node_data: {},
               legend_html: '<div>AI-Generated Study Map</div>'
             },
             learning_profile: {
               memories: []
             }
           };
        }
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
    memory_connections: MemoryConnection[];
    career_pathways?: CareerPathwayResponse;
    study_map?: MermaidStudyMap;
    learning_profile?: UserMemoryProfile;
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
            pathways: analysis.career_path ? [analysis.career_path] : []
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
    content_analysis: ContentAnalysis;
    memory_connections: MemoryConnection[];
    personalized_insights: PersonalizedInsight[];
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
        agent_type: 'orchestrator',
        task: 'document_content_analysis',
        payload: {
          document: {
            name: document.name,
            actual_subject: document.subject || 'Document',
            content_type: 'uploaded_document',
            key_topics: document.key_topics || []
          },
          memories: memories || []
        }
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
      // Call ADK agents for study map generation
      await this.callADKAgents({
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
  static async healthCheck(): Promise<{ status: string; timestamp: string; success: boolean }> {
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
    learning_profile: UserMemoryProfile;
    personalized_insights: PersonalizedInsight[];
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
    user_memories: UserMemory[];
    analysis_type: string;
  }): Promise<PersonalizedInsight[]> {
    try {
      const result = await this.callADKAgents({
        agent_type: 'personalization',
        payload: data
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
    user_memories: UserMemory[];
    analysis_type: string;
  }): Promise<ContentAnalysis> {
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
    user_memories: UserMemory[];
    format: string;
    style: string;
  }): Promise<MermaidStudyMap> {
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

  /**
   * Generate AI-powered study guide from exam content
   */
  static async generateStudyGuide(data: {
    examContent: string;
    subjectName: string;
    userId?: string;
  }): Promise<{
    id: string;
    subject: string;
    framework: {
      acronym: string;
      name: string;
      description: string;
    };
    pillars: Array<{
      name: string;
      thematicName: string;
      studyFocus: string;
      subAcronym?: string;
      subTopics: Array<{
        priority: string;
        conceptPair: string;
        pyramid: {
          base: string;
          middle: string;
          apex: string;
          keyTakeaway: string;
        };
      }>;
    }>;
    createdAt: Date;
  }> {
    try {
      // Get user memories if userId provided
      let memories: UserMemory[] = [];
      if (data.userId) {
        const { data: userMemories } = await supabase
          .from('memories')
          .select('*')
          .eq('user_id', data.userId)
          .limit(10);
        memories = userMemories || [];
      }

      // Call ADK agents for study guide generation
      const result = await this.callADKAgents({
        agent_type: 'study_guide',
        payload: {
          task: 'study_guide_generation',
          exam_content: data.examContent,
          subject_name: data.subjectName,
          user_memories: memories,
          format: 'structured_guide',
          include_frameworks: true,
          include_pyramids: true
        }
      });

      console.log('🔍 Raw ADK response:', JSON.stringify(result, null, 2));

      if (result.success && (result.data || result.study_guide)) {
        // The ADK agents return study guide data under 'study_guide' key or 'data' key
        let analysis = result.study_guide || result.data;

        console.log('📊 Study guide data received:', JSON.stringify(analysis, null, 2));

        // Check if this is a fallback response with fallback_guide
        if (analysis.fallback_guide) {
          console.log('🔄 Using fallback guide from ADK response');
          analysis = analysis.fallback_guide;
        }

        // Transform AI response to expected format
        return {
          id: `guide-${Date.now()}`,
          subject: data.subjectName,
          framework: {
            acronym: analysis.framework?.acronym || 'STUDY',
            name: analysis.framework?.name || 'Strategic Study Framework',
            description: analysis.framework?.description || `A comprehensive framework for mastering ${data.subjectName}.`
          },
          pillars: analysis.pillars || [],
          createdAt: new Date()
        };
      }

      // Fallback to mock data if AI service fails
      console.warn('AI service returned invalid response, using fallback');
      console.log('📋 Full ADK response:', result);
      return this.createFallbackStudyGuide(data.subjectName);
    } catch (error) {
      console.error('Study guide generation error:', error);

      // Return fallback guide instead of throwing error
      console.warn('Using fallback study guide due to AI service error');
      return this.createFallbackStudyGuide(data.subjectName);
    }
  }

  /**
   * Create fallback study guide when AI service is unavailable
   */
  private static createFallbackStudyGuide(subjectName: string) {
    return {
      id: `guide-fallback-${Date.now()}`,
      subject: subjectName,
      framework: {
        acronym: 'SMART',
        name: 'Strategic Mastery and Retention Techniques',
        description: `This is a demo guide for ${subjectName}. It provides a structured approach to studying, breaking down core domains into manageable pillars.`
      },
      pillars: [
        {
          name: 'Strategic Foundation',
          thematicName: 'Strategy',
          studyFocus: 'This pillar focuses on building fundamental understanding and strategic thinking. Students will develop core analytical skills essential for advanced problem-solving.',
          subAcronym: 'CORE',
          subTopics: [
            {
              priority: '[High Priority]',
              conceptPair: 'Basic Concepts vs. Advanced Applications',
              pyramid: {
                base: 'Students struggle to understand fundamental principles and their real-world applications.',
                middle: 'Learn core theories, definitions, and basic problem-solving frameworks.',
                apex: 'Complex scenarios arise where basic theories must be adapted and integrated with advanced concepts.',
                keyTakeaway: 'Master the fundamentals first, then build complexity through practical application.'
              }
            }
          ]
        }
      ],
      createdAt: new Date()
    };
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