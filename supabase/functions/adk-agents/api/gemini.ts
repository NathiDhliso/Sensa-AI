// Gemini API integration for ADK Agents Edge Function
// Handles all AI API interactions with robust error handling and fallbacks

import { 
  GEMINI_MODELS, 
  PALM_FALLBACK_MODEL, 
  AI_CONFIG, 
  ERROR_MESSAGES 
} from '../constants.ts';
import { 
  extractRetryDelay, 
  sleep, 
  extractTextFromAIResponse, 
  logWithContext,
  validateEnvironment 
} from '../utils.ts';
import type {
  ChatCompletionResponse,
  GeminiRequestBody
} from '../types.ts';

/**
 * Calls Google Gemini API with robust error handling and fallback mechanisms
 * Returns a ChatCompletion-compatible response for downstream compatibility
 */
export async function callGemini(payload: Record<string, unknown>): Promise<ChatCompletionResponse> {
  logWithContext('info', '🎯 Starting Gemini API call');
  
  // Validate environment
  const envCheck = validateEnvironment();
  if (!envCheck.isValid) {
    logWithContext('error', 'Environment validation failed', { missing: envCheck.missing });
    throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
  }

  const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY')!;

  // Debug: Log API key status (first 10 chars only for security)
  logWithContext('info', `🔑 API Key status: ${googleApiKey ? `Present (${googleApiKey.substring(0, 10)}...)` : 'Missing'}`);
  logWithContext('info', `🎯 Available models: ${GEMINI_MODELS.join(', ')}`);

  // Extract and validate payload
  const { prompt, temperature, responseMimeType, responseSchema, maxOutputTokens } = extractPayloadData(payload);

  // Test API key with a simple request first (only for epistemic driver requests)
  if (prompt.includes('Analyze the following list of exam objectives')) {
    logWithContext('info', '🧪 Testing API key with simple request first');
    try {
      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS[0]}:generateContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello, can you respond with just "API working"?' }] }],
          generationConfig: { temperature: 0.1 }
        })
      });

      logWithContext('info', `🧪 Test API response: ${testResponse.status} ${testResponse.statusText}`);

      if (testResponse.ok) {
        const testData = await testResponse.json();
        logWithContext('info', '✅ API key test successful', {
          hasCandidate: !!testData.candidates?.[0],
          responsePreview: testData.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50)
        });
      } else {
        const errorText = await testResponse.text();
        logWithContext('error', '❌ API key test failed', {
          status: testResponse.status,
          error: errorText.substring(0, 200)
        });
      }
    } catch (testError) {
      logWithContext('error', '❌ API key test error', { error: testError.message });
    }
  }

  // Prepare request body
  const requestBody: GeminiRequestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: temperature ?? AI_CONFIG.DEFAULT_TEMPERATURE,
      ...(maxOutputTokens && { maxOutputTokens }),
      ...(responseMimeType && { responseMimeType }),
      ...(responseSchema && { responseSchema })
    }
  };

  // Validate request body structure
  if (!requestBody.contents || requestBody.contents.length === 0) {
    throw new Error('Invalid request body: contents array is empty');
  }

  if (!requestBody.contents[0].parts || requestBody.contents[0].parts.length === 0) {
    throw new Error('Invalid request body: parts array is empty');
  }

  if (!requestBody.contents[0].parts[0].text || requestBody.contents[0].parts[0].text.trim() === '') {
    throw new Error('Invalid request body: text content is empty');
  }

  logWithContext('info', '📋 Request validation passed', {
    promptLength: prompt.length,
    temperature: requestBody.generationConfig.temperature,
    contentsCount: requestBody.contents.length
  });

  // Try Gemini models with fallback strategy
  const response = await tryGeminiModelsWithFallback(googleApiKey, requestBody);

  // Check if this is a structured JSON response (when responseSchema is used)
  if (responseMimeType === "application/json" && responseSchema) {
    // For structured responses, return the JSON directly from candidates[0].content.parts[0].text
    const candidates = (response as any)?.candidates;
    if (candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const jsonResponse = JSON.parse(candidates[0].content.parts[0].text);
        logWithContext('info', '✅ Structured JSON response received', {
          hasEpistemologicalDrivers: !!jsonResponse.epistemological_drivers,
          hasLearningPaths: !!jsonResponse.learning_paths,
          hasGroupedObjectives: !!jsonResponse.grouped_objectives
        });
        return jsonResponse;
      } catch (parseError) {
        logWithContext('error', '❌ Failed to parse structured JSON response', {
          error: parseError.message,
          rawText: candidates[0].content.parts[0].text.substring(0, 200)
        });
        throw new Error(`Failed to parse structured JSON response: ${parseError.message}`);
      }
    } else {
      logWithContext('error', '❌ No content in structured response', { response });
      throw new Error('No content in structured JSON response');
    }
  }

  // For regular text responses, extract text as before
  const text = extractTextFromAIResponse(response);
  if (!text) {
    logWithContext('error', 'No text content in AI response', { response });
    throw new Error(ERROR_MESSAGES.NO_CONTENT_RECEIVED);
  }

  logWithContext('info', '✅ Gemini response received', { textLength: text.length });

  // Return ChatCompletion-compatible response
  return {
    choices: [{
      message: {
        content: text
      }
    }]
  };
}

/**
 * Extract and validate data from the request payload
 */
function extractPayloadData(payload: Record<string, unknown>): {
  prompt: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: any;
  maxOutputTokens?: number;
} {
  const messages = (payload.messages as Array<{ role: string; content: string }>) || [];
  const temperature = (payload.temperature as number | undefined);
  const responseMimeType = (payload.responseMimeType as string | undefined);
  const responseSchema = (payload.responseSchema as any | undefined);
  const maxOutputTokens = (payload.maxOutputTokens as number | undefined);

  // Convert messages array to single prompt, preserving role context
  const prompt = messages
    .map((m) => (m.role === 'system' ? m.content : `User: ${m.content}`))
    .join('\n\n');

  if (!prompt.trim()) {
    throw new Error('Invalid request: Empty prompt');
  }

  return { prompt, temperature, responseMimeType, responseSchema, maxOutputTokens };
}

/**
 * Try Gemini models in order with fallback to PaLM
 */
async function tryGeminiModelsWithFallback(
  apiKey: string, 
  requestBody: GeminiRequestBody
): Promise<unknown> {
  // let lastError: Error | null = null;
  
  // Try each Gemini model
  for (const model of GEMINI_MODELS) {
    try {
      const response = await tryGeminiModel(apiKey, model, requestBody);
      if (response) {
        return response;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logWithContext('warn', `Model ${model} failed`, { error: errorMsg });
      // lastError = error as Error;
      
      // If it's a 404, try next model immediately
      if (errorMsg.includes('404')) {
        continue;
      }
      
      // For other errors, this might be the last attempt
    }
  }
  
  // If all Gemini models failed, try PaLM fallback
  logWithContext('warn', '🔄 All Gemini models failed. Trying PaLM fallback');
  try {
    return await tryPalmFallback(apiKey, requestBody);
  } catch (palmError) {
    const palmErrorMsg = palmError instanceof Error ? palmError.message : 'Unknown error';
    logWithContext('error', 'PaLM fallback also failed', { error: palmErrorMsg });
    throw new Error('All AI models failed, including PaLM fallback');
  }
}

/**
 * Try a specific Gemini model with retry logic
 */
async function tryGeminiModel(
  apiKey: string,
  model: string,
  requestBody: GeminiRequestBody
): Promise<unknown | null> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  logWithContext('info', `➡️ Trying model: ${model}`);
  
  let attempt = 0;
  
  while (attempt <= AI_CONFIG.MAX_RETRIES) {
    try {
      // Log the request details for debugging
      logWithContext('info', `📤 Sending request to ${model}`, {
        endpoint,
        requestBodyStructure: {
          hasContents: !!requestBody.contents,
          contentsLength: requestBody.contents?.length,
          hasGenerationConfig: !!requestBody.generationConfig,
          temperature: requestBody.generationConfig?.temperature,
          promptLength: requestBody.contents?.[0]?.parts?.[0]?.text?.length || 0
        },
        // Log first 100 chars of prompt for debugging
        promptPreview: requestBody.contents?.[0]?.parts?.[0]?.text?.substring(0, 100) + '...'
      });

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.GEMINI_REQUEST_TIMEOUT_MS);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Log response details
      logWithContext('info', `📥 Response from ${model}`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        logWithContext('info', `✅ Model ${model} succeeded`);
        const responseData = await response.json();
        logWithContext('info', `📊 Response data structure`, {
          model,
          hasCandidate: !!responseData.candidates?.[0],
          hasContent: !!responseData.candidates?.[0]?.content,
          hasParts: !!responseData.candidates?.[0]?.content?.parts,
          partsLength: responseData.candidates?.[0]?.content?.parts?.length
        });
        return responseData;
      }

      // Handle rate limiting with retry
      if (response.status === 429) {
        const errorBody = await response.json().catch(() => ({}));
        const retryDelay = extractRetryDelay(errorBody);
        
        attempt++;
        if (attempt <= AI_CONFIG.MAX_RETRIES) {
          logWithContext('warn', `🔄 Rate limited. Retrying in ${retryDelay/1000}s (attempt ${attempt})`);
          await sleep(retryDelay);
          continue;
        }
      }

      // Handle 404 - model not available
      if (response.status === 404) {
        logWithContext('warn', `⚠️ Model ${model} not found (404)`);
        return null; // Signal to try next model
      }

      // Other errors - get full error details
      let errorText = '';
      let errorJson = null;

      try {
        errorText = await response.text();
        // Try to parse as JSON for structured error info
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          // Not JSON, keep as text
        }
      } catch (textError) {
        errorText = `Failed to read error response: ${textError.message}`;
      }

      logWithContext('error', `❌ ${model} API error - Full Details`, {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 1000), // More characters for debugging
        errorJson,
        endpoint,
        requestBodySent: JSON.stringify(requestBody, null, 2)
      });

      throw new Error(`${model} API error ${response.status}: ${errorText}`);
      
    } catch (error) {
      // Handle timeout errors specifically
      if (error.name === 'AbortError') {
        logWithContext('warn', `⏰ Request timeout for ${model} after ${AI_CONFIG.GEMINI_REQUEST_TIMEOUT_MS/1000}s`);
        // For timeout, try next model immediately instead of retrying
        return null;
      }

      const attemptErrorMsg = error instanceof Error ? error.message : 'Unknown error';

      // Enhanced error logging with full context
      const errorContext = {
        error: attemptErrorMsg,
        attempt: attempt + 1,
        maxRetries: AI_CONFIG.MAX_RETRIES,
        errorType: error?.constructor?.name || 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined,
        model,
        endpoint,
        requestBodyStructure: {
          hasContents: !!requestBody.contents,
          contentsLength: requestBody.contents?.length,
          temperature: requestBody.generationConfig?.temperature
        }
      };

      logWithContext('error', `❌ Attempt ${attempt + 1} failed for ${model} - Full Context`, errorContext);

      // Log the full request body on final attempt for debugging
      if (attempt === AI_CONFIG.MAX_RETRIES) {
        logWithContext('error', `❌ Final attempt failed - Request Body`, {
          model,
          requestBody: JSON.stringify(requestBody, null, 2)
        });
        throw error;
      }

      attempt++;
      // Reduced backoff time for faster retries
      await sleep(Math.min(2000 * attempt, 5000)); // Progressive backoff, max 5s
    }
  }
  
  return null;
}

/**
 * Try PaLM chat-bison as fallback
 */
async function tryPalmFallback(
  apiKey: string,
  originalRequestBody: GeminiRequestBody
): Promise<unknown> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${PALM_FALLBACK_MODEL}:generateText?key=${apiKey}`;
  
  // Convert Gemini request format to PaLM format
  const prompt = originalRequestBody.contents[0]?.parts[0]?.text || '';
  const palmRequestBody = {
    prompt: { text: prompt },
    temperature: originalRequestBody.generationConfig.temperature,
  };

  logWithContext('info', '🔄 Trying PaLM fallback model');
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(palmRequestBody)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PaLM API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  
  if (data?.error) {
    throw new Error(`PaLM API error: ${data.error.message || 'Unknown error'}`);
  }

  logWithContext('info', '✅ PaLM fallback succeeded');
  return data;
}

/**
 * Create a simple text-based AI request (for cases where we don't need ChatCompletion format)
 */
export async function callGeminiSimple(prompt: string, temperature?: number): Promise<string> {
  const payload = {
    messages: [{ role: 'user', content: prompt }],
    temperature: temperature ?? AI_CONFIG.DEFAULT_TEMPERATURE
  };

  const response = await callGemini(payload);
  const content = response.choices[0]?.message?.content;

  // Handle both string and object responses from Gemini
  if (typeof content === 'string') {
    return content;
  } else if (content && typeof content === 'object' && 'text' in content) {
    return (content as { text: string }).text;
  } else {
    throw new Error(`Invalid Gemini response: content is ${typeof content}. Full response: ${JSON.stringify(response)}`);
  }
}

/**
 * Test function to verify Gemini API connectivity
 */
export async function testGeminiAPI(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!googleApiKey) {
      return { success: false, message: 'GOOGLE_AI_API_KEY environment variable not found' };
    }

    logWithContext('info', '🧪 Testing Gemini API connectivity');

    const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS[0]}:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, respond with just "API working"' }] }],
        generationConfig: { temperature: 0.1 }
      })
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      return {
        success: false,
        message: `API test failed with status ${testResponse.status}`,
        details: { status: testResponse.status, error: errorText }
      };
    }

    const testData = await testResponse.json();
    const responseText = testData.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      success: true,
      message: 'API test successful',
      details: { responseText, fullResponse: testData }
    };

  } catch (error) {
    return {
      success: false,
      message: `API test error: ${error.message}`,
      details: { error: error.message, stack: error.stack }
    };
  }
}

/**
 * Validate AI response structure
 */
export function validateAIResponse(response: unknown): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  const data = response as Record<string, unknown>;
  
  // Check for valid Gemini response
  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return true;
  }
  
  // Check for valid PaLM response  
  if (data?.candidates?.[0]?.output) {
    return true;
  }
  
  return false;
} 