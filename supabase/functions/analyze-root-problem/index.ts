import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeRootProblemRequest {
  solution: string
  nodeId: string
  nodeLabel: string
}

interface AnalysisResult {
  standardResults: string[]
  childFriendlyResults: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { solution, nodeId, nodeLabel }: AnalyzeRootProblemRequest = await req.json()

    if (!solution || !nodeId || !nodeLabel) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: solution, nodeId, nodeLabel' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Google AI API key
    const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY')
    if (!googleApiKey) {
      throw new Error('GOOGLE_AI_API_KEY not found in environment variables')
    }

    // Perform AI-powered 5-Why root cause analysis - STRICT single sentence responses
    const standardPrompt = `
CRITICAL: Each response must be EXACTLY ONE SENTENCE. No explanations, no lists, no elaboration.

Perform a 5-Why analysis for: "${solution}" (Context: "${nodeLabel}")

Provide exactly 5 single-sentence answers as a JSON array. Each sentence must be concise and direct.

Format: ["Single sentence answer 1", "Single sentence answer 2", "Single sentence answer 3", "Single sentence answer 4", "Single sentence answer 5"]

Each answer must be ONE SENTENCE ONLY.`

    const childFriendlyPrompt = `
CRITICAL: Each response must be EXACTLY ONE SIMPLE SENTENCE. No explanations, no lists.

Perform a 5-Why analysis for: "${solution}" (Context: "${nodeLabel}")

Use simple, encouraging language with emojis. Provide exactly 5 single-sentence answers as a JSON array.

Format: ["Simple sentence 1 🌟", "Simple sentence 2 💡", "Simple sentence 3 📚", "Simple sentence 4 🎯", "Simple sentence 5 ✨"]

Each answer must be ONE SIMPLE SENTENCE ONLY.`

    let analysisResults: AnalysisResult

    try {
      // Get standard analysis using Gemini
      const standardResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: standardPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      })

      // Get child-friendly analysis using Gemini
      const childFriendlyResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: childFriendlyPrompt }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000
          }
        })
      })

      // Parse Gemini responses
      let standardResults: string[] = []
      let childFriendlyResults: string[] = []

      // Parse standard response
      if (standardResponse.ok) {
        const standardData = await standardResponse.json()
        try {
          const standardContent = standardData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (standardContent) {
            standardResults = JSON.parse(standardContent)
          }
        } catch (parseError) {
          console.error('Error parsing standard results:', parseError)
          // Fallback to basic parsing
          const content = standardData.candidates?.[0]?.content?.parts?.[0]?.text || ''
          standardResults = content.split('\n').filter(line => line.trim()).slice(0, 5)
        }
      }

      // Parse child-friendly response
      if (childFriendlyResponse.ok) {
        const childData = await childFriendlyResponse.json()
        try {
          const childContent = childData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (childContent) {
            childFriendlyResults = JSON.parse(childContent)
          }
        } catch (parseError) {
          console.error('Error parsing child-friendly results:', parseError)
          // Fallback to basic parsing
          const content = childData.candidates?.[0]?.content?.parts?.[0]?.text || ''
          childFriendlyResults = content.split('\n').filter(line => line.trim()).slice(0, 5)
        }
      }

      // Ensure we have exactly 5 results for each
      if (standardResults.length < 5) {
        const remaining = 5 - standardResults.length
        for (let i = 0; i < remaining; i++) {
          standardResults.push(`Additional analysis needed for ${nodeLabel} (${i + standardResults.length + 1}/5)`)
        }
      }

      if (childFriendlyResults.length < 5) {
        const remaining = 5 - childFriendlyResults.length
        for (let i = 0; i < remaining; i++) {
          childFriendlyResults.push(`Let's explore more about ${nodeLabel}! 🔍 (${i + childFriendlyResults.length + 1}/5)`)
        }
      }

      analysisResults = {
        standardResults: standardResults.slice(0, 5),
        childFriendlyResults: childFriendlyResults.slice(0, 5)
      }

    } catch (aiError) {
      console.error('AI analysis error:', aiError)
      
      // Fallback to enhanced template-based analysis if AI fails
      analysisResults = {
        standardResults: [
          `Surface issue: ${solution} may not address the core problem with ${nodeLabel}`,
          `Process gap: Insufficient analysis of ${nodeLabel} requirements before implementing solution`,
          `Knowledge gap: Limited understanding of ${nodeLabel} fundamentals affecting solution design`,
          `Systemic issue: Lack of structured approach to ${nodeLabel} problem-solving methodology`,
          `Root cause: Absence of comprehensive ${nodeLabel} learning framework and continuous improvement process`
        ],
        childFriendlyResults: [
          `Maybe we need to understand ${nodeLabel} better first! 🤔`,
          `Let's think about what ${nodeLabel} really needs! 💭`,
          `We might be missing some important ${nodeLabel} basics! 📚`,
          `Perhaps we need a better plan for ${nodeLabel}! 📋`,
          `The real answer might be learning more about ${nodeLabel} step by step! 🎯`
        ]
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: analysisResults 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in analyze-root-problem function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})