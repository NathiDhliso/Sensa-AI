// Edge Function: Generate Chat Suggestion
// AI-powered chat suggestions based on conversation context and mindmap state

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface GenerateSuggestionRequest {
  user_message: string;
  session_id: string;
  mindmap_state: {
    nodes: Array<{ id: string; data: { label: string; type?: string } }>;
    edges: Array<{ id: string; source: string; target: string }>;
  };
  conversation_history: Array<{
    user_name: string;
    message: string;
    message_type: string;
    created_at: string;
  }>;
}

interface GenerateSuggestionResponse {
  suggestion: string | null;
  suggestion_type: 'mindmap_enhancement' | 'question_answer' | 'brainstorm' | 'clarification' | 'resource';
  confidence: number;
  related_nodes?: string[];
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

    const {
      user_message,
      session_id,
      mindmap_state,
      conversation_history
    }: GenerateSuggestionRequest = await req.json()

    if (!user_message || !session_id) {
      return new Response('Missing required fields', { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Analyze the user message and context
    const analysis = analyzeMessageContext(user_message, mindmap_state, conversation_history)
    
    // Generate appropriate suggestion based on analysis
    const suggestion = await generateContextualSuggestion(analysis, mindmap_state)
    
    // Log suggestion generation for analytics
    await logSuggestionMetrics(supabase, {
      session_id,
      user_message,
      suggestion_type: suggestion.suggestion_type,
      confidence: suggestion.confidence,
      generated_at: Date.now()
    })

    return new Response(JSON.stringify(suggestion), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Error generating suggestion:', error)
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

// Analyze message context to determine suggestion type
function analyzeMessageContext(message: string, mindmapState: any, history: any[]) {
  const messageLower = message.toLowerCase()
  
  const patterns = {
    question: /\?|what|how|why|when|where|who|can you|could you|would you/,
    brainstorm: /ideas|brainstorm|think of|suggestions|alternatives|options/,
    clarification: /confused|unclear|don't understand|explain|clarify/,
    mindmap_related: /node|connect|link|add|remove|mindmap|map|diagram/,
    resource: /resource|link|reference|documentation|example|tutorial/,
    stuck: /stuck|help|problem|issue|difficulty|challenge/
  }

  const intent = Object.entries(patterns).find(([_, pattern]) => 
    pattern.test(messageLower)
  )?.[0] || 'general'

  return {
    intent,
    message,
    messageLower,
    mindmapNodes: mindmapState?.nodes || [],
    mindmapEdges: mindmapState?.edges || [],
    recentMessages: history.slice(-5),
    hasQuestion: message.includes('?'),
    messageLength: message.length
  }
}

// Generate contextual suggestion based on analysis
async function generateContextualSuggestion(analysis: any, mindmapState: any): Promise<GenerateSuggestionResponse> {
  const { intent, message, mindmapNodes, mindmapEdges, recentMessages } = analysis

  switch (intent) {
    case 'question':
      return generateQuestionResponse(analysis)
    
    case 'brainstorm':
      return generateBrainstormSuggestion(analysis)
    
    case 'clarification':
      return generateClarification(analysis)
    
    case 'mindmap_related':
      return generateMindmapSuggestion(analysis)
    
    case 'resource':
      return generateResourceSuggestion(analysis)
    
    case 'stuck':
      return generateHelpSuggestion(analysis)
    
    default:
      return generateGeneralSuggestion(analysis)
  }
}

// Generate response to questions
function generateQuestionResponse(analysis: any): GenerateSuggestionResponse {
  const { message, mindmapNodes } = analysis
  
  // Look for relevant nodes that might answer the question
  const relevantNodes = mindmapNodes.filter((node: any) => {
    const nodeText = node.data.label.toLowerCase()
    const messageWords = message.toLowerCase().split(' ')
    return messageWords.some(word => word.length > 3 && nodeText.includes(word))
  })

  if (relevantNodes.length > 0) {
    const nodeLabels = relevantNodes.map((n: any) => n.data.label).join(', ')
    return {
      suggestion: `Based on your mindmap, you might want to explore: ${nodeLabels}. These concepts seem related to your question.`,
      suggestion_type: 'question_answer',
      confidence: 0.7,
      related_nodes: relevantNodes.map((n: any) => n.id)
    }
  }

  return {
    suggestion: "That's an interesting question! Consider breaking it down into smaller parts or adding it as a new node to explore further.",
    suggestion_type: 'question_answer',
    confidence: 0.5
  }
}

// Generate brainstorming suggestions
function generateBrainstormSuggestion(analysis: any): GenerateSuggestionResponse {
  const { mindmapNodes } = analysis
  
  const suggestions = [
    "Try the 'What if...' technique - ask what if scenarios about your current nodes.",
    "Consider the opposite perspective - what would contradict your current ideas?",
    "Look for patterns and connections between existing nodes.",
    "Think about the 5 W's: Who, What, When, Where, Why for each concept.",
    "Try mind mapping from a different stakeholder's perspective."
  ]

  if (mindmapNodes.length > 0) {
    const randomNode = mindmapNodes[Math.floor(Math.random() * mindmapNodes.length)]
    suggestions.unshift(`What if we expanded on '${randomNode.data.label}'? What are its implications or applications?`)
  }

  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
  
  return {
    suggestion: randomSuggestion,
    suggestion_type: 'brainstorm',
    confidence: 0.8
  }
}

// Generate clarification help
function generateClarification(analysis: any): GenerateSuggestionResponse {
  const { message, mindmapNodes } = analysis
  
  return {
    suggestion: "I'd be happy to help clarify! Try breaking down the concept into smaller, more specific questions. You can also create a new node to explore the confusing topic step by step.",
    suggestion_type: 'clarification',
    confidence: 0.6
  }
}

// Generate mindmap-specific suggestions
function generateMindmapSuggestion(analysis: any): GenerateSuggestionResponse {
  const { mindmapNodes, mindmapEdges } = analysis
  
  const suggestions = []
  
  if (mindmapNodes.length === 0) {
    suggestions.push("Start by adding a central concept as your main node, then branch out with related ideas.")
  } else if (mindmapNodes.length < 5) {
    suggestions.push("Consider adding more nodes to expand your ideas. What are the key components or related concepts?")
  } else {
    suggestions.push("Your mindmap is growing! Consider grouping related nodes or adding connections to show relationships.")
  }
  
  if (mindmapEdges.length < mindmapNodes.length - 1) {
    suggestions.push("Try connecting your nodes to show how concepts relate to each other.")
  }
  
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
  
  return {
    suggestion: randomSuggestion,
    suggestion_type: 'mindmap_enhancement',
    confidence: 0.9
  }
}

// Generate resource suggestions
function generateResourceSuggestion(analysis: any): GenerateSuggestionResponse {
  const { message } = analysis
  
  const resourceTypes = {
    'documentation': 'Check official documentation or wikis for detailed information.',
    'tutorial': 'Look for step-by-step tutorials or guided learning paths.',
    'example': 'Search for real-world examples or case studies.',
    'video': 'Consider video tutorials for visual learning.',
    'book': 'Academic books or textbooks might provide comprehensive coverage.',
    'community': 'Online communities and forums can provide practical insights.'
  }
  
  const resourceType = Object.keys(resourceTypes).find(type => 
    message.toLowerCase().includes(type)
  ) || 'general'
  
  const suggestion = resourceTypes[resourceType as keyof typeof resourceTypes] || 
    'Consider searching for online resources, academic papers, or expert blogs on this topic.'
  
  return {
    suggestion,
    suggestion_type: 'resource',
    confidence: 0.7
  }
}

// Generate help for when users are stuck
function generateHelpSuggestion(analysis: any): GenerateSuggestionResponse {
  const helpStrategies = [
    "Take a step back and look at the big picture. What's the main goal you're trying to achieve?",
    "Try approaching the problem from a different angle. What would someone else do?",
    "Break the challenge into smaller, manageable pieces.",
    "Consider what you already know that might be relevant to this situation.",
    "Sometimes a short break can help. Come back with fresh eyes in a few minutes."
  ]
  
  const randomStrategy = helpStrategies[Math.floor(Math.random() * helpStrategies.length)]
  
  return {
    suggestion: randomStrategy,
    suggestion_type: 'clarification',
    confidence: 0.8
  }
}

// Generate general suggestions
function generateGeneralSuggestion(analysis: any): GenerateSuggestionResponse {
  const { mindmapNodes, recentMessages } = analysis
  
  const generalSuggestions = [
    "Great point! How does this connect to your other ideas?",
    "Interesting perspective! What evidence supports this view?",
    "That's worth exploring further. What are the implications?",
    "Good observation! How might this apply in different contexts?",
    "Nice insight! What questions does this raise?"
  ]
  
  // Don't suggest if there have been recent AI messages
  const recentAICount = recentMessages.filter((msg: any) => 
    msg.user_name === 'AI Assistant'
  ).length
  
  if (recentAICount >= 2) {
    return {
      suggestion: null,
      suggestion_type: 'clarification',
      confidence: 0
    }
  }
  
  const randomSuggestion = generalSuggestions[Math.floor(Math.random() * generalSuggestions.length)]
  
  return {
    suggestion: randomSuggestion,
    suggestion_type: 'brainstorm',
    confidence: 0.6
  }
}

// Log suggestion metrics for analytics
async function logSuggestionMetrics(supabase: any, metrics: any) {
  try {
    await supabase
      .from('ai_suggestion_metrics')
      .insert([{
        session_id: metrics.session_id,
        user_message_length: metrics.user_message.length,
        suggestion_type: metrics.suggestion_type,
        confidence: metrics.confidence,
        generated_at: new Date().toISOString()
      }])
  } catch (error) {
    // Metrics logging is non-critical
    console.warn('Failed to log suggestion metrics:', error)
  }
}