// Edge Function: Process Chat Message
// Backend processing for chat messages including sentiment analysis, mention extraction, and content enhancement

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ProcessMessageRequest {
  message: string;
  session_id?: string;
  user_id?: string;
  context?: string | {
    participants: Array<{ id: string; name: string }>;
    recent_messages: Array<{ message: string; user_name: string }>;
    mindmap_context: boolean;
  };
}

interface ProcessMessageResponse {
  processed_content: string;
  sentiment_score: number;
  mentions: string[];
  should_suggest: boolean;
  content_flags: string[];
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { message, session_id, user_id, context }: ProcessMessageRequest = await req.json()

    if (!message) {
      return new Response('Message is required', { status: 400 })
    }

    // Handle simple AI chat requests (like Root Problem analysis)
    if (typeof context === 'string' || (!session_id || !user_id)) {
      return await handleSimpleAIChat(message)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Ensure context is the collaboration context type
    const collaborationContext = context as {
      participants: Array<{ id: string; name: string }>;
      recent_messages: Array<{ message: string; user_name: string }>;
      mindmap_context: boolean;
    }

    // 1. Extract @mentions from message
    const mentions = extractMentions(message, collaborationContext.participants)

    // 2. Analyze sentiment using simple keyword-based approach
    const sentiment_score = analyzeSentiment(message)

    // 3. Enhance content with formatting and links
    const processed_content = enhanceContent(message)

    // 4. Check if AI suggestion should be triggered
    const should_suggest = shouldTriggerAISuggestion(message, collaborationContext.recent_messages)

    // 5. Content moderation flags
    const content_flags = moderateContent(message)

    // 6. Log processing metrics (backend analytics)
    await logMessageMetrics(supabase, {
      session_id,
      user_id,
      message_length: message.length,
      sentiment_score,
      mentions_count: mentions.length,
      processing_time: Date.now()
    })

    const response: ProcessMessageResponse = {
      processed_content,
      sentiment_score,
      mentions,
      should_suggest,
      content_flags
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Error processing message:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

// Handle simple AI chat requests
async function handleSimpleAIChat(message: string): Promise<Response> {
  try {
    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GOOGLE_AI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Multiple Gemini models to try (in order of preference)
    const GEMINI_MODELS = [
      'gemini-2.5-flash',
      'gemini-2.5-pro', 
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest' // Keep the original as fallback
    ];
    
    // Try each Gemini model with retry logic
    for (const model of GEMINI_MODELS) {
      try {
        const result = await tryGeminiModel(geminiApiKey, model, message);
        if (result) {
          return new Response(JSON.stringify({
            success: true,
            data: {
              response: result
            }
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch (error) {
        console.log(`Model ${model} failed: ${error.message}`);
        // Continue to next model
      }
    }
    
    throw new Error('All Gemini models failed');

  } catch (error) {
    console.error('Error in simple AI chat:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

// Extract @mentions from message
function extractMentions(message: string, participants: Array<{ id: string; name: string }>): string[] {
  const mentions: string[] = []
  const mentionRegex = /@(\w+)/g
  let match

  while ((match = mentionRegex.exec(message)) !== null) {
    const mentionedName = match[1].toLowerCase()
    const participant = participants.find(p => 
      p.name.toLowerCase().includes(mentionedName) ||
      mentionedName.includes(p.name.toLowerCase())
    )
    
    if (participant && !mentions.includes(participant.id)) {
      mentions.push(participant.id)
    }
  }

  return mentions
}

// Simple sentiment analysis using keyword scoring
function analyzeSentiment(message: string): number {
  const positiveWords = [
    'good', 'great', 'excellent', 'awesome', 'fantastic', 'love', 'like',
    'amazing', 'wonderful', 'perfect', 'brilliant', 'outstanding', 'yes',
    'agree', 'correct', 'right', 'helpful', 'useful', 'clear', 'thanks'
  ]
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'hate', 'dislike', 'wrong', 'error',
    'problem', 'issue', 'difficult', 'hard', 'confusing', 'unclear',
    'no', 'disagree', 'incorrect', 'useless', 'unhelpful', 'frustrated'
  ]

  const words = message.toLowerCase().split(/\s+/)
  let score = 0
  let wordCount = 0

  words.forEach(word => {
    const cleanWord = word.replace(/[^a-z]/g, '')
    if (positiveWords.includes(cleanWord)) {
      score += 1
      wordCount++
    } else if (negativeWords.includes(cleanWord)) {
      score -= 1
      wordCount++
    }
  })

  // Normalize score between -1 and 1
  if (wordCount === 0) return 0
  return Math.max(-1, Math.min(1, score / Math.max(wordCount, 3)))
}

// Enhance content with formatting and smart links
function enhanceContent(message: string): string {
  let enhanced = message

  // 1. Convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g
  enhanced = enhanced.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>')

  // 2. Highlight @mentions
  const mentionRegex = /@(\w+)/g
  enhanced = enhanced.replace(mentionRegex, '<span class="mention">@$1</span>')

  // 3. Format code blocks
  const codeRegex = /`([^`]+)`/g
  enhanced = enhanced.replace(codeRegex, '<code>$1</code>')

  // 4. Convert mindmap node references
  const nodeRegex = /#node:(\w+)/g
  enhanced = enhanced.replace(nodeRegex, '<span class="node-ref" data-node-id="$1">#$1</span>')

  // 5. Emphasize important words
  const emphasisRegex = /\*(\w+)\*/g
  enhanced = enhanced.replace(emphasisRegex, '<strong>$1</strong>')

  return enhanced
}

// Determine if AI suggestion should be triggered
function shouldTriggerAISuggestion(message: string, recentMessages: Array<{ message: string; user_name: string }>): boolean {
  const triggerPhrases = [
    'what do you think', 'any ideas', 'suggestions', 'help me',
    'how should', 'what about', 'any thoughts', 'brainstorm',
    'stuck', 'not sure', 'confused', 'need help'
  ]

  const messageLower = message.toLowerCase()
  const hasTriggerPhrase = triggerPhrases.some(phrase => messageLower.includes(phrase))
  
  // Also trigger if it's a question
  const isQuestion = message.includes('?')
  
  // Don't trigger too frequently (check recent messages)
  const recentAIMessages = recentMessages.filter(msg => 
    msg.user_name === 'AI Assistant'
  ).length
  
  return (hasTriggerPhrase || isQuestion) && recentAIMessages < 2
}

// Content moderation
function moderateContent(message: string): string[] {
  const flags: string[] = []
  const messageLower = message.toLowerCase()

  // Check for inappropriate content
  const inappropriateWords = ['spam', 'scam', 'offensive']
  if (inappropriateWords.some(word => messageLower.includes(word))) {
    flags.push('inappropriate')
  }

  // Check for excessive caps
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length
  if (capsRatio > 0.7 && message.length > 10) {
    flags.push('excessive_caps')
  }

  // Check for very long messages
  if (message.length > 1000) {
    flags.push('very_long')
  }

  return flags
}

// Helper function to try a specific Gemini model with retry logic
async function tryGeminiModel(apiKey: string, model: string, prompt: string): Promise<string | null> {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Handle 404 - model not available, try next model
        if (response.status === 404) {
          console.log(`Model ${model} not found (404)`);
          return null;
        }
        
        // Check if this is a retryable error
        if ((response.status === 503 || response.status === 429 || response.status === 500) && attempt < maxRetries - 1) {
          attempt++;
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`${model} API error ${response.status}, retrying in ${delay/1000}s (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`${model} API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error(`No response generated from ${model}`);
      }

      console.log(`✅ Model ${model} succeeded`);
      return generatedText;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      attempt++;
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`${model} error, retrying in ${delay/1000}s (attempt ${attempt}/${maxRetries}): ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

// Log processing metrics for analytics
async function logMessageMetrics(supabase: SupabaseClient, metrics: {
  session_id: string;
  user_id: string;
  message_length: number;
  processing_time: number;
  sentiment_score: number;
  mentions_count: number;
}) {
  try {
    await supabase
      .from('chat_message_metrics')
      .insert([{
        session_id: metrics.session_id,
        user_id: metrics.user_id,
        message_length: metrics.message_length,
        sentiment_score: metrics.sentiment_score,
        mentions_count: metrics.mentions_count,
        processed_at: new Date().toISOString()
      }])
  } catch (error) {
    // Metrics logging is non-critical, don't fail the main operation
    console.warn('Failed to log metrics:', error)
  }
}