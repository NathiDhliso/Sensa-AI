// ADK Agents Edge Function - Modular Architecture
// Main server entry point with clean routing and error handling

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// Import modular components
import { AgentType } from './constants.ts';
import { 
  createCorsResponse, 
  createErrorResponse, 
  generateRequestId, 
  validateRequest,
  logWithContext,
  formatProcessingTime 
} from './utils.ts';
import { handleOrchestratorRequest } from './handlers/orchestrator.ts';
import { handleAgentRequest } from './handlers/agents.ts';
import type { ADKRequest } from './types.ts';

/**
 * Main server function with modular routing
 */
serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  logWithContext('info', '🚀 ADK Edge Function started', { requestId });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logWithContext('info', '✅ CORS preflight handled', { requestId });
    return createCorsResponse();
  }

  try {
    // Parse and validate request
    const requestData = await parseRequest(req);
    if (!requestData) {
      logWithContext('error', 'Invalid request format', { requestId });
      return createErrorResponse('Invalid request format', 400, requestId);
    }

    logWithContext('info', '🤖 ADK Request received', {
      task: requestData.task,
      agent_type: requestData.agent_type,
      requestId
    });

    // Route to appropriate handler
    const response = await routeRequest(requestData, requestId);
    
    // Add processing time metadata
    const processingTime = formatProcessingTime(startTime);
    logWithContext('info', '✅ Request completed', { 
      processingTime, 
      requestId 
    });

    return response;

  } catch (error) {
    const processingTime = formatProcessingTime(startTime);
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    
    logWithContext('error', '❌ Top-level server error', {
      error: errorMsg,
      processingTime,
      requestId
    });
    
    return createErrorResponse(
      'Failed to process request',
      500,
      requestId
    );
  }
});

/**
 * Parse and validate incoming request
 */
async function parseRequest(req: Request): Promise<ADKRequest | null> {
  try {
    const body = await req.json();
    
    if (!validateRequest(body)) {
      return null;
    }
    
    return body as ADKRequest;
  } catch (error) {
    logWithContext('error', 'Failed to parse request JSON', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
}

/**
 * Route request to appropriate handler based on type
 */
async function routeRequest(requestData: ADKRequest, requestId: string): Promise<Response> {
  // Route to orchestrator if task is specified or agent_type is orchestrator
  if (requestData.task || requestData.agent_type === AgentType.Orchestrator) {
    logWithContext('info', '🎭 Routing to orchestrator', { 
      task: requestData.task, 
      requestId 
    });
    return await handleOrchestratorRequest(requestData);
  }
  
  // Route to direct agent handler
  logWithContext('info', '🤖 Routing to agent handler', { 
    agent: requestData.agent_type, 
    requestId 
  });
  return await handleAgentRequest(requestData);
}

/**
 * Health check endpoint (for monitoring)
 */
export function createHealthResponse(): Response {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-modular',
    modules: {
      orchestrator: 'active',
      agents: 'active',
      gemini_api: 'active',
      analysis: 'active',
      features: 'active'
    }
  };

  return new Response(JSON.stringify(health), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Error logging and monitoring
 */
function setupErrorMonitoring(): void {
  // Global error handler
  globalThis.addEventListener('error', (event) => {
    logWithContext('error', '💥 Unhandled error', {
      message: event.error?.message || 'Unknown error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Unhandled promise rejection handler
  globalThis.addEventListener('unhandledrejection', (event) => {
    logWithContext('error', '💥 Unhandled promise rejection', {
      reason: event.reason
    });
  });
}

// Initialize error monitoring
setupErrorMonitoring();

// Log startup
logWithContext('info', '🎉 ADK Edge Function initialized with modular architecture'); 