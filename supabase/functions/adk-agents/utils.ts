// Enhanced Utility functions for ADK Agents Edge Function
// Shared helper functions used throughout the application

import { CORS_HEADERS } from './constants.ts';
import type { ADKResponse, ADKError } from './types.ts';

// Enhanced response creation with better type safety and validation
export function createJsonResponse<T>(
    data: T | null,
    success: boolean = true,
    status: number = 200,
    error?: string,
    requestId?: string,
    metadata?: Record<string, unknown>
): Response {
  // Validate status code
  if (status < 100 || status > 599) {
    throw new Error(`Invalid HTTP status code: ${status}`);
  }

  const response: ADKResponse<T> = {
    success,
    timestamp: new Date().toISOString(),
    ...(requestId && { request_id: requestId }),
    ...(data !== null && { data }),
    ...(error && { error }),
    ...(metadata && { metadata }),
  };

  return new Response(JSON.stringify(response, null, 2), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'X-Request-ID': requestId || generateRequestId(),
    },
  });
}

// Enhanced error response with better error categorization
export function createErrorResponse(
    error: string | Error | ADKError,
    status: number = 500,
    requestId?: string,
    context?: Record<string, unknown>
): Response {
  let errorMessage: string;
  let errorCode: string | undefined;
  let errorType: string = 'UnknownError';

  if (error instanceof Error) {
    errorMessage = error.message;
    errorType = error.constructor.name;
    if ('code' in error) {
      errorCode = (error as ADKError).code;
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
    errorType = 'ValidationError';
  } else {
    errorMessage = 'An unknown error occurred';
  }

  // Enhanced logging with context
  logWithContext('error', `${errorType}: ${errorMessage}`, {
    errorCode,
    status,
    requestId,
    context,
    stack: error instanceof Error ? error.stack : undefined
  });

  return createJsonResponse(
      null,
      false,
      status,
      errorMessage,
      requestId,
      { errorType, errorCode }
  );
}

// Enhanced JSON parsing with detailed error reporting
export function safeJsonParse<T = unknown>(
    jsonString: string,
    reviver?: (key: string, value: unknown) => unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    if (typeof jsonString !== 'string') {
      return { success: false, error: 'Input is not a string' };
    }

    if (jsonString.trim() === '') {
      return { success: false, error: 'Empty string provided' };
    }

    const parsed = JSON.parse(jsonString, reviver) as T;
    return { success: true, data: parsed };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    console.error('JSON parse error:', { error: errorMessage, input: jsonString.substring(0, 100) + '...' });
    return { success: false, error: errorMessage };
  }
}

// Enhanced retry delay extraction with better error handling
export function extractRetryDelay(errorBody: unknown): number {
  try {
    if (typeof errorBody === 'object' && errorBody !== null) {
      const body = errorBody as Record<string, unknown>;

      // Check multiple possible locations for retry information
      const errorObj = body?.error as Record<string, unknown>;
      const details = errorObj?.details as Record<string, unknown>[];

      // Look for RetryInfo in details
      const retryInfo = details?.find((d: Record<string, unknown>) =>
          d['@type']?.toString().includes('RetryInfo')
      );

      if (retryInfo?.retryDelay) {
        const retryDelayStr = retryInfo.retryDelay as string;
        const seconds = parseInt(retryDelayStr.replace(/[^\d]/g, ''));
        return Math.max(seconds * 1000, 1000); // Minimum 1 second
      }

      // Check for retry-after header format
      if (errorObj?.retryAfter) {
        const retryAfter = parseInt(errorObj.retryAfter as string);
        return Math.max(retryAfter * 1000, 1000);
      }
    }
  } catch (parseError) {
    logWithContext('warn', 'Failed to parse retry delay', { error: parseError });
  }

  return 30000; // Default 30 second delay
}

// Enhanced sleep with cancellation support
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Sleep was aborted'));
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, Math.max(ms, 0));

    const cleanup = () => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abortHandler);
    };

    const abortHandler = () => {
      cleanup();
      reject(new Error('Sleep was aborted'));
    };

    signal?.addEventListener('abort', abortHandler);
  });
}

// Enhanced request ID generation with better uniqueness
export function generateRequestId(prefix: string = 'adk'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  const processPart = Math.floor(Math.random() * 1000).toString(36);
  return `${prefix}_${timestamp}_${randomPart}_${processPart}`;
}

// Enhanced request validation with detailed error messages
export function validateRequest(request: unknown): {
  isValid: boolean;
  errors: string[];
  warnings: string[]
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request || typeof request !== 'object') {
    errors.push('Request must be an object');
    return { isValid: false, errors, warnings };
  }

  const req = request as Record<string, unknown>;

  // Required fields validation
  if (!req.agent_type || typeof req.agent_type !== 'string') {
    errors.push('agent_type is required and must be a string');
  } else if (req.agent_type.trim() === '') {
    errors.push('agent_type cannot be empty');
  }

  // Optional fields validation
  if (req.task !== undefined && typeof req.task !== 'string') {
    errors.push('task must be a string when provided');
  }

  if (!req.payload || typeof req.payload !== 'object') {
    errors.push('payload is required and must be an object');
  }

  // Warnings for best practices
  if (req.agent_type && typeof req.agent_type === 'string' && req.agent_type.length > 50) {
    warnings.push('agent_type is unusually long (>50 characters)');
  }

  if (req.task && typeof req.task === 'string' && req.task.length > 1000) {
    warnings.push('task is very long (>1000 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Enhanced AI response extraction with multiple format support
export function extractTextFromAIResponse(response: unknown): {
  text: string | null;
  confidence: number;
  format: string;
} {
  try {
    if (typeof response !== 'object' || !response) {
      return { text: null, confidence: 0, format: 'unknown' };
    }

    const data = response as Record<string, unknown>;

    // Handle Gemini v1beta format
    const candidates = data?.candidates as Record<string, unknown>[];
    if (candidates?.[0]?.content) {
      const content = candidates[0].content as Record<string, unknown>;
      const parts = content?.parts as Record<string, unknown>[];
      if (parts?.[0]?.text) {
        return {
          text: parts[0].text as string,
          confidence: 0.9,
          format: 'gemini-v1beta'
        };
      }
    }

    // Handle PaLM chat-bison format
    if (candidates?.[0]?.output) {
      return {
        text: candidates[0].output as string,
        confidence: 0.8,
        format: 'palm-chat-bison'
      };
    }

    // Handle OpenAI ChatCompletion format
    const choices = data?.choices as Record<string, unknown>[];
    if (choices?.[0]?.message) {
      const message = choices[0].message as Record<string, unknown>;
      if (message?.content) {
        return {
          text: message.content as string,
          confidence: 0.9,
          format: 'openai-chat'
        };
      }
    }

    // Handle Claude format
    if (data?.content && Array.isArray(data.content)) {
      const textContent = data.content.find((item: { type: string; text?: string }) => item.type === 'text');
      if (textContent?.text) {
        return {
          text: textContent.text,
          confidence: 0.9,
          format: 'claude'
        };
      }
    }

    return { text: null, confidence: 0, format: 'unsupported' };
  } catch (error) {
    logWithContext('error', 'Failed to extract text from AI response', { error });
    return { text: null, confidence: 0, format: 'error' };
  }
}

// Enhanced JSON cleaning with better error recovery
export function cleanAIJsonResponse(text: string): {
  data: unknown;
  success: boolean;
  cleanedText: string;
} {
  try {
    // Remove markdown code blocks and common prefixes
    const cleanText = text
        .replace(/```(?:json|javascript|js)?\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^Here's?\s+(?:the\s+)?(?:JSON|response):\s*/i, '')
        .replace(/^(?:JSON|Response):\s*/i, '')
        .trim();

    // Try direct parsing first
    try {
      const parsed = JSON.parse(cleanText);
      return { data: parsed, success: true, cleanedText: cleanText };
    } catch {
      // Continue with more aggressive cleaning
    }

    // Extract JSON from text using multiple strategies
    const jsonPatterns = [
      /\{[\s\S]*\}/,  // Standard JSON object
      /\[[\s\S]*\]/,  // JSON array
      /\{[^{}]*\}/,   // Simple object without nested braces
    ];

    for (const pattern of jsonPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          return { data: parsed, success: true, cleanedText: match[0] };
        } catch {
          // Continue with next pattern
        }
      }
    }

    // Final attempt: try to fix common JSON issues
    const fixedText = cleanText
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Fix unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Fix single quotes
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']');

    try {
      const parsed = JSON.parse(fixedText);
      return { data: parsed, success: true, cleanedText: fixedText };
    } catch {
      return { data: null, success: false, cleanedText: cleanText };
    }
  } catch (error) {
    logWithContext('error', 'Failed to clean AI JSON response', { error, textLength: text.length });
    return { data: null, success: false, cleanedText: text };
  }
}

// Enhanced input sanitization with configurable options
export function sanitizeInput(
    input: string,
    options: {
      maxLength?: number;
      allowedTags?: string[];
      removeUrls?: boolean;
      removeEmails?: boolean;
    } = {}
): string {
  if (typeof input !== 'string') {
    return '';
  }

  const {
    maxLength = 10000,
    allowedTags = [],
    removeUrls = false,
    removeEmails = false
  } = options;

  let sanitized = input.trim();

  // Remove URLs if requested
  if (removeUrls) {
    sanitized = sanitized.replace(/https?:\/\/[^\s]+/gi, '[URL_REMOVED]');
  }

  // Remove emails if requested
  if (removeEmails) {
    sanitized = sanitized.replace(/[^\s]+@[^\s]+\.[^\s]+/gi, '[EMAIL_REMOVED]');
  }

  // Remove HTML tags except allowed ones
  if (allowedTags.length === 0) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    const allowedPattern = new RegExp(`<(?!/?(?:${allowedTags.join('|')})(?:\\s|>))[^>]*>`, 'gi');
    sanitized = sanitized.replace(allowedPattern, '');
  }

  // Remove potentially dangerous characters
  sanitized = sanitized
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');

  return sanitized.substring(0, maxLength);
}

// Enhanced technical term extraction with better patterns
export function extractTechnicalTerms(text: string): {
  terms: string[];
  categories: Record<string, string[]>;
  confidence: number;
} {
  const patterns = {
    acronyms: /\b[A-Z]{2,}\b/g,
    algorithms: /\b\w*[Aa]lgorithm\w*\b/g,
    dataTerms: /\b\w*[Dd]ata(?:base|set|type|structure)?\w*\b/g,
    programming: /\b\w*[Pp]rogramming\w*\b/g,
    computer: /\b\w*[Cc]omputer\w*\b/g,
    software: /\b\w*[Ss]oftware\w*\b/g,
    technology: /\b\w*[Tt]echnology\w*\b/g,
    frameworks: /\b(?:React|Vue|Angular|Express|Django|Flask|Spring|Rails)\b/gi,
    languages: /\b(?:JavaScript|Python|Java|C\+\+|C#|Go|Rust|TypeScript|PHP|Ruby)\b/gi,
    databases: /\b(?:MySQL|PostgreSQL|MongoDB|Redis|SQLite|Oracle|Firebase)\b/gi,
  };

  const categories: Record<string, string[]> = {};
  const allTerms = new Set<string>();

  Object.entries(patterns).forEach(([category, pattern]) => {
    const matches = text.match(pattern) || [];
    const uniqueMatches = [...new Set(matches.map(m => m.toLowerCase()))];

    if (uniqueMatches.length > 0) {
      categories[category] = uniqueMatches;
      uniqueMatches.forEach(term => allTerms.add(term));
    }
  });

  const terms = Array.from(allTerms).slice(0, 20);
  const confidence = Math.min(terms.length / 10, 1);

  return { terms, categories, confidence };
}

// Enhanced similarity calculation with multiple algorithms
export function calculateSimilarity(
    text1: string,
    text2: string,
    algorithm: 'jaccard' | 'cosine' | 'levenshtein' = 'jaccard'
): { similarity: number; algorithm: string } {
  const normalize = (text: string) => text.toLowerCase().trim();
  const text1Norm = normalize(text1);
  const text2Norm = normalize(text2);

  switch (algorithm) {
    case 'jaccard':
      return { similarity: calculateJaccard(text1Norm, text2Norm), algorithm: 'jaccard' };
    case 'cosine':
      return { similarity: calculateCosine(text1Norm, text2Norm), algorithm: 'cosine' };
    case 'levenshtein':
      return { similarity: calculateLevenshtein(text1Norm, text2Norm), algorithm: 'levenshtein' };
    default:
      return { similarity: 0, algorithm: 'unknown' };
  }
}

function calculateJaccard(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateCosine(text1: string, text2: string): number {
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);

  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();

  words1.forEach(word => freq1.set(word, (freq1.get(word) || 0) + 1));
  words2.forEach(word => freq2.set(word, (freq2.get(word) || 0) + 1));

  const allWords = new Set([...freq1.keys(), ...freq2.keys()]);

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  allWords.forEach(word => {
    const f1 = freq1.get(word) || 0;
    const f2 = freq2.get(word) || 0;
    dotProduct += f1 * f2;
    norm1 += f1 * f1;
    norm2 += f2 * f2;
  });

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator > 0 ? dotProduct / denominator : 0;
}

function calculateLevenshtein(text1: string, text2: string): number {
  const matrix = Array(text2.length + 1).fill(null).map(() => Array(text1.length + 1).fill(null));

  for (let i = 0; i <= text1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= text2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= text2.length; j++) {
    for (let i = 1; i <= text1.length; i++) {
      const cost = text1[i - 1] === text2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  const maxLength = Math.max(text1.length, text2.length);
  return maxLength > 0 ? 1 - (matrix[text2.length][text1.length] / maxLength) : 1;
}

// Enhanced emotional tone analysis with confidence scoring
export function analyzeEmotionalTone(text: string): {
  tone: 'positive' | 'negative' | 'neutral';
  confidence: number;
  scores: { positive: number; negative: number; neutral: number };
  keywords: string[];
} {
  const emotionWords = {
    positive: ['good', 'great', 'amazing', 'love', 'enjoy', 'happy', 'excited', 'wonderful', 'fantastic', 'excellent', 'perfect', 'awesome', 'brilliant', 'outstanding'],
    negative: ['bad', 'hate', 'difficult', 'hard', 'struggle', 'frustrated', 'confused', 'terrible', 'awful', 'horrible', 'disappointing', 'angry', 'upset'],
    neutral: ['ok', 'fine', 'normal', 'average', 'moderate', 'acceptable', 'standard', 'typical']
  };

  const words = text.toLowerCase().split(/\s+/);
  const foundKeywords: string[] = [];

  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;

  words.forEach(word => {
    Object.entries(emotionWords).forEach(([emotion, emotionWordList]) => {
      const matchingWord = emotionWordList.find(emoWord =>
          word.includes(emoWord) || emoWord.includes(word)
      );
      if (matchingWord) {
        foundKeywords.push(matchingWord);
        switch (emotion) {
          case 'positive': positiveScore++; break;
          case 'negative': negativeScore++; break;
          case 'neutral': neutralScore++; break;
        }
      }
    });
  });

  const totalScore = positiveScore + negativeScore + neutralScore;
  const confidence = Math.min(totalScore / words.length * 10, 1);

  let tone: 'positive' | 'negative' | 'neutral';
  if (positiveScore > negativeScore && positiveScore > neutralScore) {
    tone = 'positive';
  } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
    tone = 'negative';
  } else {
    tone = 'neutral';
  }

  return {
    tone,
    confidence,
    scores: {
      positive: positiveScore,
      negative: negativeScore,
      neutral: neutralScore
    },
    keywords: [...new Set(foundKeywords)]
  };
}

// Enhanced processing time formatter
export function formatProcessingTime(startTime: number): {
  milliseconds: number;
  seconds: number;
  formatted: string;
} {
  const ms = Date.now() - startTime;
  const seconds = ms / 1000;

  let formatted: string;
  if (ms < 1000) {
    formatted = `${ms}ms`;
  } else if (seconds < 60) {
    formatted = `${seconds.toFixed(2)}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    formatted = `${minutes}m ${remainingSeconds.toFixed(2)}s`;
  }

  return { milliseconds: ms, seconds, formatted };
}

// Enhanced CORS response with additional headers
export function createCorsResponse(additionalHeaders: Record<string, string> = {}): Response {
  return new Response('ok', {
    headers: {
      ...CORS_HEADERS,
      'X-Response-Time': new Date().toISOString(),
      ...additionalHeaders
    }
  });
}

// Enhanced logging with structured data and log levels
export function logWithContext(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, unknown>,
    userId?: string
): void {
  const timestamp = new Date().toISOString();
  const emoji = {
    debug: '🔍',
    info: '📝',
    warn: '⚠️',
    error: '❌'
  }[level];

  const structuredLog = {
    timestamp,
    level,
    message,
    ...(userId && { userId }),
    ...(context && { context }),
  };

  const logMessage = `${emoji} [${timestamp}] ${message}`;

  // Use appropriate console method
  if (level === 'debug' && console.debug) {
    console.debug(logMessage, structuredLog);
  } else if (level === 'info') {
    console.info(logMessage, structuredLog);
  } else if (level === 'warn') {
    console.warn(logMessage, structuredLog);
  } else if (level === 'error') {
    console.error(logMessage, structuredLog);
  }
}

// Enhanced environment validation with security checks
export function validateEnvironment(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  securityIssues: string[];
} {
  const required = ['GOOGLE_AI_API_KEY'];
  const optional = ['RATE_LIMIT_REQUESTS', 'RATE_LIMIT_WINDOW', 'LOG_LEVEL'];

  const missing = required.filter(key => !Deno.env.get(key));
  const warnings: string[] = [];
  const securityIssues: string[] = [];

  // Check for optional environment variables
  optional.forEach(key => {
    if (!Deno.env.get(key)) {
      warnings.push(`Optional environment variable ${key} not set`);
    }
  });

  // Security checks
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (apiKey && apiKey.length < 20) {
    securityIssues.push('API key appears to be too short');
  }

  // Check for development environment indicators
  if (Deno.env.get('NODE_ENV') === 'development') {
    warnings.push('Running in development mode');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    securityIssues
  };
}

// Rate limiting utilities
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
      private maxRequests: number = 100,
      private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const existingRequests = this.requests.get(identifier) || [];

    // Filter out requests outside the window
    const validRequests = existingRequests.filter(time => time > windowStart);

    // Check if under the limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const existingRequests = this.requests.get(identifier) || [];
    const validRequests = existingRequests.filter(time => time > windowStart);

    return Math.max(0, this.maxRequests - validRequests.length);
  }

  getResetTime(identifier: string): number {
    const existingRequests = this.requests.get(identifier) || [];
    if (existingRequests.length === 0) return 0;

    const oldestRequest = Math.min(...existingRequests);
    return oldestRequest + this.windowMs;
  }
}

// Circuit breaker for external API calls
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
      private failureThreshold: number = 5,
      private resetTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}