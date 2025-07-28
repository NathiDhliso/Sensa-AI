// Edge Functions Service for Sensa AI
// Integrates with deployed Supabase Edge Functions

import { supabase } from '../lib/supabase'

// Base configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://okvdirskoukqnjzqsowb.supabase.co'

// Generic function to call any Edge Function
export const callEdgeFunction = async (functionName: string, payload: unknown) => {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for AI operations

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    clearTimeout(timeoutId);

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = `Edge function ${functionName} failed with status ${response.status}`

      try {
        const errorData = await response.json()
        console.log(`📡 Error response data:`, errorData);
        if (errorData.error) {
          errorMessage = errorData.error
        } else {
          errorMessage += `: ${response.statusText}`
        }
      } catch (parseError) {
        console.log(`📡 Failed to parse error response:`, parseError);
        errorMessage += `: ${response.statusText}`
      }

      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout specifically
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 2 minutes. The AI service may be experiencing high load. Please try again or use a shorter input.');
    }

    console.error(`Error calling ${functionName}:`, error)

    // Enhance error messages for better user experience
    if (error instanceof Error) {
      if (error.message.includes('temporarily unavailable')) {
        throw error // Pass through AI service errors as-is
      } else if (error.message.includes('failed to fetch') || error.message.includes('network')) {
        throw new Error('Network connection issue. Please check your internet connection and try again.')
      } else if (error.message.includes('500')) {
        throw new Error('Server error occurred. Please try again in a few moments.')
      }
    }

    throw error
  }
}

// Specific function interfaces and calls

// 1. ADK Agents Function
export interface ADKAgentRequest {
  agent_type: 'memory_analysis' | 'course_intel' | 'personalization' | 'career_pathway' | 'study_map' | 'study_guide' | 'orchestrator'
  payload: Record<string, unknown>
}

export const callADKAgent = async (request: ADKAgentRequest) => {
  return callEdgeFunction('adk-agents', request)
}

// 2. Mermaid Cartographer Function
export interface MermaidCartographerRequest {
  field_of_study: string
  course_syllabus: string[]
  exam_scope: string[]
  user_memory_profile: {
    memories: Array<{
      category: string
      text: string
    }>
  }
}

export interface MermaidCartographerResponse {
  mermaid_code: string
  node_data: Record<string, {
    node_name: string
    sensa_insight: {
      analogy: string
      study_tip: string
    }
  }>
  legend_html: string
}

export const generateStudyMap = async (request: MermaidCartographerRequest): Promise<MermaidCartographerResponse> => {
  return callEdgeFunction('mermaid-cartographer', request)
}

// 3. Send Auth Email Function
export interface AuthEmailRequest {
  email: string
  type: 'signup' | 'login' | 'reset_password' | 'email_change'
  redirect_to?: string
}

export const sendAuthEmail = async (request: AuthEmailRequest) => {
  return callEdgeFunction('send-auth-email', request)
}

// 4. Test Deploy Function (for testing purposes)
export const testDeployment = async () => {
  return callEdgeFunction('test-deploy', {})
}

// Utility functions for specific use cases

// Memory Analysis Agent
export const analyzeMemories = async (memories: Array<Record<string, unknown>>) => {
  return callADKAgent({
    agent_type: 'memory_analysis',
    payload: { memories }
  })
}

// Course Intelligence Agent
export const analyzeCourse = async (courseData: Record<string, unknown>) => {
  return callADKAgent({
    agent_type: 'course_intel',
    payload: courseData
  })
}

// Personalization Agent
export const getPersonalizedRecommendations = async (userProfile: Record<string, unknown>) => {
  return callADKAgent({
    agent_type: 'personalization',
    payload: userProfile
  })
}

// Career Pathway Agent
export const getCareerPathway = async (userGoals: Record<string, unknown>) => {
  return callADKAgent({
    agent_type: 'career_pathway',
    payload: userGoals
  })
}

// Study Map Agent
export const generateStudyPlan = async (studyData: Record<string, unknown>) => {
  return callADKAgent({
    agent_type: 'study_map',
    payload: studyData
  })
}

// Study Guide Agent
export const generateStudyGuide = async (studyGuideData: Record<string, unknown>) => {
  return callADKAgent({
    agent_type: 'study_guide',
    payload: studyGuideData
  })
}

// Orchestrator Agent (coordinates multiple agents)
export const orchestrateAgents = async (orchestrationRequest: Record<string, unknown>) => {
  return callADKAgent({
    agent_type: 'orchestrator',
    payload: orchestrationRequest
  })
}

// Error handling wrapper
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T | null> => {
  try {
    return await operation()
  } catch (error) {
    console.error(errorMessage, error)
    // You might want to show a toast notification here
    return null
  }
}

// Health check for all functions
export const checkFunctionHealth = async () => {
  const functions = ['test-deploy', 'adk-agents', 'mermaid-cartographer', 'send-auth-email']
  const results: Record<string, boolean> = {}

  for (const func of functions) {
    try {
      await callEdgeFunction(func, {})
      results[func] = true
    } catch {
      results[func] = false
    }
  }

  return results
}

const edgeFunctionService = {
  callEdgeFunction,
  callADKAgent,
  generateStudyMap,
  sendAuthEmail,
  testDeployment,
  analyzeMemories,
  analyzeCourse,
  getPersonalizedRecommendations,
  getCareerPathway,
  generateStudyPlan,
  generateStudyGuide,
  orchestrateAgents,
  withErrorHandling,
  checkFunctionHealth
};

export default edgeFunctionService;