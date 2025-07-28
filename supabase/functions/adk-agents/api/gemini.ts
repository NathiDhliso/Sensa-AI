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
  
  // Extract and validate payload
  const { prompt, temperature } = extractPayloadData(payload);
  
  // Prepare request body
  const requestBody: GeminiRequestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: temperature ?? AI_CONFIG.DEFAULT_TEMPERATURE
    }
  };

  // Try Gemini models with fallback strategy
  const response = await tryGeminiModelsWithFallback(googleApiKey, requestBody);
  
  // Extract and validate response text
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
} {
  const messages = (payload.messages as Array<{ role: string; content: string }>) || [];
  const temperature = (payload.temperature as number | undefined);

  // Convert messages array to single prompt, preserving role context
  const prompt = messages
    .map((m) => (m.role === 'system' ? m.content : `User: ${m.content}`))
    .join('\n\n');

  if (!prompt.trim()) {
    throw new Error('Invalid request: Empty prompt');
  }

  return { prompt, temperature };
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
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        logWithContext('info', `✅ Model ${model} succeeded`);
        return await response.json();
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

      // Other errors
      const errorText = await response.text();
      throw new Error(`${model} API error ${response.status}: ${errorText}`);
      
    } catch (error) {
      if (attempt === AI_CONFIG.MAX_RETRIES) {
        throw error;
      }
      
      attempt++;
      const attemptErrorMsg = error instanceof Error ? error.message : 'Unknown error';
      logWithContext('warn', `Attempt ${attempt} failed for ${model}`, { error: attemptErrorMsg });
      await sleep(1000 * attempt); // Progressive backoff
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
  const endpoint = `https://generativelanguage.googleapis.com/v1beta1/models/${PALM_FALLBACK_MODEL}:generateText?key=${apiKey}`;
  
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
  return response.choices[0].message.content;
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