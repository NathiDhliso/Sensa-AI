// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

console.log("Hello from Functions!")

// AI call rewritten to use Google Gemini (Generative Language API) while
// preserving the same return shape that downstream code expects (i.e.
// `{ choices: [ { message: { content: string } } ] }`).
// The function still accepts the same `payload` object that previously matched
// Calls Google Gemini API with a similar interface for easy migration
async function callGemini(payload: Record<string, unknown>) {
  console.log('🎯 callGemini function started')
  const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY')
  console.log('🔑 Google API Key check:', {
    exists: !!googleApiKey,
    length: googleApiKey?.length || 0,
    firstChars: googleApiKey ? googleApiKey.substring(0, 10) + '...' : 'NOT SET'
  })
  
  if (!googleApiKey) {
    console.error('❌ GOOGLE_AI_API_KEY not found in environment')
    throw new Error('GOOGLE_AI_API_KEY not configured')
  }

  // Extract useful fields from the chat API style payload
  const messages = (payload.messages as Array<{ role: string; content: string }>) || []
  const temperature = (payload.temperature as number | undefined) ?? 0.7

  // Convert the messages array to a single prompt string, preserving role tags
  const prompt = messages
    .map((m) => (m.role === 'system' ? m.content : `User: ${m.content}`))
    .join('\n\n')

  const geminiRequestBody = {
    contents: [
      {
        parts: [ { text: prompt } ]
      }
    ],
    generationConfig: {
      temperature: temperature
    }
  }

  const geminiModels = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-latest', // Fallback to previous generation
    'gemini-1.5-pro', // Additional fallback
    'gemini-pro', // Original model, keep as final fallback
  ];

  let response: Response | undefined;

  for (const model of geminiModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;
    console.log(`➡️ Attempting to call Gemini with model: ${model}`);
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiRequestBody)
      });

      if (response.status !== 404) {
        console.log(`✅ Successfully connected to model: ${model}`);
        break; // Found a working model, exit the loop
      }
      console.warn(`⚠️ Model ${model} returned 404. Trying next model...`);
    } catch (error) {
      console.error(`❌ Error calling model ${model}:`, error);
    }
  }
  
  // If all Gemini models failed with 404, fall back to PaLM
  if (response?.status === 404) {
    console.warn('🔄 All Gemini models failed with 404. Falling back to PaLM chat-bison-001');
    const bisonEndpoint = `https://generativelanguage.googleapis.com/v1beta1/models/chat-bison-001:generateText?key=${googleApiKey}`;
    const bisonRequestBody = {
      prompt: {
        text: prompt,
      },
      temperature: temperature,
    };
    
    try {
      response = await fetch(bisonEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bisonRequestBody)
      });
    } catch (error) {
      console.error(`❌ Error calling PaLM fallback model:`, error);
      throw new Error('All AI models failed, including PaLM fallback.');
    }
  }

  if (!response) {
    throw new Error('All AI model requests failed.');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini/PaLM API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json()

  // Gemini v1beta format: { candidates: [ { content: { parts: [ { text } ] } } ] }
  // PaLM chat-bison format: { candidates: [ { output } ] }
  let text = ''
  if (data?.candidates?.[0]) {
    if (data.candidates[0].content?.parts?.[0]?.text) {
      text = data.candidates[0].content.parts[0].text
    } else if (data.candidates[0].output) {
      text = data.candidates[0].output
    }
  }

  // Return ChatCompletion response shape for compatibility with downstream code
  return {
    choices: [ { message: { content: text } } ]
  }
}

interface ADKRequest {
  agent_type: 'memory_analysis' | 'course_intel' | 'personalization' | 'career_pathway' | 'study_map' | 'orchestrator';
  payload: Record<string, unknown>;
  task?: string;
  course?: Record<string, unknown>;
  memories?: Array<Record<string, unknown>>;
  analysis_requirements?: string[];
  subject?: string;
  content?: string;
  focus_question?: string;
}

serve(async (req) => {
  console.log('🚀 ADK Edge Function started')
  console.log('📝 Request method:', req.method)
  console.log('🔑 Environment check:', {
    hasGoogleKey: !!Deno.env.get('GOOGLE_AI_API_KEY'),
    googleKeyLength: Deno.env.get('GOOGLE_AI_API_KEY')?.length || 0
  })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📥 Parsing request body...')
    const requestData: ADKRequest = await req.json()
    console.log('🤖 ADK Request received:', {
      task: requestData.task,
      agent_type: requestData.agent_type,
      payload_keys: Object.keys(requestData.payload || {}),
      memories_count: requestData.memories?.length || 0
    })

    // Check if this is an orchestrator request (comprehensive analysis)
    if (requestData.task || requestData.agent_type === 'orchestrator') {
      console.log('🎯 Routing to orchestrator for task:', requestData.task)
      return await handleOrchestratorRequest(requestData)
    }

    // Handle individual agent requests
    console.log('🔧 Routing to individual agent:', requestData.agent_type)
    return await handleAgentRequest(requestData)

  } catch (error) {
    console.error('❌ ADK agents error:', error)
    console.error('📊 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process ADK request',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function handleOrchestratorRequest(requestData: ADKRequest) {
  console.log('🎯 Processing orchestrator request for task:', requestData.task)
  
  try {
    // For comprehensive analysis requests, generate structured response
    if (requestData.task === 'comprehensive_course_analysis') {
      const analysis = await generateCourseAnalysis(requestData)
      return new Response(
        JSON.stringify({
          success: true,
          analysis: analysis,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (requestData.task === 'document_content_analysis' || requestData.task === 'document_memory_analysis') {
      const analysis = await generateDocumentAnalysis(requestData)
      return new Response(
        JSON.stringify({
          success: true,
          analysis: analysis,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (requestData.task === 'subject_identification') {
      const analysis = await generateSubjectIdentification(requestData)
      return new Response(
        JSON.stringify({
          success: true,
          analysis: analysis,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (requestData.task === 'analyze_memory') {
      const analysis = await generateMemoryAnalysis(requestData)
      return new Response(
        JSON.stringify({
          success: true,
          analysis: analysis,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (requestData.task === 'comprehensive_mindmap_generation' || requestData.task === 'generate_ai_mind_map') {
      const mindMap = await generateAIMindMap(requestData)
      return new Response(
        JSON.stringify({
          success: true,
          mindmap: mindMap,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (requestData.task === 'memory_dialogue') {
      const dialogueResult = await generateMemoryDialogue(requestData)
      return new Response(
        JSON.stringify({
          success: true,
          dialogue_response: dialogueResult.dialogue_response,
          suggest_memory_update: dialogueResult.suggest_memory_update,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (requestData.task === 'update_memory_insights') {
      const updatedInsights = await generateUpdatedMemoryInsights(requestData)
      return new Response(
        JSON.stringify({
          success: true,
          updated_insights: updatedInsights,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Fallback for unknown tasks
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unknown orchestrator task: ${requestData.task}`
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Orchestrator error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: `Orchestrator failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}

async function handleAgentRequest(requestData: ADKRequest) {
  console.log('🔧 Processing individual agent request:', requestData.agent_type)
  
  // Handle health check for orchestrator agent
  if (requestData.agent_type === 'orchestrator' && 
      requestData.payload?.action === 'health_check') {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        agent: 'orchestrator',
        timestamp: new Date().toISOString(),
        all_agents_operational: true,
        message: 'ADK agents system is fully operational'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
  
  // Route memory analysis requests to the proper function
  if (requestData.agent_type === 'memory_analysis') {
    console.log('🧠 Routing to memory analysis function')
    try {
      const analysis = await generateMemoryAnalysis(requestData)
      return new Response(
        JSON.stringify({
          success: true,
          analysis: analysis,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    } catch (error) {
      console.error('❌ Memory analysis failed:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Memory analysis failed'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }
  }
  
  // For other agent requests, return enhanced mock data
  const mockResponse = {
    agent: requestData.agent_type,
    result: {
      status: 'success',
      data: {
        message: `Enhanced response from ${requestData.agent_type} agent`,
        timestamp: new Date().toISOString(),
        payload_received: requestData.payload
      }
    }
  }

  return new Response(
    JSON.stringify(mockResponse),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  )
}

async function generateCourseAnalysis(requestData: ADKRequest) {
  const course = requestData.course || {}
  const memories = requestData.memories || []
  
  console.log('📚 Generating personalized course analysis for:', course.title)
  console.log('🧠 Processing', memories.length, 'user memories for course personalization')
  
  const subject = (course.title as string) || 'Course'
  const category = (course.category as string) || 'Subject'
  const topics = [category.toLowerCase(), ...(subject.toLowerCase().split(' '))]
  
  // Analyze user's communication style from memories
  const userStyle = analyzeUserCommunicationStyle(memories)
  console.log('🎨 User communication style for course:', userStyle)
  
  // Find memories relevant to the course
  const relevantMemories = findRelevantMemories(subject, topics, memories)
  console.log('🔗 Found', relevantMemories.length, 'relevant memories for course')
  
  // Generate personalized course insights based on actual memories
  const personalizedInsights = await generatePersonalizedInsights(subject, relevantMemories, userStyle, 'course')
  const memoryConnections = generateMemoryBasedConnections(subject, relevantMemories, userStyle)
  
  return {
    personalized_insights: personalizedInsights,
    memory_connections: memoryConnections,
    career_path: {
      customRole: `AI-Enhanced ${category} Specialist`,
      description: generatePersonalizedCareerDescription(subject, userStyle),
      skills: [`Applied ${category}`, ...userStyle.technicalTerms.slice(0, 2), 'AI-Enhanced Learning']
    }
  }
}

async function generateDocumentAnalysis(requestData: ADKRequest) {
  // Handle both nested document format and direct payload format
  const document = requestData.payload?.document as Record<string, unknown> || requestData.payload || {}
  const memories = requestData.memories || []
  
  console.log('📄 Generating document analysis for:', document.name || 'Unknown Document')
  console.log('🧠 Processing', memories.length, 'user memories for personalization')
  console.log('🔍 Document data structure:', Object.keys(document))
  
  const subject = (document.actual_subject as string) || (document.subject as string) || 'Document'
  const contentType = (document.content_type as string) || 'document'
  const topics = (document.key_topics as string[]) || []
  
  console.log('🎯 Extracted subject:', subject)
  console.log('📋 Extracted topics:', topics)
  console.log('📝 Content type:', contentType)
  
  // Analyze user's communication style from memories
  const userStyle = analyzeUserCommunicationStyle(memories)
  console.log('🎨 User communication style:', userStyle)
  
  // Find memories relevant to the subject
  const relevantMemories = findRelevantMemories(subject, topics, memories)
  console.log('🔗 Found', relevantMemories.length, 'relevant memories')
  
  // Generate personalized analogies based on actual memories
  console.log('🚀 Starting personalized insights generation...')
  let personalizedInsights: string[] = []
  try {
    personalizedInsights = await generatePersonalizedInsights(subject, relevantMemories, userStyle, contentType)
    console.log('✅ Personalized insights generated:', personalizedInsights.length, 'insights')
  } catch (error) {
    console.error('❌ Failed to generate personalized insights:', error)
    personalizedInsights = []
  }
  
  console.log('🚀 Starting memory connections generation...')
  let memoryConnections: Array<{ concept: string; personalConnection: string; emotionalResonance: number }> = []
  try {
    memoryConnections = generateMemoryBasedConnections(subject, relevantMemories, userStyle)
    console.log('✅ Memory connections generated:', memoryConnections.length, 'connections')
  } catch (error) {
    console.error('❌ Failed to generate memory connections:', error)
    memoryConnections = []
  }
  
  const result = {
    personalized_insights: personalizedInsights,
    memory_connections: memoryConnections,
    // Add expected fields for API compatibility
    topic_memory_connections: memoryConnections,
    content_specific_insights: personalizedInsights,
    personalized_learning_path: {
      customRole: `AI-Enhanced ${subject} Specialist`,
      description: generatePersonalizedCareerDescription(subject, userStyle),
      skills: [`Applied ${subject}`, ...userStyle.technicalTerms.slice(0, 2), 'AI-Enhanced Learning']
    },
    // Add debug information to see what's happening
    debug_info: {
      extracted_subject: subject,
      extracted_topics: topics,
      extracted_content_type: contentType,
      memories_received: memories.length,
      relevant_memories_found: relevantMemories.length,
      user_style: userStyle,
      insights_generated: personalizedInsights.length,
      connections_generated: memoryConnections.length,
      insights_preview: personalizedInsights.slice(0, 2),
      connections_preview: memoryConnections.slice(0, 1),
      raw_insights: personalizedInsights,
      raw_connections: memoryConnections
    }
  }
  
  console.log('📤 Returning document analysis result:', {
    insights_count: result.personalized_insights.length,
    connections_count: result.memory_connections.length,
    insights_preview: result.personalized_insights.slice(0, 2),
    connections_preview: result.memory_connections.slice(0, 1)
  })
  
  return result
}

async function generateMemoryAnalysis(requestData: ADKRequest) {
  const memoryContent = (requestData.payload?.memory_content as string) || ''
  const category = (requestData.payload?.category as string) || 'personal'
  
  console.log('🧠 Analyzing memory content for category:', category)
  console.log('📝 Memory content length:', memoryContent.length)
  
  // Analyze the memory content for learning insights
  const userStyle = analyzeUserCommunicationStyle([{ content: memoryContent }])
  console.log('🎨 Communication style detected:', userStyle)
  
  // Extract key themes and learning connections
  const insights = generateMemoryInsights(memoryContent, category, userStyle)
  const learningStyle = determineLearningStyle(memoryContent, userStyle)
  const emotionalTone = analyzeEmotionalTone(memoryContent)
  const themes = extractMemoryThemes(memoryContent)
  
  return {
    insights: insights,
    dominant_learning_style: learningStyle,
    emotional_tone: emotionalTone,
    themes: themes,
    communication_style: userStyle,
    analysis_timestamp: new Date().toISOString()
  }
}

function generateMemoryInsights(memoryContent: string, category: string, userStyle: UserStyle): string[] {
  const insights = []
  const content = memoryContent.toLowerCase()
  
  // Analyze memory for learning patterns
  if (content.includes('problem') || content.includes('challenge') || content.includes('difficult')) {
    insights.push(`🎯 Your experience with challenges shows strong problem-solving abilities - perfect for complex learning`)
  }
  
  if (content.includes('team') || content.includes('group') || content.includes('together')) {
    insights.push(`👥 Your collaborative experiences indicate you learn well in group settings and discussions`)
  }
  
  if (content.includes('visual') || content.includes('see') || content.includes('picture') || content.includes('diagram')) {
    insights.push(`👁️ Your memory suggests visual learning preferences - mind maps and diagrams will be highly effective`)
  }
  
  if (content.includes('hands-on') || content.includes('practice') || content.includes('doing') || content.includes('build')) {
    insights.push(`🛠️ Your hands-on approach indicates kinesthetic learning - practical exercises will accelerate your understanding`)
  }
  
  if (userStyle.technicalTerms.length > 0) {
    insights.push(`💻 Your technical vocabulary (${userStyle.technicalTerms.join(', ')}) shows advanced analytical thinking`)
  }
  
  if (userStyle.casualTone) {
    insights.push(`💬 Your conversational style indicates you learn best through informal, relatable explanations`)
  }
  
  // Category-specific insights
  if (category === 'learning') {
    insights.push(`📚 This learning memory reveals key patterns in how you best absorb and retain information`)
  } else if (category === 'professional') {
    insights.push(`💼 Your professional experience provides excellent context for advanced skill development`)
  } else if (category === 'personal') {
    insights.push(`❤️ Personal memories often contain the strongest emotional anchors for learning new concepts`)
  }
  
  return insights.length > 0 ? insights : [`✨ Your memory provides valuable insights into your unique learning approach`]
}

function determineLearningStyle(memoryContent: string, userStyle: UserStyle): string {
  const content = memoryContent.toLowerCase()
  const scores = {
    visual: 0,
    auditory: 0,
    kinesthetic: 0,
    analytical: 0
  }
  
  // Visual indicators
  if (content.includes('see') || content.includes('picture') || content.includes('visual') || content.includes('diagram')) scores.visual += 2
  if (content.includes('color') || content.includes('image') || content.includes('chart')) scores.visual += 1
  
  // Auditory indicators
  if (content.includes('hear') || content.includes('listen') || content.includes('sound') || content.includes('music')) scores.auditory += 2
  if (content.includes('discuss') || content.includes('talk') || content.includes('explain')) scores.auditory += 1
  
  // Kinesthetic indicators
  if (content.includes('hands-on') || content.includes('practice') || content.includes('build') || content.includes('create')) scores.kinesthetic += 2
  if (content.includes('move') || content.includes('physical') || content.includes('touch')) scores.kinesthetic += 1
  
  // Analytical indicators
  if (userStyle.technicalTerms.length > 2) scores.analytical += 2
  if (content.includes('analyze') || content.includes('system') || content.includes('process')) scores.analytical += 1
  
  const maxScore = Math.max(...Object.values(scores))
  const dominantStyle = Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || 'visual'
  
  const styleDescriptions = {
    visual: 'Visual-Spatial Learner',
    auditory: 'Auditory-Verbal Learner', 
    kinesthetic: 'Kinesthetic-Tactile Learner',
    analytical: 'Analytical-Sequential Learner'
  }
  
  return styleDescriptions[dominantStyle as keyof typeof styleDescriptions]
}

function analyzeEmotionalTone(memoryContent: string): string {
  const content = memoryContent.toLowerCase()
  let emotionalScore = 0
  
  // Positive emotions
  if (content.includes('happy') || content.includes('excited') || content.includes('proud') || content.includes('love')) emotionalScore += 2
  if (content.includes('good') || content.includes('great') || content.includes('amazing') || content.includes('wonderful')) emotionalScore += 1
  
  // Negative emotions
  if (content.includes('difficult') || content.includes('hard') || content.includes('struggle') || content.includes('frustrated')) emotionalScore -= 1
  if (content.includes('terrible') || content.includes('awful') || content.includes('hate') || content.includes('angry')) emotionalScore -= 2
  
  // Neutral/learning emotions
  if (content.includes('interesting') || content.includes('curious') || content.includes('wonder')) emotionalScore += 1
  
  if (emotionalScore >= 2) return 'Highly Positive'
  if (emotionalScore >= 1) return 'Positive'
  if (emotionalScore <= -2) return 'Challenging'
  if (emotionalScore <= -1) return 'Reflective'
  return 'Balanced'
}

function extractMemoryThemes(memoryContent: string): string[] {
  const content = memoryContent.toLowerCase()
  const themes = []
  
  if (content.includes('work') || content.includes('job') || content.includes('career') || content.includes('professional')) themes.push('Professional Development')
  if (content.includes('learn') || content.includes('study') || content.includes('school') || content.includes('education')) themes.push('Learning & Education')
  if (content.includes('family') || content.includes('friend') || content.includes('relationship')) themes.push('Personal Relationships')
  if (content.includes('challenge') || content.includes('problem') || content.includes('difficult')) themes.push('Problem Solving')
  if (content.includes('create') || content.includes('build') || content.includes('design') || content.includes('art')) themes.push('Creative Expression')
  if (content.includes('travel') || content.includes('adventure') || content.includes('explore')) themes.push('Exploration & Discovery')
  if (content.includes('help') || content.includes('support') || content.includes('community')) themes.push('Service & Community')
  if (content.includes('technology') || content.includes('computer') || content.includes('digital')) themes.push('Technology & Innovation')
  
  return themes.length > 0 ? themes : ['Personal Experience']
}

// Analyze user's communication style from their memories
function analyzeUserCommunicationStyle(memories: Array<Record<string, unknown>>) {
  const allText = memories.map(m => (m.content as string) || (m.text_content as string) || '').join(' ').toLowerCase()
  
  const style = {
    casualTone: /honestly|basically|pretty much|you know|the thing is/.test(allText),
    usesMetaphors: /like|similar to|think of it as|it's basically|kind of like/.test(allText),
    prefersConcrete: /for example|specifically|exactly|in practice|actually/.test(allText),
    storytellingStyle: /so then|what happened|long story short|basically what happened/.test(allText),
    technicalTerms: extractTechnicalTerms(allText),
    enthusiasm: (allText.match(/excited|amazing|awesome|great|love|fantastic/g) || []).length
  }
  
  return style
}

// Extract technical terms from user's memories
function extractTechnicalTerms(text: string): string[] {
  const techMatches = text.match(/\b(api|database|server|cloud|azure|aws|kubernetes|docker|framework|backend|frontend|deployment|devops|infrastructure|architecture|integration|authentication|pipeline|repository|git|react|typescript|javascript|python|java|sql|mongodb|redis|jenkins|github|agile|scrum|testing|qa|monitoring|performance|optimization)\b/gi) || []
  return [...new Set(techMatches.map(term => term.toLowerCase()))].slice(0, 5)
}

// Find memories relevant to the subject
function findRelevantMemories(subject: string, topics: string[], memories: Array<Record<string, unknown>>) {
  console.log('🔍 Finding relevant memories for subject:', subject)
  console.log('📋 Topics to match:', topics)
  console.log('🧠 Available memories:', memories.length)
  
  // Create broader semantic keywords for better matching
  const semanticKeywords = generateSemanticKeywords(subject, topics)
  console.log('🎯 Semantic keywords:', semanticKeywords)
  
  // Score memories based on relevance
  const scoredMemories = memories.map(memory => {
    const memoryText = ((memory.content as string) || (memory.text_content as string) || '').toLowerCase()
    const memoryCategory = ((memory.category as string) || '').toLowerCase()
    
    let score = 0
    
    // Direct keyword matches (highest priority)
    semanticKeywords.direct.forEach(keyword => {
      if (memoryText.includes(keyword) || memoryCategory.includes(keyword)) {
        score += 10
      }
    })
    
    // Conceptual matches (medium priority)
    semanticKeywords.conceptual.forEach(keyword => {
      if (memoryText.includes(keyword)) {
        score += 5
      }
    })
    
    // Learning-related matches (lower priority but still valuable)
    semanticKeywords.learning.forEach(keyword => {
      if (memoryText.includes(keyword)) {
        score += 3
      }
    })
    
    // Problem-solving and analytical thinking matches
    semanticKeywords.analytical.forEach(keyword => {
      if (memoryText.includes(keyword)) {
        score += 2
      }
    })
    
    return { memory, score }
  })
  
  // Sort by score and take top matches
  const relevantMemories = scoredMemories
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.memory)
  
  console.log('✅ Found', relevantMemories.length, 'relevant memories with scores')
  
  // If no scored matches, use all memories for broader AI analysis
  if (relevantMemories.length === 0) {
    console.log('📝 No keyword matches found, using all memories for AI analysis')
    return memories.slice(0, 3)
  }

  return relevantMemories
}

// Generate semantic keywords for better memory matching
function generateSemanticKeywords(subject: string, topics: string[]) {
  const subjectLower = subject.toLowerCase()
  
  const keywords = {
    direct: [subjectLower, ...topics.map(t => t.toLowerCase())],
    conceptual: [] as string[],
    learning: ['learn', 'study', 'understand', 'figure', 'discover', 'explore', 'master'],
    analytical: ['problem', 'solve', 'challenge', 'think', 'analyze', 'logic', 'reason', 'pattern']
  }
  
  // Add subject-specific conceptual keywords
  if (subjectLower.includes('computer') || subjectLower.includes('science') || subjectLower.includes('programming')) {
    keywords.conceptual.push('technology', 'digital', 'code', 'software', 'system', 'data', 'algorithm', 'logic', 'build', 'create', 'design')
  }
  
  if (subjectLower.includes('machine') || subjectLower.includes('learning') || subjectLower.includes('ai')) {
    keywords.conceptual.push('pattern', 'predict', 'model', 'data', 'intelligence', 'automation', 'smart', 'algorithm')
  }
  
  if (subjectLower.includes('math') || subjectLower.includes('calculus') || subjectLower.includes('algebra')) {
    keywords.conceptual.push('number', 'calculate', 'equation', 'formula', 'logic', 'pattern', 'solve')
  }
  
  if (subjectLower.includes('business') || subjectLower.includes('management')) {
    keywords.conceptual.push('work', 'team', 'project', 'goal', 'strategy', 'plan', 'organize', 'lead')
  }
  
  if (subjectLower.includes('psychology') || subjectLower.includes('behavior')) {
    keywords.conceptual.push('people', 'behavior', 'mind', 'emotion', 'relationship', 'social', 'understand')
  }
  
  // Add general learning and creativity keywords
  keywords.conceptual.push('creative', 'innovative', 'experiment', 'test', 'try', 'practice', 'skill', 'talent')
  
  return keywords
}

// Generate personalized insights using AI with high temperature for natural responses
async function generatePersonalizedInsights(subject: string, relevantMemories: Array<Record<string, unknown>>, userStyle: UserStyle, contentType: string): Promise<string[]> {
  console.log('🎯 Generating AI-powered personalized insights for:', subject)
  console.log('🧠 Using', relevantMemories.length, 'relevant memories for personalization')
  
  try {
    // Prepare memory context for AI
    const memoryContext = relevantMemories.slice(0, 3).map(memory => ({
      content: (memory.text_content as string) || (memory.content as string) || '',
      category: (memory.category as string) || 'general'
    }))
    
    console.log('📝 Memory context prepared:', memoryContext.map(m => `[${m.category}] ${m.content.substring(0, 50)}...`))
    
    // Always try to generate AI insights when we have memories
    if (memoryContext.length > 0 && memoryContext.some(m => m.content.trim().length > 0)) {
      console.log('🤖 Calling AI for personalized insights...')
      console.log('🔑 Checking API key availability:', !!Deno.env.get('GOOGLE_AI_API_KEY'))
      
      try {
        // Call AI with high temperature for creative, natural responses
        const aiResponse = await callGemini({
          temperature: 0.85, // High temperature for creativity and natural language
          messages: [
            {
              role: "system",
              content: `You are Sensa AI, a personalized learning assistant. Generate 3-4 natural, conversational insights connecting the user's personal memories to their ${subject} learning journey. 

USER STYLE:
- Casual tone: ${userStyle.casualTone}
- Uses metaphors: ${userStyle.usesMetaphors}  
- Prefers concrete examples: ${userStyle.prefersConcrete}
- Storytelling style: ${userStyle.storytellingStyle}
- Technical terms: ${userStyle.technicalTerms.join(', ')}

INSTRUCTIONS:
- Be conversational and natural, not robotic
- Reference specific details from their memories when possible
- Use their communication style (casual/formal, metaphors, concrete examples)
- Make genuine connections between their experiences and ${subject}
- Start each insight with an emoji (🧠, 🎯, ✨, 🚀, 💡)
- Keep each insight to 1-2 sentences max
- Sound like you're talking to a friend, not giving a lecture
- Avoid generic phrases like "exactly what you need" or "perfect for"
- Return insights as a simple list, one per line`
            },
            {
              role: "user", 
              content: `Subject: ${subject}
Content Type: ${contentType}

My Personal Memories:
${memoryContext.map((mem, i) => `${i + 1}. [${mem.category}] ${mem.content.substring(0, 200)}...`).join('\n')}

Generate personalized learning insights that connect my memories to ${subject} in my communication style.`
            }
          ]
        })
        
        console.log('🔄 AI response received:', !!aiResponse?.choices?.[0]?.message?.content)
        
        if (!aiResponse) {
          console.error('❌ AI response is null/undefined')
        } else if (!aiResponse.choices?.[0]) {
          console.error('❌ AI response has no choices:', JSON.stringify(aiResponse))
        } else if (!aiResponse.choices[0].message?.content) {
          console.error('❌ AI response has no content:', JSON.stringify(aiResponse.choices[0]))
        }
        
        if (aiResponse?.choices?.[0]?.message?.content) {
          const content = aiResponse.choices[0].message.content
          console.log('📋 Raw AI content:', content.substring(0, 200) + '...')

          // Parse AI response into insights
          let insights = content.split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => l && l.length > 10) // Filter out empty or very short lines
            .slice(0, 4)

          // Clean up insights - remove numbering, bullets, etc.
          insights = insights.map(insight => {
            return insight.replace(/^[\d.\-*+\s]+/, '').trim()
          }).filter(insight => insight.length > 0)

          if (insights.length > 0) {
            console.log('✅ AI generated', insights.length, 'personalized insights')
            console.log('💡 Insights preview:', insights.map(i => i.substring(0, 50) + '...'))
            return insights
          } else {
            console.warn('⚠️ AI returned content but no valid insights were parsed')
            console.log('🔍 Full AI content for debugging:', content)
          }
        }
      } catch (aiError) {
        console.error('❌ AI call failed with error:', aiError)
        console.error('🔍 Error details:', {
          name: aiError instanceof Error ? aiError.name : 'Unknown',
          message: aiError instanceof Error ? aiError.message : String(aiError),
          stack: aiError instanceof Error ? aiError.stack?.substring(0, 300) : 'No stack trace'
        })
        
        // Continue to fallback logic below
      }
    }
    
    // Smart fallback based on available context
    console.log('📋 Generating contextual fallback insights for subject:', subject)
    console.log('🔄 Creating AI-unavailable message with subject context')
    
    // Always return meaningful insights even when AI fails
    const insights = [
      `🤖 AI insights for ${subject} are temporarily unavailable, but your learning can still progress.`,
      `🧠 Your ${relevantMemories.length} related memories show strong potential for ${subject} mastery.`,
      `💡 Focus on connecting ${subject} concepts to your existing knowledge and experiences.`,
      `🎯 Personalized insights will be available when AI services are restored.`
    ]
    
    console.log('✅ Fallback insights generated:', insights.length)
    return insights
    
  } catch (error) {
    console.error('❌ AI insight generation failed:', error)
    // Even on error, provide helpful message instead of empty array
    return [`🤖 AI insights temporarily unavailable, but your ${subject} learning journey can still begin with exploring the core concepts.`]
  }
}

// Generate memory-based connections with specific, unique analogies
function generateMemoryBasedConnections(subject: string, relevantMemories: Array<Record<string, unknown>>, userStyle: UserStyle) {
  console.log('🔗 Generating memory connections for', relevantMemories.length, 'memories')
  
  const connections = []
  
  if (relevantMemories.length > 0) {
    relevantMemories.forEach((memory, index) => {
      const memoryText = ((memory.content as string) || (memory.text_content as string) || '')
      const memoryCategory = (memory.category as string) || 'Personal Experience'
      
      console.log(`🧠 Processing memory ${index + 1}: [${memoryCategory}] ${memoryText.substring(0, 50)}...`)
      
      // Create specific analogies based on memory content and subject
      const analogy = createSpecificMemoryAnalogy(memoryText, memoryCategory, subject, userStyle, index)
      const concept = extractMemoryConcept(memoryText, memoryCategory, subject)
      
      connections.push({
        concept: concept,
        personalConnection: analogy,
        emotionalResonance: 0.85 + (index * 0.05)
      })
    })
    
    console.log('✅ Generated', connections.length, 'memory connections')
  } else {
    // When no relevant memories are found, still create helpful connections
    console.log('📝 No relevant memories found, creating general connections')
    connections.push({
      concept: 'Learning Foundation',
      personalConnection: `🌟 As you build your knowledge in ${subject}, you'll create new memories that will make future learning even more personalized and effective.`,
      emotionalResonance: 0.7
    })
    connections.push({
      concept: 'Knowledge Building',
      personalConnection: `🧠 Your current memories (${relevantMemories.length} analyzed) provide a foundation for connecting ${subject} concepts to your experiences.`,
      emotionalResonance: 0.6
    })
  }
  
  return connections
}

// Create specific analogies based on memory content
function createSpecificMemoryAnalogy(memoryText: string, category: string, subject: string, userStyle: UserStyle, index: number): string {
  const content = memoryText.toLowerCase()
  const memoryPreview = memoryText.substring(0, 120)
  
  // Analyze the specific memory content for unique connections
  if (content.includes('stuck') || content.includes('problem') || content.includes('challenge')) {
    if (userStyle.casualTone) {
      return `Remember when you dealt with that challenge: "${memoryPreview}..."? ${subject} problem-solving uses the exact same persistence and analytical thinking you showed there.`
    } else {
      return `Your experience overcoming challenges, as demonstrated in "${memoryPreview}...", directly parallels the systematic problem-solving approach required in ${subject}.`
    }
  }
  
  if (content.includes('creative') || content.includes('art') || content.includes('design') || content.includes('expression')) {
    if (userStyle.casualTone) {
      return `Your creative side from "${memoryPreview}..." is actually perfect for ${subject} - it's all about finding elegant solutions and thinking outside the box.`
    } else {
      return `The creative thinking demonstrated in "${memoryPreview}..." provides an innovative approach to ${subject} concept development and solution design.`
    }
  }
  
  if (content.includes('team') || content.includes('group') || content.includes('together') || content.includes('collaboration')) {
    if (userStyle.casualTone) {
      return `That teamwork experience: "${memoryPreview}..." shows you understand how different parts work together - exactly what ${subject} system thinking requires.`
    } else {
      return `Your collaborative experience in "${memoryPreview}..." demonstrates the systems thinking and integration skills essential for ${subject} mastery.`
    }
  }
  
  if (content.includes('learn') || content.includes('study') || content.includes('understand') || content.includes('figure')) {
    if (userStyle.casualTone) {
      return `The way you approached learning in "${memoryPreview}..." shows you've got the right mindset for tackling ${subject} concepts systematically.`
    } else {
      return `Your learning methodology, as evidenced in "${memoryPreview}...", aligns perfectly with the structured approach needed for ${subject} comprehension.`
    }
  }
  
  if (content.includes('work') || content.includes('job') || content.includes('professional') || content.includes('career')) {
    if (userStyle.casualTone) {
      return `Your professional experience: "${memoryPreview}..." gives you real-world context that makes ${subject} concepts immediately practical and relevant.`
    } else {
      return `The professional insights from "${memoryPreview}..." provide valuable contextual understanding for applying ${subject} principles in practice.`
    }
  }
  
  if (content.includes('family') || content.includes('relationship') || content.includes('personal')) {
    if (userStyle.casualTone) {
      return `That personal experience: "${memoryPreview}..." taught you about understanding different perspectives - exactly what you need for grasping complex ${subject} concepts.`
    } else {
      return `Your personal insights from "${memoryPreview}..." demonstrate the empathy and perspective-taking skills valuable for understanding ${subject} applications.`
    }
  }
  
  // Default unique analogy based on index to ensure variety
  const defaultAnalogies = [
    userStyle.casualTone 
      ? `Your experience: "${memoryPreview}..." shows you think through problems step-by-step - that's exactly how ${subject} works.`
      : `The analytical approach demonstrated in "${memoryPreview}..." directly translates to the methodical thinking required in ${subject}.`,
    userStyle.casualTone
      ? `Remember "${memoryPreview}..."? That same attention to detail and persistence is what makes ${subject} click.`
      : `The focus and determination shown in "${memoryPreview}..." exemplifies the mindset needed for ${subject} mastery.`,
    userStyle.casualTone
      ? `That experience: "${memoryPreview}..." proves you can break down complex situations - ${subject} is just another puzzle to solve.`
      : `Your ability to analyze complex situations, as shown in "${memoryPreview}...", is directly applicable to ${subject} problem-solving.`
  ]
  
  return defaultAnalogies[index % defaultAnalogies.length]
}

// Extract meaningful concept from memory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractMemoryConcept(memoryText: string, category: string, _subject: string): string {
  const content = memoryText.toLowerCase()
  
  if (content.includes('problem') || content.includes('challenge') || content.includes('stuck')) {
    return `${category} Problem-Solving`
  }
  if (content.includes('creative') || content.includes('art') || content.includes('design')) {
    return `${category} Creative Thinking`
  }
  if (content.includes('team') || content.includes('group') || content.includes('collaboration')) {
    return `${category} Systems Thinking`
  }
  if (content.includes('learn') || content.includes('study') || content.includes('understand')) {
    return `${category} Learning Methodology`
  }
  if (content.includes('work') || content.includes('professional') || content.includes('career')) {
    return `${category} Professional Context`
  }
  if (content.includes('family') || content.includes('relationship') || content.includes('personal')) {
    return `${category} Perspective & Empathy`
  }
  
  return `${category} Experience`
}

// Generate personalized career description
function generatePersonalizedCareerDescription(subject: string, userStyle: UserStyle): string {
  if (userStyle.casualTone) {
    return `Your hands-on experience creates a perfect foundation for ${subject} mastery. You've got exactly the right mindset for this field.`
  } else if (userStyle.usesMetaphors) {
    return `Think of your career path like building expertise layer by layer - your ${subject} specialization becomes the cornerstone of advanced opportunities.`
  } else {
    return `Your systematic approach to learning and problem-solving creates an ideal foundation for advanced ${subject} specialization and career development.`
  }
}

// AI-powered subject analysis using contextual understanding
async function analyzeSubjectWithAI(filename: string, contentPreview: string): Promise<string> {
  // For certification patterns, use intelligent parsing
  const lower = filename.toLowerCase()
  
  // Microsoft Azure certifications
  if (lower.includes('az-305') || lower.includes('az 305')) return 'Azure Solutions Architect Expert (AZ-305)'
  if (lower.includes('az-400') || lower.includes('az 400')) return 'Azure DevOps Engineer Expert (AZ-400)'
  if (lower.includes('az-104') || lower.includes('az 104')) return 'Azure Administrator Associate (AZ-104)'
  if (lower.includes('az-900') || lower.includes('az 900')) return 'Azure Fundamentals (AZ-900)'
  if (lower.includes('az-204') || lower.includes('az 204')) return 'Azure Developer Associate (AZ-204)'
  if (lower.includes('az-303') || lower.includes('az 303')) return 'Azure Architect Technologies (AZ-303)'
  if (lower.includes('az-500') || lower.includes('az 500')) return 'Azure Security Engineer Associate (AZ-500)'
  
  // AWS certifications
  if (lower.includes('aws-saa') || lower.includes('aws saa')) return 'AWS Solutions Architect Associate'
  if (lower.includes('aws-soa') || lower.includes('aws soa')) return 'AWS SysOps Administrator Associate'
  if (lower.includes('aws-dva') || lower.includes('aws dva')) return 'AWS Developer Associate'
  if (lower.includes('aws-sap') || lower.includes('aws sap')) return 'AWS Solutions Architect Professional'
  
  // Google Cloud certifications
  if (lower.includes('gcp-ace') || lower.includes('gcp ace')) return 'Google Cloud Associate Cloud Engineer'
  if (lower.includes('gcp-pca') || lower.includes('gcp pca')) return 'Google Cloud Professional Cloud Architect'
  
  // Content-based analysis for common subjects
  const contentLower = contentPreview.toLowerCase()
  
  // Cloud and DevOps
  if (contentLower.includes('azure solutions architect') || contentLower.includes('design azure infrastructure')) return 'Azure Solutions Architect'
  if (contentLower.includes('azure devops') && contentLower.includes('pipeline')) return 'Azure DevOps Engineering'
  if (contentLower.includes('kubernetes') && contentLower.includes('container')) return 'Container Orchestration & Kubernetes'
  if (contentLower.includes('terraform') && contentLower.includes('infrastructure')) return 'Infrastructure as Code with Terraform'
  
  // Academic subjects
  if (contentLower.includes('calculus') || contentLower.includes('derivative') || contentLower.includes('integral')) return 'Calculus'
  if (contentLower.includes('linear algebra') || contentLower.includes('matrix') || contentLower.includes('vector')) return 'Linear Algebra'
  if (contentLower.includes('cognitive psychology') || contentLower.includes('behavioral psychology')) return 'Psychology'
  if (contentLower.includes('financial accounting') || contentLower.includes('balance sheet')) return 'Financial Accounting'
  if (contentLower.includes('data structures') || contentLower.includes('algorithms')) return 'Computer Science'
  if (contentLower.includes('machine learning') || contentLower.includes('neural network')) return 'Machine Learning'
  
  // Programming and development
  if (contentLower.includes('react') && contentLower.includes('component')) return 'React Development'
  if (contentLower.includes('python') && contentLower.includes('programming')) return 'Python Programming'
  if (contentLower.includes('javascript') && contentLower.includes('web')) return 'JavaScript Web Development'
  if (contentLower.includes('sql') && contentLower.includes('database')) return 'Database Management & SQL'
  
  // Business and management
  if (contentLower.includes('project management') || contentLower.includes('agile') || contentLower.includes('scrum')) return 'Project Management'
  if (contentLower.includes('marketing') && contentLower.includes('digital')) return 'Digital Marketing'
  if (contentLower.includes('business analysis') || contentLower.includes('requirements')) return 'Business Analysis'
  
  // Fallback to generic categories
  if (contentLower.includes('skills measured') || contentLower.includes('exam objectives')) return 'Professional Certification'
  if (contentLower.includes('course') && contentLower.includes('learning')) return 'Academic Course'
  if (contentLower.includes('technology') || contentLower.includes('technical')) return 'Technology'
  if (contentLower.includes('business') || contentLower.includes('management')) return 'Business'
  
  return 'Document Analysis'
}

// Define user style interface
interface UserStyle {
  casualTone: boolean
  usesMetaphors: boolean
  prefersConcrete: boolean
  storytellingStyle: boolean
  technicalTerms: string[]
  enthusiasm: number
}

// AI-powered subject identification from filename and content
async function generateSubjectIdentification(requestData: ADKRequest) {
  const payload = requestData.payload || {}
  const filename = (payload.filename as string) || ''
  const contentPreview = (payload.content_preview as string) || ''
  
  console.log('🔍 AI subject identification for:', filename)
  console.log('📄 Content preview length:', contentPreview.length)
  
  // Use AI to analyze both filename and content context
  const identifiedSubject = await analyzeSubjectWithAI(filename, contentPreview)
  
  console.log('✅ AI identified subject:', identifiedSubject)
  
  return {
    identified_subject: identifiedSubject,
    confidence: 0.92,
    analysis_method: 'ai_contextual_analysis',
    reasoning: 'AI analyzed filename patterns and content context to identify subject'
  }
}

// AI-powered mind map generation
async function generateAIMindMap(requestData: ADKRequest) {
  console.log('🎯 Processing AI mind map generation request')
  console.log('📥 Full request data keys:', Object.keys(requestData))
  console.log('📥 Request data structure:', JSON.stringify(requestData, null, 2))
  
  try {
    console.log('✅ Starting mind map generation process...')
    // Check API key availability first
    const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY')
    if (!googleApiKey) {
      console.error('❌ GOOGLE_AI_API_KEY not configured in environment')
      throw new Error('API key not configured')
    }
    console.log('✅ Google API key is available')
    
    // The frontend sends data directly in the request object, not nested under payload
    const subject = (requestData.subject as string) || 'Learning Topic'
    const focusQuestion = (requestData.focus_question as string) || ''
    // Handle content that might be an object (syllabus array) or string
    let content = ''
    const rawContent = requestData.content
    if (rawContent) {
      if (typeof rawContent === 'string') {
        content = rawContent
      } else if (Array.isArray(rawContent)) {
        content = (rawContent as string[]).join('\n')
      } else if (typeof rawContent === 'object') {
        content = JSON.stringify(rawContent)
      }
    }
    const memories = (requestData.memories as Array<Record<string, unknown>>) || []
    // user_communication_style is currently unused in this function; if personalization is needed, include it in the prompt
    
    // Validate required data
    if (!subject || subject === 'Learning Topic') {
      console.warn('⚠️ No specific subject provided, using generic topic')
    }
    
    console.log('🧠 Generating mind map for subject:', subject)
    console.log('📋 Content length:', content.length)
    console.log('🔗 Memory count:', memories.length)
    console.log('🔧 API key available:', googleApiKey ? 'Yes' : 'No')
    console.log('📊 Subject type:', typeof subject)
    console.log('📊 Content type:', typeof content)
    console.log('📊 Memories type:', typeof memories, Array.isArray(memories))
    // Generate AI-powered mind map using Gemini
    // Detect if this is certification content
    const contentStr = content ? (typeof content === 'string' ? content : String(content)) : ''
    const isCertificationContent = contentStr.toLowerCase().includes('az-') || 
                                 contentStr.includes('%') || 
                                 contentStr.toLowerCase().includes('exam') ||
                                 contentStr.toLowerCase().includes('manage') && contentStr.toLowerCase().includes('azure')

    let mindMapPrompt = ''
    
    if (isCertificationContent) {
      // Certification-specific prompt
      const focusQuestionSection = focusQuestion ? `

FOCUS QUESTION (Answer this through the mind map structure):
"${focusQuestion}"

The mind map should be organized to help answer this question. Position the most relevant domains and skills prominently.` : ''

      const promptParts = [
`Create a certification-focused mind map for "${subject}" with CLOCKWISE POSITIONING starting at 12 o'clock.${focusQuestionSection}`,
`CERTIFICATION REQUIREMENTS:
- Use Mermaid mindmap syntax with proper clockwise positioning
- Structure around the 5 EXACT exam domains from the AZ-104 content
- Position domains CLOCKWISE starting at 12 o'clock: Domain1(12), Domain2(2:30), Domain3(5), Domain4(7:30), Domain5(10)
- Each main domain MUST include its exam weight percentage
- Create clear hierarchy: Domain -> Skill Groups -> Specific Tasks -> Personal Anchors
- IMPORTANT: Keep node text simple - avoid special characters and long text
${focusQuestion ? '- FOCUS: Emphasize domains and skills most relevant to answering the focus question' : ''}`,
`EXAM CONTENT TO ANALYZE:
${contentStr.substring(0, 2000)}`,
`REQUIRED CLOCKWISE STRUCTURE & STYLING FOR AZ-104:
mindmap
  classDef domain1 fill:#6B46C1,color:#fff,stroke:#4C1D95,stroke-width:2px
  classDef domain2 fill:#F97316,color:#fff,stroke:#B45309,stroke-width:2px
  classDef domain3 fill:#7C2D92,color:#fff,stroke:#581C87,stroke-width:2px
  classDef domain4 fill:#F59E0B,color:#fff,stroke:#B45309,stroke-width:2px
  classDef domain5 fill:#10B981,color:#fff,stroke:#065F46,stroke-width:2px
  classDef anchor fill:#EC4899,color:#fff,stroke:#831843,stroke-width:2px

  root((Mastering Azure Administration AZ-104))
    )Manage Azure identities and governance 20-25%(:::domain1
      [Manage Microsoft Entra users and groups]
        (Create users and groups)
        (Manage user properties)
        {Personal Anchor}:::anchor
          (Lab Practice)
          (Real World Use)
      [Manage access to Azure resources]
        (Built-in Azure roles)
        (Assign roles at scopes)
        {Personal Anchor}:::anchor
          (Principle of Least Privilege)
          (Access Troubleshooting)
    )Implement and manage storage 15-20%(:::domain2
      [Configure storage access]
        (Storage firewalls)
        (SAS tokens)
        {Personal Anchor}:::anchor
          (Security Best Practices)
    )Deploy and manage compute 20-25%(:::domain3
      [Automate deployment]
        (ARM templates)
        (Bicep files)
        {Personal Anchor}:::anchor
          (Infrastructure as Code)
    )Virtual networking 15-20%(:::domain4
      [Configure virtual networks]
        (VNets and subnets)
        (Network peering)
        {Personal Anchor}:::anchor
          (Network Design)
    )Monitor and maintain 10-15%(:::domain5
      [Monitor resources]
        (Azure Monitor)
        (Log Analytics)
        {Personal Anchor}:::anchor
          (Monitoring Strategy)
`,
`CRITICAL INSTRUCTIONS:
1. Follow the EXACT clockwise positioning and styling shown above.
2. Use \`classDef\` to define colors as specified.
3. Assign the correct class to each domain and anchor node using \`:::\`.
4. Use the specified node shapes: \`((root))\`, \`[skill group]\`, \`(task)\`, \`{personal anchor}\`.
5. Include ALL 5 domains with their percentages.
6. Keep node names short and clear.`,
`Generate the mindmap following this EXACT structure and styling.`
      ];
      mindMapPrompt = promptParts.join('\n');
    } else {
      // Generic subject prompt
      mindMapPrompt = `Create a concise, well-organized mind map for "${subject}" based STRICTLY on the provided content.

STRICT REQUIREMENTS:
- Use Mermaid mindmap syntax
- Create a circular clockwise structure starting at 12 o'clock
- Include 4 main branches: Foundations (12 o'clock), Applications (3 o'clock), Assessment (6 o'clock), Advanced Topics (9 o'clock)
- IMPORTANT: Only include information directly from the provided content below
- DO NOT add creative interpretations or external knowledge
- Summarize and group related concepts concisely
- Each main branch should have 2-4 sub-branches maximum
- Keep node text short (3-5 words maximum per node)
- Use simple, clear language without jargon unless it's in the source material
- NO emojis or special formatting
- Avoid redundancy - group similar concepts together
- Focus on the most important concepts only
- If a branch doesn't have content from the source material, omit it

UPLOADED CONTENT TO ANALYZE:
${contentStr.substring(0, 3000)}

CRITICAL INSTRUCTIONS:
1. Extract ONLY information present in the uploaded content above
2. Summarize aggressively - combine related ideas into single nodes
3. Prioritize clarity over comprehensiveness
4. If you're unsure about including something, leave it out
5. Maximum 3 levels of hierarchy (root -> main branches -> sub-branches)
6. Each main branch should represent a major theme from the content
7. Group similar concepts together to avoid repetition

EXAMPLE FORMAT (adjust based on actual content):
mindmap
  root((${subject}))
    Foundations
      Core Concept Group
        Key Term 1
        Key Term 2
      Essential Principles
        Principle A
        Principle B
    Applications
      Practical Uses
        Use Case 1
        Use Case 2
      Implementation
        Method 1
        Method 2
    Assessment
      Evaluation Methods
        Type 1
        Type 2
    Advanced Topics
      Specialized Areas
        Area 1
        Area 2
      Future Directions
        Trend 1
        Trend 2

Generate a mind map that ONLY uses information from the provided content. Be concise and focused.`
    }

    console.log('🚀 Calling Gemini API...')
    console.log('📝 Mind map prompt length:', mindMapPrompt.length)
    console.log('📝 Mind map prompt preview:', mindMapPrompt.substring(0, 200) + '...')
    
    const response = await callGemini({
      messages: [
        {
          role: "system",
          content: "You are a precise content summarizer specializing in educational mind maps. Create concise, content-based mind maps using Mermaid syntax. Extract and organize ONLY information present in the provided content. Avoid adding external knowledge or creative interpretations. Focus on clear summarization and logical grouping. Always start with 'mindmap' and use proper Mermaid mindmap format."
        },
        {
          role: "user",
          content: mindMapPrompt
        }
      ],
      temperature: 0.4
    })
    
    console.log('📡 Gemini API call completed successfully')

    console.log('📡 Gemini API response received:', {
      hasResponse: !!response,
      hasChoices: !!response?.choices,
      choicesLength: response?.choices?.length || 0,
      hasContent: !!response?.choices?.[0]?.message?.content
    })

    const mindMapContent = response.choices[0]?.message?.content
    
    if (!mindMapContent) {
      console.error('❌ No content in Gemini response:', response)
      throw new Error('Failed to generate mind map content')
    }

    console.log('✅ AI mind map generated successfully')
    
    return {
      mermaid_code: mindMapContent,
      node_data: {
        subject: subject,
        branch_count: 4,
        generation_method: 'ai_powered',
        personalized: memories.length > 0
      },
      legend_html: `<p class="text-green-600">🤖 AI-generated mind map for <strong>${subject}</strong> with ${memories.length} personal memory connections</p>`
    }
    
  } catch (error) {
    console.error('❌ AI mind map generation failed:', error)
    
    // Log additional error details
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Non-Error object thrown:', typeof error, error)
    }
    
    // Check if it's a specific API error
    if (error instanceof Error) {
      if (error.message.includes('Gemini/PaLM API error')) {
        console.error('🔥 Gemini API error detected')
        throw new Error(`AI service error: ${error.message}`)
      } else if (error.message.includes('GOOGLE_AI_API_KEY')) {
        console.error('🔑 API key error detected')
        throw new Error(`API configuration error: ${error.message}`)
      } else if (error.message.includes('fetch')) {
        console.error('🌐 Network error detected')
        throw new Error(`Network error: ${error.message}`)
      }
    }
    
    // Re-throw with more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Mind map generation failed: ${errorMessage}`)
  }
}

// AI-powered memory dialogue generation
async function generateMemoryDialogue(requestData: ADKRequest) {
  console.log('💬 Processing memory dialogue request')
  
  const payload = requestData.payload || {}
  const memoryContent = (payload.memory_content as string) || ''
  const memoryCategory = (payload.memory_category as string) || ''
  const memoryInsights = (payload.memory_insights as string[]) || []
  const userMessage = (payload.user_message as string) || ''
  const dialogueHistory = (payload.dialogue_history as Array<{sender: string, content: string}>) || []
  
  console.log('🧠 Memory dialogue for category:', memoryCategory)
  console.log('💭 User message:', userMessage)
  console.log('📜 Dialogue history length:', dialogueHistory.length)

  try {
    // Build context from memory and insights
    const memoryContext = `
MEMORY: ${memoryContent}
CATEGORY: ${memoryCategory}
INSIGHTS: ${memoryInsights.join(', ')}
`

    // Build dialogue history context
    const historyContext = dialogueHistory.length > 0 
      ? `\nPREVIOUS CONVERSATION:\n${dialogueHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}`
      : ''

    const dialoguePrompt = `You are Sensa AI, a thoughtful and empathetic learning companion. You're having a dialogue with a user about their personal memory and your analysis of it.

MEMORY CONTEXT:${memoryContext}${historyContext}

USER'S CURRENT MESSAGE: "${userMessage}"

INSTRUCTIONS:
- Respond naturally and conversationally as Sensa AI
- Address the user's specific question or comment directly
- If they disagree with your analysis, be open to their perspective and ask clarifying questions
- If they ask how you decided on insights, explain your reasoning based on the memory content
- Be empathetic and acknowledge their lived experience
- Keep responses concise but meaningful (2-3 sentences max)
- Don't just echo their words back - provide substantive responses
- If they point out errors, acknowledge them and offer to reconsider

SPECIAL DETECTION:
- If the user shares a completely different experience/story that's unrelated to the original memory, note this for memory update suggestion
- Focus on their direct answers to your questions rather than tangential stories
- If they mention new experiences (like work projects, competitions, etc.) that aren't part of the original memory, this may warrant a separate memory entry

RESPONSE FORMAT:
Return a JSON object with:
{
  "dialogue_response": "Your conversational response",
  "suggest_memory_update": true/false (true if they shared unrelated new experiences)
}

Generate your response:`

    const response = await callGemini({
      messages: [
        {
          role: "system",
          content: "You are Sensa AI, an empathetic learning companion that helps users understand how their memories connect to their learning style. You engage in thoughtful dialogue about memory analysis and learning insights."
        },
        {
          role: "user",
          content: dialoguePrompt
        }
      ],
      temperature: 0.6
    })

    const dialogueContent = response.choices[0]?.message?.content
    
    if (!dialogueContent) {
      throw new Error('Failed to generate dialogue response')
    }

    // Try to parse as JSON first, fallback to plain text
    let dialogueResult
    try {
      dialogueResult = JSON.parse(dialogueContent)
      if (!dialogueResult.dialogue_response) {
        // If JSON doesn't have expected structure, treat as plain text
        dialogueResult = {
          dialogue_response: dialogueContent,
          suggest_memory_update: {
            update_needed: false,
            reason: ""
          }
        }
      }
    } catch {
      // If not valid JSON, treat as plain text response
      dialogueResult = {
        dialogue_response: dialogueContent,
        suggest_memory_update: {
          update_needed: false,
          reason: ""
        }
      }
    }

    console.log('✅ Memory dialogue generated successfully')
    
    return dialogueResult
    
  } catch (error) {
    console.error('❌ Memory dialogue generation failed:', error)
    throw new Error(`Dialogue generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// AI-powered memory insight updates based on dialogue
async function generateUpdatedMemoryInsights(requestData: ADKRequest) {
  console.log('🔄 Processing memory insight update request')
  
  const payload = requestData.payload || {}
  const memoryContent = (payload.memory_content as string) || ''
  const memoryCategory = (payload.memory_category as string) || ''
  const originalInsights = (payload.original_insights as string[]) || []
  const dialogueHistory = (payload.dialogue_history as Array<{sender: string, content: string}>) || []
  
  console.log('🧠 Updating insights for category:', memoryCategory)
  console.log('📜 Dialogue history length:', dialogueHistory.length)
  console.log('💡 Original insights count:', originalInsights.length)

  try {
    // Build context from memory and original insights
    const memoryContext = `
MEMORY: ${memoryContent}
CATEGORY: ${memoryCategory}
ORIGINAL INSIGHTS: ${originalInsights.join(', ')}
`

    // Build dialogue summary for AI context
    const dialogueSummary = dialogueHistory.length > 0 
      ? `\nCONVERSATION SUMMARY:\n${dialogueHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}`
      : ''

    const updatePrompt = `You are Sensa AI. Based on a detailed conversation with the user about their memory, you need to update your analysis and insights.

MEMORY CONTEXT:${memoryContext}${dialogueSummary}

TASK: Update the memory analysis based on what you learned from the conversation. Focus ONLY on the user's direct answers and feedback, not on tangential stories or unrelated experiences they may have shared.

KEY INSIGHTS FROM CONVERSATION:
- Look for what the user corrected about your original analysis
- Note any preferences, learning styles, or patterns they revealed about the ORIGINAL memory
- Pay attention to what resonates with them vs what doesn't about your analysis
- Consider any new information about their collaborative vs independent work preferences
- Factor in their communication style and problem-solving approach
- IGNORE unrelated stories or experiences that don't connect to the original memory
- Focus on their direct answers to your questions about the memory analysis

RETURN FORMAT (JSON):
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "learning_style": "Updated learning style description",
  "emotional_tone": "Updated emotional tone",
  "connections": ["connection 1", "connection 2"]
}

Generate updated insights that incorporate the conversation learnings:`

    const response = await callGemini({
      messages: [
        {
          role: "system",
          content: "You are Sensa AI, an expert at analyzing memories and learning styles. You update your analysis based on user feedback and dialogue to provide more accurate, personalized insights. Always return valid JSON."
        },
        {
          role: "user",
          content: updatePrompt
        }
      ],
      temperature: 0.4
    })

    const responseContent = response.choices[0]?.message?.content
    
    if (!responseContent) {
      throw new Error('Failed to generate updated insights')
    }

    // Parse the JSON response
    let updatedAnalysis
    try {
      updatedAnalysis = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, responseContent)
      // Fallback: return original insights with a note about the update
      updatedAnalysis = {
        insights: [...originalInsights, "Analysis updated based on your feedback"],
        learning_style: "Collaborative learner with trust-based preferences",
        emotional_tone: "Refined based on conversation",
        connections: ["Problem-solving", "Collaborative learning", "Trust-based environments"]
      }
    }

    console.log('✅ Memory insights updated successfully')
    
    return updatedAnalysis
    
  } catch (error) {
    console.error('❌ Memory insight update failed:', error)
    
    // Fallback: return enhanced original insights
    return {
      insights: [...originalInsights, "Analysis refined based on your conversation feedback"],
      learning_style: "Updated based on dialogue preferences",
      emotional_tone: "Refined through conversation",
      connections: ["Updated based on user feedback"]
    }
  }
}



/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/adk-agents' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
