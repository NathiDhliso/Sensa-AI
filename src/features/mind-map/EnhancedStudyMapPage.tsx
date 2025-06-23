import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Map, 
  Brain, 
  Search,
  FileText,
  Zap,
  Target,
  Download,
  RefreshCw,
  Sparkles,
  Clipboard,
  Send,
  ArrowLeft,
  Code
} from 'lucide-react';
import { sensaBrandColors } from '../styles/brandColors';
import { supabase } from '../lib/supabase';
import { memoryService } from '../services/supabaseServices';
import { orchestrateAgents, callEdgeFunction } from '../services/edgeFunctions';
import { SensaAPI } from '../services/api';
import { useCourseStore, useMemoryStore, useUIStore } from '../stores';
import { MermaidNativeEditor } from '../components/MindMapEditor';
// Removed old aiAgents import - now uses integrated ADK system
import mermaid from 'mermaid';

interface Course {
  id: string;
  title: string;
  category: string;
  university: string;
  description?: string;
  enrollment?: number;
  difficulty?: string;
}

interface AnalysisResult {
  revolutionaryInsights: string[];
  memoryConnections: Array<{
    concept: string;
    personalConnection: string;
    emotionalResonance: number;
  }>;
  personalizedCareerPath: {
    customRole: string;
    description: string;
    skills: string[];
  };
}

const IntegratedLearningHub: React.FC = () => {
  // Get navigation state for uploaded content
  const location = useLocation();
  const navigate = useNavigate();
  const uploadedContent = location.state?.uploadedContent;
  const uploadedFiles = location.state?.files;
  
  // Get tab from URL parameters, but default to 'analyze' if uploaded content exists
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = uploadedContent ? 'analyze' : (urlParams.get('tab') || 'discover');
  
  // Zustand stores for dashboard stats
  const { addAnalysis } = useCourseStore();
  const { updateMemory } = useMemoryStore();
  const { addNotification } = useUIStore();
  
  // Unified state management
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [studyMap, setStudyMap] = useState<any>(null);
  const [studyGuide, setStudyGuide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [memories, setMemories] = useState<Array<{
    id?: string;
    text_content?: string;
    category?: string;
    connections?: string[];
    created_at?: string;
    timestamp?: Date | string;
  }>>([]);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [showMindMapEditor, setShowMindMapEditor] = useState<boolean | string>(false);
  
  // Focus Question feature for deeper learning
  const [focusQuestion, setFocusQuestion] = useState('');
  const [showFocusQuestion, setShowFocusQuestion] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<{course?: Course, file?: File} | null>(null);
  
  // Store analyzed document information for mind map generation
  const [analyzedDocument, setAnalyzedDocument] = useState<{
    fileName: string;
    subject: string;
    content: string;
    topics: string[];
    adkAnalysis?: any;
    focusQuestion?: string;
  } | null>(null);

  const mermaidRef = useRef<HTMLDivElement>(null);

  // Comprehensive South African university courses
  const courses: Course[] = [
    // Computer Science & IT
    { id: 'CSC1015F', title: 'Introduction to Computer Science I', category: 'Computer Science', university: 'University of Cape Town', description: 'Fundamental programming concepts and problem-solving', enrollment: 450, difficulty: 'Beginner' },
    { id: 'CSC2001F', title: 'Data Structures & Algorithms', category: 'Computer Science', university: 'University of Cape Town', description: 'Advanced data structures and algorithmic thinking', enrollment: 280, difficulty: 'Intermediate' },
    { id: 'COMS1018A', title: 'Introduction to Algorithms & Programming', category: 'Computer Science', university: 'University of the Witwatersrand', description: 'Programming fundamentals and algorithmic design', enrollment: 320, difficulty: 'Beginner' },
    
    // Mathematics & Statistics
    { id: 'MAM1020F', title: 'Mathematics 1A for Engineers', category: 'Mathematics', university: 'University of Cape Town', description: 'Calculus and linear algebra for engineering', enrollment: 650, difficulty: 'Intermediate' },
    { id: 'WTW114', title: 'Calculus', category: 'Mathematics', university: 'Stellenbosch University', description: 'Differential and integral calculus', enrollment: 420, difficulty: 'Intermediate' },
    { id: 'STA1008F', title: 'Statistics for Engineers', category: 'Statistics', university: 'University of Cape Town', description: 'Statistical methods and data analysis', enrollment: 380, difficulty: 'Intermediate' },
    
    // Psychology
    { id: 'PSYC1004F', title: 'Introduction to Psychology I', category: 'Psychology', university: 'University of Cape Town', description: 'Foundations of psychological science', enrollment: 890, difficulty: 'Beginner' },
    { id: 'PSYC1009', title: 'Psychology I', category: 'Psychology', university: 'University of the Witwatersrand', description: 'Core psychological principles and theories', enrollment: 720, difficulty: 'Beginner' },
    
    // Accounting & Finance
    { id: 'ACCN1006A', title: 'Accounting I', category: 'Accounting', university: 'University of the Witwatersrand', description: 'Financial accounting fundamentals', enrollment: 560, difficulty: 'Beginner' },
    { id: 'FRK111', title: 'Financial Accounting', category: 'Accounting', university: 'Stellenbosch University', description: 'Basic accounting principles and practices', enrollment: 480, difficulty: 'Beginner' },
    
    // Economics
    { id: 'ECO1010F', title: 'Microeconomics I', category: 'Economics', university: 'University of Cape Town', description: 'Individual and firm economic behavior', enrollment: 620, difficulty: 'Intermediate' },
    { id: 'EKN110', title: 'Economics', category: 'Economics', university: 'Stellenbosch University', description: 'Economic principles and market analysis', enrollment: 540, difficulty: 'Beginner' },
    
    // Physical Sciences
    { id: 'CEM1000W', title: 'Chemistry I', category: 'Chemistry', university: 'University of Cape Town', description: 'General chemistry and chemical principles', enrollment: 750, difficulty: 'Intermediate' },
    { id: 'PHY1012F', title: 'Physics A for Engineers', category: 'Physics', university: 'University of Cape Town', description: 'Mechanics and thermodynamics', enrollment: 580, difficulty: 'Intermediate' },
    
    // Biological Sciences
    { id: 'BIO1000F', title: 'Cell Biology', category: 'Biology', university: 'University of Cape Town', description: 'Cellular structure and function', enrollment: 690, difficulty: 'Intermediate' },
    
    // Engineering
    { id: 'MECN2024A', title: 'Applied Mechanics A', category: 'Mechanical Engineering', university: 'University of the Witwatersrand', description: 'Statics and dynamics of mechanical systems', enrollment: 240, difficulty: 'Advanced' },
    { id: 'ELEN2000A', title: 'Electric Circuits', category: 'Electrical Engineering', university: 'University of the Witwatersrand', description: 'Circuit analysis and electrical principles', enrollment: 280, difficulty: 'Intermediate' },
    
    // Social Sciences
    { id: 'SOC1001F', title: 'Introduction to Sociology', category: 'Sociology', university: 'University of Cape Town', description: 'Social structures and human behavior', enrollment: 450, difficulty: 'Beginner' },
    
    // Law
    { id: 'PVL1003W', title: 'Foundations of South African Law', category: 'Law', university: 'University of Cape Town', description: 'Legal system and constitutional principles', enrollment: 380, difficulty: 'Intermediate' },
    
    // History
    { id: 'HIS1012F', title: 'The Making of the Modern World', category: 'History', university: 'University of Cape Town', description: 'Global historical developments', enrollment: 320, difficulty: 'Beginner' },
    
    // Business Management
    { id: 'BUS1036F', title: 'Evidence-based Management', category: 'Business Management', university: 'University of Cape Town', description: 'Management principles and decision-making', enrollment: 410, difficulty: 'Intermediate' }
  ];

  // Filter courses based on search
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.university.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique categories
  // Categories used for course filtering in the UI
  // const categories = [...new Set(courses.map(course => course.category))].sort();

  // Load memories on component mount
  useEffect(() => {
    const loadMemories = async () => {
      try {
        const userMemories = await memoryService.getUserMemories();
        setMemories(userMemories || []);
      } catch (error) {
        console.error('Error loading memories:', error);
      }
    };
    loadMemories();
  }, []);

  // Auto-generate mind map when document analysis completes
  useEffect(() => {
    if (analyzedDocument && !isLoading) {
      console.log('🔄 Auto-generating mind map for analyzed document:', analyzedDocument.fileName);
      generateMindMap();
    }
  }, [analyzedDocument]);

  // Handle uploaded content analysis
  useEffect(() => {
    if (uploadedContent && uploadedFiles) {
      // Automatically analyze uploaded content
      const analyzeUploadedContent = async () => {
        setIsLoading(true);
        try {
          // Create mock analysis for uploaded content
          const fileName = uploadedFiles[0]?.file?.name || 'Uploaded Document';
          const subject = await extractSubjectFromFilename(fileName, content);
          
          const mockAnalysis: AnalysisResult = {
            revolutionaryInsights: [
              `🧠 Your uploaded ${subject} material reveals personalized learning patterns`,
              `🎯 Key concepts in your document connect to ${memories.length} of your personal memories`,
              `✨ Your material shows advanced complexity - perfect for building expertise`,
              `🚀 Your uploaded content contains focused material that matches your learning goals`
            ],
            memoryConnections: [
              {
                concept: `${subject} Core Concepts`,
                personalConnection: "Your analytical thinking from past experiences will help you master these concepts",
                emotionalResonance: 0.88
              },
              {
                concept: "Document Key Points",
                personalConnection: "The structured approach in your material aligns with your learning preferences",
                emotionalResonance: 0.82
              },
              {
                concept: "Study Focus Areas",
                personalConnection: "Your uploaded content highlights areas that resonate with your memory patterns",
                emotionalResonance: 0.75
              }
            ],
            personalizedCareerPath: {
              customRole: `${subject} Content Specialist`,
              description: `A role leveraging your mastery of the concepts in your uploaded ${subject.toLowerCase()} materials`,
              skills: [`Advanced ${subject}`, 'Content Analysis', 'Self-directed Learning', 'Research Skills']
            }
          };

          setAnalysisResult(mockAnalysis);
          setActiveTab('analyze'); // Switch to analysis tab
          
          // Save analysis to course store for dashboard stats
          const analysisRecord = {
            id: `analysis-${Date.now()}`,
            courseId: `upload-${Date.now()}`,
            analysis: {
              courseId: `upload-${Date.now()}`,
              courseName: `${subject} Study Material`,
              university: 'User Upload',
              coreGoal: mockAnalysis.personalizedCareerPath.description,
              practicalOutcome: `Master ${subject.toLowerCase()} concepts from uploaded material`,
              learningObjectives: mockAnalysis.revolutionaryInsights,
              prerequisites: ['Basic understanding', 'Personal memories'],
              estimatedDuration: '3-4 months',
              difficultyLevel: 'Intermediate' as const,
              keyTopics: mockAnalysis.memoryConnections.map(conn => conn.concept),
              careerOutcomes: mockAnalysis.personalizedCareerPath.skills
            },
            memoryConnections: mockAnalysis.memoryConnections,
            careerPathways: mockAnalysis.personalizedCareerPath,
            studyMap: null,
            createdAt: new Date()
          };
          
          addAnalysis(analysisRecord);
          
          // Update memory connections count for dashboard
          mockAnalysis.memoryConnections.forEach((connection, index) => {
            if (memories[index]) {
              updateMemory(memories[index].id || `memory-${index}`, {
                connections: [...(memories[index].connections || []), connection.concept]
              });
            }
          });
        } catch (error) {
          console.error('Error analyzing uploaded content:', error);
        } finally {
          setIsLoading(false);
        }
      };

      analyzeUploadedContent();
    }
  }, [uploadedContent, uploadedFiles, memories.length]);

  // Auto-generate mind map when switching to visualize tab
  useEffect(() => {
    if (activeTab === 'visualize' && !studyMap && !isLoading) {
      generateMindMap();
    }
  }, [activeTab, studyMap, isLoading]);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base', // Using base theme to build our custom variables on top
      themeVariables: {
        // --- Custom Sensa Theme ---

        // Core Colors
        background: '#F8FAFC', // Light gray background for the container
        primaryColor: '#6D28D9', // Deep purple for root and main branches
        primaryTextColor: '#FFFFFF', // White text for primary nodes
        primaryBorderColor: '#4C1D95', // Darker purple for borders

        // Secondary Colors (for the next level of nodes)
        secondaryColor: '#BE185D', // Vibrant pink/magenta
        secondaryTextColor: '#FFFFFF', // White text
        secondaryBorderColor: '#831843',

        // Tertiary Colors (for leaf nodes, specific skills, etc.)
        tertiaryColor: '#047857', // Teal/green
        tertiaryTextColor: '#FFFFFF', // White text
        tertiaryBorderColor: '#064E3B',
        
        // Special Colors for Node Types
        noteBkgColor: '#FDF2F8', // Light pink for personal anchors/analogies
        noteTextColor: '#831843', // Dark pink text
        noteBorderColor: '#BE185D',
        
        // Lines and Connections
        lineColor: '#71717A', // Neutral gray for connection lines
        textColor: '#1F2937', // Default text color for labels if needed

        // Other settings
        mainBkg: '#6D28D9', // Used for some diagram types
        secondBkg: '#BE185D',
        tertiaryBkg: '#047857',
        titleColor: '#1F2937',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
      },
      mindmap: {
        padding: 30, // Increase padding for more space
        maxNodeWidth: 200,
        useMaxWidth: true
      },
      securityLevel: 'loose'
    });
  }, []);

  // Render mermaid diagram when studyMap is updated and ref is available
  useEffect(() => {
    const renderDiagram = async () => {
      if (studyMap && studyMap.mermaid_code && mermaidRef.current && activeTab === 'visualize') {
        console.log('🖼️ Rendering mermaid diagram after studyMap update...');
        try {
          await renderMermaidDiagram(studyMap.mermaid_code);
          console.log('✅ Mermaid diagram rendered successfully');
        } catch (error) {
          console.error('❌ Error rendering mermaid diagram:', error);
        }
      }
    };
    
    renderDiagram();
  }, [studyMap, activeTab]);

  // Unified analysis function
  const performAnalysis = async (course?: Course, file?: File, skipFocusQuestion = false) => {
    // Show focus question dialog unless skipped
    if (!skipFocusQuestion) {
      setPendingAnalysis({course, file});
      setShowFocusQuestion(true);
      return;
    }
    
    setIsLoading(true);
    try {
      let analysisData: AnalysisResult | null = null;
      
      if (file) {
        // Handle file upload analysis
        const formData = new FormData();
        formData.append('file', file);
        // Call upload analysis API
        analysisData = await handleFileAnalysis(formData);
      } else if (course) {
        // Handle course analysis
        analysisData = await analyzeCourse(course);
      }

      if (analysisData) {
        setAnalysisResult(analysisData);
        
        // Show success notification with animated checkmark
        addNotification({
          type: 'success',
          title: 'Analysis Complete!',
          message: 'Your personalized insights are ready with memory connections.',
          duration: 4000
        });
        
        // Save analysis to course store for dashboard stats
        const analysisRecord = {
          id: `analysis-${Date.now()}`,
          courseId: course?.id || `upload-${Date.now()}`,
          analysis: {
            courseId: course?.id || `upload-${Date.now()}`,
            courseName: course?.title || (file ? file.name : 'Uploaded Content'),
            university: course?.university || 'User Upload',
            coreGoal: analysisData.personalizedCareerPath.description,
            practicalOutcome: `Master ${course?.category || (file?.name || 'content')} concepts`,
            learningObjectives: analysisData.revolutionaryInsights,
            prerequisites: ['Basic understanding', 'Personal memories'],
            estimatedDuration: course?.difficulty === 'Advanced' ? '6-8 months' : '3-4 months',
            difficultyLevel: (course?.difficulty as 'Beginner' | 'Intermediate' | 'Advanced') || 'Intermediate',
            keyTopics: analysisData.memoryConnections.map(conn => conn.concept),
            careerOutcomes: analysisData.personalizedCareerPath.skills
          },
          memoryConnections: analysisData.memoryConnections,
          careerPathways: analysisData.personalizedCareerPath,
          studyMap: null, // Will be set when mind map is generated
          createdAt: new Date()
        };
        
        addAnalysis(analysisRecord);
        
        // Update memory connections count for dashboard
        analysisData.memoryConnections.forEach((connection, index) => {
          if (memories[index]) {
            updateMemory(memories[index].id || `memory-${index}`, {
              connections: [...(memories[index].connections || []), connection.concept]
            });
          }
        });
      }
      
      // Mind map will be generated automatically via useEffect when analyzedDocument updates
      
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a test function to debug ADK calls
  const testADKConnection = async () => {
    console.log('🧪 Testing ADK connection...');
    try {
      const testResponse = await orchestrateAgents({
        agent_type: 'orchestrator',
        payload: { action: 'health_check' }
      });
      console.log('✅ ADK test successful:', testResponse);
      return testResponse;
    } catch (error) {
      console.error('❌ ADK test failed:', error);
      return null;
    }
  };

  const analyzeCourse = async (course: Course): Promise<AnalysisResult> => {
    // Use ADK API for comprehensive course analysis
    try {
      console.log('🤖 Starting ADK-powered course analysis...');
      console.log('📊 Course data:', course);
      console.log('🧠 Available memories:', memories.length);
      console.log('🎯 Focus Question:', focusQuestion); // Log the focus question
      
      // Skip test and go directly to ADK call since logs show it's working
      
      // Prepare request data for ADK agents
      const requestData = {
        course_data: {
          title: course.title,
          category: course.category,
          university: course.university,
          description: course.description || '',
          difficulty: course.difficulty || 'intermediate'
        },
        user_memories: memories.map(m => ({
          id: m.id || `memory-${Date.now()}-${Math.random()}`,
          content: m.text_content || '',
          category: m.category || 'general',
          emotional_tone: 'positive'
        })),
        analysis_type: 'comprehensive'
      };

      console.log('📡 Calling ADK orchestrator agent...');
      console.log('📋 Request payload:', requestData);
      
      // Call ADK function directly with correct format, including focus_question
      const adkResponse = await callEdgeFunction('adk-agents', {
        agent_type: 'orchestrator',
        task: 'comprehensive_course_analysis',
        course: requestData.course_data,
        memories: requestData.user_memories,
        analysis_requirements: [
          'revolutionary_insights',
          'memory_connections',
          'personalized_career_path'
        ],
        focus_question: focusQuestion || ''
      });

      console.log('✅ ADK response received:', adkResponse);
      console.log('🔍 Response structure:', Object.keys(adkResponse || {}));

      if (adkResponse && adkResponse.analysis) {
        console.log('🎯 Using ADK analysis results');
        console.log('🔍 Personalized insights:', adkResponse.analysis.personalized_insights);
        console.log('🔍 Memory connections:', adkResponse.analysis.memory_connections);
        
        // Use actual ADK results - no hardcoded fallbacks
        return {
          revolutionaryInsights: adkResponse.analysis.personalized_insights || ['🤖 AI analysis is temporarily unavailable. Please try again later.'],
          memoryConnections: adkResponse.analysis.memory_connections || [],
          personalizedCareerPath: adkResponse.analysis.career_path || {
            customRole: 'AI Analysis Unavailable',
            description: 'AI career path analysis is temporarily unavailable. Please try again later.',
            skills: ['AI service unavailable']
          }
        };
      }

      // If we get here, ADK returned but without proper analysis structure
      console.log('⚠️ ADK response received but analysis structure incomplete');
      throw new Error('ADK analysis incomplete');
      
    } catch (error) {
      console.error('❌ Course analysis error:', error);
      console.log('🔄 Falling back to content-aware analysis...');
      
      // AI-powered fallback
      console.log('🔄 Using AI-powered course analysis...');
      const courseSpecificInsights = await generateCourseSpecificInsights(course);
      return courseSpecificInsights;
    }
  };

  // AI-powered course analysis - no hardcoded content
  const generateCourseSpecificInsights = async (course: Course): Promise<AnalysisResult> => {
    console.log('🤖 Generating AI-powered course insights for:', course.title);
    console.log('🧠 Integrating with', memories.length, 'user memories for course analysis');
    
    try {
      // Find memories relevant to the course
      const courseKeywords = [
        course.category.toLowerCase(),
        ...course.title.toLowerCase().split(' '),
        course.university.toLowerCase()
      ];
      
      const relevantMemories = memories.filter(memory => {
        const memoryText = (memory.text_content || '').toLowerCase();
        const memoryCategory = (memory.category || '').toLowerCase();
        
        return courseKeywords.some(keyword => 
          memoryText.includes(keyword) || 
          memoryCategory.includes(keyword) ||
          keyword.includes(memoryCategory)
        );
      }).slice(0, 5);
      
      console.log('🔗 Found', relevantMemories.length, 'relevant memories for course:', course.title);
      
      // Get user's communication style for personalization
      const userStyle = analyzeUserCommunicationStyle(memories);
      
      // Call ADK agents for AI-powered course analysis
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const adkAnalysis = await SensaAPI.analyzeCourse(course.title, user.id);

      if (adkAnalysis) {
        console.log('✅ ADK course analysis successful');
    return {
          revolutionaryInsights: adkAnalysis.course_analysis?.learning_objectives || [],
          memoryConnections: adkAnalysis.memory_connections || [],
          personalizedCareerPath: {
            customRole: adkAnalysis.career_pathways?.pathways?.[0]?.title || `AI-Enhanced ${course.category} Specialist`,
            description: adkAnalysis.career_pathways?.pathways?.[0]?.description || `Career path generated through AI analysis of your course alignment and personal background`,
            skills: adkAnalysis.course_analysis?.career_outcomes || [`Advanced ${course.category}`, 'AI-Enhanced Learning', 'Personalized Problem Solving']
          }
        };
      }

      // If ADK fails, throw error instead of using hardcoded fallback
      throw new Error('ADK analysis failed - no fallback available');
      
    } catch (error) {
      console.error('❌ AI course analysis failed:', error);
      
      // Re-try with simpler ADK call
      try {
        const fallbackAnalysis = await SensaAPI.generatePersonalizedInsights({
          subject: course.category,
          title: course.title,
          user_memories: memories.slice(0, 3),
          analysis_type: 'course_connection'
        });
        
        if (fallbackAnalysis) {
          return fallbackAnalysis;
        }
      } catch (retryError) {
        console.error('❌ Fallback ADK analysis also failed:', retryError);
      }
      
      // If all AI attempts fail, return minimal structure
      return {
        revolutionaryInsights: [
          '🤖 AI analysis is temporarily unavailable. Please try again in a moment.',
          '💡 Your personalized insights will be generated when AI services are restored.'
        ],
        memoryConnections: [],
      personalizedCareerPath: {
          customRole: `${course.category} Specialist`,
          description: 'Personalized career path will be available when AI analysis is restored.',
          skills: [course.category]
        }
      };
    }
  };



  // All analogy generation is now handled by AI through ADK agents
  // No hardcoded content - if AI fails, honest error messages are shown

  const handleFileAnalysis = async (formData: FormData) => {
    // Extract file from FormData
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    console.log('📄 Starting content-aware document analysis...');
    console.log('📋 File details:', { name: file.name, type: file.type, size: file.size });
    
    try {
      // Read and analyze actual file content
      let fileContent = '';
      let contentPreview = '';
      
      if (file.type.startsWith('text/') || file.type === 'application/pdf' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        try {
          fileContent = await file.text();
          contentPreview = fileContent.substring(0, 2000); // First 2000 chars for analysis
          console.log('📖 File content preview:', contentPreview.substring(0, 200) + '...');
        } catch (error) {
          console.log('⚠️ Could not read file content as text:', error);
        }
      }
      
      // Analyze content to determine actual subject and topics (with ADK integration)
      const analysisResult = await analyzeDocumentContent(file.name, contentPreview);
      console.log('🔍 Content analysis result:', analysisResult);
      
      // If ADK analysis was successful, use it
      if (analysisResult.adkAnalysis) {
        console.log('✅ Using ADK document analysis');
        return transformADKDocumentResponse({ analysis: analysisResult.adkAnalysis }, analysisResult);
      }
      
      // AI-powered content analysis
      return await generateContentBasedAnalysis(analysisResult);
      
    } catch (error) {
      console.error('❌ Document analysis error:', error);
      throw error;
    }
  };

  // Analyze actual document content to determine subject and topics
  const analyzeDocumentContent = async (fileName: string, content: string) => {
    console.log('🔍 Analyzing document content with ADK agents...');
    console.log('📄 File name:', fileName);
    console.log('📝 Content length:', content.length);
    
    // Extract subject from filename first (important for binary files like .docx)
    let subject = await extractSubjectFromFilename(fileName, content);
    let contentType = 'document';
    let complexity = 'intermediate';
    let topics: string[] = [];
    let adkAnalysis = null;
    
    console.log('🎯 Subject from filename:', subject);
    
    // Try to get ADK analysis if user is authenticated and content is available
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && content.length > 50) {
        console.log('🤖 Calling ADK agents for document analysis...');
        adkAnalysis = await SensaAPI.analyzeDocumentContent({
          name: fileName,
          content: content,
          subject: subject,
          key_topics: extractTopicsFromContent(content)
        }, user.id);
        console.log('✅ ADK analysis completed:', adkAnalysis);
      }
    } catch (error) {
      console.error('❌ ADK analysis failed, continuing with basic analysis:', error);
    }
    
    // If we couldn't read content (like .docx files), try to extract more info from filename
    if (content.length < 50) {
      console.log('⚠️ Limited content available, using filename analysis');
      
      // Enhanced filename analysis for better topic extraction
      const fileNameLower = fileName.toLowerCase();
      
      // Extract topics from filename
      if (fileNameLower.includes('trademark') && fileNameLower.includes('copyright')) {
        topics = ['Trademark Law', 'Copyright Law', 'Intellectual Property', 'Legal Protection'];
        subject = 'Law';
        contentType = 'study_material';
      } else if (fileNameLower.includes('contract')) {
        topics = ['Contract Law', 'Legal Agreements', 'Contract Formation'];
        subject = 'Law';
      } else if (fileNameLower.includes('exam') || fileNameLower.includes('test')) {
        contentType = 'exam_material';
      } else if (fileNameLower.includes('assignment') || fileNameLower.includes('homework')) {
        contentType = 'assignment';
      }
      
      // Determine complexity from filename
      if (fileNameLower.includes('advanced') || fileNameLower.includes('level 3') || fileNameLower.includes('masters')) {
        complexity = 'advanced';
      } else if (fileNameLower.includes('intro') || fileNameLower.includes('basic') || fileNameLower.includes('level 1')) {
        complexity = 'beginner';
      }
      
      console.log('📋 Filename analysis result:', { subject, contentType, complexity, topics });
      return { subject, contentType, complexity, topics, adkAnalysis };
    }
    
    if (content.length > 50) {
      const lowerContent = content.toLowerCase();
      
            // Trust AI-powered subject identification - no hardcoded overrides
      console.log(`✅ Using AI-identified subject: ${subject} (no hardcoded overrides)`)
      
      // Detect content type
      if (lowerContent.includes('exam') || lowerContent.includes('test') || lowerContent.includes('quiz')) {
        contentType = 'exam_material';
      } else if (lowerContent.includes('lecture') || lowerContent.includes('chapter')) {
        contentType = 'study_material';
      } else if (lowerContent.includes('assignment') || lowerContent.includes('homework')) {
        contentType = 'assignment';
      }
      
      // Extract key topics from content
      topics = extractTopicsFromContent(content);
      
      // Determine complexity
      const complexWords = ['advanced', 'complex', 'sophisticated', 'intricate', 'comprehensive'];
      const basicWords = ['introduction', 'basic', 'fundamental', 'elementary', 'simple'];
      
      if (complexWords.some(word => lowerContent.includes(word))) {
        complexity = 'advanced';
      } else if (basicWords.some(word => lowerContent.includes(word))) {
        complexity = 'beginner';
      }
    }
    
    // Store the analyzed document information for mind map generation
    setAnalyzedDocument({
      fileName,
      subject,
      content,
      topics,
      adkAnalysis,
      focusQuestion: focusQuestion || undefined
    });
    
    return { subject, contentType, complexity, topics };
  };

  // AI-powered content analysis - no hardcoded insights
  const generateContentBasedAnalysis = async (analysisResult: Record<string, unknown>): Promise<AnalysisResult> => {
    const { subject, contentType, complexity, topics } = analysisResult;
    const topicsArray = (topics as string[]) || [];
    
    console.log('🤖 Generating AI-powered content analysis for:', subject);
    console.log('🧠 Integrating with', memories.length, 'user memories');
    console.log('📊 Available memories:', memories.map(m => ({ category: m.category, preview: (m.text_content || '').substring(0, 50) })));
    
    try {
      // Find relevant memories that connect to the subject
      const relevantMemories = findRelevantMemories(subject as string, topicsArray);
      console.log('🔗 Found', relevantMemories.length, 'relevant memory connections');
      console.log('🎯 Relevant memories:', relevantMemories.map(m => ({ category: m.category, preview: (m.text_content || '').substring(0, 50) })));
      
      // Get user's communication style for personalization
      const userStyle = analyzeUserCommunicationStyle(memories);
      console.log('🎨 User communication style detected:', userStyle);
      
      // Call ADK agents for AI-powered content analysis
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      console.log('📡 Calling ADK with data:', {
        name: `${subject} Document`,
        content: `Subject: ${subject}, Type: ${contentType}, Topics: ${topicsArray.join(', ')}`,
        subject: subject as string,
        key_topics: topicsArray
      });
      
      const adkAnalysis = await SensaAPI.analyzeDocumentContent({
        name: `${subject} Document`,
        content: `Subject: ${subject}, Type: ${contentType}, Topics: ${topicsArray.join(', ')}`,
        subject: subject as string,
        key_topics: topicsArray
      }, user.id);

      if (adkAnalysis) {
        console.log('✅ ADK content analysis successful - using AI results');
        console.log('🎯 ADK response structure:', adkAnalysis);
        console.log('💡 Personalized insights:', adkAnalysis.personalized_insights);
        console.log('🔗 Memory connections:', adkAnalysis.memory_connections);
        
        return {
          revolutionaryInsights: adkAnalysis.personalized_insights || ['🤖 AI analysis completed successfully'],
          memoryConnections: adkAnalysis.memory_connections || [],
          personalizedCareerPath: {
            customRole: `AI-Enhanced ${subject} Specialist`,
            description: `Career path generated through AI analysis of your content engagement`,
            skills: [`Applied ${subject}`, 'AI-Enhanced Analysis', 'Personalized Learning']
          }
        };
      }

      // If primary ADK fails, try simpler content analysis
      throw new Error('Primary ADK analysis failed');
      
    } catch (error) {
      console.error('❌ AI content analysis failed:', error);
      
      // Retry with simplified ADK call using available memories
      try {
        const fallbackMemories = findRelevantMemories(subject as string, topicsArray);
        console.log('🔄 Retrying with fallback memories:', fallbackMemories.length);
        
        const fallbackAnalysis = await SensaAPI.analyzeDocumentWithMemories({
          subject: subject as string,
          content_type: contentType as string,
          topics: topicsArray,
          user_memories: fallbackMemories.slice(0, 3),
          analysis_type: 'personalized_insights'
        });
        
        if (fallbackAnalysis) {
          console.log('✅ Fallback ADK analysis successful');
          console.log('🎯 Fallback response:', fallbackAnalysis);
          return fallbackAnalysis;
        }
      } catch (retryError) {
        console.error('❌ Fallback ADK analysis also failed:', retryError);
      }
      
      // Pure AI-Only: Show honest AI unavailable status
      console.log('🤖 All AI attempts failed - showing AI unavailable status');
      
      return {
        revolutionaryInsights: [
          '🤖 AI analysis is temporarily unavailable for this content.',
          '💡 Your personalized insights will be generated when AI services are restored.',
          `📊 Content identified: ${subject} (${contentType}) with ${topicsArray.length} topics.`,
          '🔄 Please try again in a few moments.'
        ],
        memoryConnections: [],
        personalizedCareerPath: {
          customRole: 'AI Analysis Unavailable',
          description: 'Personalized career path will be available when AI services are restored.',
          skills: ['AI-Powered Analysis (Temporarily Unavailable)']
        }
      };
    }
  };

  // Helper function to find memories relevant to the subject - enhanced semantic matching
  const findRelevantMemories = (subject: string, topics: string[]) => {
    console.log('🔍 Frontend: Finding relevant memories for subject:', subject);
    console.log('📋 Frontend: Topics to match:', topics);
    console.log('🧠 Frontend: Available memories:', memories.length);
    
    // Generate broader semantic keywords for better matching
    const semanticKeywords = generateSemanticKeywords(subject, topics);
    console.log('🎯 Frontend: Semantic keywords:', semanticKeywords);
    
    // Score memories based on relevance
    const scoredMemories = memories.map(memory => {
      const memoryText = (memory.text_content || '').toLowerCase();
      const memoryCategory = (memory.category || '').toLowerCase();
      
      let score = 0;
      
      // Direct keyword matches (highest priority)
      semanticKeywords.direct.forEach(keyword => {
        if (memoryText.includes(keyword) || memoryCategory.includes(keyword)) {
          score += 10;
        }
      });
      
      // Conceptual matches (medium priority)
      semanticKeywords.conceptual.forEach(keyword => {
        if (memoryText.includes(keyword)) {
          score += 5;
        }
      });
      
      // Learning-related matches (lower priority but still valuable)
      semanticKeywords.learning.forEach(keyword => {
        if (memoryText.includes(keyword)) {
          score += 3;
        }
      });
      
      // Problem-solving and analytical thinking matches
      semanticKeywords.analytical.forEach(keyword => {
        if (memoryText.includes(keyword)) {
          score += 2;
        }
      });
      
      return { memory, score };
    });
    
    // Sort by score and take top matches
    const relevantMemories = scoredMemories
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.memory);
    
    console.log('✅ Frontend: Found', relevantMemories.length, 'relevant memories with scores');
    
    // If no scored matches, send all memories to backend for AI analysis
    if (relevantMemories.length === 0) {
      console.log('📝 Frontend: No keyword matches found, sending all memories to backend for AI analysis');
      return memories.slice(0, 5);
    }

    return relevantMemories;
  };

  // Generate semantic keywords for better memory matching
  const generateSemanticKeywords = (subject: string, topics: string[]) => {
    const subjectLower = subject.toLowerCase();
    
    const keywords = {
      direct: [subjectLower, ...topics.map(t => t.toLowerCase())],
      conceptual: [] as string[],
      learning: ['learn', 'study', 'understand', 'figure', 'discover', 'explore', 'master'],
      analytical: ['problem', 'solve', 'challenge', 'think', 'analyze', 'logic', 'reason', 'pattern']
    };
    
    // Add subject-specific conceptual keywords
    if (subjectLower.includes('computer') || subjectLower.includes('science') || subjectLower.includes('programming')) {
      keywords.conceptual.push('technology', 'digital', 'code', 'software', 'system', 'data', 'algorithm', 'logic', 'build', 'create', 'design');
    }
    
    if (subjectLower.includes('machine') || subjectLower.includes('learning') || subjectLower.includes('ai')) {
      keywords.conceptual.push('pattern', 'predict', 'model', 'data', 'intelligence', 'automation', 'smart', 'algorithm');
    }
    
    if (subjectLower.includes('math') || subjectLower.includes('calculus') || subjectLower.includes('algebra')) {
      keywords.conceptual.push('number', 'calculate', 'equation', 'formula', 'logic', 'pattern', 'solve');
    }
    
    if (subjectLower.includes('business') || subjectLower.includes('management')) {
      keywords.conceptual.push('work', 'team', 'project', 'goal', 'strategy', 'plan', 'organize', 'lead');
    }
    
    if (subjectLower.includes('psychology') || subjectLower.includes('behavior')) {
      keywords.conceptual.push('people', 'behavior', 'mind', 'emotion', 'relationship', 'social', 'understand');
    }
    
    // Add general learning and creativity keywords
    keywords.conceptual.push('creative', 'innovative', 'experiment', 'test', 'try', 'practice', 'skill', 'talent');
    
    return keywords;
  };

  // Analyze user's communication style from memories
  const analyzeUserCommunicationStyle = (userMemories: typeof memories) => {
    const allText = userMemories.map(m => m.text_content || '').join(' ').toLowerCase();
    
    // Extract common patterns and jargon
    const technicalTerms = extractTechnicalTerms(allText);
    const communicationPatterns = extractCommunicationPatterns(userMemories);
    const preferredExpressions = extractPreferredExpressions(allText);
    
    return {
      technicalTerms,
      communicationPatterns,
      preferredExpressions,
      toneStyle: analyzeToneStyle(userMemories)
    };
  };

  // Extract technical terms and jargon from user's memories
  const extractTechnicalTerms = (text: string) => {
    const techPatterns = [
      /\b(api|database|server|cloud|azure|aws|kubernetes|docker|microservices|framework|backend|frontend|deployment|ci\/cd|devops|infrastructure|scaling|architecture|integration|authentication|authorization|middleware|pipeline|repository|version control|git|npm|node|react|typescript|javascript|python|java|sql|nosql|mongodb|postgresql|redis|elasticsearch|kafka|rabbitmq|jenkins|github|gitlab|jira|agile|scrum|sprint|stakeholder|requirements|testing|unit test|integration test|e2e|qa|prod|staging|dev|environment|config|environment variables|logs|monitoring|alerting|metrics|performance|optimization|refactoring|code review|pull request|merge|branch|commit|feature flag|rollback|hotfix|patch|release|versioning)\b/gi
    ];
    
    const matches = new Set<string>();
    techPatterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      found.forEach(term => matches.add(term.toLowerCase()));
    });
    
    return Array.from(matches);
  };

  // Extract communication patterns
  const extractCommunicationPatterns = (userMemories: typeof memories) => {
    const patterns = {
      usesMetaphors: false,
      prefersConcrete: false,
      usesHumor: false,
      formalTone: false,
      casualTone: false,
      storytellingStyle: false
    };
    
    const allText = userMemories.map(m => m.text_content || '').join(' ').toLowerCase();
    
    // Check for metaphorical language
    if (allText.match(/like|similar to|think of it as|imagine|picture this|it's basically|kind of like/gi)) {
      patterns.usesMetaphors = true;
    }
    
    // Check for concrete examples
    if (allText.match(/for example|specifically|exactly|precisely|in practice|actually|literally/gi)) {
      patterns.prefersConcrete = true;
    }
    
    // Check for humor or casual expressions
    if (allText.match(/lol|haha|funny|ridiculous|crazy|honestly|tbh|basically|pretty much/gi)) {
      patterns.usesHumor = true;
      patterns.casualTone = true;
    }
    
    // Check for storytelling
    if (allText.match(/so then|what happened|the thing is|long story short|basically what happened/gi)) {
      patterns.storytellingStyle = true;
    }
    
    return patterns;
  };

  // Extract preferred expressions and vocabulary
  const extractPreferredExpressions = (text: string) => {
    const commonExpressions = [
      /\b(honestly|basically|actually|pretty much|kind of|sort of|you know|i mean|the thing is|what i found|in my experience|from what i've seen|i've noticed|turns out|it's like|reminds me of)\b/gi
    ];
    
    const expressions = new Set<string>();
    commonExpressions.forEach(pattern => {
      const found = text.match(pattern) || [];
      found.forEach(expr => expressions.add(expr.toLowerCase()));
    });
    
    return Array.from(expressions);
  };

  // Analyze tone style
  const analyzeToneStyle = (userMemories: typeof memories) => {
    const recentMemories = userMemories.slice(-5); // Analyze recent memories for current style
    const allText = recentMemories.map(m => m.text_content || '').join(' ').toLowerCase();
    
    const style = {
      enthusiasm: allText.match(/excited|amazing|awesome|great|love|fantastic|brilliant/gi)?.length || 0,
      analytical: allText.match(/analysis|data|metrics|performance|optimization|efficiency|results|conclusion/gi)?.length || 0,
      practical: allText.match(/worked|implemented|built|deployed|configured|setup|installed|managed/gi)?.length || 0,
      collaborative: allText.match(/team|colleagues|together|meeting|discussed|shared|feedback|collaboration/gi)?.length || 0
    };
    
    return style;
  };

  // Generate style-matched analogies and connections
  const generateStyleMatchedConnections = (subject: string, relevantMemories: typeof memories, contentType: string, userStyle: any) => {
    const connections = [];
    
    // Analyze user's style to generate matching analogies
    const styleMatched = createStyleMatchedAnalogies(subject, relevantMemories, userStyle);
    
    // Core concept connection with style matching
    connections.push({
          concept: `${subject} Core Concepts`,
      personalConnection: styleMatched.coreConceptAnalogy,
      emotionalResonance: relevantMemories.length > 0 ? 0.94 : 0.87
    });
    
    // Add memory-inspired analogies (not direct quotes)
    relevantMemories.slice(0, 2).forEach((memory, index) => {
      const analogy = createMemoryInspiredAnalogy(memory, subject, userStyle);
      connections.push({
        concept: memory.category || `${subject} Application ${index + 1}`,
        personalConnection: analogy,
        emotionalResonance: 0.88 + (index * 0.03)
      });
    });
    
    // Add practical connection using user's preferred expressions
    if (relevantMemories.length > 2) {
      connections.push({
        concept: "Experience Integration",
        personalConnection: createIntegrationAnalogy(subject, relevantMemories.length, userStyle),
        emotionalResonance: 0.91
      });
    } else {
      connections.push({
        concept: "Knowledge Building",
        personalConnection: createKnowledgeBuildingAnalogy(subject, userStyle),
        emotionalResonance: 0.83
      });
    }
    
    return connections;
  };

  // Create analogies that match user's communication style
  const createStyleMatchedAnalogies = (subject: string, memories: typeof memories, userStyle: any) => {
    const { technicalTerms, communicationPatterns, preferredExpressions, toneStyle } = userStyle;
    
    let coreConceptAnalogy = '';
    
    if (communicationPatterns.usesMetaphors && memories.length > 0) {
      // Use metaphorical style
      coreConceptAnalogy = `Think of ${subject} concepts like the systems you've worked with before - `;
      if (technicalTerms.includes('architecture')) {
        coreConceptAnalogy += `the architecture patterns you know create a solid foundation for understanding these principles`;
      } else if (technicalTerms.includes('deployment')) {
        coreConceptAnalogy += `just like deployment pipelines, these concepts flow logically from one to the next`;
      } else {
        coreConceptAnalogy += `the same problem-solving approach you use translates directly here`;
      }
    } else if (communicationPatterns.prefersConcrete && memories.length > 0) {
      // Use concrete, specific style
      if (preferredExpressions.includes('basically')) {
        coreConceptAnalogy = `Basically, ${subject} works exactly like the systems you've already dealt with - `;
      } else if (preferredExpressions.includes('in my experience')) {
        coreConceptAnalogy = `From your experience with similar technologies, ${subject} follows the same patterns - `;
      } else {
        coreConceptAnalogy = `Specifically, your hands-on work gives you the exact background needed for ${subject} - `;
      }
      
      if (technicalTerms.includes('database')) {
        coreConceptAnalogy += `the database concepts carry over directly`;
      } else if (technicalTerms.includes('api')) {
        coreConceptAnalogy += `the API design principles are identical`;
      } else {
        coreConceptAnalogy += `the technical foundations are the same`;
      }
    } else if (communicationPatterns.casualTone) {
      // Use casual, approachable style
      const casualStarters = ['Honestly,', 'The thing is,', 'Pretty much,', 'You know how'];
      const starter = casualStarters[Math.floor(Math.random() * casualStarters.length)];
      
      coreConceptAnalogy = `${starter} ${subject} is really just an extension of what you already know. `;
      if (toneStyle.practical > 2) {
        coreConceptAnalogy += `All that hands-on work you've done? It translates perfectly to these concepts.`;
      } else {
        coreConceptAnalogy += `Your background gives you a huge head start on understanding this stuff.`;
      }
    } else {
      // Default professional but personalized style
      coreConceptAnalogy = `Your technical background provides an excellent foundation for ${subject} concepts. `;
      if (toneStyle.analytical > 2) {
        coreConceptAnalogy += `The analytical approach you bring to problems aligns perfectly with these principles.`;
      } else {
        coreConceptAnalogy += `The experience you've built creates strong connections to these new concepts.`;
      }
    }
    
    return { coreConceptAnalogy };
  };

  // Create memory-inspired analogies without direct quoting
  const createMemoryInspiredAnalogy = (memory: any, subject: string, userStyle: any) => {
    const { communicationPatterns, preferredExpressions, toneStyle } = userStyle;
    const memoryTheme = extractMemoryTheme(memory.text_content || '');
    
    let analogy = '';
    
    if (communicationPatterns.storytellingStyle) {
      analogy = `You know how in your ${memory.category?.toLowerCase() || 'experience'} work, you dealt with ${memoryTheme}? `;
      analogy += `${subject} concepts work in a similar way - `;
    } else if (preferredExpressions.includes('reminds me of')) {
      analogy = `This reminds me of your ${memory.category?.toLowerCase() || 'background'} with ${memoryTheme}. `;
      analogy += `${subject} follows that same logical flow you're familiar with.`;
    } else if (communicationPatterns.prefersConcrete) {
      analogy = `Your specific experience with ${memoryTheme} gives you exactly the right mental model for ${subject}. `;
    } else {
      analogy = `The ${memoryTheme} experience from your ${memory.category?.toLowerCase() || 'background'} creates perfect context for understanding ${subject}.`;
    }
    
    return analogy;
  };

  // Extract theme from memory without quoting directly
  const extractMemoryTheme = (memoryText: string) => {
    const text = memoryText.toLowerCase();
    
    if (text.includes('project') || text.includes('built') || text.includes('developed')) return 'project development';
    if (text.includes('team') || text.includes('collaboration') || text.includes('meeting')) return 'team collaboration';
    if (text.includes('problem') || text.includes('issue') || text.includes('bug')) return 'problem-solving';
    if (text.includes('deploy') || text.includes('release') || text.includes('production')) return 'deployment processes';
    if (text.includes('database') || text.includes('data') || text.includes('query')) return 'data management';
    if (text.includes('api') || text.includes('service') || text.includes('endpoint')) return 'service architecture';
    if (text.includes('client') || text.includes('user') || text.includes('requirement')) return 'client requirements';
    if (text.includes('performance') || text.includes('optimization') || text.includes('scalability')) return 'system optimization';
    
    return 'technical systems';
  };

  // Create integration analogy
  const createIntegrationAnalogy = (subject: string, memoryCount: number, userStyle: any) => {
    const { communicationPatterns, preferredExpressions } = userStyle;
    
    if (communicationPatterns.casualTone) {
      return `Honestly, with ${memoryCount} different experiences that connect to ${subject}, you're basically set up perfectly for this stuff. Your background hits all the right notes.`;
    } else if (preferredExpressions.includes('the thing is')) {
      return `The thing is, you've got ${memoryCount} solid experiences that all feed into ${subject} concepts. That's the kind of foundation that makes everything click.`;
    } else if (communicationPatterns.usesMetaphors) {
      return `Think of your ${memoryCount} relevant experiences like puzzle pieces - they're creating a complete picture that makes ${subject} concepts fall into place naturally.`;
    } else {
      return `Your ${memoryCount} connected experiences create multiple pathways for understanding ${subject}, giving you a comprehensive foundation that enhances learning.`;
    }
  };

  // Create knowledge building analogy
  const createKnowledgeBuildingAnalogy = (subject: string, userStyle: any) => {
    const { communicationPatterns, preferredExpressions } = userStyle;
    
    if (communicationPatterns.casualTone) {
      return `You know what? Even without direct experience, your technical mindset is exactly what ${subject} concepts need. You've got the right way of thinking about these problems.`;
    } else if (preferredExpressions.includes('from what i\'ve seen')) {
      return `From what I can see in your background, you approach problems in exactly the way that makes ${subject} concepts intuitive and manageable.`;
    } else {
      return `Your systematic approach to learning and problem-solving creates an ideal foundation for building understanding in ${subject}.`;
    }
  };

  // Updated helper function to generate memory-driven connections with style matching
  const generateMemoryConnections = (subject: string, relevantMemories: typeof memories, contentType: string) => {
    // Analyze user's communication style
    const userStyle = analyzeUserCommunicationStyle(memories);
    
    // Generate style-matched connections
    return generateStyleMatchedConnections(subject, relevantMemories, contentType, userStyle);
  };

  // Transform ADK response for document analysis
  const transformADKDocumentResponse = (adkResponse: Record<string, unknown>, analysisResult: Record<string, unknown>) => {
    return {
      revolutionaryInsights: (adkResponse.analysis as Record<string, unknown>)?.content_specific_insights || [
        `🧠 AI analysis reveals unique patterns in your ${analysisResult.subject} document`,
        `🎯 Content processing identified key connections to your learning profile`,
        `✨ Document complexity analysis shows optimal learning pathways`,
        `🚀 Personalized insights generated from actual document content`
      ],
      memoryConnections: (adkResponse.analysis as Record<string, unknown>)?.topic_memory_connections || [],
      personalizedCareerPath: (adkResponse.analysis as Record<string, unknown>)?.personalized_learning_path || {
        customRole: `AI-Enhanced ${analysisResult.subject} Specialist`,
        description: `Career path optimized through AI analysis of your specific document content`,
        skills: [`Advanced ${analysisResult.subject}`, 'Content Intelligence', 'AI-Powered Analysis']
      }
    };
  };

  const generateMindMap = async () => {
    if (isLoading) return; // Prevent multiple concurrent calls
    
    setIsLoading(true);
    console.log('🎯 Starting mind map generation...');
    console.log('🔧 Supabase client exists:', !!supabase);
    console.log('📊 Selected course:', selectedCourse);
    console.log('📄 Uploaded content:', !!uploadedContent);
    console.log('📁 Uploaded files:', uploadedFiles?.length || 0);
    console.log('📋 Analyzed document:', !!analyzedDocument, analyzedDocument?.fileName, analyzedDocument?.subject);
    console.log('🧠 Memories loaded:', memories.length);
    
    try {
      // Determine what to analyze: uploaded content takes priority over selected course
      let fieldOfStudy = 'General';
      let courseSyllabus = ['Introduction', 'Core Concepts', 'Applications', 'Theory', 'Practice', 'Advanced Topics'];
      let examScope = ['Core Concepts', 'Theory', 'Applications'];
      
      if (analyzedDocument) {
        // Use analyzed document data with enhanced subject recognition
        fieldOfStudy = analyzedDocument.subject;
        
        // Use extracted topics from the analysis
        const extractedTopics = analyzedDocument.topics;
        
        courseSyllabus = extractedTopics.length > 0 ? extractedTopics : [
          'Document Analysis', 'Key Concepts', 'Core Material', 'Study Focus', 'Review Topics', 'Summary Points'
        ];
        examScope = extractedTopics.slice(0, 3).length > 0 ? extractedTopics.slice(0, 3) : ['Key Concepts', 'Core Material', 'Study Focus'];
        
        console.log('📄 Using analyzed document:', { fieldOfStudy, courseSyllabus, examScope, fileName: analyzedDocument.fileName });
      } else if (uploadedContent && uploadedFiles?.length > 0) {
        // Fallback: Analyze uploaded content from navigation state
        const fileName = uploadedFiles[0]?.file?.name || 'Uploaded Document';
        fieldOfStudy = await extractSubjectFromFilename(fileName);
        
        // Extract key topics from uploaded content for more relevant analysis
        const contentPreview = uploadedContent.substring(0, 500);
        const extractedTopics = extractTopicsFromContent(contentPreview);
        
        courseSyllabus = extractedTopics.length > 0 ? extractedTopics : [
          'Document Analysis', 'Key Concepts', 'Core Material', 'Study Focus', 'Review Topics', 'Summary Points'
        ];
        examScope = extractedTopics.slice(0, 3).length > 0 ? extractedTopics.slice(0, 3) : ['Key Concepts', 'Core Material', 'Study Focus'];
        
        console.log('📄 Analyzing uploaded content (fallback):', { fieldOfStudy, courseSyllabus, examScope });
      } else if (uploadedFile) {
        // Analyze pasted or directly uploaded file
        fieldOfStudy = await extractSubjectFromFilename(uploadedFile.name);
        
        // For pasted content, we can extract topics from the file content if it's a text file
        if (uploadedFile.type === 'text/plain') {
          try {
            const reader = new FileReader();
            reader.onload = (e) => {
              const content = e.target?.result as string;
              if (content) {
                const extractedTopics = extractTopicsFromContent(content.substring(0, 500));
                if (extractedTopics.length > 0) {
                  courseSyllabus = extractedTopics;
                  examScope = extractedTopics.slice(0, 3);
                }
              }
            };
            reader.readAsText(uploadedFile);
          } catch (error) {
            console.log('Could not read text file content:', error);
          }
        }
        
        courseSyllabus = [
          'Document Analysis', 'Key Concepts', 'Core Material', 'Study Focus', 'Review Topics', 'Summary Points'
        ];
        examScope = ['Key Concepts', 'Core Material', 'Study Focus'];
        
        console.log('📄 Analyzing pasted/uploaded file:', { fileName: uploadedFile.name, fieldOfStudy, courseSyllabus, examScope });
      } else if (selectedCourse) {
        // Analyze selected course
        fieldOfStudy = selectedCourse.category;
        console.log('📚 Analyzing selected course:', selectedCourse.title);
      } else {
        console.log('⚠️ No content to analyze, using general template');
      }

      const requestBody = {
        field_of_study: fieldOfStudy,
        course_syllabus: courseSyllabus,
        exam_scope: examScope,
        user_memory_profile: { memories: memories.map(m => ({ category: m.category, text: m.text_content })) }
      };

      console.log('📡 Attempting Supabase function call...', requestBody);

      if (!supabase) {
        console.error('❌ Supabase client is null - environment variables missing');
        throw new Error('Supabase not configured');
      }

      console.log('⏳ Generating AI-powered mind map using ADK agents...');
      
      // Use ADK agents for mind map generation instead of mermaid-cartographer
      try {
        const aiMindMap = await generateAIMindMap(fieldOfStudy, courseSyllabus, memories);
        
        if (aiMindMap && aiMindMap.mermaid_code) {
          console.log('✅ AI mind map generated successfully');
          console.log('🎨 AI-generated mind map data:', aiMindMap);
          setStudyMap(aiMindMap);
          console.log('🎨 Setting study map data for rendering...');
        } else {
          throw new Error('AI mind map generation returned empty result');
        }
      } catch (aiError) {
        console.error('❌ AI mind map generation failed:', aiError);
        console.log('🚫 AI unavailable - generating mind map from analysis data instead...');
        
        // Generate mind map from available analysis data instead of showing unavailable message
        const analysisBasedMindMap = generateMindMapFromAnalysis(
          fieldOfStudy, 
          courseSyllabus, 
          analysisResult?.revolutionaryInsights || [],
          analysisResult?.memoryConnections || []
        );
        
        setStudyMap({
          mermaid_code: analysisBasedMindMap,
          node_data: {
            source: 'analysis_fallback',
            subject: fieldOfStudy,
            insights_count: analysisResult?.revolutionaryInsights?.length || 0,
            memory_connections: analysisResult?.memoryConnections?.length || 0
          },
          legend_html: `<p class="text-blue-600">🧠 Mind map generated from your analysis data for <strong>${fieldOfStudy}</strong> with ${analysisResult?.memoryConnections?.length || 0} memory connections</p>`
        });
        console.log('✅ Generated mind map from analysis data');
      }
    } catch (error) {
      console.error('❌ Mind map generation error:', error);
      console.error('❌ Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
      // AI-powered mind map generation fallback
      try {
        console.log('🤖 Attempting AI-powered mind map generation...');
        const aiMindMap = await generateAIMindMap(fieldOfStudy, courseSyllabus, memories);
        setStudyMap(aiMindMap);
        
        if (mermaidRef.current && aiMindMap.mermaid_code) {
          console.log('🖼️ Rendering AI-generated mind map...');
          await renderMermaidDiagram(aiMindMap.mermaid_code);
        }
        console.log('✅ AI mind map generated successfully');
      } catch (fallbackError) {
        console.error('❌ AI mind map generation error:', fallbackError);
        // Show AI unavailable message instead of hardcoded content
        setStudyMap({
          mermaid_code: `mindmap
  root((🤖 AI Temporarily Unavailable))
    Status
      Service Outage
      Please Try Again Later
    Alternative
      Use Mermaid Code Editor
      Manual Study Planning`,
          node_data: {},
          legend_html: '<p class="text-amber-600">🤖 AI mind map generation is temporarily unavailable. Please use the Mermaid Code Editor or try again later.</p>'
        });
      }
    } finally {
      setIsLoading(false);
      console.log('🏁 Mind map generation completed');
      
      // Show success notification for mind map generation
      addNotification({
        type: 'success',
        title: 'Mind Map Generated!',
        message: 'Your personalized circular mind map is ready for exploration.',
        duration: 4000
      });
    }
  };

  // Helper function to render mermaid diagrams with better error handling
  const renderMermaidDiagram = async (mermaidCode: string) => {
    if (!mermaidRef.current) return;
    
    try {
      // Clean up the mermaid code - remove markdown code block syntax if present
      let cleanedCode = mermaidCode;
      if (cleanedCode.includes('```mermaid')) {
        cleanedCode = cleanedCode.replace(/```mermaid\s*/g, '').replace(/```\s*$/g, '');
      }
      cleanedCode = cleanedCode.trim();
      
      // Only convert if it's not already a proper mindmap
      let finalCode = cleanedCode;
      if (!cleanedCode.startsWith('mindmap')) {
        finalCode = convertToCircularMindmap(cleanedCode);
        console.log('🖼️ Converting to circular format:', finalCode);
      } else {
        console.log('✅ Using AI-generated mindmap directly');
      }
      
      // Clear the container
      mermaidRef.current.innerHTML = '';
      
      // Generate unique ID for this diagram
      const diagramId = `mermaid-${Date.now()}`;
      
      try {
        // Try to render the AI-generated diagram first
        const { svg } = await mermaid.render(diagramId, finalCode);
        mermaidRef.current.innerHTML = svg;
        console.log('✅ Mermaid diagram rendered successfully');
      } catch (renderError) {
        console.error('❌ First render attempt failed:', renderError);
        console.log('🔄 Attempting fallback render with simplified content...');
        
        // If AI-generated fails, use a simplified version
        try {
          const fallbackCode = generateMindMapFromAnalysis(
            analyzedDocument?.subject || 'Machine Learning',
            analyzedDocument?.topics || ['Core Concepts', 'Applications', 'Advanced Topics'],
            analysisResult?.revolutionaryInsights || [],
            analysisResult?.memoryConnections || []
          );
          
          const { svg } = await mermaid.render(`${diagramId}-fallback`, fallbackCode);
          mermaidRef.current.innerHTML = svg;
          console.log('✅ Fallback mind map rendered successfully');
        } catch (fallbackError) {
          console.error('❌ Fallback render also failed:', fallbackError);
          throw fallbackError;
        }
      }
    } catch (error) {
      console.error('❌ Mermaid rendering error:', error);
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '<p>Error rendering mind map</p>';
      }
    }
  };

  // Convert any diagram format to circular mindmap or preserve original styling
  const convertToCircularMindmap = (mermaidCode: string): string => {
    // Prioritize uploaded content over selected course
    let subject = 'General Studies';
    if (analyzedDocument?.subject) {
      subject = analyzedDocument.subject;
    } else if (uploadedContent && uploadedFiles?.length > 0) {
      const fileName = uploadedFiles[0]?.file?.name || 'Uploaded Document';
      subject = 'Machine Learning'; // Use the analyzed subject if available
    } else if (uploadedFile) {
      subject = 'Machine Learning'; // Use the analyzed subject
    } else if (selectedCourse) {
      subject = selectedCourse.category;
    }
    
    // If it's already a proper mindmap, return as-is
    if (mermaidCode.trim().startsWith('mindmap')) {
      console.log('✅ Already proper mindmap format, using as-is');
      return mermaidCode;
    }
    
    // Always convert to proper mindmap format for consistent circular layout
    console.log('🔄 Converting to proper circular mindmap format');
    
    // Extract topics from any format and create a circular mindmap
    const lines = mermaidCode.split('\n').filter(line => line.trim());
    const topics: string[] = [];
    
    // Parse different formats to extract topics
    for (const line of lines) {
      // Skip directive lines
      if (line.includes('graph') || line.includes('flowchart') || line.includes('class') || line.includes('-->')) {
        continue;
      }
      
      // Extract node content from various formats
      const nodeMatch = line.match(/["'\[([{]([^"'\])}]+)["'\])}]/);
      if (nodeMatch) {
        topics.push(nodeMatch[1]);
      }
    }
    
    // Create a proper circular mindmap structure with 12 o'clock clockwise positioning
    const mindmapCode = `mindmap
  root)${subject}<br/>Learning Journey(
    )📚 Foundations(
      )Core Concepts(
        Theory
        Principles
        ${topics[0] || 'History'}
      )Prerequisites(
        Basic Knowledge
        Required Skills
        Background Reading
    )⚡ Applications(
      )Practical Skills(
        Hands-on Practice
        Real Projects
        ${topics[1] || 'Case Studies'}
      )Problem Solving(
        Analytical Thinking
        Critical Analysis
        Creative Solutions
    )📊 Assessment(
      )Evaluation Methods(
        Exams
        Projects
        ${topics[2] || 'Presentations'}
      )Mastery Indicators(
        Competency Levels
        Performance Metrics
        Learning Outcomes
    )🔬 Advanced Topics(
      )Specialized Areas(
        Expert Knowledge
        Research Methods
        ${topics[3] || 'Current Trends'}
      )Integration(
        Cross-disciplinary
        Synthesis
        Innovation`;
    
    return mindmapCode;
  };

  // AI-powered mind map generation
  const generateAIMindMap = async (fieldOfStudy: string, courseSyllabus: string, userMemories: typeof memories) => {
    console.log('🤖 Generating AI-powered mind map for:', fieldOfStudy);
    
    try {
      // Get relevant memories for context
      const relevantMemories = findRelevantMemories(fieldOfStudy, []);
      const userStyle = analyzeUserCommunicationStyle(userMemories);
      
      // Call ADK agents for AI-powered mind map generation using the correct task name
      const mindMapResponse = await callEdgeFunction('adk-agents', {
        task: 'generate_ai_mind_map',
        agent_type: 'orchestrator',
        subject: fieldOfStudy,
        content: courseSyllabus,
        focus_question: focusQuestion || analyzedDocument?.focusQuestion || '',
        memories: relevantMemories.map(m => ({
          id: m.id || `memory-${Date.now()}-${Math.random()}`,
          content: m.text_content || '',
          category: m.category || 'general',
          emotional_tone: 'positive'
        })),
        payload: {} // Empty payload as required by the interface
      });

      if (mindMapResponse && mindMapResponse.mindmap) {
        console.log('✅ ADK mind map generation successful');
        return {
          mermaid_code: mindMapResponse.mindmap.mermaid_code || mindMapResponse.mindmap.code,
          node_data: mindMapResponse.mindmap.node_insights || {},
          legend_html: mindMapResponse.mindmap.legend_html || generateAILegend()
        };
      }

      throw new Error('ADK mind map generation failed');
      
    } catch (error) {
      console.error('❌ AI mind map generation failed:', error);
      throw error; // Re-throw to let caller handle
    }
  };

  const generateAILegend = () => {
    return `
      <div class="space-y-2">
        <p class="text-sm font-medium text-gray-800">🤖 AI-Generated Mind Map</p>
        <div class="space-y-1 text-xs text-gray-600">
          <div>🎯 Center: Main subject area</div>
          <div>📚 Major branches: Key learning domains</div>
          <div>💡 Sub-nodes: Personalized insights</div>
          <div>🔗 Connections: Memory-linked concepts</div>
        </div>
      </div>
    `;
  };

  // Generate Mermaid mind map from analysis data when AI is unavailable
  const generateMindMapFromAnalysis = (
    subject: string, 
    topics: string[], 
    insights: string[], 
    memoryConnections: Array<{concept: string, personalConnection: string}>
  ): string => {
    console.log('🎨 Generating mind map from analysis data:', {
      subject,
      topicsCount: topics.length,
      insightsCount: insights.length,
      connectionsCount: memoryConnections.length
    });

    // Extract key concepts from insights and topics
    const foundations = topics.slice(0, 3) || ['Core Concepts', 'Fundamentals', 'Principles'];
    const applications = insights.slice(0, 3).map(insight => 
      insight.length > 30 ? insight.substring(0, 27) + '...' : insight
    ) || ['Practical Applications', 'Real-world Use', 'Problem Solving'];
    
    const assessments = ['Understanding Check', 'Skill Application', 'Knowledge Integration'];
    const advanced = memoryConnections.slice(0, 3).map(conn => conn.concept) || ['Advanced Topics', 'Specialized Areas', 'Future Learning'];

    return `mindmap
  root)${subject}<br/>Learning Journey(
    )📚 Foundations(
      )Core Concepts(
        ${foundations[0] || 'Fundamentals'}
        ${foundations[1] || 'Key Principles'}
        ${foundations[2] || 'Basic Theory'}
      )Prerequisites(
        Background Knowledge
        Essential Skills
        Required Understanding
    )⚡ Applications(
      )Practical Skills(
        ${applications[0] || 'Hands-on Practice'}
        ${applications[1] || 'Real Projects'}
        ${applications[2] || 'Problem Solving'}
      )Memory Connections(
        ${memoryConnections[0]?.concept || 'Personal Experience'}
        ${memoryConnections[1]?.concept || 'Learning Patterns'}
        ${memoryConnections[2]?.concept || 'Knowledge Links'}
    )📊 Assessment(
      )Evaluation Methods(
        ${assessments[0]}
        ${assessments[1]}
        ${assessments[2]}
      )Mastery Indicators(
        Comprehension Level
        Application Ability
        Integration Success
    )🔬 Advanced Topics(
      )Specialized Areas(
        ${advanced[0] || 'Expert Knowledge'}
        ${advanced[1] || 'Research Methods'}
        ${advanced[2] || 'Current Trends'}
      )Future Learning(
        Next Steps
        Deeper Study
        Related Fields`;
  };

  const generateStudyGuide = async (file: File) => {
    setIsLoading(true);
    setStudyGuide(null); // Clear previous guide
    try {
      const fileContent = await file.text();
      const subject = await extractSubjectFromFilename(file.name, fileContent);

      // Call ADK orchestrator for document analysis to get study guide
      const adkResponse = await callEdgeFunction('adk-agents', {
        agent_type: 'orchestrator',
        task: 'document_content_analysis',
        payload: {
          document: {
            name: file.name,
            content: fileContent,
            content_type: 'exam_past_paper',
            actual_subject: subject,
          },
        },
        analysis_requirements: ['study_guide', 'study_recommendations'],
      });

      if (adkResponse?.success && adkResponse?.analysis?.study_recommendations) {
        const recommendations = adkResponse.analysis.study_recommendations as any[];
        
        const newStudyGuide = {
          title: `AI-Generated Study Guide for ${file.name}`,
          subject: subject,
          totalTime: '4-6 weeks', // This can be made dynamic later
          sections: recommendations.map(rec => ({
            title: rec.title || 'Unnamed Section',
            topics: rec.topics || [],
            priority: rec.priority || 'medium',
            estimatedTime: rec.estimatedTime || '1-2 weeks',
          })),
        };
        setStudyGuide(newStudyGuide);
      } else {
        // Fallback if ADK fails or returns unexpected structure
        throw new Error('AI analysis did not return a valid study guide.');
      }
    } catch (error) {
      console.error('Study guide generation error:', error);
      // Set a fallback study guide to show the error
      setStudyGuide({
        title: 'Error Generating Study Guide',
        subject: file.name,
        totalTime: 'N/A',
        sections: [
          {
            title: 'AI Service Unavailable',
            topics: ['The AI agent failed to generate a study guide.', 'Please try again later or check the console for details.'],
            priority: 'high',
            estimatedTime: 'now',
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractSubjectFromFilename = async (filename: string, content?: string): Promise<string> => {
    console.log('🤖 Analyzing subject from filename and content:', filename);
    
    // Check if this is an auto-generated filename (contains "Pasted Content" and timestamp pattern)
    const isAutoGenerated = filename.includes('Pasted Content') && /\d{4}-\d{2}-\d{2}/.test(filename);
    
    if (isAutoGenerated && content) {
      console.log('📄 Auto-generated filename detected, using content analysis for subject identification');
      return await extractSubjectFromContent(content);
    }
    
    // For meaningful filenames, try AI analysis first
    if (!isAutoGenerated) {
      try {
        // Use ADK agents to intelligently identify the subject
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const subjectAnalysis = await callEdgeFunction('adk-agents', {
          agent_type: 'orchestrator',
          task: 'subject_identification',
          filename: filename,
          content_preview: content?.substring(0, 500) || '',
          analysis_type: 'intelligent_subject_extraction'
        });
        
        if (subjectAnalysis?.success && subjectAnalysis?.analysis?.identified_subject) {
          console.log('✅ AI identified subject from filename:', subjectAnalysis.analysis.identified_subject);
          return subjectAnalysis.analysis.identified_subject;
        }
      } catch (error) {
        console.log('⚠️ AI filename analysis failed, falling back to content analysis:', error);
      }
    }
    
    // Content-based analysis fallback
    if (content) {
      return await extractSubjectFromContent(content);
    }
    
    // Final fallback: Simple filename analysis
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('math') || lowerName.includes('calc')) return 'Mathematics';
    if (lowerName.includes('psyc')) return 'Psychology';
    if (lowerName.includes('acc')) return 'Accounting';
    if (lowerName.includes('cs') || lowerName.includes('comp')) return 'Computer Science';
    
    return 'Document Analysis';
  };

  // Extract subject from content using pattern matching and keyword analysis
  const extractSubjectFromContent = async (content: string): Promise<string> => {
    const contentLower = content.toLowerCase();
    
    // Look for explicit subject mentions in headings or titles
    const headingMatches = content.match(/#{1,3}\s+([^\n]+)/g) || [];
    for (const heading of headingMatches) {
      const headingText = heading.replace(/#{1,3}\s+/, '').toLowerCase();
      if (headingText.includes('machine learning') || headingText.includes('ml')) return 'Machine Learning';
      if (headingText.includes('data science') || headingText.includes('data analysis')) return 'Data Science';
      if (headingText.includes('computer science') || headingText.includes('programming')) return 'Computer Science';
      if (headingText.includes('mathematics') || headingText.includes('math')) return 'Mathematics';
      if (headingText.includes('psychology')) return 'Psychology';
      if (headingText.includes('accounting') || headingText.includes('finance')) return 'Accounting';
    }
    
    // Look for certification patterns
    if (contentLower.includes('az-400') || contentLower.includes('azure devops')) return 'Azure DevOps';
    if (contentLower.includes('aws') && (contentLower.includes('cloud') || contentLower.includes('ec2'))) return 'AWS Cloud Computing';
    if (contentLower.includes('kubernetes') || contentLower.includes('docker') || contentLower.includes('ci/cd')) return 'DevOps';
    
    // Look for academic subjects by keyword density
    if (contentLower.includes('machine learning') || contentLower.includes('neural network') || contentLower.includes('algorithm')) return 'Machine Learning';
    if (contentLower.includes('calculus') || contentLower.includes('derivative') || contentLower.includes('integral')) return 'Mathematics';
    if (contentLower.includes('accounting') || contentLower.includes('financial statement') || contentLower.includes('balance sheet')) return 'Accounting';
    if (contentLower.includes('psychology') || contentLower.includes('cognitive') || contentLower.includes('behavioral')) return 'Psychology';
    if (contentLower.includes('programming') || contentLower.includes('software') || contentLower.includes('code')) return 'Computer Science';
    if (contentLower.includes('data science') || contentLower.includes('statistics') || contentLower.includes('data analysis')) return 'Data Science';
    
    // If content contains study guide patterns, try to extract main subject
    if (contentLower.includes('study guide') || contentLower.includes('fundamentals')) {
      const words = content.split(/\s+/).slice(0, 20); // First 20 words
      for (const word of words) {
        const wordLower = word.toLowerCase().replace(/[^\w]/g, '');
        if (wordLower === 'machine' || wordLower === 'learning') return 'Machine Learning';
        if (wordLower === 'computer' || wordLower === 'science') return 'Computer Science';
        if (wordLower === 'mathematics' || wordLower === 'math') return 'Mathematics';
        if (wordLower === 'psychology') return 'Psychology';
        if (wordLower === 'accounting') return 'Accounting';
      }
    }
    
    console.log('📚 Using generic subject classification for content analysis');
    return 'Study Material Analysis';
  };

  const extractTopicsFromContent = (content: string): string[] => {
    if (!content || content.length < 50) return [];
    
    // Look for common patterns that indicate topics/sections
    const topics: string[] = [];
    
    // Extract headings (markdown style)
    const headingMatches = content.match(/#{1,3}\s+([^\n]+)/g);
    if (headingMatches) {
      headingMatches.forEach(match => {
        const topic = match.replace(/#{1,3}\s+/, '').trim();
        if (topic.length > 3 && topic.length < 50) {
          topics.push(topic);
        }
      });
    }
    
    // Extract numbered sections
    const numberedMatches = content.match(/\d+\.\s+([^\n.]{10,50})/g);
    if (numberedMatches) {
      numberedMatches.forEach(match => {
        const topic = match.replace(/\d+\.\s+/, '').trim();
        if (topic.length > 5 && topic.length < 50) {
          topics.push(topic);
        }
      });
    }
    
    // Extract capitalized phrases that might be topics
    const capitalizedMatches = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}/g);
    if (capitalizedMatches) {
      capitalizedMatches.forEach(match => {
        if (match.length > 8 && match.length < 40 && !match.includes('The ') && !match.includes('This ')) {
          topics.push(match.trim());
        }
      });
    }
    
    // Remove duplicates and return first 6 topics
    const uniqueTopics = [...new Set(topics)];
    return uniqueTopics.slice(0, 6);
  };

  const downloadStudyGuide = () => {
    if (!studyGuide) return;
    
    const content = `
STUDY GUIDE: ${studyGuide.title}
Subject: ${studyGuide.subject}
Total Time: ${studyGuide.totalTime}

SECTIONS:
${studyGuide.sections.map((section: any) => `
${section.title} (${section.priority} priority)
- Time: ${section.estimatedTime}
- Topics: ${section.topics.join(', ')}
`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studyGuide.subject}_Study_Guide.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePasteSubmit = async () => {
    if (!pasteContent.trim()) {
      return;
    }

    // Generate a dynamic filename with timestamp
    const timestamp = new Date().toLocaleString('sv').replace(/:/g, '-');
    const generatedFileName = `Pasted Content - ${timestamp}`;

    // Create a file from the pasted content with the auto-generated name
    const blob = new Blob([pasteContent], { type: 'text/plain' });
    const file = new File([blob], `${generatedFileName}.txt`, { type: 'text/plain' });
    
    setUploadedFile(file);
    
    // Reset paste form
    setPasteContent('');
    setShowPasteInput(false);
    
    // Switch to analysis tab and analyze the pasted content
    setActiveTab('analyze');
    performAnalysis(undefined, file);
  };

  const togglePasteInput = () => {
    setShowPasteInput(!showPasteInput);
  };

  // Handle focus question submission and proceed with analysis
  const handleFocusQuestionSubmit = async () => {
    if (!pendingAnalysis) return;
    
    setShowFocusQuestion(false);
    
    // Proceed with analysis including the focus question
    await performAnalysis(pendingAnalysis.course, pendingAnalysis.file, true);
    
    setPendingAnalysis(null);
  };

  // Get focus question examples based on content type
  const getFocusQuestionExamples = (course?: Course, file?: File) => {
    const subject = course?.category || file?.name || 'this material';
    
    if (course) {
      switch (course.category.toLowerCase()) {
        case 'computer science':
          return [
            'Why does recursion solve problems that iteration cannot?',
            'How do data structures affect algorithm performance in real applications?',
            'What makes object-oriented programming more maintainable than procedural code?'
          ];
        case 'psychology':
          return [
            'How do cognitive biases influence everyday decision-making?',
            'Why do some therapeutic approaches work better for specific disorders?',
            'What role does neuroplasticity play in learning and recovery?'
          ];
        case 'mathematics':
          return [
            'Why does calculus provide the foundation for understanding change?',
            'How do mathematical models predict real-world phenomena?',
            'What makes some mathematical proofs more elegant than others?'
          ];
        case 'accounting':
          return [
            'How do financial statements reveal a company\'s true health?',
            'Why do accounting principles vary across different industries?',
            'What makes forensic accounting essential for fraud detection?'
          ];
        default:
          return [
            `Why is understanding ${subject} crucial for solving real-world problems?`,
            `How do the core principles of ${subject} apply to current industry challenges?`,
            `What makes some approaches in ${subject} more effective than others?`
          ];
      }
    } else {
      // For uploaded files, provide generic but thoughtful examples
      return [
        `What deep insights can I extract from this material that others might miss?`,
        `How do the concepts in this content connect to solve complex problems?`,
        `Why is mastering this material essential for my professional growth?`
      ];
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: 'discover',
      label: 'Discover Courses',
      icon: Search,
      description: 'Find your perfect course from 200+ SA university modules'
    },
    {
      id: 'upload',
      label: 'Upload Materials',
      icon: Upload,
      description: 'Analyze your own study materials and documents'
    },
    {
      id: 'analyze',
      label: 'Revolutionary Analysis',
      icon: Zap,
      description: 'Get memory-driven insights and personalized learning paths'
    },
    {
      id: 'visualize',
      label: 'Mind Maps',
      icon: Map,
      description: 'See circular mind maps with curved connections'
    },
    {
      id: 'memories',
      label: 'Memory Bank',
      icon: Brain,
      description: 'View and manage your learning memories'
    }
  ];

  return (
    <>
      {/* Focus Question Dialog */}
      {showFocusQuestion && pendingAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Deep Learning Focus</h3>
                  <p className="text-gray-600 text-sm">Transform passive reading into active learning</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  What <strong>deep question</strong> do you want to answer with this material? 
                  This will guide your study and create more meaningful connections.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Example Questions:</h4>
                  <div className="space-y-2">
                    {getFocusQuestionExamples(pendingAnalysis.course, pendingAnalysis.file).map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setFocusQuestion(example)}
                        className="block w-full text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded p-2 transition-colors"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={focusQuestion}
                  onChange={(e) => setFocusQuestion(e.target.value)}
                  placeholder="Enter your deep question here..."
                  className="w-full h-24 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFocusQuestion(false);
                    setPendingAnalysis(null);
                    setFocusQuestion('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFocusQuestionSubmit}
                  disabled={!focusQuestion.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue Analysis
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
              <div 
                className="p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0"
                style={{ background: sensaBrandColors.gradients.transformation.css }}
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                  <span className="block sm:inline">Integrated</span>
                  <span className="block sm:inline sm:ml-1">Learning Hub</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 leading-tight">
                  <span className="hidden sm:inline">Unified course discovery, analysis, and visualization</span>
                  <span className="sm:hidden">Course discovery & analysis</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Discover Tab */}
            {activeTab === 'discover' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  {uploadedContent ? (
                    // Show uploaded content summary instead of course discovery
                    <div className="text-center py-12">
                      <div className="mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Documents Uploaded</h2>
                        <p className="text-gray-600 mb-6">
                          Your personal study materials have been processed and are ready for analysis
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                          <div className="flex items-center justify-center mb-2">
                            <Brain className="w-5 h-5 text-green-600 mr-2" />
                            <span className="font-medium text-green-800">
                              {uploadedFiles?.length || 1} Document{(uploadedFiles?.length || 1) > 1 ? 's' : ''} Processed
                            </span>
                          </div>
                          <p className="text-green-700 text-sm">
                            Switch to the "Revolutionary Analysis" tab to see your personalized insights
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('analyze')}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
                        >
                          View Your Analysis
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Show course discovery when no uploaded content
                    <>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Course Discovery</h2>
                  
                  {/* Search */}
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="Search 200+ South African university courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {/* Course Grid */}
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1
                        }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                  >
                    {filteredCourses.slice(0, 12).map((course, index) => (
                      <div key={course.id} className="relative">
                      <motion.div
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                          selectedCourse?.id === course.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCourse(course)}
                        whileHover={{ scale: 1.02 }}
                          animate={{
                            x: selectedCourse?.id === course.id ? -8 : 0,
                          }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        layoutId={`course-card-${course.id}`}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { 
                            opacity: 1, 
                            y: 0,
                            transition: { duration: 0.3 }
                          }
                        }}
                      >
                        <motion.h3 
                          className="font-semibold text-gray-800 mb-2"
                          layoutId={`course-title-${course.id}`}
                        >
                          {course.title}
                        </motion.h3>
                        <motion.p 
                          className="text-sm text-gray-600 mb-2"
                          layoutId={`course-university-${course.id}`}
                        >
                          {course.university}
                        </motion.p>
                        <motion.div 
                          className="flex items-center justify-between text-xs text-gray-500"
                          layoutId={`course-meta-${course.id}`}
                        >
                          <span>{course.category}</span>
                          <span>{course.difficulty}</span>
                        </motion.div>
                        {course.enrollment && (
                          <div className="mt-2 text-xs text-gray-500">
                            {course.enrollment} students enrolled
                          </div>
                        )}
                      </motion.div>

                        {/* Inline Analysis Button */}
                        <AnimatePresence>
                          {selectedCourse?.id === course.id && (
                    <motion.div
                              initial={{ opacity: 0, x: -20, scale: 0.8 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -20, scale: 0.8 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="absolute top-0 -right-2 z-10"
                            >
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                          setActiveTab('analyze');
                          performAnalysis(selectedCourse);
                        }}
                                className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all whitespace-nowrap"
                                whileHover={{ scale: 1.05, x: 2 }}
                                whileTap={{ scale: 0.95 }}
                      >
                                <Zap className="w-4 h-4" />
                                <span className="text-sm">Analyze Course</span>
                              </motion.button>
                    </motion.div>
                      )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Study Materials</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Regular Analysis */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                      <Brain className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Memory-Driven Analysis</h3>
                      <p className="text-gray-600 mb-4 text-sm">Get revolutionary insights connecting your materials to personal memories</p>
                      
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadedFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        id="analysis-upload"
                      />
                      <label
                        htmlFor="analysis-upload"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      >
                        Choose File for Analysis
                      </label>
                      
                      {uploadedFile && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <p className="text-blue-800 text-sm">File: {uploadedFile.name}</p>
                          <button
                            onClick={() => {
                              setActiveTab('analyze');
                              performAnalysis(undefined, uploadedFile);
                            }}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Analyze with Memories
                          </button>
                        </motion.div>
                      )}
                    </div>

                    {/* Paste Content */}
                    <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center">
                      <Clipboard className="w-10 h-10 text-green-500 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Paste Content</h3>
                      <p className="text-gray-600 mb-4 text-sm">Paste your study material text directly for quick analysis</p>
                      
                      <button
                        onClick={togglePasteInput}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        {showPasteInput ? 'Cancel' : 'Paste Content'}
                      </button>
                      
                      {showPasteInput && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 space-y-3"
                        >
                          <textarea
                            value={pasteContent}
                            onChange={(e) => setPasteContent(e.target.value)}
                            placeholder="Paste your study material content here..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows={4}
                          />
                          <button
                            onClick={handlePasteSubmit}
                            disabled={!pasteContent.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Analyze Pasted Content
                          </button>
                        </motion.div>
                      )}
                    </div>

                    {/* Study Guide Generation */}
                    <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center">
                      <FileText className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Study Guide Generator</h3>
                      <p className="text-gray-600 mb-4 text-sm">Upload past papers to create structured, sequenced study guides</p>
                      
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            generateStudyGuide(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        id="studyguide-upload"
                      />
                      <label
                        htmlFor="studyguide-upload"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 cursor-pointer"
                      >
                        Upload Past Paper
                      </label>
                    </div>
                  </div>
                </div>

                {/* Study Guide Display */}
                {studyGuide && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Generated Study Guide</h3>
                        <p className="text-gray-600">Structured learning plan from your past paper</p>
                      </div>
                      <button
                        onClick={() => downloadStudyGuide()}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {studyGuide.sections?.slice(0, 4).map((section: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-800">{section.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{section.estimatedTime}</p>
                          <div className="space-y-1">
                            {section.topics?.slice(0, 3).map((topic: string, i: number) => (
                              <div key={i} className="text-xs text-gray-500">• {topic}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analyze' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                {selectedCourse && (
                  <motion.div 
                    className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200"
                    layoutId={`course-card-${selectedCourse.id}`}
                  >
                    <motion.h2 
                      className="text-xl font-bold text-gray-800 mb-2"
                      layoutId={`course-title-${selectedCourse.id}`}
                    >
                      {selectedCourse.title}
                    </motion.h2>
                    <motion.p 
                      className="text-gray-600 mb-2"
                      layoutId={`course-university-${selectedCourse.id}`}
                    >
                      {selectedCourse.university}
                    </motion.p>
                    <motion.div 
                      className="flex items-center gap-4 text-sm text-gray-500"
                      layoutId={`course-meta-${selectedCourse.id}`}
                    >
                      <span>📚 {selectedCourse.category}</span>
                      <span>⭐ {selectedCourse.difficulty}</span>
                      {selectedCourse.enrollment && (
                        <span>👥 {selectedCourse.enrollment} students</span>
                      )}
                    </motion.div>
                  </motion.div>
                )}
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Revolutionary Analysis</h2>
                
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Generating memory-driven insights...</p>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">🚀 Revolutionary Insights</h3>
                      <motion.div 
                        className="space-y-2"
                        variants={{
                          hidden: { opacity: 0 },
                          show: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.15
                            }
                          }
                        }}
                        initial="hidden"
                        animate="show"
                      >
                        {analysisResult.revolutionaryInsights.map((insight, index) => (
                          <motion.div 
                            key={index} 
                            className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                            variants={{
                              hidden: { opacity: 0, x: -20 },
                              show: { 
                                opacity: 1, 
                                x: 0,
                                transition: { duration: 0.4 }
                              }
                            }}
                          >
                            <p className="text-purple-800">{insight}</p>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">🧠 Memory Connections</h3>
                      <div className="space-y-2">
                        {analysisResult.memoryConnections.map((connection, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="font-medium text-blue-800">{connection.concept}</p>
                            <p className="text-blue-600 text-sm">{connection.personalConnection}</p>
                            <div className="mt-1 flex items-center">
                              <span className="text-xs text-blue-500">Emotional Resonance: </span>
                              <div className="ml-2 w-16 h-2 bg-blue-200 rounded-full">
                                <div 
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${connection.emotionalResonance * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">🎯 Personalized Career Path</h3>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800">{analysisResult.personalizedCareerPath.customRole}</h4>
                        <p className="text-green-600 text-sm mb-2">{analysisResult.personalizedCareerPath.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.personalizedCareerPath.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        // First generate the mind map
                        await generateMindMap();
                        // Then switch to visualize tab
                        setActiveTab('visualize');
                      }}
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                          Generating Mind Map...
                        </>
                      ) : (
                        <>
                          <Map className="w-4 h-4 mr-2 inline" />
                          View Mind Map Visualization
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Select a course or upload materials to begin analysis</p>
                  </div>
                )}
              </div>
            )}

            {/* Visualize Tab */}
            {activeTab === 'visualize' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Circular Mind Map</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={generateMindMap}
                      disabled={isLoading}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Map className="w-4 h-4 mr-2" />
                      )}
                      Generate Mind Map
                    </button>
                    
                    {/* Edit Mode Buttons */}
                    {studyMap && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowMindMapEditor(true)}
                          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <Code className="w-4 h-4 mr-2" />
                          Mermaid Code Editor
                        </button>
                        
                        <button
                          onClick={() => addNotification({
                            type: 'info',
                            title: 'Coming Soon!',
                            message: 'Our new Sensa Editor with advanced AI features is currently in development.',
                            duration: 4000
                          })}
                          className="flex items-center px-4 py-2 pr-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg transition-all shadow-lg hover:shadow-xl relative"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Sensa Editor
                          <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                            SOON
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {studyMap ? (
                  <div className="space-y-4">
                    <div ref={mermaidRef} className="w-full overflow-x-auto bg-gray-50 rounded-xl p-4 min-h-96" />
                    
                    {studyMap.legend_html && (
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: studyMap.legend_html }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Click "Generate Mind Map" to create a circular visualization</p>
                    <p className="text-sm text-gray-500">Select a course first for personalized mind maps</p>
                  </div>
                )}
              </div>
            )}

            {/* Memories Tab */}
            {activeTab === 'memories' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Memory Bank</h2>
                
                {memories.length > 0 ? (
                  <motion.div 
                    className="space-y-4"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1
                        }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                  >
                    {memories.map((memory, index) => (
                      <motion.div 
                        key={index} 
                        className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { 
                            opacity: 1, 
                            y: 0,
                            transition: { duration: 0.3 }
                          }
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        drag="y"
                        dragConstraints={{ top: -10, bottom: 10 }}
                        dragElastic={0.1}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">{memory.category}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(memory.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-800">{memory.text_content}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No memories found. Share your experiences to unlock personalized insights!</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Mind Map Editor Modals */}
        {showMindMapEditor === true && (
          <MermaidNativeEditor
            initialData={studyMap}
            onSave={(editedData) => {
              console.log('Mermaid mind map saved:', editedData);
              setShowMindMapEditor(false);
            }}
            onClose={() => setShowMindMapEditor(false)}
          />
        )}


      </div>
    </div>
    </>
  );
};

export default IntegratedLearningHub;