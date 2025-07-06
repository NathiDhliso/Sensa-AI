import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Brain, 
  Target, 
  BarChart3, 
  CheckCircle, 
  ArrowRight, 
  Mic, 
  MicOff,
  Lightbulb,
  Star,
  TrendingUp,
  Calendar,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { callEdgeFunction } from '../services/edgeFunctions';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Configure worker source immediately
try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
} catch (wErr) {
  console.warn('Failed to configure PDF.js workerSrc:', wErr);
}

// Enhanced Types for Problem-Based Learning
interface KnowMePhase {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'active' | 'completed';
}

interface ProblemSolutionAnalysis {
  solution_id: string;
  technical_solution: string;
  underlying_problem: string;
  problem_category: string;
  abstracted_problem: string;
  life_connection: string;
  complexity_level: string;
}

interface KnowMeQuestion {
  question_id: string;
  related_solution_id: string;
  question_text: string;
  question_purpose: string;
  expected_insights: string[];
  follow_up_prompts: string[];
}

interface LearningObjective {
  objective: string;
  problem_focus: string;
  real_world_application: string;
}

interface Scenario {
  scenario_id: string;
  related_problem_id: string;
  scenario_title: string;
  scenario_description: string;
  core_problem: string;
  question: string;
  context_type: string;
  difficulty_level: string;
  problem_indicators: string[];
  expected_response_type: string;
  estimated_time: string;
  rubric?: any;
}

interface ScoringResult {
  question_id: string;
  total_score: number;
  total_possible: number;
  percentage: number;
  detailed_scores: any[];
  feedback_items: any[];
  overall_feedback: string;
  completion_status: string;
}

interface PerformanceReport {
  overall_metrics: {
    problem_solving_score: number;
    confidence_level: string;
    scenarios_completed: number;
    consistency_rating: number;
  };
  problem_category_breakdown: Record<string, any>;
  predictive_insights: {
    predicted_exam_performance: string;
    strongest_problem_areas: string[];
    areas_needing_focus: string[];
    problem_solving_pattern: string;
    exam_readiness: string;
    key_insights: string[];
  };
  improvement_areas: any[];
  study_recommendations: any;
  core_problems_resolved?: Record<string, string>;
}

const KnowMePage: React.FC = () => {
  const { user } = useAuthStore();
  
  // Phase management
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phases, setPhases] = useState<KnowMePhase[]>([
    { id: 'upload', title: 'Upload Material', description: 'Upload your exam PDF', icon: Upload, status: 'active' },
    { id: 'questionnaire', title: 'Know Me Questions', description: 'Share your experiences', icon: Brain, status: 'pending' },
    { id: 'scenarios', title: 'Problem Scenarios', description: 'Apply your knowledge', icon: Target, status: 'pending' },
    { id: 'report', title: 'Performance Report', description: 'Your insights', icon: BarChart3, status: 'pending' }
  ]);

  // Phase 1: PDF Upload and Problem-Solution Analysis
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [knowledgeAnalysis, setKnowledgeAnalysis] = useState<any>(null);
  const [problemSolutionAnalysis, setProblemSolutionAnalysis] = useState<ProblemSolutionAnalysis[]>([]);
  const [knowMeQuestions, setKnowMeQuestions] = useState<KnowMeQuestion[]>([]);
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([]);

  // Phase 2: Questionnaire
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Phase 3: Scenarios
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<string, string>>({});
  const [scoringResults, setScoringResults] = useState<Record<string, ScoringResult>>({});
  const [realTimeHints, setRealTimeHints] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Phase 4: Report
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);

  // General state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePhaseStatus = (phaseIndex: number, status: 'pending' | 'active' | 'completed') => {
    setPhases(prev => prev.map((phase, index) => 
      index === phaseIndex ? { ...phase, status } : phase
    ));
  };

  const moveToNextPhase = () => {
    updatePhaseStatus(currentPhase, 'completed');
    if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
      updatePhaseStatus(currentPhase + 1, 'active');
    }
  };

  // Phase 1: PDF Upload and Problem-Solution Analysis
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Phase 2: Questionnaire Processing
  const handleQuestionnaireResponse = (questionId: string, answer: string) => {
    setQuestionnaireResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitQuestionnaire = async () => {
    setLoading(true);
    setError(null);

    try {
      const responses = Object.entries(questionnaireResponses).map(([questionId, answer]) => ({
        question_id: questionId,
        answer: answer,
        question: knowMeQuestions?.find((q: KnowMeQuestion) => q.question_id === questionId)?.question_text || ''
      }));

      const scenarioResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_questionnaire',
          questionnaire_responses: { responses },
          knowledge_analysis: knowledgeAnalysis,
          user_id: user?.id || 'demo-user'
        }
      });

      if (scenarioResult.success) {
        setScenarios(scenarioResult.scenarios?.scenarios || []);
        moveToNextPhase();
      } else {
        throw new Error(scenarioResult.error || 'Failed to generate scenarios');
      }

    } catch (err) {
      console.error('❌ Questionnaire submission failed:', err);
      setError('🤖 AI scenario generation is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 3: Scenario Questions with Real-time Scoring
  const handleScenarioAnswer = (scenarioId: string, answer: string) => {
    setScenarioAnswers(prev => ({
      ...prev,
      [scenarioId]: answer
    }));

    // Trigger real-time hints if answer is substantial enough
    if (answer.length > 50) {
      provideLiveHints(scenarioId, answer);
    }
  };

  const provideLiveHints = async (scenarioId: string, partialAnswer: string) => {
    try {
      const scenario = scenarios.find(s => s.scenario_id === scenarioId);
      if (!scenario) return;

      const hintResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_score',
          question_id: scenarioId,
          user_answer: partialAnswer,
          scenarios_data: { scenarios, rubrics: scenarios.map(s => s.rubric) },
          partial_answer: true
        }
      });

      if (hintResult.success && hintResult.scoring_result?.hints) {
        setRealTimeHints(hintResult.scoring_result.hints);
      }
    } catch (err) {
      console.error('❌ Real-time hints failed:', err);
      // Clear hints when AI is unavailable
      setRealTimeHints([]);
    }
  };

  const submitScenarioAnswer = async (scenarioId: string) => {
    const answer = scenarioAnswers[scenarioId];
    if (!answer) return;

    setLoading(true);

    try {
      const scoringResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_score',
          question_id: scenarioId,
          user_answer: answer,
          scenarios_data: { scenarios, rubrics: scenarios.map(s => s.rubric) },
          partial_answer: false
        }
      });

      if (scoringResult.success) {
        setScoringResults(prev => ({
          ...prev,
          [scenarioId]: scoringResult.scoring_result
        }));

        // Move to next scenario or final report
        if (currentScenarioIndex < scenarios.length - 1) {
          setCurrentScenarioIndex(currentScenarioIndex + 1);
        } else {
          await generateFinalReport();
        }
      } else {
        throw new Error(scoringResult.error || 'Failed to score answer');
      }

    } catch (err) {
      console.error('❌ Scenario scoring failed:', err);
      setError('🤖 AI scoring is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 4: Performance Report Generation
  const generateFinalReport = async () => {
    setLoading(true);

    try {
      const allResults = Object.values(scoringResults);
      
      const reportResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_report',
          scoring_results: allResults,
          knowledge_analysis: knowledgeAnalysis,
          user_id: user?.id || 'demo-user'
        }
      });

      if (reportResult.success) {
        setPerformanceReport(reportResult.performance_report);
        moveToNextPhase();
      } else {
        throw new Error(reportResult.error || 'Failed to generate report');
      }

    } catch (err) {
      console.error('❌ Report generation failed:', err);
      setError('🤖 AI report generation is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Voice recording functionality (placeholder for future integration)
  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        processFile(file);
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const processFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    setLoading(true);
    setError(null);

    try {
      // Extract text from the uploaded PDF using pdfjs-dist with improved error handling
      const arrayBuffer = await file.arrayBuffer();
      
      let extractedTextCombined = '';
      let extractionSucceeded = true;
      
      try {
        // Try to load the PDF with PDF.js legacy build
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: 0 // Reduce console noise
        });
        
        const pdf = await loadingTask.promise;
        console.log(`✅ PDF loaded successfully: ${pdf.numPages} pages`);

        for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) { // Limit to first 10 pages
          try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = (textContent.items as any[]).map(item => item.str).join(' ');
            extractedTextCombined += pageText + '\n';
            
            // Limit to first ~20k chars to avoid oversize payloads
            if (extractedTextCombined.length > 20000) {
              extractedTextCombined = extractedTextCombined.substring(0, 20000);
              console.log(`📄 Text extraction stopped at ${extractedTextCombined.length} characters`);
              break;
            }
          } catch (pageError) {
            console.warn(`⚠️ Failed to extract text from page ${pageNum}:`, pageError);
            continue; // Skip this page and continue with others
          }
        }
        
        if (extractedTextCombined.length < 200) {
          throw new Error('Extracted text too short');
        }
        
        console.log(`✅ Text extraction completed: ${extractedTextCombined.length} characters`);
        
      } catch (pdfError) {
        extractionSucceeded = false;
        console.error('PDF.js extraction failed:', pdfError);
        setError('Failed to extract text from the PDF. Please try a different PDF or re-export the file to ensure text is selectable.');
        setLoading(false);
        return; // Abort further processing
      }

      if (!extractionSucceeded) return;

      setExtractedText(extractedTextCombined);

      // Call Enhanced Knowledge Extraction Agent with real extracted text
      console.log('🔍 Calling edge function with payload:', {
        action: 'know_me_start',
        pdf_content: extractedTextCombined.substring(0, 100) + '...',
        user_id: user?.id || 'demo-user'
      });

      const knowledgeResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_start',
          pdf_content: extractedTextCombined,
          user_id: user?.id || 'demo-user'
        }
      });

      console.log('📥 Edge function response:', knowledgeResult);

      if (knowledgeResult.success) {
        console.log('✅ Analysis successful:', knowledgeResult.knowledge_analysis);
        setKnowledgeAnalysis(knowledgeResult.knowledge_analysis);
        setProblemSolutionAnalysis(knowledgeResult.knowledge_analysis?.problem_solution_analysis || []);
        setKnowMeQuestions(knowledgeResult.knowledge_analysis?.know_me_questions || []);
        setLearningObjectives(knowledgeResult.knowledge_analysis?.learning_objectives || []);
        moveToNextPhase();
      } else {
        console.error('❌ Analysis failed:', knowledgeResult.error);
        throw new Error(knowledgeResult.error || 'Failed to analyze PDF');
      }

    } catch (err) {
      console.error('💥 Upload error:', err);
      setError(`Failed to process PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderPhaseIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {phases.map((phase, index) => {
          const Icon = phase.icon;
          return (
            <React.Fragment key={phase.id}>
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ 
                    scale: phase.status === 'active' ? 1.1 : 1, 
                    opacity: phase.status === 'pending' ? 0.5 : 1 
                  }}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${phase.status === 'completed' ? 'bg-green-500 text-white' :
                      phase.status === 'active' ? 'bg-indigo-500 text-white' :
                      'bg-gray-200 text-gray-500'}
                  `}
                >
                  {phase.status === 'completed' ? <CheckCircle size={24} /> : <Icon size={24} />}
                </motion.div>
                <span className="text-xs mt-2 text-center max-w-20">{phase.title}</span>
              </div>
              {index < phases.length - 1 && (
                <ArrowRight 
                  className={`
                    ${phase.status === 'completed' ? 'text-green-500' : 'text-gray-300'}
                  `}
                  size={20}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const renderPhase1Upload = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Study Material</h2>
        <p className="text-gray-600 text-lg">
          Upload your exam papers or study materials to begin the problem-based learning analysis
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            uploadedFile 
              ? 'border-green-300 bg-green-50' 
              : isDragOver
                ? 'border-indigo-500 bg-indigo-100 scale-105'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploadedFile ? (
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          )}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {uploadedFile ? 'PDF Ready for Analysis' : 'Upload PDF Document'}
          </h3>
          <p className="text-gray-600 mb-6">
            {uploadedFile 
              ? `File: ${uploadedFile.name}` 
              : isDragOver
                ? 'Drop your PDF file here to get started!'
                : 'Choose an exam paper or study material to analyze with AI, or drag and drop a PDF file here'
            }
          </p>
          
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
            id="file-upload"
            disabled={loading}
          />
          
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-all duration-200 cursor-pointer ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing PDF...
              </>
            ) : (
              <>
                <Upload className="mr-2" size={20} />
                Choose PDF File
              </>
            )}
          </label>

          <div className="mt-4 text-sm text-gray-500">
            <p>📄 Supported format: PDF files up to 20MB</p>
            <p>🔍 AI will analyze your content to create personalized learning experiences</p>
          </div>
        </div>

        {uploadedFile && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <span className="text-green-800 font-medium">
                    {uploadedFile.name}
                  </span>
                  <p className="text-sm text-green-600">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for AI analysis
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700">Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results Preview */}
      {problemSolutionAnalysis && problemSolutionAnalysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-xl p-6 border border-indigo-100"
        >
          <div className="flex items-center mb-6">
            <Brain className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">
              AI Analysis Preview
            </h3>
            <span className="ml-auto px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
              {problemSolutionAnalysis.length} problems identified
            </span>
          </div>
          <div className="grid gap-4">
            {problemSolutionAnalysis.slice(0, 3).map((analysis, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex-1">{analysis.technical_solution}</h4>
                  <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full whitespace-nowrap">
                    {analysis.problem_category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Problem:</span> {analysis.underlying_problem}
                </p>
                <p className="text-sm text-purple-600 italic">
                  <span className="font-medium">Life Connection:</span> {analysis.life_connection}
                </p>
              </div>
            ))}
            {problemSolutionAnalysis.length > 3 && (
              <div className="text-center">
                <span className="text-sm text-gray-500">
                  +{problemSolutionAnalysis.length - 3} more problems will be explored in the questionnaire
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderPhase2Questionnaire = () => {
    if (!knowMeQuestions || knowMeQuestions.length === 0) return null;

    const questions: KnowMeQuestion[] = knowMeQuestions;
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const allQuestionsAnswered = questions.every(q => questionnaireResponses[q.question_id]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Know Me Questions</h2>
          <p className="text-gray-600 text-lg">Help us understand your problem-solving approach through personal experiences</p>
          <div className="mt-4 text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length} • 5-7 minutes
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                Life Experience
              </span>
              <span className="ml-2">{currentQuestion.question_purpose}</span>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 mb-4">
              {currentQuestion.question_text}
            </h3>

            <textarea
              value={questionnaireResponses[currentQuestion.question_id] || ''}
              onChange={(e) => handleQuestionnaireResponse(currentQuestion.question_id, e.target.value)}
              placeholder="Share your thoughts and experiences..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentQuestionIndex ? 'bg-indigo-500' :
                    questionnaireResponses[questions[index].question_id] ? 'bg-green-500' :
                    'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {isLastQuestion ? (
              <button
                onClick={submitQuestionnaire}
                disabled={!allQuestionsAnswered || loading}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Processing...' : 'Generate Scenarios'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={!questionnaireResponses[currentQuestion.question_id]}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderPhase3Scenarios = () => {
    if (scenarios.length === 0) return null;

    const currentScenario = scenarios[currentScenarioIndex];
    const currentAnswer = scenarioAnswers[currentScenario.scenario_id] || '';
    const scoringResult = scoringResults[currentScenario.scenario_id];
    const hasResult = !!scoringResult;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Problem-Based Scenarios</h2>
          <p className="text-gray-600 text-lg">
            Apply your problem-solving skills to real-world scenarios based on your personal experiences
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Scenario {currentScenarioIndex + 1} of {scenarios.length}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Scenario */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">
                  {currentScenario.core_problem}
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                  {currentScenario.difficulty_level}
                </span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                  {currentScenario.estimated_time}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {currentScenario.scenario_title}
              </h3>

              <div className="bg-gray-50 border-l-4 border-indigo-500 p-4 mb-4">
                <p className="text-gray-700 leading-relaxed">
                  {currentScenario.scenario_description}
                </p>
              </div>

              <h4 className="font-semibold text-gray-900 mb-3">
                Question:
              </h4>
              <p className="text-gray-700 mb-6">
                {currentScenario.question}
              </p>

              {/* Problem Indicators */}
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-2">Key Indicators:</h5>
                <div className="flex flex-wrap gap-2">
                  {currentScenario.problem_indicators.map((indicator, index) => (
                    <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>

              {/* Answer Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Your Response:
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleRecording}
                      className={`p-2 rounded-full transition-colors ${
                        isRecording ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}
                      title="Voice input (coming soon)"
                    >
                      {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                    <span className="text-xs text-gray-500">
                      {currentAnswer.length} characters
                    </span>
                  </div>
                </div>

                <textarea
                  value={currentAnswer}
                  onChange={(e) => handleScenarioAnswer(currentScenario.scenario_id, e.target.value)}
                  placeholder="Focus on identifying the core problem and explaining your approach..."
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                {!hasResult && (
                  <button
                    onClick={() => submitScenarioAnswer(currentScenario.scenario_id)}
                    disabled={!currentAnswer.trim() || loading}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Scoring...' : 'Submit Answer'}
                  </button>
                )}
              </div>
            </div>

            {/* Scoring Results */}
            {hasResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6"
              >
                <h4 className="font-semibold text-green-800 mb-4">
                  ✓ Scored: {scoringResult.percentage}% ({scoringResult.total_score}/{scoringResult.total_possible})
                </h4>
                <p className="text-gray-700 mb-4">{scoringResult.overall_feedback}</p>

                  <div className="space-y-2">
                  {scoringResult.feedback_items.map((item: any, index: number) => (
                    <div key={index} className={`flex items-start space-x-2 ${
                      item.type === 'positive' ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      <span className="text-sm">{item.message}</span>
                      </div>
                    ))}
                </div>

                {currentScenarioIndex < scenarios.length - 1 && (
                  <button
                    onClick={() => setCurrentScenarioIndex(currentScenarioIndex + 1)}
                    className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Next Scenario
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* Hints Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Lightbulb className="mr-2" size={20} />
              Real-time Hints
            </h4>
            
            {realTimeHints.length > 0 ? (
              <div className="space-y-3">
                {realTimeHints.map((hint, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-800">{hint}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Start typing your response to get personalized hints...
              </p>
            )}

            {/* Progress */}
            <div className="mt-6">
              <h5 className="font-medium text-gray-900 mb-2">Progress</h5>
              <div className="space-y-2">
                {scenarios.map((scenario, index) => (
                  <div key={scenario.scenario_id} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      index === currentScenarioIndex ? 'bg-indigo-500' :
                      scoringResults[scenario.scenario_id] ? 'bg-green-500' :
                      'bg-gray-200'
                    }`} />
                    <span className="text-sm text-gray-600">
                      Scenario {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderPhase4Report = () => {
    if (!performanceReport) return null;

    const metrics = performanceReport.overall_metrics;
    const insights = performanceReport.predictive_insights;
    const categoryBreakdown = performanceReport.problem_category_breakdown;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Performance Report</h2>
          <p className="text-gray-600 text-lg">
            Discover how personalized, experience-based learning transforms your understanding
          </p>
        </div>

        {/* Core Problems Resolved Section */}
        {performanceReport.core_problems_resolved && (
          <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Lightbulb className="mr-2 text-indigo-600" size={20} />
              Core Learning Problems Resolved
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(performanceReport.core_problems_resolved).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-sm text-gray-600">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Metrics */}
            <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="mr-2" size={20} />
                Overall Performance
              </h3>
              
            <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                  {metrics.problem_solving_score}%
                  </div>
                <div className="text-sm text-gray-500">Problem-Solving Score</div>
                </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {metrics.scenarios_completed}
                  </div>
                  <div className="text-xs text-gray-500">Scenarios Completed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {metrics.consistency_rating}/10
                  </div>
                  <div className="text-xs text-gray-500">Consistency</div>
                </div>
              </div>

                <div className="text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  metrics.confidence_level === 'high' ? 'bg-green-100 text-green-800' :
                  metrics.confidence_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {metrics.confidence_level.toUpperCase()} CONFIDENCE
                </span>
                  </div>
                </div>
              </div>

          {/* Predictive Insights */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Predictive Insights
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Exam Readiness</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Predicted Performance:</span>
                    <span className="font-medium">{insights.predicted_exam_performance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Readiness Status:</span>
                    <span className={`font-medium ${
                      insights.exam_readiness === 'ready' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {insights.exam_readiness.toUpperCase()}
                    </span>
                </div>
              </div>
            </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Problem-Solving Pattern</h4>
                <p className="text-sm text-gray-600">{insights.problem_solving_pattern}</p>
                    </div>
                    </div>

            {/* Key Insights - Enhanced */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Key Learning Insights</h4>
              <div className="space-y-2">
                {insights.key_insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-indigo-50 rounded">
                    <CheckCircle className="text-indigo-600 mt-0.5" size={16} />
                    <span className="text-sm text-gray-700">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Strongest Areas</h4>
                <div className="space-y-1">
                  {insights.strongest_problem_areas.map((area, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Star className="text-green-500" size={16} />
                      <span className="text-sm text-gray-700">{area}</span>
                  </div>
                ))}
              </div>
            </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Focus Areas</h4>
                <div className="space-y-1">
                  {insights.areas_needing_focus.map((area, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <AlertCircle className="text-yellow-500" size={16} />
                      <span className="text-sm text-gray-700">{area}</span>
                  </div>
                ))}
                </div>
              </div>
              </div>
            </div>
          </div>

        {/* Problem Category Breakdown */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="mr-2" size={20} />
            Problem Category Performance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryBreakdown).map(([category, data]: [string, any]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Score:</span>
                    <span className="font-medium">{data.average_score}%</span>
                    </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Scenarios:</span>
                    <span className="font-medium">{data.scenarios_completed}</span>
                </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Readiness:</span>
                    <span className={`font-medium ${
                      data.real_world_readiness === 'high' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {data.real_world_readiness.toUpperCase()}
                    </span>
              </div>
                  {data.core_problem_addressed && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <span className="font-medium text-blue-800">Problem Addressed:</span>
                      <div className="text-blue-700">{data.core_problem_addressed}</div>
                    </div>
                  )}
                  {data.learning_transformation && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                      <span className="font-medium text-green-800">Learning Transformation:</span>
                      <div className="text-green-700">{data.learning_transformation}</div>
                    </div>
                  )}
                </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Study Recommendations */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="mr-2" size={20} />
            Study Recommendations
              </h3>
              
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Priority Problems</h4>
              <div className="space-y-2">
                {performanceReport.study_recommendations.priority_problems.map((problem: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    <span className="text-sm text-gray-700">{problem}</span>
                  </div>
                    ))}
                  </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommended Approaches</h4>
              <div className="space-y-2">
                {performanceReport.study_recommendations.recommended_approaches.map((approach: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-700">{approach}</span>
                </div>
              ))}
            </div>
              </div>
            </div>

          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="text-indigo-600" size={20} />
              <span className="font-medium text-indigo-900">
                Estimated Prep Time: {performanceReport.study_recommendations.estimated_prep_time}
              </span>
            </div>
            <p className="text-sm text-indigo-700 mt-2">
              Focus Areas: {performanceReport.study_recommendations.focus_areas}
            </p>
            {performanceReport.study_recommendations.personalization_success && (
              <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                <div className="flex items-center space-x-2">
                  <Star className="text-green-600" size={16} />
                  <span className="font-medium text-green-900">Personalization Success</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {performanceReport.study_recommendations.personalization_success}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Improvement Areas with Core Problem Resolution */}
        {performanceReport.improvement_areas && performanceReport.improvement_areas.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Learning Transformation Areas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performanceReport.improvement_areas.map((area: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{area.problem_category}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Score:</span>
                      <span className="font-medium">{area.current_score}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Improvement Potential:</span>
                      <span className={`font-medium ${
                        area.improvement_potential === 'high' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {area.improvement_potential.toUpperCase()}
                      </span>
                    </div>
                    {area.core_problem_being_resolved && (
                      <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                        <span className="font-medium text-purple-800">Transformation:</span>
                        <div className="text-purple-700">{area.core_problem_being_resolved}</div>
                      </div>
                    )}
                    {area.life_experience_connections && area.life_experience_connections.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-600">Experience Connections:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {area.life_experience_connections.map((connection: string, idx: number) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {connection}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 0:
        return renderPhase1Upload();
      case 1:
        return renderPhase2Questionnaire();
      case 2:
        return renderPhase3Scenarios();
      case 3:
        return renderPhase4Report();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enhanced Know Me Feature
          </h1>
          <p className="text-xl text-gray-600">
            Problem-based learning through personal experience connections
          </p>
        </div>

        {renderPhaseIndicator()}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 rounded-lg p-4 ${
                error.includes('🤖') 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center">
                {error.includes('🤖') ? (
                  <Brain className="text-blue-500 mr-2" size={20} />
                ) : (
                  <AlertCircle className="text-red-500 mr-2" size={20} />
                )}
                <span className={error.includes('🤖') ? 'text-blue-800' : 'text-red-800'}>
                  {error}
                </span>
              </div>
              {error.includes('🤖') && (
                <div className="mt-2 text-sm text-blue-700">
                  Our AI is temporarily unavailable. Please try again in a few moments, or contact support if the issue persists.
                </div>
              )}
            </motion.div>
          )}

        <AnimatePresence mode="wait">
          {renderCurrentPhase()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KnowMePage; 