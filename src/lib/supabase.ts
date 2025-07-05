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
          learning_profile: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          email: string
          full_name?: string | null
          learning_profile?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          email?: string
          full_name?: string | null
          learning_profile?: any | null
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
          sensa_analysis: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          text_content: string
          sensa_analysis?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          text_content?: string
          sensa_analysis?: any | null
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
          metadata: any | null
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
          metadata?: any | null
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
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      course_analyses: {
        Row: {
          id: string
          user_id: string
          course_id: string
          analysis_data: any
          memory_connections: any | null
          career_pathways: any | null
          study_map: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          analysis_data: any
          memory_connections?: any | null
          career_pathways?: any | null
          study_map?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          analysis_data?: any
          memory_connections?: any | null
          career_pathways?: any | null
          study_map?: any | null
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