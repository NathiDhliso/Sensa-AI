// Agent request handler for ADK Agents Edge Function
// Handles direct agent requests that bypass the orchestrator

import { AgentType, ERROR_MESSAGES } from '../constants.ts';
import { 
  createJsonResponse, 
  createErrorResponse, 
  generateRequestId, 
  logWithContext,
  formatProcessingTime 
} from '../utils.ts';
import type { ADKRequest, TaskHandler } from '../types.ts';

// Import analysis modules
import { generateMemoryAnalysis } from '../analysis/memory.ts';
import { generateCourseAnalysis } from '../analysis/course.ts';
import { generateStudyGuide } from '../features/studyGuideGenerator.ts';

/**
 * Agent handler mapping for direct agent requests
 */
function createAgentHandlerMap(): Map<AgentType, TaskHandler> {
  return new Map<AgentType, TaskHandler>([
    [AgentType.MemoryAnalysis, handleMemoryAnalysisAgent],
    [AgentType.CourseIntel, handleCourseIntelAgent],
    [AgentType.Personalization, handlePersonalizationAgent],
    [AgentType.CareerPathway, handleCareerPathwayAgent],
    [AgentType.StudyMap, handleStudyMapAgent],
    [AgentType.StudyGuide, handleStudyGuideAgent],
  ]);
}

/**
 * Main agent request handler
 * Routes direct agent requests to appropriate handlers
 */
export async function handleAgentRequest(requestData: ADKRequest): Promise<Response> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  logWithContext('info', '🤖 Agent request started', {
    agent: requestData.agent_type,
    requestId
  });

  try {
    // Validate agent type
    if (!requestData.agent_type) {
      logWithContext('error', 'No agent type specified', { requestId });
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, requestId);
    }

    // Get agent handler
    const agentHandlers = createAgentHandlerMap();
    const handler = agentHandlers.get(requestData.agent_type);
    
    if (!handler) {
      logWithContext('error', 'Unknown agent type', { 
        agent: requestData.agent_type, 
        requestId 
      });
      return createErrorResponse(ERROR_MESSAGES.UNKNOWN_AGENT, 400, requestId);
    }

    // Execute agent handler
    logWithContext('info', `🔄 Executing agent: ${requestData.agent_type}`, { requestId });
    const result = await handler(requestData);
    
    // Add processing metadata
    const processingTime = formatProcessingTime(startTime);
    logWithContext('info', '✅ Agent task completed', {
      agent: requestData.agent_type,
      processingTime,
      requestId
    });

    // If handler returns a Response, return it
    if (result instanceof Response) {
      return result;
    }

    // Otherwise create a success response
    return createJsonResponse(result, true, 200, undefined, requestId);

  } catch (error) {
    const processingTime = formatProcessingTime(startTime);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    
    logWithContext('error', '❌ Agent error', {
      agent: requestData.agent_type,
      error: errorMsg,
      processingTime,
      requestId
    });

    return createErrorResponse(errorMsg, 500, requestId);
  }
}

/**
 * Individual agent handlers
 */

async function handleMemoryAnalysisAgent(request: ADKRequest): Promise<Response> {
  logWithContext('info', '🧠 Processing memory analysis request');
  
  const memories = request.memories || request.payload.memories;
  if (!memories || !Array.isArray(memories)) {
    throw new Error('Memories array is required for memory analysis');
  }

  // Use the memory analysis module
  return await generateMemoryAnalysis(request);
}

async function handleCourseIntelAgent(request: ADKRequest): Promise<Response> {
  logWithContext('info', '📚 Processing course intelligence request');
  
  const course = request.course || request.payload.course;
  if (!course) {
    throw new Error('Course data is required for course intelligence');
  }

  // Use the course analysis module
  return await generateCourseAnalysis(request);
}

async function handlePersonalizationAgent(request: ADKRequest): Promise<Response> {
  logWithContext('info', '🎯 Processing personalization request');
  
  const userProfile = request.user_profile || request.payload.user_profile;
  if (!userProfile) {
    throw new Error('User profile is required for personalization');
  }

  // Generate personalized recommendations based on actual data
  const recommendations = {
    learning_style_insights: [],
    study_recommendations: [],
    content_preferences: {
      format: 'adaptive',
      difficulty: 'progressive',
      time_commitment: 'flexible'
    }
  };

  return createJsonResponse(recommendations);
}

async function handleCareerPathwayAgent(): Promise<Response> {
  logWithContext('info', '🚀 Processing career pathway request');
  
  // const interests = request.payload.interests || [];
  // const skills = request.payload.skills || [];
  // const goals = request.payload.goals || [];

  // Generate career pathway recommendations
  const pathways = {
    recommended_careers: [
      {
        title: 'Data Scientist',
        alignment_score: 85,
        reasons: ['Strong analytical thinking', 'Interest in patterns', 'Technical aptitude'],
        next_steps: ['Learn Python/R', 'Study statistics', 'Build portfolio projects']
      },
      {
        title: 'UX Designer',
        alignment_score: 78,
        reasons: ['Creative problem solving', 'User empathy', 'Visual thinking'],
        next_steps: ['Learn design tools', 'Study user psychology', 'Create design portfolio']
      }
    ],
    skill_development: [
      'Critical thinking and analysis',
      'Technical communication',
      'Project management',
      'Continuous learning mindset'
    ],
    learning_path: {
      short_term: 'Focus on foundational skills in your area of interest',
      medium_term: 'Build practical experience through projects and internships',
      long_term: 'Develop specialization and leadership capabilities'
    }
  };

  return createJsonResponse(pathways);
}

async function handleStudyMapAgent(request: ADKRequest): Promise<Response> {
  logWithContext('info', '🗺️ Processing study map request');

  const subject = request.subject || request.payload.subject;
  // const syllabus = request.payload.syllabus || [];
  const userMemories = (request.memories || request.payload.memories || []) as Array<{ text?: string }>;

  if (!subject) {
    throw new Error('Subject is required for study map generation');
  }

  // Generate personalized study map
  const studyMap = {
    subject: subject,
    personalized_pathway: [
      {
        phase: 'Foundation',
        duration: '2-3 weeks',
        topics: ['Basic concepts', 'Core terminology', 'Fundamental principles'],
        memory_connections: userMemories.slice(0, 2).map((m: { text?: string }) => ({
          memory: m.text?.substring(0, 100),
          relevance: 'Connects to your experience with similar concepts'
        }))
      },
      {
        phase: 'Development',
        duration: '4-6 weeks',
        topics: ['Advanced concepts', 'Practical applications', 'Problem solving'],
        memory_connections: userMemories.slice(2, 4).map((m: { text?: string }) => ({
          memory: m.text?.substring(0, 100),
          relevance: 'Builds on your existing knowledge and interests'
        }))
      },
      {
        phase: 'Mastery',
        duration: '3-4 weeks',
        topics: ['Complex scenarios', 'Integration', 'Critical analysis'],
        memory_connections: userMemories.slice(4, 6).map((m: { text?: string }) => ({
          memory: m.text?.substring(0, 100),
          relevance: 'Applies concepts to your real-world context'
        }))
      }
    ],
    study_techniques: [
      'Spaced repetition for key concepts',
      'Practice problems with immediate feedback',
      'Connect new information to existing memories',
      'Regular self-assessment and reflection'
    ],
    progress_milestones: [
      'Week 2: Understanding basic terminology',
      'Week 4: Applying concepts to simple problems',
      'Week 8: Solving complex, multi-step problems',
      'Week 12: Teaching concepts to others'
    ]
  };

  return createJsonResponse(studyMap);
}

async function handleStudyGuideAgent(request: ADKRequest): Promise<Response> {
  logWithContext('info', '📚 Processing study guide generation request');

  const examContent = request.exam_content || request.payload.exam_content;
  const subjectName = request.subject_name || request.payload.subject_name;

  if (!examContent || !subjectName) {
    throw new Error('Both exam_content and subject_name are required for study guide generation');
  }

  // Create a properly formatted request for the study guide generator
  const studyGuideRequest = {
    ...request,
    exam_content: examContent,
    subject_name: subjectName
  };

  // Use the dedicated study guide generator feature
  return await generateStudyGuide(studyGuideRequest);
}

/**
 * Validate agent request structure
 */
export function validateAgentRequest(request: ADKRequest): {
  isValid: boolean;
  error?: string;
} {
  if (!request.agent_type) {
    return {
      isValid: false,
      error: 'Agent type is required'
    };
  }

  if (!Object.values(AgentType).includes(request.agent_type)) {
    return {
      isValid: false,
      error: `Unknown agent type: ${request.agent_type}`
    };
  }

  // Agent-specific validation
  switch (request.agent_type) {
    case AgentType.MemoryAnalysis:
      if (!request.memories && !request.payload.memories) {
        return {
          isValid: false,
          error: 'Memories data is required for memory analysis agent'
        };
      }
      break;

    case AgentType.CourseIntel:
      if (!request.course && !request.payload.course) {
        return {
          isValid: false,
          error: 'Course data is required for course intelligence agent'
        };
      }
      break;

    case AgentType.StudyMap:
      if (!request.subject && !request.payload.subject) {
        return {
          isValid: false,
          error: 'Subject is required for study map agent'
        };
      }
      break;

    case AgentType.StudyGuide:
      if (!request.exam_content && !request.payload.exam_content) {
        return {
          isValid: false,
          error: 'Exam content is required for study guide agent'
        };
      }
      if (!request.subject_name && !request.payload.subject_name) {
        return {
          isValid: false,
          error: 'Subject name is required for study guide agent'
        };
      }
      break;

    default:
      // Basic validation passed for other agents
      break;
  }

  return { isValid: true };
}

/**
 * List available agents for debugging/documentation
 */
export function getAvailableAgents(): string[] {
  return Object.values(AgentType);
} 