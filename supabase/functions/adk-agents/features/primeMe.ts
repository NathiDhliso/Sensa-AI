// Prime Me feature - Transform topics into compelling learning journeys
// Expert educator and storyteller AI that creates logical narratives

import { 
  logWithContext,
  createJsonResponse,
  createErrorResponse 
} from '../utils.ts';
import { callGeminiSimple } from '../api/gemini.ts';
import type { ADKRequest } from '../types.ts';

/**
 * Interface for Prime Me narrative stages
 */
interface NarrativeStage {
  title: string;
  problem: string;
  solutions: string[];
  capability: string;
  topics: string[];
}

/**
 * Interface for complete Prime Me narrative
 */
interface PrimeNarrative {
  subject: string;
  metaphor: string;
  title: string;
  introduction: string;
  stages: NarrativeStage[];
  conclusion: string;
}

/**
 * Generate Prime Me narrative from past papers content
 */
export async function generatePrimeMeNarrative(request: ADKRequest): Promise<Response> {
  try {
    logWithContext('info', '📚 Starting Prime Me narrative generation');

    const { subject, past_paper_content, system_prompt } = request.payload;

    if (!subject || !past_paper_content) {
      return createErrorResponse('Subject and past paper content are required', 400);
    }

    // Create the expert educator prompt
    const expertPrompt = system_prompt || createDefaultSystemPrompt(subject);

    // Enhanced prompt for structured narrative generation
    const enhancedPrompt = `${expertPrompt}

IMPORTANT: Respond with a JSON object in exactly this format:
{
  "subject": "${subject}",
  "metaphor": "Your central metaphor for the subject",
  "title": "The Journey of [Your Metaphor Title]",
  "introduction": "A compelling introduction that establishes the central metaphor and explains why these concepts build on each other",
  "stages": [
    {
      "title": "Stage name (e.g., 'The Foundation')",
      "problem": "The general problem or challenge at this stage",
      "solutions": ["topic1", "topic2", "topic3"],
      "capability": "One sentence describing what the learner can now do",
      "topics": ["specific topics from past papers covered in this stage"]
    }
  ],
  "conclusion": "A paragraph that ties together the complete journey and explains how the concepts form a coherent whole"
}

Here is the past paper content to analyze:
${past_paper_content}

Remember:
1. Create 4-6 sequential stages
2. Each stage must show how concepts create the need for the next
3. Use connecting language like "This leads to...", "With that established...", "To solve this..."
4. Present topics as solutions to problems
5. Create a coherent story, not just a list
6. Make it compelling and logical

Generate the JSON response now:`;

    // Call Gemini API for narrative generation
    const response = await callGeminiSimple(enhancedPrompt, 0.8);

    if (!response) {
      logWithContext('error', 'No response from AI service for Prime Me narrative');
      return createErrorResponse('Failed to generate narrative', 500);
    }

    // Parse the JSON response
    let narrative: PrimeNarrative;
    try {
      // Clean the response to extract just the JSON
      const cleanedResponse = extractJsonFromResponse(response);
      narrative = JSON.parse(cleanedResponse);
      
      // Validate the narrative structure
      if (!validateNarrativeStructure(narrative)) {
        throw new Error('Invalid narrative structure');
      }
      
    } catch (parseError) {
      logWithContext('error', 'Failed to parse Prime Me narrative JSON', { 
        error: parseError instanceof Error ? parseError.message : 'Unknown error',
        response: response.substring(0, 500) 
      });
      
      // Fallback: create a structured narrative from the raw response
      narrative = createFallbackNarrative(subject, response);
    }

    logWithContext('info', '✅ Prime Me narrative generated successfully', {
      subject: narrative.subject,
      stagesCount: narrative.stages.length
    });

    return createJsonResponse({
      narrative,
      metadata: {
        subject,
        generatedAt: new Date().toISOString(),
        stagesCount: narrative.stages.length,
        totalTopics: narrative.stages.reduce((total, stage) => total + stage.topics.length, 0)
      }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logWithContext('error', '❌ Prime Me narrative generation failed', { error: errorMsg });
    return createErrorResponse(`Prime Me generation failed: ${errorMsg}`, 500);
  }
}

/**
 * Create default system prompt for Prime Me
 */
function createDefaultSystemPrompt(subject: string): string {
  return `You are an expert educator and storyteller. Your goal is to transform a list of topics from a subject's past papers into a compelling, logical narrative that explains why these concepts are learned in a particular order.

Task:
1. Analyze: Identify the core, recurring topics and concepts from the past papers for the subject: ${subject}.
2. Create a Narrative Framework: Invent a central metaphor for mastering this subject and create a report titled "The Journey of [Create a Relevant Metaphor for the Subject]."
3. Structure the Journey: Organise the topics into 4 to 6 sequential stages. Each stage must represent a major phase in understanding or applying the subject matter. Give each stage a thematic title (e.g., "The Blueprint," "Construction," "Operations").
4. Develop Each Stage with a Problem-Solution Flow: For each stage in your report, you must:
   - Introduce the stage by describing the general problem, question, or challenge that a learner faces at that point.
   - Present the specific topics from the past papers as the "solutions" or "answers" to these problems.
   - Crucially, use connecting language to show how one concept creates the need for the next. Use phrases like: "This leads to the problem of...", "With that established, the next challenge is...", "To solve this, one must first understand...".
   - Conclude each stage with a one-sentence summary of the new capability the learner has achieved (e.g., "At this point, the student can now analyze foundational principles," or "The learner now has the tools to build a complete model.").

The final output should not be a list. It must be a coherent story that illustrates the intellectual journey of mastering ${subject}, with each concept building logically on the last.`;
}

/**
 * Extract JSON from AI response that might contain extra text
 */
function extractJsonFromResponse(response: string): string {
  // Look for JSON object boundaries
  const jsonStart = response.indexOf('{');
  const jsonEnd = response.lastIndexOf('}');
  
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error('No valid JSON found in response');
  }
  
  return response.substring(jsonStart, jsonEnd + 1);
}

/**
 * Validate the narrative structure
 */
function validateNarrativeStructure(narrative: unknown): narrative is PrimeNarrative {
  if (!narrative || typeof narrative !== 'object') return false;
  
  const required = ['subject', 'metaphor', 'title', 'introduction', 'stages', 'conclusion'];
  for (const field of required) {
    if (!(field in narrative)) return false;
  }
  
  if (!Array.isArray(narrative.stages) || narrative.stages.length === 0) return false;
  
  // Validate each stage
  for (const stage of narrative.stages) {
    const stageRequired = ['title', 'problem', 'solutions', 'capability', 'topics'];
    for (const field of stageRequired) {
      if (!(field in stage)) return false;
    }
    
    if (!Array.isArray(stage.solutions) || !Array.isArray(stage.topics)) return false;
  }
  
  return true;
}

/**
 * Create fallback narrative when JSON parsing fails
 */
function createFallbackNarrative(subject: string, rawResponse: string): PrimeNarrative {
  logWithContext('info', 'Creating fallback Prime Me narrative');
  
  // Extract key information from the raw response
  const metaphor = extractMetaphor(rawResponse) || 'Mathematical Architecture';
  
  return {
    subject,
    metaphor,
    title: `The Journey of ${subject}: Building ${metaphor}`,
    introduction: `Learning ${subject} is like constructing a magnificent ${metaphor.toLowerCase()}. Each concept serves as a crucial building block, with earlier foundations supporting more complex structures. This journey transforms abstract principles into a coherent framework for understanding.`,
    stages: [
      {
        title: "The Foundation",
        problem: "Before any structure can be built, one must establish solid foundations. The challenge is understanding how basic principles interact in systematic ways.",
        solutions: ["Basic concepts", "Fundamental principles", "Core theories"],
        capability: "At this point, the student can manipulate basic concepts with confidence and precision.",
        topics: extractTopicsFromResponse(rawResponse, 0)
      },
      {
        title: "The Framework",
        problem: "With foundations laid, the next challenge is understanding how different elements work together. This leads to the problem of connecting isolated concepts.",
        solutions: ["Integration techniques", "Connecting principles", "Unified approaches"],
        capability: "The learner now has the tools to see relationships between different concepts.",
        topics: extractTopicsFromResponse(rawResponse, 1)
      },
      {
        title: "The Construction",
        problem: "Having mastered connections, the challenge becomes building complex solutions. To solve this, one must first understand how to apply integrated knowledge.",
        solutions: ["Advanced applications", "Problem-solving methods", "Real-world connections"],
        capability: "At this point, students can now tackle complex, multi-faceted problems.",
        topics: extractTopicsFromResponse(rawResponse, 2)
      },
      {
        title: "The Mastery",
        problem: "With construction skills developed, the final challenge is achieving expertise and innovation. This requires understanding the deepest principles.",
        solutions: ["Advanced techniques", "Expert methods", "Creative applications"],
        capability: "The learner now has the capability to innovate and extend the field.",
        topics: extractTopicsFromResponse(rawResponse, 3)
      }
    ],
    conclusion: `This journey through ${subject} reveals how concepts build upon each other in a logical progression. From basic foundations to advanced mastery, each stage prepares the learner for greater complexity and deeper understanding, culminating in the ability to innovate and contribute to the field.`
  };
}

/**
 * Extract metaphor from raw response
 */
function extractMetaphor(response: string): string | null {
  const metaphorPatterns = [
    /metaphor[^:]*:\s*["']([^"']+)["']/i,
    /journey of[^:]*:\s*["']([^"']+)["']/i,
    /building\s+([a-zA-Z\s]+)/i,
    /architecture/i,
    /construction/i,
    /framework/i
  ];
  
  for (const pattern of metaphorPatterns) {
    const match = response.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Extract topics from response for a specific stage
 */
function extractTopicsFromResponse(response: string, stageIndex: number): string[] {
  // Simple extraction of mathematical/academic terms
  const topicPatterns = [
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Capitalized terms
    /\b(?:calculus|algebra|geometry|analysis|integration|differentiation|matrix|vector|equation|function|theorem|proof|formula)\b/gi,
  ];
  
  const topics: Set<string> = new Set();
  
  for (const pattern of topicPatterns) {
    const matches = response.match(pattern);
    if (matches) {
      matches.slice(stageIndex * 3, (stageIndex + 1) * 3).forEach(topic => {
        if (topic.length > 3 && topic.length < 30) {
          topics.add(topic.trim());
        }
      });
    }
  }
  
  return Array.from(topics).slice(0, 5); // Limit to 5 topics per stage
} 