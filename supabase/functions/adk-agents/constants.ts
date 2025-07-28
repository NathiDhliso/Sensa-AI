// Centralized constants for ADK Agents Edge Function
// Eliminates magic strings and provides type safety

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
} as const;

// Gemini AI Models in order of preference
export const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
] as const;

// PaLM fallback model
export const PALM_FALLBACK_MODEL = 'chat-bison-001' as const;

// API Configuration
export const AI_CONFIG = {
  DEFAULT_TEMPERATURE: 0.7,
  MAX_RETRIES: 2,
  DEFAULT_RETRY_DELAY_MS: 30000,
} as const;

// Task enumeration for orchestrator routing
export enum Task {
  ComprehensiveCourseAnalysis = 'comprehensive_course_analysis',
  DocumentContentAnalysis = 'document_content_analysis',
  GenerateAIMindMap = 'generate_ai_mind_map',
  MemoryAnalysis = 'memory_analysis',
  SubjectIdentification = 'subject_identification',
  MemoryDialogue = 'memory_dialogue',
  UpdatedMemoryInsights = 'updated_memory_insights',
  KnowMeStart = 'know_me_start',
  KnowMeScenarios = 'know_me_scenarios',
  KnowMeScore = 'know_me_score',
  KnowMeReport = 'know_me_report',
  PrimeMeNarrative = 'prime_me_narrative',
  StudyGuideGeneration = 'study_guide_generation',
}

// Agent types
export enum AgentType {
  MemoryAnalysis = 'memory_analysis',
  CourseIntel = 'course_intel',
  Personalization = 'personalization',
  CareerPathway = 'career_pathway',
  StudyMap = 'study_map',
  StudyGuide = 'study_guide',
  Orchestrator = 'orchestrator',
}

// Content types for analysis
export enum ContentType {
  Course = 'course',
  Document = 'document',
  Memory = 'memory',
  KnowMe = 'know_me',
}

// Response status constants
export const RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PROCESSING: 'processing',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'GOOGLE_AI_API_KEY not configured',
  AI_SERVICE_UNAVAILABLE: 'AI service is temporarily unavailable. Please try again later.',
  NO_CONTENT_RECEIVED: 'No content received from AI service',
  INVALID_REQUEST: 'Invalid request format',
  UNKNOWN_TASK: 'Unknown task type',
  UNKNOWN_AGENT: 'Unknown agent type',
} as const;

// Memory analysis constants
export const MEMORY_ANALYSIS = {
  MIN_WORD_COUNT: 10,
  MAX_INSIGHTS: 4,
  DEFAULT_ENTHUSIASM_SCORE: 5,
  TECHNICAL_TERMS_THRESHOLD: 3,
} as const;

// Know Me feature constants
export const KNOW_ME = {
  SCENARIOS_COUNT: 5,
  MAX_SCORE: 100,
  PERSONALITY_DIMENSIONS: [
    'openness',
    'conscientiousness', 
    'extraversion',
    'agreeableness',
    'neuroticism'
  ],
} as const; 