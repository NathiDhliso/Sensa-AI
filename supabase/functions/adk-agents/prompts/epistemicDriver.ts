// Epistemic Driver System Prompts
// Two-step AI processing for transforming exam objectives into strategic study maps

/**
 * Step 1: The Grouping Prompt
 * Purpose: To convert a messy list of topics into a clean, structured JSON object.
 * This is a crucial data-cleaning step that structures raw objectives.
 */
export const GROUPING_PROMPT = (objectives: string): string => `
Analyze the following list of exam objectives. Group them into a logical, nested structure.

INSTRUCTIONS:
1. Identify the main domains (e.g., "Manage Azure identities and governance (20–25%)")
2. List the specific sub-topics that belong to each domain
3. Ensure all topics are captured and properly categorized
4. Use clear, descriptive domain names

OBJECTIVES TO ANALYZE:
${objectives}

REQUIRED OUTPUT FORMAT (JSON only):
{
  "grouped_objectives": [
    {
      "domain": "Domain Name with percentage if available",
      "sub_topics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ]
}

Return ONLY the JSON object, no additional text.`;

/**
 * Step 2: The Main Analysis Prompt
 * Purpose: To analyze the structured objectives and generate the full study map.
 * Takes clean JSON from step 1 and performs comprehensive analysis.
 */
export const ANALYSIS_PROMPT = (subject: string, groupedData: any): string => `
You are an expert educational strategist creating a Strategic Study Map for: ${subject}

STRUCTURED INPUT DATA:
${JSON.stringify(groupedData, null, 2)}

CREATE A COMPREHENSIVE STUDY MAP WITH THREE PARTS:

PART 1: EPISTEMOLOGICAL DRIVERS (The "Why" - Foundation)
Generate exactly 3 points using this scaffold:
- Concept/Fact: Core foundational knowledge
- Process/Explanation: How the concepts work together  
- Implication/Application: Why this matters in practice

PART 2: LEARNING PATHS (The "How" & "So What" for each domain)
For each domain in the input data, create:

Methodology & Practice (The "How"):
- Technical Component: Core technical elements to master
- Operational Process: Step-by-step implementation approach
- Direct Result: Immediate outcomes of mastery

Application & Impact (The "So What"):
- Strategic Driver: High-level business/strategic rationale
- Execution Strategy: How to implement in real scenarios
- Business Impact: Tangible benefits and outcomes

PART 3: CONNECTING LINK
One sentence connecting the foundational "Why" to the detailed learning paths.

REQUIRED JSON FORMAT:
{
  "epistemological_drivers": {
    "pillar": "Epistemological Drivers",
    "points": [
      {"type": "Concept/Fact", "content": "..."},
      {"type": "Process/Explanation", "content": "..."},
      {"type": "Implication/Application", "content": "..."}
    ]
  },
  "learning_paths": [
    {
      "domain": "Domain name from input",
      "methodology": {
        "pillar": "Methodology & Practice",
        "points": [
          {"type": "Technical Component", "content": "..."},
          {"type": "Operational Process", "content": "..."},
          {"type": "Direct Result", "content": "..."}
        ]
      },
      "application": {
        "pillar": "Application & Impact", 
        "points": [
          {"type": "Strategic Driver", "content": "..."},
          {"type": "Execution Strategy", "content": "..."},
          {"type": "Business Impact", "content": "..."}
        ]
      }
    }
  ],
  "connecting_link": "Single sentence connecting foundation to learning paths"
}

Return ONLY the JSON object, no additional text.`;

/**
 * Quality Guidelines for Epistemic Driver Generation
 * These guidelines ensure consistent, high-quality output
 */
export const QUALITY_GUIDELINES = {
  foundation: {
    conceptFact: "Should establish core knowledge that underpins everything else",
    processExplanation: "Should explain how different concepts interconnect and work together",
    implicationApplication: "Should clarify why this knowledge matters in real-world contexts"
  },
  methodology: {
    technicalComponent: "Should identify specific technical skills, tools, or knowledge areas",
    operationalProcess: "Should outline step-by-step approaches to implementation",
    directResult: "Should specify immediate, measurable outcomes of mastery"
  },
  application: {
    strategicDriver: "Should connect to high-level business or organizational goals",
    executionStrategy: "Should provide practical approaches for real-world implementation",
    businessImpact: "Should quantify or qualify the tangible benefits and outcomes"
  },
  connectingLink: {
    purpose: "Should create a logical bridge between foundational understanding and practical application",
    length: "Should be a single, clear sentence that ties everything together",
    tone: "Should be inspiring and motivational while remaining factual"
  }
};

/**
 * Validation Rules for Generated Content
 * Used to ensure the AI output meets quality standards
 */
export const VALIDATION_RULES = {
  structure: {
    requiredFields: [
      'epistemological_drivers',
      'learning_paths', 
      'connecting_link'
    ],
    epistemologicalDrivers: {
      requiredPoints: 3,
      requiredTypes: ['Concept/Fact', 'Process/Explanation', 'Implication/Application']
    },
    learningPaths: {
      methodologyPoints: 3,
      applicationPoints: 3,
      requiredMethodologyTypes: ['Technical Component', 'Operational Process', 'Direct Result'],
      requiredApplicationTypes: ['Strategic Driver', 'Execution Strategy', 'Business Impact']
    }
  },
  content: {
    minContentLength: 50, // Minimum characters per content field
    maxContentLength: 500, // Maximum characters per content field
    connectingLinkMaxLength: 200 // Maximum length for connecting link
  }
};

/**
 * Error Messages for Validation Failures
 */
export const VALIDATION_ERRORS = {
  missingFields: "Required fields missing from AI response",
  invalidStructure: "AI response structure does not match expected format",
  insufficientContent: "Generated content is too brief to be useful",
  excessiveContent: "Generated content exceeds maximum length limits",
  missingPointTypes: "Required point types are missing from the response",
  invalidPointCount: "Incorrect number of points generated for section"
};
