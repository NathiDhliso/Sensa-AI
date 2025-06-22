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

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Edge function ${functionName} failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error)
    throw error
  }
}

// Specific function interfaces and calls

// 1. ADK Agents Function
export interface ADKAgentRequest {
  agent_type: 'memory_analysis' | 'course_intel' | 'personalization' | 'career_pathway' | 'study_map' | 'orchestrator'
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

export default {
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
  orchestrateAgents,
  withErrorHandling,
  checkFunctionHealth
} 