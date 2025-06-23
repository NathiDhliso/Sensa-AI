import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Development mode flag
const isDevelopment = import.meta.env.DEV

console.log('🔍 Environment check:');
console.log('   - isDevelopment:', isDevelopment);
console.log('   - VITE_SUPABASE_URL exists:', !!supabaseUrl);
console.log('   - VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
console.log('   - URL length:', supabaseUrl?.length || 0);
console.log('   - Key length:', supabaseAnonKey?.length || 0);

if (!supabaseUrl || !supabaseAnonKey) {
  if (isDevelopment) {
    console.warn('⚠️ Supabase environment variables missing - running in development mode')
    console.warn('   Please check your .env file for:')
    console.warn('   - VITE_SUPABASE_URL')
    console.warn('   - VITE_SUPABASE_ANON_KEY')
  } else {
    throw new Error('Missing Supabase environment variables')
  }
}

// Log connection details for debugging (remove in production)
console.log('🔍 Supabase URL:', supabaseUrl)
console.log('🔑 Supabase Key exists:', !!supabaseAnonKey)

// Test connection to Supabase
const testConnection = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('🔧 Running in development mode without Supabase')
    return false
  }
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })
    
    console.log('🌐 Supabase connection test:', response.status, response.statusText)
    
    if (!response.ok) {
      console.error('❌ Supabase connection failed:', response.status, response.statusText)
      if (response.status === 404) {
        console.error('🚨 Supabase project not found - may be deleted or paused')
        console.error('📝 Please check your Supabase dashboard or create a new project')
      }
      return false
    }
    
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('💥 Supabase connection error:', error)
    return false
  }
}

// Run connection test
testConnection()

// Create Supabase client with error handling
export const supabase = supabaseUrl && supabaseAnonKey ? 
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }) : null

// Development mode helper
export const isSupabaseConnected = () => {
  return supabase !== null
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