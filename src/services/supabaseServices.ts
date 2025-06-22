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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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
    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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