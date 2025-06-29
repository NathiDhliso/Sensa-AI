import { supabase, isSupabaseConnected } from '../lib/supabase';

// Enhanced error handling with detailed context
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase ${context} error:`, error);
  
  if (!isSupabaseConnected()) {
    throw new Error(`Development mode: Supabase not connected. ${context} requires database connection.`);
  }
  
  if (error?.message?.includes('JWT')) {
    throw new Error('Authentication expired. Please sign in again.');
  }
  
  if (error?.message?.includes('not authenticated')) {
    throw new Error('Authentication required. Please sign in to continue.');
  }
  
  if (error?.message?.includes('Failed to fetch')) {
    throw new Error('Network connection failed. Please check your internet connection and try again.');
  }
  
  throw new Error(`${context} failed: ${error?.message || 'Unknown error'}`);
};

// Mock data for development mode
const mockUser = {
  id: 'dev-user-123',
  email: 'dev@example.com',
  full_name: 'Development User'
};

const mockMemories = [
  {
    id: 'mem-1',
    category: 'Academic',
    text_content: 'I remember solving my first programming problem in high school. The satisfaction of seeing the code work was incredible.',
    sensa_analysis: {
      themes: ['Problem-solving', 'Technology'],
      learningStyle: 'Hands-on',
      emotionalTone: 'Positive'
    },
    created_at: new Date().toISOString()
  },
  {
    id: 'mem-2', 
    category: 'Personal',
    text_content: 'Leading a team project taught me how to coordinate different perspectives and find solutions.',
    sensa_analysis: {
      themes: ['Leadership', 'Collaboration'],
      learningStyle: 'Interactive',
      emotionalTone: 'Confident'
    },
    created_at: new Date().toISOString()
  }
];

const mockCourses = [
  {
    id: 'CSC1015F',
    name: 'Introduction to Computer Science I',
    university: 'University of Cape Town',
    field: 'Computer Science',
    difficulty: 'Beginner',
    duration: '1 semester',
    description: 'Programming fundamentals with Python',
    created_at: new Date().toISOString()
  },
  {
    id: 'PSYC1004F',
    name: 'Introduction to Psychology I',
    university: 'University of Cape Town', 
    field: 'Psychology',
    difficulty: 'Beginner',
    duration: '1 semester',
    description: 'Understanding human behavior',
    created_at: new Date().toISOString()
  }
];

export const supabaseServices = {
  // User Management
  async getCurrentUser() {
    if (!isSupabaseConnected()) {
      console.log('🔧 Development mode: Using mock user data');
      return { data: { user: mockUser }, error: null };
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
      console.log('🔧 Development mode: Using mock memory data');
      return mockMemories;
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

  async saveMemory(memory: { category: string; text_content: string; sensa_analysis?: any }) {
    if (!isSupabaseConnected()) {
      console.log('🔧 Development mode: Memory save simulated');
      return {
        id: `mock-${Date.now()}`,
        ...memory,
        created_at: new Date().toISOString()
      };
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
      console.log('🔧 Development mode: Using mock course data');
      return mockCourses;
    }

    try {
      const { data, error } = await supabase!
        .from('courses')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error getting courses:', error);
        return mockCourses; // Fallback to mock data
      }

      return data || mockCourses;
    } catch (error) {
      console.error('Error getting courses:', error);
      return mockCourses; // Fallback to mock data
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
  }
};

// Memory Services
export const memoryService = {
  async saveMemory(category: string, textContent: string, sensaAnalysis?: any) {
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

  async updateMemoryAnalysis(memoryId: string, sensaAnalysis: any) {
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
          const storedData = memoryAnalyses.find((a: any) => a.stepId === memory.stepId);
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
    analysisData: any,
    memoryConnections?: any,
    careerPathways?: any,
    studyMap?: any
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

// Legacy Edge Function Services - MIGRATED TO ADK
// These functions now redirect to the new ADK multi-agent system
export const edgeFunctionService = {
  async analyzeMemory(memoryContent: string, category: string) {
    console.warn('⚠️ Using legacy edgeFunctionService.analyzeMemory - consider migrating to SensaAPI.analyzeMemory');
    // Redirect to new ADK system
    const { SensaAPI } = await import('./api');
    return await SensaAPI.analyzeMemory(memoryContent, category);
  },

  async analyzeCourse(courseQuery: string, userMemories: any[]) {
    console.warn('⚠️ Using legacy edgeFunctionService.analyzeCourse - consider migrating to SensaAPI.analyzeCourse');
    // For compatibility, get current user and redirect to new system
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { SensaAPI } = await import('./api');
    const result = await SensaAPI.analyzeCourse(courseQuery, user.id);
    return result.course_analysis;
  },

  async generateCareerPathways(courseName: string, userMemoryProfile: any) {
    console.warn('⚠️ Using legacy edgeFunctionService.generateCareerPathways - consider migrating to SensaAPI.generateCareerPathways');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { SensaAPI } = await import('./api');
    return await SensaAPI.generateCareerPathways(courseName, user.id);
  },

  async generateStudyMap(fieldOfStudy: string, courseSyllabus: string[], userMemoryProfile: any) {
    console.warn('⚠️ Using legacy edgeFunctionService.generateStudyMap - consider migrating to SensaAPI.generateStudyMap');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { SensaAPI } = await import('./api');
    return await SensaAPI.generateStudyMap(fieldOfStudy, courseSyllabus, user.id);
  },

  async generateMermaidMap(fieldOfStudy: string, courseSyllabus: string[], userMemoryProfile: any) {
    console.warn('⚠️ Using legacy edgeFunctionService.generateMermaidMap - consider migrating to SensaAPI.generateMermaidStudyMap');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { SensaAPI } = await import('./api');
    return await SensaAPI.generateMermaidStudyMap(fieldOfStudy, courseSyllabus, user.id);
  },
};

// User Profile Services
export const userService = {
  async updateLearningProfile(learningProfile: any) {
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

    const payload: any = { title, mermaid_text: mermaidText, user_id: user.id, updated_at: new Date().toISOString() };
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