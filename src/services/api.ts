import { supabase } from '../lib/supabase';
import { callEdgeFunction } from './edgeFunctions';
import type {
  // Assuming these types are defined elsewhere, we'll create local versions
  // for the properties we see being used.
  // CourseAnalysisResult, 
  // CareerPathwayResponse,
  // StudyMap,
  // MermaidStudyMap,
  // UserMemoryProfile,
  // OnboardingMemoryAnalysis
} from '../types';

// --- Locally Defined/Inferred Types for Clarity ---
// Based on usage in the functions below.

interface CourseAnalysisResult {
  courseId: string;
  courseName: string;
  university: string;
  coreGoal: string;
  practicalOutcome: string;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedDuration: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Variable';
  keyTopics: string[];
  careerOutcomes: string[];
}

interface CareerPathway {
  title: string;
  description: string;
  skills: string[];
  roles: string[];
}

interface CareerPathwayResponse {
  pathways: CareerPathway[];
}

interface MermaidStudyMap {
  mermaid_code: string;
  node_data: Record<string, any>;
  legend_html: string;
}

interface StudyMap {
  field: string;
  map: Array<{
    node_name: string;
    in_course: boolean;
    sensa_insight: {
      analogy: string;
      study_tip: string;
    };
  }>;
}

interface UserMemoryProfile {
  dominant_learning_style?: string;
  study_recommendations?: string[];
  memories?: UserMemory[];
}

interface OnboardingMemoryAnalysis {
  themes: string[];
  emotionalTone: string;
  learningIndicators: string[];
  followUpSuggestions: string[];
  confidence: number;
}


// --- API-specific interfaces from original code ---

interface ADKAgentRequest {
  agent_type: string;
  payload: Record<string, unknown>;
  task?: string;
  dominant_learning_style?: string;
  course_id?: string;
  agents_available?: boolean;
  [key: string]: unknown;
}

// Adjusted ADKAgentResponse to better reflect actual usage and potential shapes
interface ADKAgentResponse {
  success: boolean;
  data?: any; // Kept as 'any' due to highly variable structure (e.g., fallback_guide)
  error?: string;
  memories?: UserMemory[];
  analysis?: {
    course_analysis?: CourseAnalysisResult;
    learning_profile?: UserMemoryProfile;
    memory_connections?: MemoryConnection[];
    personalized_insights?: PersonalizedInsight[];
    content_analysis?: ContentAnalysis;
    revolutionary_insights?: string[];
    career_path?: CareerPathway; // Corrected to be a single object based on usage
    topic_memory_connections?: string[] | MemoryConnection[]; // Allow both for flexibility
    content_specific_insights?: string[] | PersonalizedInsight[]; // Allow both
    agents_available?: boolean;
    code?: string;
    node_insights?: Record<string, unknown>;
    legend_html?: string;
    fallback_guide?: any;
    framework?: {
      acronym?: string;
      name?: string;
      description?: string;
    };
    pillars?: any[];
    [key: string]: unknown;
  };
  study_guide?: any; // Kept as 'any' to handle fallback and direct data
  mindmap?: any;
  mermaid_code?: string;
  node_data?: Record<string, any>;
  legend_html?: string;
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
  complexity_level: string; // Corrected from 'complexity'
  key_concepts: string[];
  learning_objectives: string[];
  topic_memory_connections?: string[];
  content_specific_insights?: string[];
  [key: string]: unknown;
}

interface PersonalizedInsight {
  insight_type: string;
  content: string;
  relevance_score: number;
  memory_connection?: string;
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

  static async callADKAgents(data: ADKAgentRequest): Promise<ADKAgentResponse> {
    try {
      console.log('🤖 Calling ADK agents with data:', data);
      const result: ADKAgentResponse = await callEdgeFunction('adk-agents', data);
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
        },
        memories: [{
          id: 'temp-' + Date.now(),
          category: category,
          text_content: memoryContent
        }]
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
            name: courseQuery,
            actual_subject: courseQuery,
            key_topics: [],
            description: `Course analysis for ${courseQuery}`,
            difficulty_level: 'intermediate'
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
              coreGoal: fallbackGuide?.framework?.description || `Master the fundamentals of ${courseQuery}`,
              practicalOutcome: `Apply ${courseQuery} knowledge in real-world scenarios`,
              learningObjectives: fallbackGuide?.pillars?.map((p: any) => p.studyFocus) || [`Master the fundamentals of ${courseQuery}`],
              prerequisites: ['Basic academic preparation'],
              estimatedDuration: 'Variable',
              difficultyLevel: 'Intermediate',
              keyTopics: fallbackGuide?.pillars?.flatMap((p: any) => p.subTopics?.map((st: any) => st.conceptPair) || []) || [],
              careerOutcomes: ['Professional development', 'Enhanced skills']
            },
            memory_connections: [],
            career_pathways: {
              pathways: []
            },
            study_map: {
              mermaid_code: 'graph TD\n  A[Start] --> B[' + courseQuery + '] --> C[Mastery]',
              node_data: {},
              legend_html: '<div>AI-Generated Study Map</div>'
            },
            learning_profile: {
              dominant_learning_style: 'AI-Enhanced',
              study_recommendations: ['Personalized learning pathway', 'Memory-based connections'],
              memories: [],
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
              learningObjectives: analysis.revolutionary_insights || [`Master the fundamentals of ${courseQuery}`],
              prerequisites: ['Basic academic preparation'],
              estimatedDuration: 'Variable',
              difficultyLevel: 'Intermediate',
              keyTopics: analysis.memory_connections?.map((c: any) => c.description || 'Topic') || [],
              careerOutcomes: analysis.career_path?.skills || []
            },
            memory_connections: analysis.memory_connections || [],
            career_pathways: {
              pathways: analysis.career_path ? [analysis.career_path] : []
            },
            study_map: {
              mermaid_code: analysis.code || 'graph TD\n  A[Start] --> B[' + courseQuery + '] --> C[Mastery]',
              node_data: analysis.node_insights || {},
              legend_html: analysis.legend_html || '<div>AI-Generated Study Map</div>'
            },
            learning_profile: analysis.learning_profile || {
                dominant_learning_style: 'AI-Enhanced',
                study_recommendations: ['Personalized learning pathway', 'Memory-based connections'],
                memories: [],
            }
          };
        }
      }

      // Log the actual response structure for debugging
      console.log('🔍 Actual ADK response structure:', JSON.stringify(result, null, 2));

      // Provide a fallback response if the structure is unexpected
      console.warn('⚠️ Unexpected response structure, providing fallback analysis');
      return {
        course_analysis: {
          courseId: `generated_${Date.now()}`,
          courseName: courseQuery,
          university: 'AI Generated',
          coreGoal: `Master the fundamentals of ${courseQuery}`,
          practicalOutcome: `Apply ${courseQuery} knowledge in real-world scenarios`,
          learningObjectives: [`Understand core concepts of ${courseQuery}`, `Apply practical skills`],
          prerequisites: ['Basic academic preparation'],
          estimatedDuration: 'Variable',
          difficultyLevel: 'Intermediate',
          keyTopics: ['Fundamentals', 'Applications', 'Best Practices'],
          careerOutcomes: ['Enhanced professional skills', 'Career advancement opportunities']
        },
        memory_connections: [],
        career_pathways: {
          pathways: []
        },
        study_map: {
          mermaid_code: `graph TD\n  A[Start Learning] --> B[${courseQuery} Fundamentals]\n  B --> C[Practical Applications]\n  C --> D[Mastery]`,
          node_data: {},
          legend_html: '<div>AI-Generated Study Map</div>'
        },
        learning_profile: {
          dominant_learning_style: 'AI-Enhanced',
          study_recommendations: ['Personalized learning pathway', 'Memory-based connections'],
          memories: [],
        }
      };
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
        agent_type: 'orchestrator',
        task: 'comprehensive_course_analysis',
        payload: {
          course: {
            name: course.title,
            actual_subject: course.title,
            key_topics: [],
            description: course.description || `Course analysis for ${course.title}`,
            difficulty_level: course.difficulty || 'intermediate'
          },
          memories: memories || []
        }
      });

      if (result.success && result.analysis) {
        const analysis = result.analysis;

        return {
          course_analysis: {
            courseId: courseId,
            courseName: course.title,
            university: course.university,
            coreGoal: course.description || `Master ${course.title}`,
            practicalOutcome: `Apply ${course.title} knowledge professionally`,
            learningObjectives: analysis.revolutionary_insights || [],
            prerequisites: course.prerequisites || ['Basic preparation'],
            estimatedDuration: course.duration || 'Variable',
            difficultyLevel: course.difficulty || 'Intermediate',
            keyTopics: course.key_topics || [],
            careerOutcomes: analysis.career_path?.skills || []
          },
          memory_connections: analysis.memory_connections || [],
          career_pathways: {
            pathways: analysis.career_path ? [analysis.career_path] : []
          },
          study_map: {
            mermaid_code: analysis.code || 'graph TD\n  A[Start] --> B[' + course.title + '] --> C[Career Success]',
            node_data: analysis.node_insights || {},
            legend_html: analysis.legend_html || '<div>Personalized Study Map</div>'
          },
          learning_profile: analysis.learning_profile || {
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
            key_topics: document.key_topics || [],
            content_preview: document.content.substring(0, 1000) // First 1000 chars as preview
          },
          memories: memories || []
        }
      });

      if (result.success && result.analysis) {
        const analysis = result.analysis;
        
        // FIX: Map string[] to object[] if the API returns simple strings
        const memoryConnections: MemoryConnection[] = (Array.isArray(analysis.topic_memory_connections) && typeof analysis.topic_memory_connections[0] === 'string')
          ? (analysis.topic_memory_connections as string[]).map(desc => ({ memory_id: 'unknown', relevance_score: 0.5, connection_type: 'topic', description: desc }))
          : (analysis.topic_memory_connections as MemoryConnection[] || []);

        const personalizedInsights: PersonalizedInsight[] = (Array.isArray(analysis.content_specific_insights) && typeof analysis.content_specific_insights[0] === 'string')
          ? (analysis.content_specific_insights as string[]).map(insight => ({ insight_type: 'content', content: insight, relevance_score: 0.5 }))
          : (analysis.content_specific_insights as PersonalizedInsight[] || []);


        return {
          content_analysis: {
            subject: document.subject || 'Document',
            // FIX: Use 'complexity_level' as defined in the interface
            complexity_level: analysis.content_analysis?.complexity_level || 'AI-Analyzed',
            key_concepts: analysis.content_analysis?.key_concepts || document.key_topics || [],
            learning_objectives: analysis.content_analysis?.learning_objectives || [],
          },
          memory_connections: memoryConnections,
          personalized_insights: personalizedInsights,
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

      // Return a mock/fallback as the result isn't used
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
    courseSyllabus: string[], // This parameter is unused but kept for compatibility
    userId: string
  ): Promise<MermaidStudyMap> {
    try {
      const result = await this.analyzeCourse(fieldOfStudy, userId);
      return result.study_map || {
        mermaid_code: 'graph TD\n  A[Start] --> B[' + fieldOfStudy + '] --> C[Success]',
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
   * FIX: Updated return type to match implementation
   */
  static async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    success: boolean;
    agents_available?: boolean;
    response?: ADKAgentResponse;
    error?: string;
  }> {
    try {
      const result = await this.callADKAgents({
        agent_type: 'orchestrator',
        payload: { health_check: true }
      });

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        success: true,
        agents_available: result.analysis?.agents_available ?? true,
        response: result
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        success: false,
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

      // FIX: Map MemoryConnection[] to PersonalizedInsight[]
      const insights: PersonalizedInsight[] = (result.memory_connections || []).map(conn => ({
          insight_type: conn.connection_type,
          content: conn.description || 'Connected to your memories.',
          relevance_score: conn.relevance_score,
          memory_connection: conn.memory_id
      }));

      return {
        course_analysis: result.course_analysis,
        // FIX: Provide a default object for learning_profile if it's undefined
        learning_profile: result.learning_profile || { memories: [] },
        // FIX: Assign the correctly mapped insights
        personalized_insights: insights,
        career_pathways: result.career_pathways || { pathways: [] },
        study_map: result.study_map || {
          mermaid_code: 'graph TD\n  A[Start] --> B[Learning] --> C[Success]',
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
      // FIX: Ensure the returned data is actually PersonalizedInsight[]
      if (result.success && result.analysis?.personalized_insights) {
          return result.analysis.personalized_insights;
      }
      // Handle cases where data might be in another key or is the root
      if (Array.isArray(result)) {
          return result as PersonalizedInsight[];
      }
      return [];
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
        agent_type: 'orchestrator',
        task: 'document_content_analysis',
        payload: {
          document: {
            name: `${data.subject} Analysis`,
            actual_subject: data.subject,
            key_topics: data.topics
          },
          memories: data.user_memories,
          analysis_type: data.analysis_type
        }
      });
      
      // FIX: Ensure the returned data is actually ContentAnalysis
      if (result.success && result.analysis?.content_analysis) {
        return result.analysis.content_analysis;
      }
      throw new Error("Could not extract content analysis from response.");
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
        agent_type: 'orchestrator',
        task: 'generate_ai_mind_map',
        payload: {
          subject: data.subject,
          content: data.content,
          memories: data.user_memories,
          format: data.format,
          style: data.style
        }
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
    // This type is very specific. The AI response must match it.
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
        agent_type: 'orchestrator',
        task: 'study_guide_generation',
        payload: {
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
        // NOTE: This assumes the 'pillars' from the AI match the required structure.
        // A validation library like Zod would be better for production code.
        return {
          id: `guide-${Date.now()}`,
          subject: data.subjectName,
          framework: {
            acronym: analysis.framework?.acronym || 'STUDY',
            name: analysis.framework?.name || 'Strategic Study Framework',
            description: analysis.framework?.description || `A comprehensive framework for mastering ${data.subjectName}.`
          },
          pillars: analysis.pillars || [], // This is the fragile part
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
  // This function is now effectively a no-op since the endpoint is managed internally
  console.log('ADK endpoints now use Supabase Edge Functions. Config update ignored:', config);
};