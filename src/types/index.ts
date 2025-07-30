// Core Types for Sensa Application
// These interfaces are shared between frontend and backend

// Memory and Profile Types
export interface MemoryProfile {
  id: string;
  themes: string[];
  emotionalAnchors: string[];
  sensoryDetails: string[];
  learningStyle: string;
  motivationalTriggers: string[];
  cognitivePatterns: string[];
}

export interface UserMemoryProfile {
  memories: Array<{
    category: string;
    text: string;
  }>;
  dominant_learning_style?: string;
  learning_profile?: {
    course_analysis: CourseAnalysisResult;
    memory_connections: MemoryConnection[];
  };
  revolutionary_insights?: string[];
  career_path?: string;
  memory_connections?: MemoryConnection[];
  topic_memory_connections?: string[];
  content_specific_insights?: string[];
  agents_available?: boolean;
  code?: string;
  node_insights?: Record<string, unknown>;
  legend_html?: string;
}

export interface MemoryInsight {
  id: string;
  memory: string;
  category: string;
  insights: string[];
  learningStyle: string;
  emotionalTone: string;
  connections: string[];
  timestamp: Date;
}

// Course Analysis Types
export interface CourseAnalysisResult {
  courseId: string;
  courseName: string;
  university: string;
  coreGoal: string;
  practicalOutcome: string;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedDuration: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  keyTopics: string[];
  careerOutcomes: string[];
  revolutionary_insights?: string[];
  career_path?: string;
  memory_connections?: MemoryConnection[];
  topic_memory_connections?: string[];
  content_specific_insights?: string[];
  agents_available?: boolean;
  code?: string;
  node_insights?: Record<string, unknown>;
  legend_html?: string;
  [key: string]: unknown;
}

export interface CourseWorkflow {
  phase: string;
  objective: string;
  coreSkills: string[];
  duration: string;
  assessmentType: string;
  practicalApplications: string[];
}

export interface CompetencyMap {
  technical: string[];
  cognitive: string[];
  interpersonal: string[];
  leadership: string[];
}

// Analogy and Insight Types
export interface AnalogyResult {
  concept: string;
  analogy: string;
  memoryConnection: string;
  emotionalResonance: number;
  cognitiveLoad: number;
  retentionPotential: number;
}

export interface SensaInsight {
  analogy: string;
  study_tip: string;
}

// Career Pathway Types
export interface CareerPathway {
  type: 'The Prominent Path' | 'Your Personalized Discovery Path';
  field_name: string;
  description: string;
  memory_link: string;
}

export interface CareerPathwayResponse {
  pathways: CareerPathway[];
}

// Study Map Types
export interface KnowledgeNode {
  node_name: string;
  in_course: boolean;
  sensa_insight?: SensaInsight | null;
  children?: KnowledgeNode[];
}

export interface StudyMap {
  field: string;
  map: KnowledgeNode[];
}

export interface StudyGuideSection {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedTime: string;
  topics: string[];
}

// Legacy StudyGuide interface (kept for backward compatibility)
export interface LegacyStudyGuide {
  title: string;
  subject: string;
  totalTime: string;
  sections: StudyGuideSection[];
}

// Modern StudyGuide interface with framework and pillars
export interface StudyGuide {
  id: string;
  subject: string;
  framework: {
    acronym: string;
    name: string;
    description: string;
  };
  pillars: Pillar[];
  createdAt: Date;
}

export interface Pillar {
  name: string;
  thematicName: string;
  studyFocus: string;
  subAcronym?: string;
  subTopics: SubTopic[];
}

export interface SubTopic {
  priority: string;
  conceptPair: string;
  pyramid: {
    base: string;
    middle: string;
    apex: string;
    keyTakeaway: string;
  };
}

export interface UserCommunicationStyle {
  technicalTerms: string[];
  communicationPatterns: {
    usesMetaphors: boolean;
    storytellingStyle: boolean;
    casualTone: boolean;
    prefersConcrete: boolean;
  };
  preferredExpressions: string[];
  toneStyle: string;
}

// Enhanced Mermaid Study Map Types
export interface NodeData {
  node_name: string;
  sensa_insight: SensaInsight;
}

export interface MermaidStudyMap {
  mermaid_code: string;
  node_data: Record<string, NodeData>;
  legend_html: string; // New field for the visual legend
}

// Learning Sequence Mind Map Types (Enhanced Implementation)
export interface LearningModule {
  id: string;
  name: string;
  topics: string[];
  isFoundational: boolean;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  memoryConnections: string[];
}

export interface LearningSequenceMindMap extends MermaidStudyMap {
  modules?: LearningModule[]; // Optional: structured module data for advanced usage
}

// Onboarding Types
export interface OnboardingMemoryAnalysis {
  themes: string[];
  emotionalTone: string;
  learningIndicators: string[];
  followUpSuggestions: string[];
  confidence: number;
}

export interface DynamicQuestion {
  id: string;
  question: string;
  category: string;
  reasoning: string;
  priority: number;
}

// Learning Profile Types
export interface LearningProfile {
  dominantStyle: string;
  emotionalAnchors: string[];
  cognitivePatterns: string[];
  preferredEnvironments: string[];
  motivationalTriggers: string[];
  courseRecommendations: string[];
}

// Course Types
export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  university: string;
  skills: string[];
  icon: string;
  color: string;
  students: string;
  dreamJob: string;
}

// Dashboard Types
export interface DashboardStats {
  coursesAnalyzed: number;
  memoryConnections: number;
  avgMatchScore: string;
}

export interface MemoryConnection {
  memory: string;
  connection: string;
  course: string;
  strength: number;
}

// Enhanced Visual Language Types
export interface VisualElement {
  shape: 'cloud' | 'rectangle' | 'rounded-rectangle';
  color: 'amethyst' | 'coral' | 'amber';
  meaning: string;
  description: string;
}

export interface StudyMapLegend {
  elements: VisualElement[];
  html: string;
}

// User Memory Interface for mindmap integration
export interface UserMemory {
  id: string;
  category: string;
  text_content: string;
  sensa_analysis?: Record<string, unknown>;
  [key: string]: unknown;
}