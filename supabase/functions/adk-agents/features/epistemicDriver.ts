// Epistemic Driver feature - Transform exam objectives into strategic study maps
// Uses two-step AI processing: grouping then comprehensive analysis

import {
  logWithContext,
  createJsonResponse,
  createErrorResponse,
  formatProcessingTime
} from '../utils.ts';
import { callGemini } from '../api/gemini.ts';
import { GROUPING_PROMPT, ANALYSIS_PROMPT } from '../prompts/epistemicDriver.ts';
import type { ADKRequest } from '../types.ts';

// Schema definitions for structured generation
const GROUPING_SCHEMA = {
  type: "OBJECT",
  properties: {
    grouped_objectives: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          domain: { type: "STRING" },
          sub_topics: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["domain", "sub_topics"]
      }
    }
  },
  required: ["grouped_objectives"]
};

const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    epistemological_drivers: {
      type: "OBJECT",
      properties: {
        pillar: { type: "STRING" },
        points: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              type: { type: "STRING" },
              content: { type: "STRING" }
            },
            required: ["type", "content"]
          }
        }
      },
      required: ["pillar", "points"]
    },
    learning_paths: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          domain: { type: "STRING" },
          methodology: {
            type: "OBJECT",
            properties: {
              pillar: { type: "STRING" },
              points: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    type: { type: "STRING" },
                    content: { type: "STRING" }
                  },
                  required: ["type", "content"]
                }
              }
            },
            required: ["pillar", "points"]
          },
          application: {
            type: "OBJECT",
            properties: {
              pillar: { type: "STRING" },
              points: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    type: { type: "STRING" },
                    content: { type: "STRING" }
                  },
                  required: ["type", "content"]
                }
              }
            },
            required: ["pillar", "points"]
          }
        },
        required: ["domain", "methodology", "application"]
      }
    },
    connecting_link: { type: "STRING" }
  },
  required: ["epistemological_drivers", "learning_paths", "connecting_link"]
};

/**
 * Interface for grouped exam objectives
 */
interface GroupedObjective {
  domain: string;
  sub_topics: string[];
}

/**
 * Interface for epistemological drivers (the "Why")
 */
interface EpistemologicalDriver {
  type: 'Concept/Fact' | 'Process/Explanation' | 'Implication/Application';
  content: string;
}

/**
 * Interface for methodology points (the "How")
 */
interface MethodologyPoint {
  type: 'Technical Component' | 'Operational Process' | 'Direct Result';
  content: string;
}

/**
 * Interface for application points (the "So What")
 */
interface ApplicationPoint {
  type: 'Strategic Driver' | 'Execution Strategy' | 'Business Impact';
  content: string;
}

/**
 * Interface for learning path (domain-specific study plan)
 */
interface LearningPath {
  domain: string;
  methodology: {
    pillar: string;
    points: MethodologyPoint[];
  };
  application: {
    pillar: string;
    points: ApplicationPoint[];
  };
}

/**
 * Interface for complete epistemic driver response
 */
interface EpistemicDriverResponse {
  epistemological_drivers: {
    pillar: string;
    points: EpistemologicalDriver[];
  };
  learning_paths: LearningPath[];
  connecting_link: string;
}

/**
 * Generate Epistemic Driver study map from exam subject and objectives
 */
export async function generateEpistemicDriver(request: ADKRequest): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    logWithContext('info', '🎯 Starting Epistemic Driver generation', { requestId });
    
    // Extract and validate input
    const { subject, objectives } = request.payload;
    
    if (!subject || typeof subject !== 'string') {
      return createErrorResponse('Subject is required and must be a string', 400, requestId);
    }
    
    if (!objectives || typeof objectives !== 'string') {
      return createErrorResponse('Objectives are required and must be a string', 400, requestId);
    }
    
    logWithContext('info', 'Input validated', { 
      requestId, 
      subject: subject.substring(0, 50) + '...',
      objectivesLength: objectives.length 
    });
    
    // Step 1: Group and structure the objectives
    const groupedObjectives = await groupObjectives(objectives, requestId);
    
    // Step 2: Generate comprehensive analysis
    const studyMap = await generateComprehensiveAnalysis(subject, groupedObjectives, requestId);
    
    const processingTime = Date.now() - startTime;
    logWithContext('info', '✅ Epistemic Driver generation completed', { 
      requestId, 
      processingTime: `${processingTime}ms` 
    });
    
    return createJsonResponse(studyMap, true, 200, undefined, requestId, { processingTime: formatProcessingTime(startTime) });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    logWithContext('error', '❌ Epistemic Driver generation failed', { 
      requestId, 
      error: errorMessage,
      processingTime: `${processingTime}ms`
    });
    
    return createErrorResponse(
      `Failed to generate epistemic driver: ${errorMessage}`,
      500,
      requestId,
      { processingTime: `${processingTime}ms` }
    );
  }
}

/**
 * Step 1: Group objectives into logical domains
 */
async function groupObjectives(objectives: string, requestId: string): Promise<GroupedObjective[]> {
  logWithContext('info', '📋 Starting objectives grouping', { requestId });

  const groupingPrompt = GROUPING_PROMPT(objectives);

  // CORRECTED PAYLOAD - Use structured JSON response
  const payload = {
    messages: [{ role: 'user', content: groupingPrompt }],
    temperature: 0.3,
    responseMimeType: "application/json",
    responseSchema: GROUPING_SCHEMA // Use the schema for guaranteed JSON structure
  };

  try {
    logWithContext('info', '📤 Sending grouping payload to Gemini', {
      requestId,
      payloadStructure: {
        messagesCount: payload.messages.length,
        temperature: payload.temperature,
        promptLength: groupingPrompt.length,
        hasSchema: !!payload.responseSchema
      }
    });

    // This call should now return a clean JSON object directly
    const parsedResponse = await callGemini(payload);
    
    if (!parsedResponse.grouped_objectives || !Array.isArray(parsedResponse.grouped_objectives)) {
      throw new Error('Invalid grouping response format');
    }
    
    logWithContext('info', '✅ Objectives grouped successfully', { 
      requestId, 
      domainsCount: parsedResponse.grouped_objectives.length 
    });
    
    return parsedResponse.grouped_objectives;
    
  } catch (error) {
    // Enhanced error logging with full error details
    const errorDetails = {
      requestId,
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      payloadSent: JSON.stringify(payload, null, 2)
    };

    logWithContext('error', '❌ Objectives grouping failed - Full Error Details', errorDetails);

    // If it's a fetch error, try to get more details
    if (error.cause) {
      logWithContext('error', '❌ Error cause details', { requestId, cause: error.cause });
    }

    throw new Error(`Failed to group objectives: ${error.message}`);
  }
}

/**
 * Step 2: Generate comprehensive analysis with structured study map
 */
async function generateComprehensiveAnalysis(
  subject: string,
  groupedObjectives: GroupedObjective[],
  requestId: string
): Promise<EpistemicDriverResponse> {
  logWithContext('info', '🧠 Starting comprehensive analysis', { requestId });

  const analysisPrompt = ANALYSIS_PROMPT(subject, groupedObjectives);

  // CORRECTED PAYLOAD - Use structured JSON response
  const payload = {
    messages: [{ role: 'user', content: analysisPrompt }],
    temperature: 0.4,
    maxOutputTokens: 8192,  // Increased token limit for comprehensive responses
    responseMimeType: "application/json",
    responseSchema: ANALYSIS_SCHEMA // Use the schema for guaranteed JSON structure
  };

  try {
    logWithContext('info', '📤 Sending analysis payload to Gemini', {
      requestId,
      payloadStructure: {
        messagesCount: payload.messages.length,
        temperature: payload.temperature,
        promptLength: analysisPrompt.length,
        groupedObjectivesCount: groupedObjectives.length,
        hasSchema: !!payload.responseSchema
      }
    });

    // This call will return a clean JSON object directly
    const parsedResponse = await callGemini(payload);
    
    // Validate response structure
    if (!parsedResponse.epistemological_drivers || 
        !parsedResponse.learning_paths || 
        !parsedResponse.connecting_link) {
      throw new Error('Invalid analysis response format');
    }
    
    logWithContext('info', '✅ Comprehensive analysis completed', { 
      requestId,
      learningPathsCount: parsedResponse.learning_paths.length
    });
    
    return parsedResponse;
    
  } catch (error) {
    // Enhanced error logging with full error details
    const errorDetails = {
      requestId,
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      payloadSent: JSON.stringify(payload, null, 2),
      groupedObjectivesCount: groupedObjectives.length
    };

    logWithContext('error', '❌ Comprehensive analysis failed - Full Error Details', errorDetails);

    // If it's a fetch error, try to get more details
    if (error.cause) {
      logWithContext('error', '❌ Analysis error cause details', { requestId, cause: error.cause });
    }

    throw new Error(`Failed to generate comprehensive analysis: ${error.message}`);
  }
}
