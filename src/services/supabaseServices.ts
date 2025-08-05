import { supabase, isSupabaseConnected } from '../lib/supabase';
import type { LearningProfile } from '../types';
import { callEdgeFunction } from './edgeFunctions';

// Additional interfaces for Supabase services
interface SensaAnalysis {
  insights?: string[];
  emotional_tone?: string;
  themes?: string[];
  learning_style?: string;
  confidence_score?: number;
  [key: string]: unknown;
}

interface AnalysisData {
  course_analysis?: Record<string, unknown>;
  memory_connections?: Record<string, unknown>[];
  career_pathways?: Record<string, unknown>;
  study_map?: Record<string, unknown>;
  [key: string]: unknown;
}

interface StudyMapPayload {
  title: string;
  mermaid_text: string;
  user_id: string;
  updated_at: string;
  id?: string;
}

// Enhanced error handling with detailed context
const handleSupabaseError = (error: unknown, context: string) => {
  console.error(`Supabase ${context} error:`, error);

  if (!isSupabaseConnected()) {
    throw new Error(`Development mode: Supabase not connected. ${context} requires database connection.`);
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('JWT')) {
    throw new Error('Authentication expired. Please sign in again.');
  }

  if (errorMessage.includes('not authenticated')) {
    throw new Error('Authentication required. Please sign in to continue.');
  }

  if (errorMessage.includes('Failed to fetch')) {
    throw new Error('Network connection failed. Please check your internet connection and try again.');
  }

  throw new Error(`${context} failed: ${errorMessage || 'Unknown error'}`);
};



export const supabaseServices = {
  // User Management
  async getCurrentUser() {
    if (!isSupabaseConnected()) {
      throw new Error('Supabase connection required for user authentication');
    }

    try {
      const { data, error } = await supabase!.auth.getUser();
      if (error) {
        handleSupabaseError(error, 'Get current user');
      }
      return { data, error };
    } catch (error) {
      handleSupabaseError(error, 'Get current user');
    }
  },

  async getUserMemories(userId?: string) {
    if (!isSupabaseConnected()) {
      throw new Error('Supabase connection required for accessing memories');
    }

    if (!userId) {
      const { data: userData } = await supabase!.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      userId = userData.user.id;
    }

    try {
      const { data, error } = await supabase!
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, 'Get user memories');
      }

      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'Get user memories');
    }
  },

  async saveMemory(memory: { category: string; text_content: string; sensa_analysis?: SensaAnalysis }) {
    if (!isSupabaseConnected()) {
      throw new Error('Supabase connection required for saving memories');
    }

    try {
      const { data: userData } = await supabase!.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase!
        .from('memories')
        .insert([
          {
            user_id: userData.user.id,
            category: memory.category,
            text_content: memory.text_content,
            sensa_analysis: memory.sensa_analysis
          }
        ])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'Save memory');
      }

      return data;
    } catch (error) {
      handleSupabaseError(error, 'Save memory');
    }
  },

  // Course Management
  async getCourses() {
    if (!isSupabaseConnected()) {
      throw new Error('Supabase connection required for course data');
    }

    try {
      const { data, error } = await supabase!
        .from('courses')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error getting courses:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting courses:', error);
      throw error;
    }
  },

  // Authentication
  async signUp(email: string, password: string, fullName: string) {
    if (!isSupabaseConnected()) {
      throw new Error('Development mode: Authentication requires Supabase connection');
    }

    try {
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        handleSupabaseError(error, 'Sign up');
      }

      return { data, error };
    } catch (error) {
      handleSupabaseError(error, 'Sign up');
    }
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConnected()) {
      throw new Error('Development mode: Authentication requires Supabase connection');
    }

    try {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        handleSupabaseError(error, 'Sign in');
      }

      return { data, error };
    } catch (error) {
      handleSupabaseError(error, 'Sign in');
    }
  },

  async signOut() {
    if (!isSupabaseConnected()) {
      console.log('🔧 Development mode: Sign out simulated');
      return { error: null };
    }

    try {
      const { error } = await supabase!.auth.signOut();
      if (error) {
        handleSupabaseError(error, 'Sign out');
      }
      return { error };
    } catch (error) {
      handleSupabaseError(error, 'Sign out');
    }
  },

  // ADK Agents Integration - Call deployed edge functions
  async callADKAgents(request: {
    agent_type: string;
    task?: string;
    payload: Record<string, unknown>;
  }) {
    try {
      console.log('🤖 Calling ADK agents with request:', request);
      const result = await callEdgeFunction('adk-agents', request);
      console.log('✅ ADK agents response:', result);
      return result;
    } catch (error) {
      console.error('❌ ADK Agents API call failed:', error);
      throw new Error(`Failed to call ADK agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Memory Services
export const memoryService = {
  async saveMemory(category: string, textContent: string, sensaAnalysis?: SensaAnalysis) {
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('memories')
      .insert({
        user_id: user.id,
        category,
        text_content: textContent,
        sensa_analysis: sensaAnalysis,
      })
      .select()
      .single();

    if (error) {
        handleSupabaseError(error, 'save memory');
    }
    return data;
    } catch (error) {
      handleSupabaseError(error, 'save memory');
    }
  },

  async getUserMemories() {
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('memories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
        handleSupabaseError(error, 'get user memories');
    }
    return data || [];
    } catch (error) {
      handleSupabaseError(error, 'get user memories');
    }
  },

  async updateMemoryAnalysis(memoryId: string, sensaAnalysis: SensaAnalysis) {
    const { data, error } = await supabase!
      .from('memories')
      .update({ sensa_analysis: sensaAnalysis })
      .eq('id', memoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating memory analysis:', error);
      throw error;
    }
    return data;
  },

  async updateMemoryContent(memoryId: string, textContent: string) {
    const { data, error } = await supabase!
      .from('memories')
      .update({ text_content: textContent })
      .eq('id', memoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating memory content:', error);
      throw error;
    }
    return data;
  },

  async analyzeMemory(memoryContent: string, category: string) {
    try {
      console.warn('⚠️ Using legacy memoryService.analyzeMemory - consider migrating to SensaAPI.analyzeMemory');
      // Redirect to new ADK system
      const { SensaAPI } = await import('./api');
      return await SensaAPI.analyzeMemory(memoryContent, category);
    } catch (error) {
      console.error('Failed to analyze memory:', error);
      throw error;
    }
  },

  // Process pending memories from onboarding after authentication
  async processPendingMemories() {
    try {
      // Get pending memories from localStorage
      const pendingMemoriesStr = localStorage.getItem('sensaPendingMemories');
      const memoryAnalysesStr = localStorage.getItem('sensaMemoryAnalyses');
      
      if (!pendingMemoriesStr) {
        console.log('No pending memories to process');
        return { success: true, processed: 0 };
      }

      const pendingMemories = JSON.parse(pendingMemoriesStr);
      const memoryAnalyses = memoryAnalysesStr ? JSON.parse(memoryAnalysesStr) : [];
      
      let processedCount = 0;
      
      // Save each memory to database and analyze them
      for (const memory of pendingMemories) {
        try {
          // Find corresponding stored data
          const storedData = memoryAnalyses.find((a: { stepId: string }) => a.stepId === memory.stepId);
          const category = storedData?.category || 'general';
          
          // Save memory to database first
          const savedMemory = await this.saveMemory(category, memory.content);
          
          // Then analyze the memory using ADK system
          if (savedMemory) {
            try {
              const { SensaAPI } = await import('./api');
              const analysis = await SensaAPI.analyzeMemory(memory.content, category);
              
              // Update memory with analysis
              if (analysis) {
                await this.updateMemoryAnalysis(savedMemory.id, analysis);
              }
            } catch (analysisError) {
              console.error('Failed to analyze memory, but memory was saved:', analysisError);
            }
          }
          
          processedCount++;
        } catch (error) {
          console.error('Failed to save pending memory:', error);
        }
      }
      
      // Clear pending memories from localStorage
      localStorage.removeItem('sensaPendingMemories');
      localStorage.removeItem('sensaMemoryAnalyses');
      localStorage.removeItem('sensaOnboardingResponses');
      
      console.log(`Successfully processed ${processedCount} pending memories`);
      return { success: true, processed: processedCount };
      
    } catch (error) {
      console.error('Failed to process pending memories:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// Course Services
export const courseService = {
  async getCourses(field?: string) {
    let query = supabase.from('courses').select('*');
    
    if (field) {
      query = query.eq('field', field);
    }

    const { data, error } = await query.order('name');
    if (error) {
      console.error('Error getting courses:', error);
      throw error;
    }
    return data || [];
  },

  async getCourseById(courseId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error getting course by ID:', error);
      throw error;
    }
    return data;
  },
};

// Course Analysis Services
export const courseAnalysisService = {
  async saveCourseAnalysis(
    courseId: string,
    analysisData: AnalysisData,
    memoryConnections?: Record<string, unknown>[],
    careerPathways?: Record<string, unknown>,
    studyMap?: Record<string, unknown>
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('course_analyses')
      .insert({
        user_id: user.id,
        course_id: courseId,
        analysis_data: analysisData,
        memory_connections: memoryConnections,
        career_pathways: careerPathways,
        study_map: studyMap,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving course analysis:', error);
      throw error;
    }
    return data;
  },

  async getUserCourseAnalyses() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('course_analyses')
      .select(`
        *,
        courses (
          name,
          university,
          field
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user course analyses:', error);
      throw error;
    }
    return data || [];
  },
};

// Legacy services have been migrated to SensaAPI in api.ts
// Use SensaAPI directly for all AI-powered functionality

// User Profile Services
export const userService = {
  async updateLearningProfile(learningProfile: LearningProfile) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('users')
      .update({ learning_profile: learningProfile })
      .eq('auth_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating learning profile:', error);
      throw error;
    }
    return data;
  },

  async getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
    return data;
  },
};

// New: Services for previously unused tables
// These helpers are deliberately lightweight so that other parts
// of the application can start utilising the data structures
// without a large refactor. All functions include basic runtime
// checks mirroring the patterns used elsewhere in this file.

// Memory-to-memory links (reference / prerequisite relationships)
export const memoryLinkService = {
  async upsertLink(fromId: string | number, toId: string | number, linkType: string = 'related') {
    const { data, error } = await supabase!
      .from('memory_links')
      .upsert({ from_id: fromId, to_id: toId, link_type: linkType });
    if (error) handleSupabaseError(error, 'upsert memory link');
    return data;
  },

  async getLinks(memoryId: string | number) {
    const { data, error } = await supabase!
      .from('memory_links')
      .select('*')
      // match either side of the relationship
      .or(`from_id.eq.${memoryId},to_id.eq.${memoryId}`);
    if (error) handleSupabaseError(error, 'get memory links');
    return data || [];
  },
};

// Dialogue sessions (persisted chat history)
export const dialogueSessionService = {
  async startSession(title: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('dialogue_sessions')
      .insert({ user_id: user.id, title, started_at: new Date().toISOString() })
      .select()
      .single();
    if (error) handleSupabaseError(error, 'start dialogue session');
    return data;
  },

  async endSession(sessionId: string | number) {
    const { error } = await supabase!
      .from('dialogue_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) handleSupabaseError(error, 'end dialogue session');
  },

  async listSessions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('dialogue_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });
    if (error) handleSupabaseError(error, 'list dialogue sessions');
    return data || [];
  },
};

// Study maps generated from Mermaid mind-maps
export const studyMapService = {
  async saveStudyMap(title: string, mermaidText: string, id?: string | number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const payload: StudyMapPayload = { title, mermaid_text: mermaidText, user_id: user.id, updated_at: new Date().toISOString() };
    if (id) payload.id = id;

    const { data, error } = await supabase!
      .from('study_maps')
      .upsert(payload)
      .select()
      .single();
    if (error) handleSupabaseError(error, 'save study map');
    return data;
  },

  async listStudyMaps() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('study_maps')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) handleSupabaseError(error, 'list study maps');
    return data || [];
  },
};

// Epistemic Driver History Services
export const epistemicDriverHistoryService = {
  async saveEpistemicDriver(input: {
    title: string;
    subject: string;
    objectives: string;
    study_map_data: Record<string, unknown>;
    tags?: string[];
    notes?: string;
    is_favorite?: boolean;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('epistemic_driver_history')
      .insert({
        user_id: user.id,
        title: input.title,
        subject: input.subject,
        objectives: input.objectives,
        study_map_data: input.study_map_data,
        tags: input.tags || [],
        notes: input.notes,
        is_favorite: input.is_favorite || false,
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, 'save epistemic driver');
    return data;
  },

  async getUserEpistemicDriverHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('epistemic_driver_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error, 'get epistemic driver history');
    return data || [];
  },

  async getEpistemicDriverById(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('epistemic_driver_history')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) handleSupabaseError(error, 'get epistemic driver by id');
    return data;
  },

  async updateEpistemicDriver(id: string, updates: {
    title?: string;
    tags?: string[];
    notes?: string;
    is_favorite?: boolean;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('epistemic_driver_history')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update epistemic driver');
    return data;
  },

  async deleteEpistemicDriver(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase!
      .from('epistemic_driver_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleSupabaseError(error, 'delete epistemic driver');
  },

  async getFavoriteEpistemicDrivers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('epistemic_driver_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false });

    if (error) handleSupabaseError(error, 'get favorite epistemic drivers');
    return data || [];
  },

  async searchEpistemicDrivers(query: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('epistemic_driver_history')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,subject.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error, 'search epistemic drivers');
    return data || [];
  },
};

// Per-user preferences (theme, tts, etc.)
export const preferenceService = {
  async getPreferences() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('user_preferences')
      .select('prefs')
      .eq('user_id', user.id)
      .single();
    if (error && error.code !== 'PGRST116') { // 116 = no rows returned
      handleSupabaseError(error, 'get user preferences');
    }
    return data?.prefs ?? {};
  },

  async updatePreferences(prefs: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase!
      .from('user_preferences')
      .upsert({ user_id: user.id, prefs, updated_at: new Date().toISOString() })
      .select('prefs')
      .single();
    if (error) handleSupabaseError(error, 'update user preferences');
    return data?.prefs;
  },
};