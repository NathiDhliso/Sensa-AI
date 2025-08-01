// Edge Function: Process Chat Message
// Backend processing for chat messages including sentiment analysis, mention extraction, and content enhancement

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ProcessMessageRequest {
  message: string;
  session_id: string;
  user_id: string;
  context: {
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

    if (!message || !session_id || !user_id) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Extract @mentions from message
    const mentions = extractMentions(message, context.participants)

    // 2. Analyze sentiment using simple keyword-based approach
    const sentiment_score = analyzeSentiment(message)

    // 3. Enhance content with formatting and links
    const processed_content = enhanceContent(message, context)

    // 4. Check if AI suggestion should be triggered
    const should_suggest = shouldTriggerAISuggestion(message, context.recent_messages)

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
function enhanceContent(message: string, context: any): string {
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

// Log processing metrics for analytics
async function logMessageMetrics(supabase: any, metrics: any) {
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