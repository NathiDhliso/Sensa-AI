// Orchestrator request handler for ADK Agents Edge Function
// Routes tasks to appropriate handlers using a clean mapping system

import { Task, ERROR_MESSAGES } from '../constants.ts';
import { 
  createJsonResponse, 
  createErrorResponse, 
  generateRequestId, 
  logWithContext,
  formatProcessingTime 
} from '../utils.ts';
import type { ADKRequest, TaskHandler, TaskHandlerMap } from '../types.ts';

// Import analysis modules
import { generateCourseAnalysis, generateDocumentAnalysis } from '../analysis/course.ts';
import { generateMemoryAnalysis } from '../analysis/memory.ts';
import { generatePrimeMeNarrative } from '../features/primeMe.ts';
import { generateStudyGuide } from '../features/studyGuideGenerator.ts';
import { generateEpistemicDriver } from '../features/epistemicDriver.ts';
import { generateBusinessLensWorkflow } from '../features/businessLens.ts';
import { generateRootProblemAnalysis } from '../features/rootProblemAnalysis.ts';

/**
 * Create task handler mapping for clean routing
 */
function createTaskHandlerMap(): TaskHandlerMap {
  return new Map<Task, TaskHandler>([
    [Task.ComprehensiveCourseAnalysis, generateCourseAnalysis],
    [Task.DocumentContentAnalysis, generateDocumentAnalysis],
    [Task.MemoryAnalysis, generateMemoryAnalysis],
    [Task.PrimeMeNarrative, generatePrimeMeNarrative],
    [Task.StudyGuideGeneration, generateStudyGuide],
    [Task.EpistemicDriverGeneration, generateEpistemicDriver],
    [Task.BusinessLensWorkflow, generateBusinessLensWorkflow],
    [Task.RootProblemAnalysis, generateRootProblemAnalysis],
  ]);
}

/**
 * Main orchestrator request handler
 * Routes requests to appropriate task handlers
 */
export async function handleOrchestratorRequest(requestData: ADKRequest): Promise<Response> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  logWithContext('info', '🎭 Orchestrator request started', {
    task: requestData.task,
    requestId
  });

  try {
    // Validate task
    if (!requestData.task) {
      logWithContext('error', 'No task specified in orchestrator request', { requestId });
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, requestId);
    }

    // Get task handler
    const taskHandlers = createTaskHandlerMap();
    const handler = taskHandlers.get(requestData.task);
    
    if (!handler) {
      logWithContext('error', 'Unknown task type', { 
        task: requestData.task, 
        requestId 
      });
      return createErrorResponse(ERROR_MESSAGES.UNKNOWN_TASK, 400, requestId);
    }

    // Execute task handler
    logWithContext('info', `🔄 Executing task: ${requestData.task}`, { requestId });
    const result = await handler(requestData);
    
    // Add processing metadata
    const processingTime = formatProcessingTime(startTime);
    logWithContext('info', '✅ Orchestrator task completed', {
      task: requestData.task,
      processingTime,
      requestId
    });

    // If handler returns a Response, add metadata and return
    if (result instanceof Response) {
      return result;
    }

    // Otherwise create a success response
    return createJsonResponse(result, true, 200, undefined, requestId);

  } catch (error) {
    const processingTime = formatProcessingTime(startTime);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    
    logWithContext('error', '❌ Orchestrator error', {
      task: requestData.task,
      error: errorMsg,
      processingTime,
      requestId
    });

    return createErrorResponse(errorMsg, 500, requestId);
  }
}

/**
 * Validate orchestrator request structure
 */
export function validateOrchestratorRequest(request: ADKRequest): {
  isValid: boolean;
  error?: string;
} {
  if (!request.task) {
    return {
      isValid: false,
      error: 'Task is required for orchestrator requests'
    };
  }

  if (!Object.values(Task).includes(request.task)) {
    return {
      isValid: false,
      error: `Unknown task: ${request.task}`
    };
  }

  // Task-specific validation
  switch (request.task) {
    case Task.ComprehensiveCourseAnalysis:
    case Task.DocumentContentAnalysis:
      if (!request.course && !request.payload.course) {
        return {
          isValid: false,
          error: 'Course data is required for analysis tasks'
        };
      }
      break;

    case Task.MemoryAnalysis:
      if (!request.memories && !request.payload.memories) {
        return {
          isValid: false,
          error: 'Memories data is required for memory analysis'
        };
      }
      break;

    default:
      // Basic validation passed for other tasks
      break;
  }

  return { isValid: true };
}

/**
 * List available tasks for debugging/documentation
 */
export function getAvailableTasks(): string[] {
  return Object.values(Task);
}

/**
 * Get task handler information for debugging
 */
export function getTaskHandlerInfo(): Record<string, string> {
  const handlers = createTaskHandlerMap();
  const info: Record<string, string> = {};
  
  handlers.forEach((handler, task) => {
    info[task] = handler.name || 'Anonymous handler';
  });
  
  return info;
}