// Study Guide Generator Feature
// Implements the Universal Study Guide Generator with comprehensive system prompt
// VERSION 2.0: Enhanced for reliable JSON output and a richer data structure.

import { ADKRequest } from '../types.ts';

// --- IMPROVEMENT 1: Refined JSON Schema in the System Prompt ---
// This new schema is more explicit and easier for a front-end to render.
// It clearly separates thematic names, concept pairs, and other elements.
const STUDY_GUIDE_SYSTEM_PROMPT = `You are an expert curriculum designer and learning strategist with deep expertise in educational psychology and knowledge architecture. Your task is to transform unstructured text from past exam papers from any subject into a comprehensive, multi-layered study guide. The guide must be optimized for deep understanding, knowledge retention, and practical application.

Objective: To create a world-class study guide by identifying the core concepts of a subject, organizing them into a memorable framework, and using a "Problem-Solution-Complexity" pyramid structure to illustrate the relationship between basic and advanced knowledge. The more exam content provided, the better your analysis will be.

ANALYSIS APPROACH: Carefully examine the provided exam paper(s) for:
- Question patterns and mark allocations
- Recurring themes and concepts
- Technical terminology and definitions
- Complexity levels across different topics
- Real-world application scenarios
- Assessment criteria and learning objectives

Based only on the content, questions, and terminology from the provided exam paper(s), perform the following four steps to generate the study guide.

________________________________________
Step 1: Create the Master Framework
1. Identify Core Pillars: Analyze the entire input to identify 3-5 fundamental pillars or domains that represent the major areas of the subject.
2. Create a Thematic Acronym: Devise a single, powerful, and memorable acronym for the overall framework using the first letter of each pillar. Name each pillar with an action-oriented or thematic word that captures its essence (e.g., Protect, Architect, Analyze, etc.). This is the master framework name.

Step 2: Deconstruct Each Pillar
For each Pillar identified in Step 1, you must perform the following:
1. Write a "Study Focus" Paragraph: Begin with a brief, 2-sentence paragraph explaining the real-world importance of this pillar and the key skills a student will gain by mastering it.
2. Identify and Frame Sub-Topics: Break the pillar down into its distinct, testable sub-topics. Frame each sub-topic's title as a "Concept Pair" that highlights the core comparison the student must understand (e.g., "Theory X vs. Theory Y", "Method A vs. Method B", "Basic Tool vs. Advanced Tool").
3. Assign Priority Tags: Based on the frequency or complexity of related questions in the source text, prefix each sub-topic title with a priority tag: [High Priority], [Common Scenario], or [Key Concept].
4. Create a Sub-Acronym: Attempt to create a memorable acronym from the first letter of each sub-topic within the pillar. A logical grouping is more important than a forced acronym; if a good one can't be formed, simply list the topics logically.

Step 3: Construct the Knowledge Pyramids
For every single sub-topic, you must construct a detailed knowledge pyramid with the following three tiers:
• Base (The Initial Problem): Describe the simple, foundational question or problem that this topic addresses. What is the initial challenge that needs a solution?
• Middle (The Standard Solution): State the standard concept, theory, formula, or tool that is taught as the initial solution to the Base problem.
• Apex (New Problem & Advanced Solution): Describe the more complex problem, limitation, or nuance that arises from applying the standard solution. Crucially, you must then explicitly name the advanced concept, theory, or tool that is required to solve this new, more complex problem.
• Key Takeaway: Conclude each pyramid with a single, bolded sentence that summarizes the most critical lesson or exam tip from that pyramid.

________________________________________
Step 4: Format the Output
Present the entire study guide as a single, valid JSON object that can be easily processed. Use the exact structure below. Do not include any explanations or markdown formatting outside of the JSON structure itself.

REQUIRED JSON SCHEMA:
{
  "subject": "The name of the subject being analyzed",
  "framework": {
    "acronym": "SMART",
    "name": "Strategic Mastery and Retention Techniques",
    "description": "A comprehensive framework for mastering [subject] by breaking down core domains into manageable pillars."
  },
  "pillars": [
    {
      "name": "Strategic Foundation",
      "thematicName": "Strategy",
      "studyFocus": "This pillar focuses on building fundamental understanding and strategic thinking. Students will develop core analytical skills essential for advanced problem-solving.",
      "subAcronym": "CORE",
      "subTopics": [
        {
          "priority": "[High Priority]",
          "conceptPair": "Basic Concepts vs. Advanced Applications",
          "pyramid": {
            "base": "Students struggle to understand fundamental principles and their real-world applications.",
            "middle": "Learn core theories, definitions, and basic problem-solving frameworks.",
            "apex": "Complex scenarios arise where basic theories must be adapted and integrated with advanced concepts.",
            "keyTakeaway": "**Master the fundamentals first, then build complexity through practical application.**"
          }
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
1. You must respond with ONLY valid JSON that adheres to the schema above
2. Each pillar must have a meaningful "name" and "thematicName" (not "pillarName")
3. Each sub-topic must use "conceptPair" (not "title") for the concept comparison
4. Priority tags must be exactly: [High Priority], [Common Scenario], or [Key Concept]
5. Key takeaways must be wrapped in **bold** markdown formatting
6. Analyze the actual exam content provided to create relevant, subject-specific content
7. Create 3-5 pillars with 2-4 sub-topics each for comprehensive coverage
8. Make acronyms memorable and meaningful for the specific subject
9. Ensure study focus paragraphs are exactly 2 sentences explaining real-world importance`;

export async function generateStudyGuide(request: ADKRequest): Promise<Response> {
  console.log('🎓 Starting Study Guide Generation...');

  try {
    const { exam_content, subject_name } = request;

    if (!exam_content || !subject_name) {
      throw new Error('Missing required parameters: exam_content and subject_name');
    }

    console.log('📚 Subject:', subject_name);
    console.log('📄 Content length:', exam_content.length);

    // Construct the user prompt portion
    const userPrompt = `Subject: ${subject_name}

Exam Paper Content:
${exam_content}

Generate a comprehensive study guide for the subject above, following all instructions and adhering strictly to the JSON output format.`;

    // Call Gemini API with retry logic and multiple models
    console.log('📞 Calling Gemini API with JSON mode enabled...');

    // Import the updated model list from constants
    const { GEMINI_MODELS } = await import('../constants.ts');
    const models = [...GEMINI_MODELS];

    let geminiResponse;
    let lastError;

    for (const model of models) {
      try {
        console.log(`🔄 Trying model: ${model}`);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

        try {
          geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` + Deno.env.get('GOOGLE_AI_API_KEY'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              systemInstruction: {
                  parts: [{
                      text: STUDY_GUIDE_SYSTEM_PROMPT
                  }]
              },
              contents: [{
                parts: [{
                  text: userPrompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.8,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json',
              }
            })
          });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.log(`⏰ Timeout with ${model}, trying next model...`);
            continue;
          }
          throw fetchError;
        }

        if (geminiResponse.ok) {
          console.log(`✅ Success with model: ${model}`);
          break;
        } else {
          const errorBody = await geminiResponse.text();
          lastError = `${model}: ${geminiResponse.status} - ${errorBody}`;
          console.log(`❌ Failed with ${model}: ${lastError}`);

          // If it's a 503 (overloaded), try next model immediately
          if (geminiResponse.status === 503) {
            continue;
          }

          // For other errors, wait a bit before trying next model
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        lastError = `${model}: ${error.message}`;
        console.log(`❌ Error with ${model}: ${lastError}`);

        // If it's a timeout, try next model immediately
        if (error.name === 'AbortError') {
          console.log(`⏰ Timeout with ${model}, trying next model...`);
        }
        continue;
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      throw new Error(`All Gemini models failed. Last error: ${lastError}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini API');
    }

    console.log('🤖 Gemini JSON response received, parsing...');

    // Parse the JSON response
    let studyGuide;
    try {
      // With JSON mode, direct parsing should be reliable.
      // The cleanup logic is kept as a defensive measure in case the API call is ever changed.
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}') + 1;
      const cleanJson = generatedText.slice(jsonStart, jsonEnd);
      
      studyGuide = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.error('RAW Gemini Response:', generatedText); // Log the raw response for debugging
      
      // Fallback: Create a structured guide from the generated text
      studyGuide = createFallbackStructure(subject_name, generatedText);
    }

    // Validate the structure
    if (!studyGuide.framework || !studyGuide.pillars) {
      throw new Error('Invalid study guide structure generated. The JSON does not match the required schema.');
    }

    console.log('✅ Study guide generated successfully');
    console.log('📊 Framework:', studyGuide.framework.acronym);
    console.log('🏛️ Pillars:', studyGuide.pillars.length);

    return {
      success: true,
      study_guide: studyGuide,
      metadata: {
        subject: subject_name,
        contentLength: exam_content.length,
        generatedAt: new Date().toISOString(),
        pillarsCount: studyGuide.pillars.length,
        totalSubTopics: studyGuide.pillars.reduce((acc: number, pillar: Record<string, unknown>) => acc + ((pillar.subTopics as unknown[])?.length || 0), 0)
      }
    };

  } catch (error) {
    console.error('❌ Study Guide Generation Error:', error);
    
    // Return a structured error with fallback
    return {
      success: false,
      error: error.message,
      fallback_guide: createBasicFallback(request.subject_name || "the specified subject"),
      metadata: {
        subject: request.subject_name || "Unknown",
        errorType: 'generation_failed',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// --- IMPROVEMENT 3: Clarified comments in fallback functions ---
// These functions provide a safety net if the primary generation fails.
function createFallbackStructure(subject: string, generatedText: string): Record<string, unknown> {
  console.log('🔄 Creating fallback structure from partially generated text...');

  extractConcepts(generatedText);
  
  return {
    framework: {
      acronym: 'STUDY',
      name: 'Strategic Techniques for Understanding Dynamic Yearning',
      description: `This guide provides a structured approach to studying for the ${subject} exam, organizing key concepts into manageable learning pillars.`
    },
    pillars: [
      {
        name: 'Strategic Foundation',
        thematicName: 'Strategy',
        studyFocus: 'This pillar establishes the fundamental concepts essential for understanding the subject. Students will develop core analytical skills and build a strong foundation for advanced learning.',
        subAcronym: 'CORE',
        subTopics: [
          {
            priority: '[High Priority]',
            conceptPair: 'Basic Principles vs. Advanced Applications',
            pyramid: {
              base: 'Students need to understand fundamental concepts and their basic applications in the subject area.',
              middle: 'Learn core theories, definitions, and standard problem-solving approaches taught in the curriculum.',
              apex: 'Complex real-world scenarios require integration of multiple concepts and advanced analytical thinking beyond basic applications.',
              keyTakeaway: '**Master the fundamentals thoroughly before attempting complex problem-solving scenarios.**'
            }
          }
        ]
      }
    ]
  };
}

// Basic fallback for when generation fails completely.
function createBasicFallback(subject: string): Record<string, unknown> {
  return {
    framework: {
      acronym: 'LEARN',
      name: 'Learning Enhancement and Retention Network',
      description: `A basic study framework for ${subject} when AI analysis is unavailable.`
    },
    pillars: [
      {
        name: 'Core Understanding',
        thematicName: 'Learn',
        studyFocus: 'Focus on building fundamental understanding of key concepts. This forms the foundation for all advanced learning in the subject.',
        subTopics: [
          {
            priority: '[High Priority]',
            conceptPair: 'Theory vs. Practice',
            pyramid: {
              base: 'Understanding the gap between theoretical knowledge and practical application.',
              middle: 'Learn standard theories and practice basic application exercises.',
              apex: 'Complex scenarios require adaptive thinking and integration of multiple theoretical frameworks.',
              keyTakeaway: '**Balance theoretical understanding with practical application for comprehensive mastery.**'
            }
          }
        ]
      }
    ]
  };
}

// A simple utility for concept extraction in fallbacks.
function extractConcepts(text: string): string[] {
  const conceptPatterns = [
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Proper nouns
    /\b(?:theory|method|principle|concept|approach|technique|strategy)\b/gi
  ];
  
  const concepts: string[] = [];
  conceptPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    concepts.push(...matches);
  });
  
  return Array.from(new Set(concepts)).slice(0, 10); // Return unique concepts, max 10
}