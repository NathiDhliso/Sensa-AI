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
import { usePageTheme } from '../../../contexts/themeUtils';
import { supabase } from '../../../lib/supabase';
import { memoryService } from '../../../services/supabaseServices';
import { callEdgeFunction } from '../../../services/edgeFunctions';
import { SensaAPI } from '../../../services/api';
import { useCourseStore, useMemoryStore, useUIStore } from '../../../stores';
import { MermaidNativeEditor } from '../../MindMapEditor';
import mermaid from 'mermaid';
import type { StudyMap, StudyGuide, StudyGuideSection, MermaidStudyMap } from '../../../types';
import { UnifiedUpload } from '../../../components';

// Import the CSS module file
import styles from './EnhancedStudyMap.module.css';

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

// Progress tracking interfaces
interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed';
  icon: React.ComponentType<any>;
}

// Consolidated workflow state interface
interface LearningWorkflow {
  currentTab: string;
  selectedCourse: Course | null;
  searchQuery: string;
  
  // Upload state
  upload: {
    files: File[];
    pasteContent: string;
    showPasteInput: boolean;
  };
  
  // Analysis state
  analysis: {
    result: AnalysisResult | null;
    isLoading: boolean;
    focusQuestion: string;
    showFocusQuestion: boolean;
    pendingAnalysis: {course?: Course, file?: File} | null;
  };
  
  // Visualization state
  visualization: {
    studyMap: any | null;
    studyGuide: StudyGuide | null;
    showMindMapEditor: boolean | string;
  };
  
  // Memory state
  memories: Array<{
    id?: string;
    text_content?: string;
    category?: string;
    connections?: string[];
    created_at?: string;
    timestamp?: Date | string;
  }>;
  
  // Document state
  analyzedDocument: {
    fileName: string;
    subject: string;
    content: string;
    topics: string[];
    adkAnalysis?: AnalysisResult;
    focusQuestion?: string;
  } | null;
}

const ProgressIndicator: React.FC<{
  steps: WorkflowStep[];
  className?: string;
}> = ({ steps, className = "" }) => {
  return (
    <div className={`${styles.progressContainer} ${className}`}>
      <div className={styles.progressSteps}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className={styles.progressStepWrapper}>
              <div className={styles.progressStepContent}>
                <motion.div
                  className={`${styles.progressStepCircle} ${
                    step.status === 'completed'
                      ? styles.progressStepCompleted
                      : step.status === 'current'
                      ? styles.progressStepCurrent
                      : styles.progressStepPending
                  }`}
                  animate={{
                    scale: step.status === 'current' ? 1.1 : 1,
                  }}
                >
                  <Icon className={styles.progressStepIcon} />
                </motion.div>
                
                <div className={styles.progressStepInfo}>
                  <p className={`${styles.progressStepTitle} ${
                    step.status === 'current' ? styles.progressStepTitleCurrent : ''
                  }`}>
                    {step.title}
                  </p>
                  <p className={styles.progressStepDescription}>
                    {step.description}
                  </p>
                </div>
              </div>
              
              {!isLast && (
                <div className={styles.progressLine}>
                  <motion.div
                    className={styles.progressLineFill}
                    initial={{ width: '0%' }}
                    animate={{
                      width: step.status === 'completed' ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const IntegratedLearningHub: React.FC = () => {
  // Basic setup
  const location = useLocation();
  const navigate = useNavigate();
  const pageTheme = usePageTheme('course');
  const uploadedContent = location.state?.uploadedContent;
  const uploadedFiles = location.state?.files;
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = uploadedContent ? 'analyze' : (urlParams.get('tab') || 'discover');
  
  // Store hooks
  const { addAnalysis } = useCourseStore();
  const { updateMemory } = useMemoryStore();
  const { addNotification } = useUIStore();
  
  // Consolidated workflow state
  const [workflow, setWorkflow] = useState<LearningWorkflow>({
    currentTab: initialTab,
    selectedCourse: null,
    searchQuery: '',
    upload: {
      files: [],
      pasteContent: '',
      showPasteInput: false,
    },
    analysis: {
      result: null,
      isLoading: false,
      focusQuestion: '',
      showFocusQuestion: false,
      pendingAnalysis: null,
    },
    visualization: {
      studyMap: null,
      studyGuide: null,
      showMindMapEditor: false,
    },
    memories: [],
    analyzedDocument: null,
  });

  // Progress tracking state
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    { id: 'discover', title: 'Discover', description: 'Find courses', status: 'pending', icon: Search },
    { id: 'upload', title: 'Upload', description: 'Add materials', status: 'pending', icon: Upload },
    { id: 'analyze', title: 'Analyze', description: 'Get insights', status: 'pending', icon: Brain },
    { id: 'visualize', title: 'Visualize', description: 'See mind map', status: 'pending', icon: Map },
    { id: 'memories', title: 'Memories', description: 'Connect past', status: 'pending', icon: Sparkles }
  ]);

  const mermaidRef = useRef<HTMLDivElement>(null);

  // Helper functions to update workflow state
  const updateWorkflow = (updates: Partial<LearningWorkflow>) => {
    setWorkflow(prev => ({ ...prev, ...updates }));
  };

  const updateUpload = (updates: Partial<LearningWorkflow['upload']>) => {
    setWorkflow(prev => ({ ...prev, upload: { ...prev.upload, ...updates } }));
  };

  const updateAnalysis = (updates: Partial<LearningWorkflow['analysis']>) => {
    setWorkflow(prev => ({ ...prev, analysis: { ...prev.analysis, ...updates } }));
  };

  const updateVisualization = (updates: Partial<LearningWorkflow['visualization']>) => {
    setWorkflow(prev => ({ ...prev, visualization: { ...prev.visualization, ...updates } }));
  };

  // Update workflow steps based on current state
  useEffect(() => {
    setWorkflowSteps(prev => prev.map(step => {
      let status: 'pending' | 'current' | 'completed' = 'pending';
      
      if (step.id === workflow.currentTab) {
        status = 'current';
      } else if (
        (step.id === 'discover' && workflow.selectedCourse) ||
        (step.id === 'upload' && (workflow.upload.files.length > 0 || uploadedContent)) ||
        (step.id === 'analyze' && workflow.analysis.result) ||
        (step.id === 'visualize' && workflow.visualization.studyMap) ||
        (step.id === 'memories' && workflow.memories.length > 0)
      ) {
        status = 'completed';
      }
      
      return { ...step, status };
    }));
  }, [workflow.currentTab, workflow.selectedCourse, workflow.upload.files.length, uploadedContent, workflow.analysis.result, workflow.visualization.studyMap, workflow.memories.length]);

  // Course data
  const courses: Course[] = [
    { id: 'CSC1015F', title: 'Introduction to Computer Science I', category: 'Computer Science', university: 'University of Cape Town', description: 'Fundamental programming concepts and problem-solving', enrollment: 450, difficulty: 'Beginner' },
    { id: 'CSC2001F', title: 'Data Structures & Algorithms', category: 'Computer Science', university: 'University of Cape Town', description: 'Advanced data structures and algorithmic thinking', enrollment: 280, difficulty: 'Intermediate' },
    { id: 'COMS1018A', title: 'Introduction to Algorithms & Programming', category: 'Computer Science', university: 'University of the Witwatersrand', description: 'Programming fundamentals and algorithmic design', enrollment: 320, difficulty: 'Beginner' },
    { id: 'MAM1020F', title: 'Mathematics 1A for Engineers', category: 'Mathematics', university: 'University of Cape Town', description: 'Calculus and linear algebra for engineering', enrollment: 650, difficulty: 'Intermediate' },
    { id: 'WTW114', title: 'Calculus', category: 'Mathematics', university: 'Stellenbosch University', description: 'Differential and integral calculus', enrollment: 420, difficulty: 'Intermediate' },
    { id: 'STA1008F', title: 'Statistics for Engineers', category: 'Statistics', university: 'University of Cape Town', description: 'Statistical methods and data analysis', enrollment: 380, difficulty: 'Intermediate' },
  ];

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(workflow.searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(workflow.searchQuery.toLowerCase()) ||
    course.university.toLowerCase().includes(workflow.searchQuery.toLowerCase())
  );

  // Load memories on mount
  useEffect(() => {
    const loadMemories = async () => {
      try {
        const userMemories = await memoryService.getUserMemories();
        updateWorkflow({ memories: userMemories || [] });
      } catch (error) {
        console.error('Error loading memories:', error);
      }
    };
    loadMemories();
  }, []);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        background: '#F8FAFC',
        primaryColor: '#6B46C1',
        primaryTextColor: '#FFFFFF',
        primaryBorderColor: '#4C1D95',
        secondaryColor: '#BE185D',
        secondaryTextColor: '#FFFFFF',
        secondaryBorderColor: '#831843',
        tertiaryColor: '#047857',
        tertiaryTextColor: '#FFFFFF',
        tertiaryBorderColor: '#064E3B',
        noteBkgColor: '#FDF2F8',
        noteTextColor: '#831843',
        noteBorderColor: '#BE185D',
        lineColor: '#71717A',
        textColor: '#1F2937',
        mainBkg: '#6D28D9',
        secondBkg: '#BE185D',
        tertiaryBkg: '#047857',
        titleColor: '#1F2937',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
      },
      mindmap: {
        padding: 30,
        maxNodeWidth: 200,
        useMaxWidth: true
      },
      securityLevel: 'loose'
    });
  }, []);

  // Render Mermaid diagram
  const renderMermaidDiagram = useCallback(async (mermaidCode: string) => {
    if (!mermaidRef.current) return;
    try {
      const { svg } = await mermaid.render(`mermaid-${Date.now()}`, mermaidCode);
      mermaidRef.current.innerHTML = svg;
    } catch (error) {
      console.error("Mermaid rendering error:", error);
    }
  }, []);

  // Auto-render diagram when study map changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (workflow.visualization.studyMap && workflow.visualization.studyMap.mermaid_code && mermaidRef.current && workflow.currentTab === 'visualize') {
        try {
          await renderMermaidDiagram(workflow.visualization.studyMap.mermaid_code);
        } catch (error) {
          console.error('Error rendering mermaid diagram:', error);
        }
      }
    };
    renderDiagram();
  }, [workflow.visualization.studyMap, workflow.currentTab, renderMermaidDiagram]);

  // Error handling
  const handleError = (error: Error, context: string) => {
    console.error(`${context}:`, error);
    addNotification({
      type: 'error',
      title: 'Something went wrong',
      message: `Error in ${context}: ${error.message}`
    });
  };

  // Reset analysis state
  const resetAnalysisState = () => {
    updateAnalysis({
      result: null,
      focusQuestion: '',
      showFocusQuestion: false,
      pendingAnalysis: null,
    });
    updateVisualization({
      studyMap: null,
      studyGuide: null,
    });
    updateWorkflow({ analyzedDocument: null });
  };

  // Analysis functions
  const analyzeCourse = async (course: Course): Promise<AnalysisResult | null> => {
    try {
      updateAnalysis({ isLoading: true });
      // Get current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      const response = await SensaAPI.analyzeCourse(course.title, user.id);
      return {
        revolutionaryInsights: response.course_analysis?.learningObjectives || [`Master the fundamentals of ${course.title}`],
        memoryConnections: response.memory_connections?.map(conn => ({
          concept: `${course.title} - ${conn.description || 'Connection'}`,
          personalConnection: conn.description || 'Personal learning connection',
          emotionalResonance: conn.relevance_score || 0.7
        })) || [],
        personalizedCareerPath: {
          customRole: response.career_pathways?.pathways?.[0]?.field_name || 'Specialized Professional',
          description: response.career_pathways?.pathways?.[0]?.description || 'Custom role based on your learning',
          skills: response.course_analysis?.careerOutcomes || []
        }
      };
    } catch (error) {
      handleError(error as Error, 'Course Analysis');
      return null;
    } finally {
      updateAnalysis({ isLoading: false });
    }
  };

  const analyzeDocumentContent = async (fileName: string, content: string) => {
    return { subject: 'Document', content, topics: [], adkAnalysis: null };
  };

  const handleFileAnalysis = async (files: File[]): Promise<AnalysisResult | null> => {
    try {
      updateAnalysis({ isLoading: true });
      const file = files[0];
      const content = await file.text();
      const analysisResult = await analyzeDocumentContent(file.name, content);
      if (analysisResult.adkAnalysis) {
        return analysisResult.adkAnalysis;
      }
      return null;
    } catch (error) {
      handleError(error as Error, 'File Analysis');
      return null;
    } finally {
      updateAnalysis({ isLoading: false });
    }
  };

  const generateAIMindMap = useCallback(async (subject: string, content: string) => {
    return { mermaid_code: `mindmap\n  root((${subject}))`, node_data: {}, legend_html: '' };
  }, []);

  const generateMindMap = useCallback(async () => {
    if (!workflow.analysis.result && !workflow.analyzedDocument) {
      addNotification({
        type: 'warning',
        title: 'No Analysis Data',
        message: 'Please analyze a course or document first.'
      });
      return;
    }
    try {
      updateAnalysis({ isLoading: true });
      let mindMapData;
      if (workflow.analyzedDocument) {
        mindMapData = await generateAIMindMap(
          workflow.analyzedDocument.subject,
          workflow.analyzedDocument.content
        );
      } else if (workflow.selectedCourse && workflow.analysis.result) {
        mindMapData = await generateAIMindMap(
          workflow.selectedCourse.title,
          JSON.stringify(workflow.analysis.result)
        );
      }
      if (mindMapData) {
        updateVisualization({ studyMap: mindMapData });
        updateWorkflow({ currentTab: 'visualize' });
      }
    } catch (error) {
      handleError(error as Error, 'Mind Map Generation');
    } finally {
      updateAnalysis({ isLoading: false });
    }
  }, [workflow.analysis.result, workflow.analyzedDocument, workflow.selectedCourse, addNotification, generateAIMindMap]);

  const performAnalysis = async (course?: Course, files?: File[], skipFocusQuestion = false) => {
    // Focus question logic
    if (!skipFocusQuestion && !workflow.analysis.focusQuestion) {
      updateAnalysis({ 
        pendingAnalysis: { course, file: files?.[0] },
        showFocusQuestion: true 
      });
      return;
    }
    
    updateAnalysis({ isLoading: true });
    try {
      let analysisData: AnalysisResult | null = null;
      if (files && files.length > 0) {
        analysisData = await handleFileAnalysis(files);
      } else if (course) {
        analysisData = await analyzeCourse(course);
      }
      if (analysisData) {
        updateAnalysis({ result: analysisData });
        updateWorkflow({ currentTab: 'analyze' });
        // Auto-generate mind map after analysis
        setTimeout(() => {
          generateMindMap();
        }, 1000);
        addNotification({
          type: 'success',
          title: 'Analysis Complete!',
          message: 'Your personalized insights are ready.',
          duration: 4000
        });
      }
    } catch (error) {
      handleError(error as Error, 'Main Analysis');
    } finally {
      updateAnalysis({ 
        isLoading: false,
        showFocusQuestion: false,
        pendingAnalysis: null,
        focusQuestion: ''
      });
    }
  };

  // Event handlers
  const handleTabChange = (tabId: string) => {
    updateWorkflow({ currentTab: tabId });
  };

  const handleCourseSelect = (course: Course) => {
    updateWorkflow({ selectedCourse: course });
    resetAnalysisState();
  };

  const handleUnifiedFileUpload = (files: File[]) => {
    updateUpload({ files });
    performAnalysis(undefined, files);
  };

  const handlePasteContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], filename, { type: 'text/plain' });
    handleUnifiedFileUpload([file]);
  };

  const handleFocusQuestionSubmit = async () => {
    if (!workflow.analysis.pendingAnalysis) return;
    await performAnalysis(
      workflow.analysis.pendingAnalysis.course, 
      workflow.analysis.pendingAnalysis.file ? [workflow.analysis.pendingAnalysis.file] : undefined, 
      true
    );
  };

  const getFocusQuestionExamples = (course?: Course, file?: File) => {
    const subject = course?.category || file?.name || 'this material';
    if (course) {
      switch (course.category.toLowerCase()) {
        case 'computer science': return ['Why does recursion solve problems that iteration cannot?'];
        case 'psychology': return ['How do cognitive biases influence everyday decision-making?'];
        default: return [`Why is understanding ${subject} crucial for solving real-world problems?`];
      }
    }
    return [`What deep insights can I extract from this material that others might miss?`];
  };

  // Tab configuration
  const tabs = [
    { id: 'discover', label: 'Discover Courses', icon: Search },
    { id: 'upload', label: 'Upload Materials', icon: Upload },
    { id: 'analyze', label: 'Revolutionary Analysis', icon: Zap },
    { id: 'visualize', label: 'Mind Maps', icon: Map },
    { id: 'memories', label: 'Memory Bank', icon: Brain },
  ];

  return (
    <>
      {/* Focus Question Dialog */}
      {workflow.analysis.showFocusQuestion && workflow.analysis.pendingAnalysis && (
        <div className={styles.dialogOverlay}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.dialogContent}
          >
            <div className={styles.dialogInner}>
              <div className={styles.dialogHeader}>
                <div className={styles.iconContainer} style={{ background: pageTheme?.gradients?.transformation || 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)' }}>
                  <span className={styles.iconEmoji}>🎯</span>
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Deep Learning Focus</h3>
                  <p className={styles.cardSubtitle}>Transform passive reading into active learning</p>
                </div>
              </div>

              <div className={styles.dialogBody}>
                <p className={styles.dialogText}>
                  What <strong>deep question</strong> do you want to answer with this material?
                  This will guide your study and create more meaningful connections.
                </p>

                <div className={styles.examplesContainer}>
                  <h4 className={styles.examplesTitle}>💡 Example Questions:</h4>
                  <div className={styles.examplesList}>
                    {getFocusQuestionExamples(workflow.analysis.pendingAnalysis.course, workflow.analysis.pendingAnalysis.file).map((example, index) => (
                      <button
                        key={index}
                        onClick={() => updateAnalysis({ focusQuestion: example })}
                        className={styles.exampleButton}
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={workflow.analysis.focusQuestion}
                  onChange={(e) => updateAnalysis({ focusQuestion: e.target.value })}
                  placeholder="Enter your deep question here..."
                  className={styles.textarea}
                />
              </div>

              <div className={styles.dialogActions}>
                <button
                  onClick={() => {
                    updateAnalysis({
                      showFocusQuestion: false,
                      pendingAnalysis: null,
                      focusQuestion: ''
                    });
                  }}
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFocusQuestionSubmit}
                  disabled={!workflow.analysis.focusQuestion.trim()}
                  className={styles.primaryButton}
                >
                  Continue Analysis
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className={styles.container}>
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <div className={styles.headerContent}>
            <div className={styles.headerFlex}>
              <div className={styles.headerLeft}>
                <motion.button
                  onClick={() => navigate('/dashboard')}
                  className={styles.backButton}
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title="Back to Dashboard"
                >
                  <ArrowLeft className={styles.headerIcon} />
                </motion.button>
                <div
                  className={styles.iconContainer}
                  style={{ background: pageTheme?.gradients?.transformation || 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)' }}
                >
                  <Sparkles className={styles.headerIcon} />
                </div>
                <div className={styles.titleContainer}>
                  <h1 className={styles.title}>Integrated Learning Hub</h1>
                  <p className={styles.subtitle}>Unified course discovery, analysis, and visualization</p>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <main className={styles.mainContent}>
          {/* Progress Indicator */}
          <ProgressIndicator steps={workflowSteps} className={styles.progressSection} />

          <div className={styles.tabContainer}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`${styles.tab} ${
                    workflow.currentTab === tab.id
                      ? styles.tabActive
                      : styles.tabInactive
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={styles.tabIcon} />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={workflow.currentTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Discover Tab */}
              {workflow.currentTab === 'discover' && (
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Course Discovery</h2>
                  </div>

                  <div className={styles.searchSection}>
                    <input
                      type="text"
                      placeholder="Search 200+ South African university courses..."
                      value={workflow.searchQuery}
                      onChange={(e) => updateWorkflow({ searchQuery: e.target.value })}
                      className={styles.input}
                    />
                  </div>

                  <motion.div
                    className={styles.courseGrid}
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                    initial="hidden"
                    animate="show"
                  >
                    {filteredCourses.slice(0, 12).map((course) => (
                      <div key={course.id} className={styles.courseCardContainer}>
                        <motion.div
                          className={`${styles.courseCard} ${workflow.selectedCourse?.id === course.id ? styles.courseCardSelected : ''}`}
                          onClick={() => handleCourseSelect(course)}
                          whileHover={{ scale: 1.02 }}
                          layoutId={`course-card-${course.id}`}
                        >
                          <h3 className={styles.courseTitle}>{course.title}</h3>
                          <p className={styles.courseUniversity}>{course.university}</p>
                          <div className={styles.courseMeta}>
                            <span>{course.category}</span>
                            <span>{course.difficulty}</span>
                          </div>
                        </motion.div>
                        <AnimatePresence>
                          {workflow.selectedCourse?.id === course.id && (
                            <motion.div
                              initial={{ opacity: 0, x: -20, scale: 0.8 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -20, scale: 0.8 }}
                              className={styles.analyzeButtonContainer}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); performAnalysis(workflow.selectedCourse || undefined); }}
                                className={styles.primaryButton}
                              >
                                <Zap className={styles.buttonIcon} />
                                <span>Analyze</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                </section>
              )}

              {/* Upload Tab */}
              {workflow.currentTab === 'upload' && (
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Upload Study Materials</h2>
                  </div>
                  
                  <UnifiedUpload
                    onFileUpload={handleUnifiedFileUpload}
                    onPasteContent={handlePasteContent}
                    acceptedTypes={['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                    maxFileSize={10}
                    maxFiles={5}
                    showPasteOption={true}
                    title="Upload Study Materials"
                    description="Upload PDFs, documents, or paste content for AI-powered analysis"
                    theme="default"
                    className={styles.uploadSection}
                  />
                </section>
              )}

              {/* Analysis Tab */}
              {workflow.currentTab === 'analyze' && (
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Revolutionary Analysis</h2>
                  </div>
                  {workflow.analysis.isLoading ? (
                    <div className={styles.loadingContainer}>
                      <RefreshCw className={styles.loadingIcon} />
                      <p className={styles.loadingText}>Generating memory-driven insights...</p>
                    </div>
                  ) : workflow.analysis.result ? (
                    <div className={styles.analysisResults}>
                      <div className={styles.analysisSection}>
                        <h3 className={styles.analysisSectionTitle}>🚀 Revolutionary Insights</h3>
                        <motion.div 
                          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15 } } }} 
                          initial="hidden" 
                          animate="show"
                        >
                          {workflow.analysis.result.revolutionaryInsights.map((insight, index) => (
                            <motion.div 
                              key={index} 
                              className={styles.insightCard} 
                              variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { duration: 0.4 } } }}
                            >
                              <p className={styles.insightText}>{insight}</p>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>

                      <div className={styles.analysisSection}>
                        <h3 className={styles.analysisSectionTitle}>🧠 Memory Connections</h3>
                        {workflow.analysis.result.memoryConnections.map((connection, index) => (
                          <div key={index} className={styles.memoryCard}>
                            <p className={styles.memoryTitle}>{connection.concept}</p>
                            <p className={styles.memoryDescription}>{connection.personalConnection}</p>
                          </div>
                        ))}
                      </div>

                      <div className={styles.analysisSection}>
                        <h3 className={styles.analysisSectionTitle}>🎯 Personalized Career Path</h3>
                        <div className={styles.successCard}>
                          <h4 className={styles.careerTitle}>{workflow.analysis.result.personalizedCareerPath.customRole}</h4>
                          <p className={styles.careerDescription}>{workflow.analysis.result.personalizedCareerPath.description}</p>
                          <div className={styles.skillTags}>
                            {workflow.analysis.result.personalizedCareerPath.skills.map((skill, index) => (
                              <span key={index} className={styles.skillTag}>{skill}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button onClick={generateMindMap} disabled={workflow.analysis.isLoading} className={styles.primaryButton}>
                        <Map className={styles.buttonIcon} /> View Mind Map
                      </button>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <Target className={styles.emptyIcon} />
                      <p className={styles.emptyText}>Select a course or upload materials to begin analysis.</p>
                    </div>
                  )}
                </section>
              )}

              {/* Visualize Tab */}
              {workflow.currentTab === 'visualize' && (
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Circular Mind Map</h2>
                    <div className={styles.cardActions}>
                      <button onClick={generateMindMap} disabled={workflow.analysis.isLoading} className={styles.primaryButton}>
                        {workflow.analysis.isLoading ? <RefreshCw className={`${styles.buttonIcon} ${styles.loadingIcon}`} /> : <Map className={styles.buttonIcon} />}
                        Generate Mind Map
                      </button>
                      {workflow.visualization.studyMap && (
                        <>
                          <button onClick={() => updateVisualization({ showMindMapEditor: true })} className={styles.secondaryButton}>
                            <Code className={styles.buttonIcon} />
                            Mermaid Code
                          </button>
                          <button
                            onClick={() => addNotification({ type: 'info', title: 'Coming Soon!', message: 'Our new Sensa Editor is in development.' })}
                            className={styles.secondaryButton}
                          >
                            <Sparkles className={styles.buttonIcon} />
                            Sensa Editor
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {workflow.visualization.studyMap ? (
                    <div className={styles.visualizationContent}>
                      <div ref={mermaidRef} className={styles.mermaidContainer} />
                      {workflow.visualization.studyMap.legend_html && (
                        <div className={styles.legend} dangerouslySetInnerHTML={{ __html: workflow.visualization.studyMap.legend_html }} />
                      )}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <Map className={styles.emptyIcon} />
                      <p className={styles.emptyText}>Click "Generate Mind Map" to create a visualization.</p>
                    </div>
                  )}
                </section>
              )}

              {/* Memories Tab */}
              {workflow.currentTab === 'memories' && (
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Memory Bank</h2>
                  </div>
                  {workflow.memories.length > 0 ? (
                    <motion.div 
                      className={styles.memoriesGrid} 
                      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} 
                      initial="hidden" 
                      animate="show"
                    >
                      {workflow.memories.map((memory, index) => (
                        <motion.div 
                          key={index} 
                          className={styles.memoryCard} 
                          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                        >
                          <div className={styles.memoryHeader}>
                            <span className={styles.memoryCategory}>{memory.category}</span>
                            <span className={styles.memoryDate}>{new Date(memory.created_at || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <p className={styles.memoryContent}>{memory.text_content}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className={styles.emptyState}>
                      <Brain className={styles.emptyIcon} />
                      <p className={styles.emptyText}>No memories found. Share your experiences to unlock personalized insights!</p>
                    </div>
                  )}
                </section>
              )}
            </motion.div>
          </AnimatePresence>

          {workflow.visualization.showMindMapEditor === true && workflow.visualization.studyMap && (
            <MermaidNativeEditor
              initialData={workflow.visualization.studyMap}
              onSave={(editedData) => {
                console.log('Mermaid mind map saved:', editedData);
                updateVisualization({ showMindMapEditor: false });
              }}
              onClose={() => updateVisualization({ showMindMapEditor: false })}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default IntegratedLearningHub;