// Comprehensive type definitions for ADK Agents Edge Function
// Provides strong typing throughout the application

import { Task, AgentType, ContentType } from './constants.ts';

// Main request interface
export interface ADKRequest {
  agent_type: AgentType;
  task?: Task;
  payload: Record<string, unknown>;
  // Specific fields for different request types
  course?: CourseData;
  memories?: Memory[];
  analysis_requirements?: string[];
  subject?: string;
  content?: string;
  focus_question?: string;
  // Know Me specific fields
  question_data?: KnowMeQuestionData;
  answers?: KnowMeAnswer[];
  user_profile?: UserProfile;
}

// Course data structure
export interface CourseData {
  name: string;
  actual_subject: string;
  key_topics: string[];
  description?: string;
  difficulty_level?: string;
  duration?: string;
}

// Memory structure
export interface Memory {
  id?: string;
  category: string;
  text: string;
  timestamp?: string;
  tags?: string[];
  emotional_tone?: string;
  confidence_score?: number;
}

// User style analysis
export interface UserStyle {
  casualTone: boolean;
  usesMetaphors: boolean;
  prefersConcrete: boolean;
  storytellingStyle: boolean;
  technicalTerms: string[];
  enthusiasm: number; // 1-10 scale
}

// AI API response interfaces
export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text: string }>;
    };
    output?: string; // For PaLM fallback
  }>;
  error?: {
    message: string;
    code?: number;
    details?: Array<{
      '@type'?: string;
      retryDelay?: string;
    }>;
  };
}

// Chat completion style response for compatibility
export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Analysis result interfaces
export interface CourseAnalysisResult {
  subject_analysis: {
    identified_subject: string;
    confidence_score: number;
    key_topics: string[];
  };
  personalized_insights: string[];
  memory_connections: MemoryConnection[];
  study_recommendations: StudyRecommendation[];
  career_connections: string[];
}

export interface MemoryConnection {
  memory_text: string;
  connection_type: 'analogy' | 'experience' | 'knowledge' | 'skill';
  relevance_explanation: string;
  application_suggestion: string;
}

export interface StudyRecommendation {
  technique: string;
  reason: string;
  memory_basis: string;
  implementation_tips: string[];
}

// Document analysis interfaces
export interface DocumentAnalysisPayload {
  document: {
    name: string;
    actual_subject: string;
    key_topics: string[];
    content_preview?: string;
  };
  memories: Memory[];
  focus_question?: string;
}

export interface DocumentAnalysisResult {
  document_summary: {
    main_themes: string[];
    complexity_level: string;
    estimated_reading_time: string;
  };
  personalized_insights: string[];
  memory_connections: MemoryConnection[];
  key_takeaways: string[];
  discussion_points: string[];
}

// Memory analysis interfaces
export interface MemoryAnalysisResult {
  insights: string[];
  learning_style: string;
  emotional_tone: string;
  themes: string[];
  connections: MemoryConnection[];
}

// Mind map interfaces
export interface MindMapData {
  central_topic: string;
  branches: MindMapBranch[];
  connections: MindMapConnection[];
  personalization_notes: string[];
}

export interface MindMapBranch {
  id: string;
  label: string;
  level: number;
  parent_id?: string;
  memory_connection?: string;
  color_code?: string;
  icon?: string;
}

export interface MindMapConnection {
  from_id: string;
  to_id: string;
  relationship_type: string;
  description: string;
}

// Know Me feature interfaces
export interface KnowMeQuestionData {
  question_id: string;
  question_text: string;
  scenario_context?: string;
  question_type: 'multiple_choice' | 'scale' | 'open_ended';
  options?: string[];
  dimension_target?: string;
}

export interface KnowMeAnswer {
  question_id: string;
  selected_option?: string;
  scale_value?: number;
  text_response?: string;
  response_time_ms?: number;
  confidence_level?: number;
}

export interface KnowMeScenario {
  scenario_id: string;
  title: string;
  description: string;
  context: string;
  questions: KnowMeQuestionData[];
  target_dimensions: string[];
}

export interface PersonalityDimension {
  dimension: string;
  score: number; // 0-100
  description: string;
  characteristics: string[];
  implications: string[];
}

export interface KnowMeReport {
  user_id: string;
  overall_score: number;
  personality_dimensions: PersonalityDimension[];
  learning_preferences: LearningPreference[];
  memory_strategies: MemoryStrategy[];
  personalized_recommendations: string[];
  strengths: string[];
  growth_areas: string[];
  career_alignment: CareerAlignment[];
}

export interface LearningPreference {
  category: string;
  preference: string;
  strength_score: number;
  description: string;
  study_tips: string[];
}

export interface MemoryStrategy {
  strategy_name: string;
  effectiveness_score: number;
  description: string;
  when_to_use: string[];
  implementation_steps: string[];
}

export interface CareerAlignment {
  career_field: string;
  alignment_score: number;
  reasoning: string;
  recommended_skills: string[];
  growth_path: string[];
}

// User profile interface
export interface UserProfile {
  user_id: string;
  learning_style?: UserStyle;
  personality_dimensions?: PersonalityDimension[];
  academic_interests?: string[];
  career_goals?: string[];
  current_level?: string;
  preferences?: {
    content_type: ContentType[];
    difficulty_preference: string;
    time_commitment: string;
  };
}

// Response wrapper interface
export interface ADKResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  request_id?: string;
  processing_time_ms?: number;
}

// Specific response types
export type CourseAnalysisResponse = ADKResponse<CourseAnalysisResult>;
export type DocumentAnalysisResponse = ADKResponse<DocumentAnalysisResult>;
export type MemoryAnalysisResponse = ADKResponse<MemoryAnalysisResult>;
export type MindMapResponse = ADKResponse<MindMapData>;
export type KnowMeResponse = ADKResponse<KnowMeReport>;

// Utility types for handlers
export type TaskHandler = (request: ADKRequest) => Promise<Response>;
export type TaskHandlerMap = Map<Task, TaskHandler>;

// Error handling types
export interface ADKError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

// Gemini API request structure
export interface GeminiRequestBody {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
} 