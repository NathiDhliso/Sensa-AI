import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

// Create Supabase client with error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Development mode helper
export const isSupabaseConnected = () => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY
}

// Specific type interfaces to replace 'any'
export interface LearningProfile {
  interests?: string[]
  skills?: string[]
  goals?: string[]
  learning_style?: string
  preferred_pace?: string
  [key: string]: unknown
}

export interface SensaAnalysis {
  emotional_themes?: string[]
  key_concepts?: string[]
  learning_connections?: string[]
  memory_strength?: number
  relevance_score?: number
  [key: string]: unknown
}

export interface CourseMetadata {
  prerequisites?: string[]
  learning_outcomes?: string[]
  assessment_methods?: string[]
  resources?: string[]
  [key: string]: unknown
}

export interface AnalysisData {
  course_breakdown?: Record<string, unknown>
  difficulty_assessment?: Record<string, unknown>
  learning_path?: Record<string, unknown>
  [key: string]: unknown
}

export interface MemoryConnections {
  connections?: Array<{
    memory_id: string
    relevance_score: number
    connection_type: string
  }>
  [key: string]: unknown
}

export interface CareerPathways {
  pathways?: Array<{
    title: string
    description: string
    relevance_score: number
  }>
  [key: string]: unknown
}

export interface StudyMap {
  nodes?: Array<{
    id: string
    label: string
    type: string
    position?: { x: number; y: number }
  }>
  edges?: Array<{
    id: string
    source: string
    target: string
    type?: string
  }>
  [key: string]: unknown
}

// Types for our database
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string
          email: string
          full_name: string | null
          learning_profile: LearningProfile | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          email: string
          full_name?: string | null
          learning_profile?: LearningProfile | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          email?: string
          full_name?: string | null
          learning_profile?: LearningProfile | null
          created_at?: string
          updated_at?: string
        }
      }
      memories: {
        Row: {
          id: string
          user_id: string
          category: string
          text_content: string
          sensa_analysis: SensaAnalysis | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          text_content: string
          sensa_analysis?: SensaAnalysis | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          text_content?: string
          sensa_analysis?: SensaAnalysis | null
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          university: string
          field: string
          difficulty: string
          duration: string
          description: string | null
          syllabus: string[] | null
          metadata: CourseMetadata | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          university: string
          field: string
          difficulty: string
          duration: string
          description?: string | null
          syllabus?: string[] | null
          metadata?: CourseMetadata | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          university?: string
          field?: string
          difficulty?: string
          duration?: string
          description?: string | null
          syllabus?: string[] | null
          metadata?: CourseMetadata | null
          created_at?: string
          updated_at?: string
        }
      }
      course_analyses: {
        Row: {
          id: string
          user_id: string
          course_id: string
          analysis_data: AnalysisData
          memory_connections: MemoryConnections | null
          career_pathways: CareerPathways | null
          study_map: StudyMap | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          analysis_data: AnalysisData
          memory_connections?: MemoryConnections | null
          career_pathways?: CareerPathways | null
          study_map?: StudyMap | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          analysis_data?: AnalysisData
          memory_connections?: MemoryConnections | null
          career_pathways?: CareerPathways | null
          study_map?: StudyMap | null
          created_at?: string
          updated_at?: string
        }
      }
      epistemic_driver_history: {
        Row: {
          id: string
          user_id: string
          title: string
          subject: string
          objectives: string
          study_map_data: Record<string, unknown>
          is_favorite: boolean
          tags: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          subject: string
          objectives: string
          study_map_data: Record<string, unknown>
          is_favorite?: boolean
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          subject?: string
          objectives?: string
          study_map_data?: Record<string, unknown>
          is_favorite?: boolean
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}