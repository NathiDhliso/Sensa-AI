// Root Problem Analysis feature - 5-Why analysis using Gemini AI
// Provides both standard and child-friendly analysis modes

import {
  logWithContext,
  createJsonResponse,
  createErrorResponse,
  formatProcessingTime
} from '../utils.ts';
import { callGemini } from '../api/gemini.ts';
import type { ADKRequest } from '../types.ts';

/**
 * Generate Root Problem Analysis using 5-Why methodology
 */
export async function generateRootProblemAnalysis(request: ADKRequest): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    logWithContext('info', '🎯 Starting Root Problem Analysis', { requestId });
    
    // Extract and validate input
    const { message, context, step, analysis_type } = request.payload;
    
    if (!message || typeof message !== 'string') {
      return createErrorResponse('Message is required and must be a string', 400, requestId);
    }
    
    logWithContext('info', 'Input validated', { 
      requestId, 
      message: message.substring(0, 50) + '...',
      step,
      analysis_type
    });
    
    // Generate AI response using Gemini
    const response = await callGemini({
      prompt: message,
      temperature: 0.7,
      maxTokens: 500
    });
    
    if (!response || !response.trim()) {
      throw new Error('No response received from AI service');
    }
    
    const processingTime = Date.now() - startTime;
    logWithContext('info', '✅ Root Problem Analysis completed', { 
      requestId, 
      processingTime: `${processingTime}ms`,
      responseLength: response.length
    });
    
    return createJsonResponse({
      success: true,
      data: {
        response: response.trim()
      }
    }, true, 200, undefined, requestId, { processingTime: formatProcessingTime(startTime) });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    logWithContext('error', '❌ Root Problem Analysis failed', { 
      requestId, 
      error: errorMessage,
      processingTime: `${processingTime}ms`
    });
    
    return createErrorResponse(
      `Failed to generate root problem analysis: ${errorMessage}`,
      500,
      requestId,
      { processingTime: `${processingTime}ms` }
    );
  }
}