// Business Lens Workflow Generation Feature
// Transforms study guides into business project workflows

import { callGeminiSimple } from '../api/gemini.ts';
import { createJsonResponse, logWithContext } from '../utils.ts';
import type { ADKRequest } from '../types.ts';

/**
 * Generate Business Lens workflow from study guide content
 */
export async function generateBusinessLensWorkflow(request: ADKRequest): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  logWithContext('info', '🏢 Starting Business Lens workflow generation', {
    requestId,
    companyName: request.payload.company_name,
    companyType: request.payload.company_type
  });

  try {
    const { company_name, company_type, study_guide_text } = request.payload;

    if (!company_name || !company_type || !study_guide_text) {
      throw new Error('Missing required fields: company_name, company_type, study_guide_text');
    }

    const prompt = `You are a business transformation consultant specializing in converting technical study materials into practical business workflows.

Your task is to analyze the provided study guide and create a comprehensive business project workflow for ${company_name}, a ${company_type}.

IMPORTANT: When identifying business problems, ensure your solution directly addresses that specific problem. For example:
- If the problem is customer churn, the solution should focus on churn analysis, prediction, and retention strategies
- If the problem is operational inefficiency, the solution should focus on process optimization and automation
- If the problem is data silos, the solution should focus on data integration and unified analytics

Study Guide Content:
${study_guide_text}

Generate a JSON response with the following structure:
{
  "extracted_tools": [
    {
      "name": "Tool/Technology Name",
      "category": "Category (e.g., Cloud, Database, Framework)",
      "description": "Brief description of the tool"
    }
  ],
  "scenario": {
    "start": {
      "title": "Business Challenge Title",
      "description": "Detailed description of the business problem ${company_name} faces"
    },
    "goal": {
      "title": "Solution Goal Title", 
      "description": "Detailed description of the desired end-state solution"
    }
  },
  "workflow": {
    "phases": [
      {
        "id": "phase_id",
        "title": "Phase Title",
        "description": "Phase description",
        "tools": ["Tool1", "Tool2"]
      }
    ],
    "narrative": "A cohesive narrative describing how ${company_name} will execute this transformation using the identified tools"
  },
  "graphviz_code": "Complete Graphviz DOT code for visualizing the workflow"
}

Requirements:
1. Extract 5-15 relevant tools/technologies from the study guide
2. Create a realistic business scenario appropriate for a ${company_type}
3. Design 3-5 workflow phases that logically progress from problem to solution
4. Use ONLY the extracted tools in the workflow phases
5. Generate valid Graphviz DOT code with proper syntax
6. Ensure the narrative flows naturally and mentions specific tools
7. Make the scenario challenging but achievable
8. **CRITICAL**: The solution MUST directly address the specific problem identified in the business challenge
9. **CRITICAL**: Ensure the tools and workflow phases are specifically chosen to solve the exact problem described
10. **CRITICAL**: The solution should not be generic - it must be tailored to resolve the particular business challenge

Focus on practical business value and real-world implementation. The solution must be a direct, logical response to the problem - not a general technology implementation.`;

    logWithContext('info', '🤖 Calling Gemini for Business Lens generation');
    
    const aiResponse = await callGeminiSimple(prompt, 0.7);
    
    // Extract JSON from AI response
    let responseData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      logWithContext('error', '❌ Failed to parse AI response as JSON', {
        error: parseError,
        response: aiResponse.substring(0, 500)
      });
      throw new Error('Invalid JSON response from AI service');
    }

    // Validate required fields
    if (!responseData.extracted_tools || !responseData.scenario || !responseData.workflow) {
      throw new Error('AI response missing required fields');
    }

    const processingTime = Date.now() - startTime;
    
    logWithContext('info', '✅ Business Lens workflow generated successfully', {
      requestId,
      processingTime: `${processingTime}ms`,
      toolsCount: responseData.extracted_tools?.length || 0,
      phasesCount: responseData.workflow?.phases?.length || 0
    });

    return createJsonResponse({
      extracted_tools: responseData.extracted_tools,
      scenario: responseData.scenario,
      workflow: responseData.workflow,
      graphviz_code: responseData.graphviz_code
    }, true, 200, undefined, requestId);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    
    logWithContext('error', '❌ Business Lens workflow generation failed', {
      requestId,
      error: errorMsg,
      processingTime: `${processingTime}ms`
    });

    throw error;
  }
}