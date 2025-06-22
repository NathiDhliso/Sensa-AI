// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2' // Unused for now

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

console.log("Sensa AI - Learning Sequence Mind Map Generator Online!")

interface CartographerRequest {
  field_of_study: string;
  course_syllabus: string[];
  exam_scope: string[];
  user_memory_profile: {
    memories: Array<{
      category: string;
      text: string;
    }>;
  };
}

interface SensaInsight {
  analogy: string;
  study_tip: string;
}

interface NodeData {
  node_name: string;
  sensa_insight: SensaInsight;
}

interface LearningModule {
  id: string;
  name: string;
  topics: string[];
  isFoundational: boolean;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  memoryConnections: string[];
}

class SensaLearningArchitect {
  private fieldOfStudy: string;
  private courseSyllabus: string[];
  private examScope: string[];
  private userMemories: Array<{ category: string; text: string }>;

  constructor(request: CartographerRequest) {
    this.fieldOfStudy = request.field_of_study;
    this.courseSyllabus = request.course_syllabus;
    this.examScope = request.exam_scope;
    this.userMemories = request.user_memory_profile.memories;
  }

  // Step 1: Analyze and Group topics into logical modules
  analyzeAndGroup(): LearningModule[] {
    const modules: LearningModule[] = [];
    
    // Group syllabus items by common themes and difficulty
    const foundationalKeywords = ['introduction', 'basic', 'fundamentals', 'overview', 'principles', 'foundations', 'concepts'];
    const intermediateKeywords = ['methods', 'applications', 'analysis', 'design', 'implementation', 'techniques'];
    const advancedKeywords = ['advanced', 'complex', 'optimization', 'research', 'theory', 'specialized'];

    // Create foundational module
    const foundationalTopics = this.courseSyllabus.filter(topic => 
      foundationalKeywords.some(keyword => 
        topic.toLowerCase().includes(keyword)
      )
    );
    
    if (foundationalTopics.length > 0) {
      modules.push({
        id: 'foundations',
        name: `${this.fieldOfStudy} Foundations`,
        topics: foundationalTopics,
        isFoundational: true,
        difficulty: 'basic',
        memoryConnections: []
      });
    }

    // Create core concepts module
    const coreTopics = this.courseSyllabus.filter(topic => 
      !foundationalTopics.includes(topic) && 
      !advancedKeywords.some(keyword => topic.toLowerCase().includes(keyword))
    );

    if (coreTopics.length > 0) {
      modules.push({
        id: 'core',
        name: `Core ${this.fieldOfStudy} Concepts`,
        topics: coreTopics.slice(0, Math.ceil(coreTopics.length / 2)),
        isFoundational: false,
        difficulty: 'intermediate',
        memoryConnections: []
      });
    }

    // Create applications module
    const applicationTopics = this.courseSyllabus.filter(topic =>
      intermediateKeywords.some(keyword => 
        topic.toLowerCase().includes(keyword)
      )
    );

    if (applicationTopics.length > 0) {
      modules.push({
        id: 'applications',
        name: `${this.fieldOfStudy} Applications`,
        topics: applicationTopics,
        isFoundational: false,
        difficulty: 'intermediate',
        memoryConnections: []
      });
    }

    // Create advanced module
    const advancedTopics = this.courseSyllabus.filter(topic =>
      advancedKeywords.some(keyword => 
        topic.toLowerCase().includes(keyword)
      )
    );

    if (advancedTopics.length > 0) {
      modules.push({
        id: 'advanced',
        name: `Advanced ${this.fieldOfStudy}`,
        topics: advancedTopics,
        isFoundational: false,
        difficulty: 'advanced',
        memoryConnections: []
      });
    }

    // Create exam-focused module for high-priority topics
    const examTopics = this.examScope.filter(topic => 
      !modules.some(module => module.topics.includes(topic))
    );

    if (examTopics.length > 0) {
      modules.push({
        id: 'exam_focus',
        name: 'Exam Priority Topics',
        topics: examTopics,
        isFoundational: false,
        difficulty: 'intermediate',
        memoryConnections: []
      });
    }

    return modules;
  }

  // Step 2: Sequence modules logically
  sequenceModules(modules: LearningModule[]): LearningModule[] {
    return modules.sort((a, b) => {
      // Foundational first
      if (a.isFoundational && !b.isFoundational) return -1;
      if (!a.isFoundational && b.isFoundational) return 1;
      
      // Then by difficulty
      const difficultyOrder = { 'basic': 1, 'intermediate': 2, 'advanced': 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
  }

  // Step 3: Personalize with memory connections
  personalizeWithMemories(modules: LearningModule[]): LearningModule[] {
    return modules.map(module => {
      const connections: string[] = [];
      
      module.topics.forEach(topic => {
        this.userMemories.forEach(memory => {
          if (this.findMemoryConnection(topic, memory.text)) {
            connections.push(memory.text);
          }
        });
      });
      
      return { ...module, memoryConnections: connections };
    });
  }

  // Helper to find semantic connections between topics and memories
  findMemoryConnection(topic: string, memoryText: string): boolean {
    const topicKeywords = topic.toLowerCase().split(/\s+/);
    const memoryKeywords = memoryText.toLowerCase().split(/\s+/);
    
    // Simple semantic matching - in production, this would use more sophisticated NLP
    return topicKeywords.some(keyword => 
      memoryKeywords.some(memoryWord => 
        keyword.includes(memoryWord) || memoryWord.includes(keyword) ||
        this.getSemanticSimilarity(keyword, memoryWord)
      )
    );
  }

  // Simple semantic similarity check
  getSemanticSimilarity(word1: string, word2: string): boolean {
    const synonyms: Record<string, string[]> = {
      'analysis': ['examine', 'study', 'investigate', 'research'],
      'design': ['create', 'build', 'develop', 'construct'],
      'problem': ['challenge', 'issue', 'difficulty', 'puzzle'],
      'solution': ['answer', 'resolution', 'fix', 'approach'],
      'learning': ['education', 'study', 'knowledge', 'understanding'],
      'memory': ['remember', 'recall', 'recollection', 'experience']
    };

    return Object.entries(synonyms).some(([key, values]) => 
      (word1.includes(key) && values.some(v => word2.includes(v))) ||
      (word2.includes(key) && values.some(v => word1.includes(v)))
    );
  }

  // Step 4: Generate Sensa Insights
  generateSensaInsights(modules: LearningModule[]): Record<string, NodeData> {
    const nodeData: Record<string, NodeData> = {};

    modules.forEach(module => {
      // Create insight for module
      const moduleInsight = this.createModuleInsight(module);
      nodeData[module.id] = {
        node_name: module.name,
        sensa_insight: moduleInsight
      };

      // Create insights for topics within the module
      module.topics.forEach((topic, index) => {
        const topicId = `${module.id}_topic_${index}`;
        const topicInsight = this.createTopicInsight(topic, module.memoryConnections);
        nodeData[topicId] = {
          node_name: topic,
          sensa_insight: topicInsight
        };
      });
    });

    // Add memory nodes
    this.userMemories.forEach((memory, index) => {
      const memoryId = `memory_${index}`;
      nodeData[memoryId] = {
        node_name: `Memory: ${memory.category}`,
          sensa_insight: {
          analogy: `This ${memory.category} memory serves as a bridge to academic concepts`,
          study_tip: `Use this personal experience to anchor new learning in ${this.fieldOfStudy}`
        }
      };
    });

    return nodeData;
  }

  createModuleInsight(module: LearningModule): SensaInsight {
    const analogies: Record<string, string> = {
      foundations: `Think of ${module.name} as the foundation of a skyscraper - everything else depends on these basics being solid`,
      core: `${module.name} are like the main rooms of a house - essential spaces where most of your learning happens`,
      applications: `${module.name} are like tools in a workshop - practical skills you'll use to solve real problems`,
      advanced: `${module.name} are like the specialized equipment of an expert - powerful tools for complex challenges`,
      exam_focus: `These ${module.name} are like the main attractions of a museum - the key exhibits you must see`
    };

    const studyTips: Record<string, string> = {
      foundations: `Master these fundamentals completely before moving forward - they appear in every advanced topic`,
      core: `Connect each concept to the others - they work together like a system`,
      applications: `Practice these through hands-on projects and real-world examples`,
      advanced: `Break down complex topics into smaller parts and build up your understanding gradually`,
      exam_focus: `Prioritize these topics in your study schedule - they carry the most weight in assessments`
    };

    return {
      analogy: analogies[module.id] || `Think of this as a key component in your ${this.fieldOfStudy} journey`,
      study_tip: studyTips[module.id] || `Focus on understanding the connections between these concepts`
    };
  }

  createTopicInsight(topic: string, memoryConnections: string[]): SensaInsight {
    let analogy = `Think of ${topic} as a puzzle piece that fits into the bigger picture of ${this.fieldOfStudy}`;
    let studyTip = `Practice this concept through examples and connect it to what you already know`;

    // Personalize with memory connections if available
    if (memoryConnections.length > 0) {
      const connection = memoryConnections[0];
      analogy = `Like your experience with "${connection.substring(0, 50)}...", ${topic} follows similar patterns of thinking`;
      studyTip = `Use your memory of "${connection.substring(0, 30)}..." to help understand ${topic} - look for the parallels`;
    }

    return { analogy, study_tip: studyTip };
  }

  // Step 5: Generate Mermaid code
  generateMermaidCode(modules: LearningModule[]): string {
    let mermaidCode = "flowchart TD\n";
    
    // Start node
    mermaidCode += `    Start([🎯 ${this.fieldOfStudy}<br/>Learning Journey]) --> Prerequisites{Prerequisites<br/>Complete?}\n`;
    
    let previousModuleId = "Prerequisites";
    
    modules.forEach((module) => {
      const moduleId = module.id;
      
      // Module node
      const moduleShape = module.isFoundational ? 
        `${moduleId}[📚 ${module.name}]` : 
        `${moduleId}[⚡ ${module.name}]`;
      
      mermaidCode += `    ${previousModuleId} --> ${moduleShape}\n`;
      
      // Add topic nodes within module
      module.topics.forEach((topic, topicIndex) => {
        const topicId = `${moduleId}_topic_${topicIndex}`;
        const topicShape = `${topicId}["${topic}"]`;
        mermaidCode += `    ${moduleId} --> ${topicShape}\n`;
        
        // Connect to memory if there are connections
        if (module.memoryConnections.length > topicIndex) {
          const memoryId = `memory_${topicIndex}`;
          const memoryShape = `${memoryId}(("💭 Personal<br/>Memory"))`;
          mermaidCode += `    ${memoryShape} -.->|"bridges to"| ${topicShape}\n`;
        }
      });
      
      previousModuleId = moduleId;
    });
    
    // End node
    mermaidCode += `    ${previousModuleId} --> Complete([🎓 ${this.fieldOfStudy}<br/>Mastery Achieved])\n`;
    
    // Add styling
    mermaidCode += `
    classDef foundational fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef intermediate fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef advanced fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef memory fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef milestone fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    
    class Start,Complete milestone
    class Prerequisites foundational`;

    // Apply module classes
    modules.forEach(module => {
      const className = module.difficulty === 'basic' ? 'foundational' : 
                      module.difficulty === 'intermediate' ? 'intermediate' : 'advanced';
      mermaidCode += `\n    class ${module.id} ${className}`;
    });

    return mermaidCode;
  }

  generateLegendHTML(): string {
    return `
      <div class="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <h3 class="font-bold text-lg text-purple-800 mb-3">🗺️ Learning Sequence Map Guide</h3>
        
        <div class="space-y-3">
          <div class="flex items-center space-x-3">
            <div class="w-6 h-6 rounded-lg bg-blue-100 border-2 border-blue-600 flex items-center justify-center">
              <span class="text-xs">📚</span>
            </div>
            <span class="text-sm text-gray-700"><strong>Foundational Modules</strong> - Essential building blocks</span>
          </div>
          
          <div class="flex items-center space-x-3">
            <div class="w-6 h-6 rounded-lg bg-purple-100 border-2 border-purple-600 flex items-center justify-center">
              <span class="text-xs">⚡</span>
            </div>
            <span class="text-sm text-gray-700"><strong>Core Modules</strong> - Main learning areas</span>
          </div>
          
          <div class="flex items-center space-x-3">
            <div class="w-6 h-6 rounded-lg bg-orange-100 border-2 border-orange-600 flex items-center justify-center">
              <span class="text-xs">🔬</span>
            </div>
            <span class="text-sm text-gray-700"><strong>Advanced Topics</strong> - Specialized knowledge</span>
          </div>
          
          <div class="flex items-center space-x-3">
            <div class="w-6 h-6 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center">
              <span class="text-xs">💭</span>
            </div>
            <span class="text-sm text-gray-700"><strong>Your Memories</strong> - Personal learning bridges</span>
          </div>
          
          <div class="flex items-center space-x-3">
            <div class="w-6 h-6 rounded-full bg-yellow-100 border-2 border-yellow-600 flex items-center justify-center">
              <span class="text-xs">🎯</span>
            </div>
            <span class="text-sm text-gray-700"><strong>Milestones</strong> - Key achievement points</span>
          </div>
        </div>
        
        <div class="mt-4 p-3 bg-white rounded border-l-4 border-purple-500">
          <p class="text-sm text-gray-600">
            <strong>🧠 Sensa Insight:</strong> This map shows your personalized learning sequence, 
            connecting course topics to your memories for deeper understanding and better retention.
          </p>
        </div>
      </div>
    `;
  }

  // Main generation method
  generateLearningSequenceMindMap() {
    console.log("🎯 Analyzing course syllabus and grouping topics...");
    const modules = this.analyzeAndGroup();
    
    console.log("📋 Sequencing modules for optimal learning flow...");
    const sequencedModules = this.sequenceModules(modules);
    
    console.log("🧠 Personalizing with memory connections...");
    const personalizedModules = this.personalizeWithMemories(sequencedModules);
    
    console.log("✨ Generating Sensa insights and connections...");
    const nodeData = this.generateSensaInsights(personalizedModules);
    
    console.log("🗺️ Constructing Mermaid visualization code...");
    const mermaidCode = this.generateMermaidCode(personalizedModules);
    
    console.log("🎨 Creating visual legend...");
    const legendHTML = this.generateLegendHTML();

    return {
      mermaid_code: mermaidCode,
      node_data: nodeData,
      legend_html: legendHTML
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("🚀 Sensa AI Learning Architect activated!");
    
    const request: CartographerRequest = await req.json();
    
    console.log(`📚 Processing ${request.field_of_study} with ${request.course_syllabus.length} topics`);
    console.log(`🧠 Integrating ${request.user_memory_profile.memories.length} personal memories`);
    
    const architect = new SensaLearningArchitect(request);
    const studyMap = architect.generateLearningSequenceMindMap();
    
    console.log("✅ Learning Sequence Mind Map generated successfully!");

    return new Response(
      JSON.stringify(studyMap),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Sensa Learning Architect error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate Learning Sequence Mind Map';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'The Sensa AI Learning Architect encountered an issue while processing your request.'
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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/mermaid-cartographer' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{
      "field_of_study": "Computer Science",
      "course_syllabus": ["Introduction to Programming", "Data Structures", "Algorithms", "Database Design", "Web Development"],
      "exam_scope": ["Programming Fundamentals", "Algorithm Analysis"],
      "user_memory_profile": {
        "memories": [
          {"category": "Problem Solving", "text": "I remember solving complex puzzles as a child"},
          {"category": "Building", "text": "I used to build elaborate structures with blocks"}
        ]
      }
    }'

*/
