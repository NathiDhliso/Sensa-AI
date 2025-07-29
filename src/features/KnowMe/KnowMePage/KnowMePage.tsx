import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { callEdgeFunction } from '../../../services/edgeFunctions';
import { uploadService, uploadConfigs } from '../../../services/uploadService';
import { UnifiedUpload, BackButton } from '../../../components';
import {
  usePageTheme
} from '../../../contexts/themeUtils';

// Upload service is configured in the service file

// Enhanced Types for Problem-Based Learning
interface KnowMePhase {
  id: string;
  title: string;
  description: string;
  icon: any; // Lucide icon component
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
  rubric?: Record<string, unknown>;
}

interface ScoringResult {
  question_id: string;
  total_score: number;
  total_possible: number;
  percentage: number;
  detailed_scores: Record<string, unknown>[];
  feedback_items: Record<string, unknown>[];
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
  problem_category_breakdown: Record<string, unknown>;
  predictive_insights: {
    predicted_exam_performance: string;
    strongest_problem_areas: string[];
    areas_needing_focus: string[];
    problem_solving_pattern: string;
    exam_readiness: string;
    key_insights: string[];
  };
  improvement_areas: Record<string, unknown>[];
  study_recommendations: Record<string, unknown>;
  core_problems_resolved?: Record<string, string>;
}

// Consolidated state management for KnowMe workflow
interface KnowMeWorkflow {
  // Phase management
  currentPhase: number;
  phases: KnowMePhase[];
  
  // Phase 1: Upload & Analysis
  upload: {
    file: File | null;
    knowledgeAnalysis: Record<string, unknown> | null;
    problemSolutionAnalysis: ProblemSolutionAnalysis[];
    questions: KnowMeQuestion[];
    isDragOver: boolean;
  };
  
  // Phase 2: Questionnaire
  questionnaire: {
    responses: Record<string, string>;
    currentQuestionIndex: number;
  };
  
  // Phase 3: Scenarios
  scenarios: {
    data: Scenario[];
    currentIndex: number;
    answers: Record<string, string>;
    scoringResults: Record<string, ScoringResult>;
    realTimeHints: string[];
    isRecording: boolean;
  };
  
  // Phase 4: Report
  report: {
    data: PerformanceReport | null;
  };
  
  // UI state
  ui: {
    loading: boolean;
  };
}

const KnowMePage: React.FC = () => {
  const { user } = useAuthStore();
  
  // Consolidated state management
  const [workflow, setWorkflow] = useState<KnowMeWorkflow>({
    currentPhase: 0,
    phases: [
      { id: 'upload', title: 'Upload Material', description: 'Upload your exam PDF', icon: Upload, status: 'active' },
      { id: 'questionnaire', title: 'Know Me Questions', description: 'Share your experiences', icon: Brain, status: 'pending' },
      { id: 'scenarios', title: 'Problem Scenarios', description: 'Apply your knowledge', icon: Target, status: 'pending' },
      { id: 'report', title: 'Performance Report', description: 'Your insights', icon: BarChart3, status: 'pending' }
    ],
    upload: {
      file: null,
      knowledgeAnalysis: null,
      problemSolutionAnalysis: [],
      questions: [],
      isDragOver: false,
    },
    questionnaire: {
      responses: {},
      currentQuestionIndex: 0,
    },
    scenarios: {
      data: [],
      currentIndex: 0,
      answers: {},
      scoringResults: {},
      realTimeHints: [],
      isRecording: false,
    },
    report: {
      data: null,
    },
    ui: {
      loading: false,
    },
  });

  // Helper functions to update specific parts of the workflow
  const updateWorkflow = (updates: Partial<KnowMeWorkflow>) => {
    setWorkflow(prev => ({ ...prev, ...updates }));
  };

  const updateUpload = (updates: Partial<KnowMeWorkflow['upload']>) => {
    setWorkflow(prev => ({ ...prev, upload: { ...prev.upload, ...updates } }));
  };

  const updateQuestionnaire = (updates: Partial<KnowMeWorkflow['questionnaire']>) => {
    setWorkflow(prev => ({ ...prev, questionnaire: { ...prev.questionnaire, ...updates } }));
  };

  const updateScenarios = (updates: Partial<KnowMeWorkflow['scenarios']>) => {
    setWorkflow(prev => ({ ...prev, scenarios: { ...prev.scenarios, ...updates } }));
  };

  const updateReport = (updates: Partial<KnowMeWorkflow['report']>) => {
    setWorkflow(prev => ({ ...prev, report: { ...prev.report, ...updates } }));
  };

  const updateUI = (updates: Partial<KnowMeWorkflow['ui']>) => {
    setWorkflow(prev => ({ ...prev, ui: { ...prev.ui, ...updates } }));
  };

  // Use the modular theme system
  const pageTheme = usePageTheme('knowMe');

  // Destructure values from workflow state
  const { 
    currentPhase, 
    phases, 
    upload: { file: uploadedFile, problemSolutionAnalysis, questions: knowMeQuestions, isDragOver },
    questionnaire: { responses: questionnaireResponses, currentQuestionIndex },
    scenarios: { data: scenarios, currentIndex: currentScenarioIndex, answers: scenarioAnswers, scoringResults, realTimeHints, isRecording },
    report: { data: performanceReport },
    ui: { loading }
  } = workflow;

  const updatePhaseStatus = (phaseIndex: number, status: 'pending' | 'active' | 'completed') => {
    updateWorkflow({
      phases: workflow.phases.map((phase, index) => 
        index === phaseIndex ? { ...phase, status } : phase
      )
    });
  };

  const moveToNextPhase = () => {
    updatePhaseStatus(workflow.currentPhase, 'completed');
    if (workflow.currentPhase < workflow.phases.length - 1) {
      const nextPhase = workflow.currentPhase + 1;
      updateWorkflow({ currentPhase: nextPhase });
      updatePhaseStatus(nextPhase, 'active');
    }
  };

  // File upload is now handled by the UnifiedUpload component

  // Phase 2: Questionnaire Processing
  const handleQuestionnaireResponse = (questionId: string, answer: string) => {
    updateQuestionnaire({
      responses: {
        ...workflow.questionnaire.responses,
        [questionId]: answer
      }
    });
  };

  const submitQuestionnaire = async () => {
    updateUI({ loading: true });

    try {
      const responses = Object.entries(workflow.questionnaire.responses).map(([questionId, answer]) => ({
        question_id: questionId,
        answer: answer,
        question: workflow.upload.questions?.find((q: KnowMeQuestion) => q.question_id === questionId)?.question_text || ''
      }));

      const scenarioResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_questionnaire',
          questionnaire_responses: { responses },
          knowledge_analysis: workflow.upload.knowledgeAnalysis,
          user_id: user?.id
        }
      });

      if (scenarioResult.success) {
        updateScenarios({ data: scenarioResult.scenarios?.scenarios || [] });
        moveToNextPhase();
      } else {
        throw new Error(scenarioResult.error || 'Failed to generate scenarios');
      }

    } catch (err) {
      console.error('❌ Questionnaire submission failed:', err);
    } finally {
      updateUI({ loading: false });
    }
  };

  // Phase 3: Scenario Questions with Real-time Scoring
  const handleScenarioAnswer = (scenarioId: string, answer: string) => {
    updateScenarios({
      answers: {
        ...workflow.scenarios.answers,
        [scenarioId]: answer
      }
    });

    // Trigger real-time hints if answer is substantial enough
    if (answer.length > 50) {
      provideLiveHints(scenarioId, answer);
    }
  };

  const provideLiveHints = async (scenarioId: string, partialAnswer: string) => {
    try {
      const scenario = workflow.scenarios.data.find(s => s.scenario_id === scenarioId);
      if (!scenario) return;

      const hintResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_score',
          question_id: scenarioId,
          user_answer: partialAnswer,
          scenarios_data: { scenarios: workflow.scenarios.data, rubrics: workflow.scenarios.data.map(s => s.rubric) },
          partial_answer: true
        }
      });

      if (hintResult.success && hintResult.scoring_result?.hints) {
        updateScenarios({ realTimeHints: hintResult.scoring_result.hints });
      }
    } catch (err) {
      console.error('❌ Real-time hints failed:', err);
      // Clear hints when AI is unavailable
      updateScenarios({ realTimeHints: [] });
    }
  };

  const submitScenarioAnswer = async (scenarioId: string) => {
    const answer = workflow.scenarios.answers[scenarioId];
    if (!answer) return;

    updateUI({ loading: true });

    try {
      const scoringResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_score',
          question_id: scenarioId,
          user_answer: answer,
          scenarios_data: { scenarios: workflow.scenarios.data, rubrics: workflow.scenarios.data.map(s => s.rubric) },
          partial_answer: false
        }
      });

      if (scoringResult.success) {
        updateScenarios({
          scoringResults: {
            ...workflow.scenarios.scoringResults,
            [scenarioId]: scoringResult.scoring_result
          }
        });

        // Move to next scenario or final report
        if (workflow.scenarios.currentIndex < workflow.scenarios.data.length - 1) {
          updateScenarios({ currentIndex: workflow.scenarios.currentIndex + 1 });
        } else {
          await generateFinalReport();
        }
      } else {
        throw new Error(scoringResult.error || 'Failed to score answer');
      }

    } catch (err) {
      console.error('❌ Scenario scoring failed:', err);
    } finally {
      updateUI({ loading: false });
    }
  };

  // Phase 4: Performance Report Generation
  const generateFinalReport = async () => {
    updateUI({ loading: true });

    try {
      const allResults = Object.values(workflow.scenarios.scoringResults);
      
      const reportResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_report',
          scoring_results: allResults,
          knowledge_analysis: workflow.upload.knowledgeAnalysis,
          user_id: user?.id
        }
      });

      if (reportResult.success) {
        updateReport({ data: reportResult.performance_report });
        moveToNextPhase();
      } else {
        throw new Error(reportResult.error || 'Failed to generate report');
      }

    } catch (err) {
      console.error('❌ Report generation failed:', err);
    } finally {
      updateUI({ loading: false });
    }
  };

  // Voice recording functionality (placeholder for future integration)
  const toggleRecording = () => {
    updateScenarios({ isRecording: !workflow.scenarios.isRecording });
  };

  // Drag and drop is now handled by the UnifiedUpload component

  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) {
      console.error('No files provided');
      return;
    }

    updateUI({ loading: true });

    try {
      // Process files using the centralized upload service
      const uploadResult = await uploadService.processFiles(files, uploadConfigs.knowMe);
      
      if (uploadResult.errors.length > 0) {
        console.warn('Upload errors:', uploadResult.errors);
      }

      const successfulFiles = uploadResult.files.filter(f => f.status === 'success');
      
      if (successfulFiles.length === 0) {
        throw new Error('No files were successfully processed');
      }

      // Use the first successful file
      const processedFile = successfulFiles[0];
      updateUpload({ file: processedFile.file });

      // Call Enhanced Knowledge Extraction Agent with extracted text
      console.log('🔍 Calling edge function with payload:', {
        action: 'know_me_start',
        pdf_content: uploadResult.totalExtractedText.substring(0, 100) + '...',
        user_id: user?.id
      });

      const knowledgeResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_start',
          pdf_content: uploadResult.totalExtractedText,
          user_id: user?.id
        }
      });

      console.log('📥 Edge function response:', knowledgeResult);

      if (knowledgeResult.success) {
        console.log('✅ Analysis successful:', knowledgeResult.knowledge_analysis);
        updateUpload({ 
          knowledgeAnalysis: knowledgeResult.knowledge_analysis,
          problemSolutionAnalysis: knowledgeResult.knowledge_analysis?.problem_solution_analysis || [],
          questions: knowledgeResult.knowledge_analysis?.know_me_questions || []
        });
        moveToNextPhase();
      } else {
        console.error('❌ Analysis failed:', knowledgeResult.error);
        throw new Error(knowledgeResult.error || 'Failed to analyze PDF');
      }

    } catch (err) {
      console.error('💥 Upload error:', err);
      console.error(`Failed to process files: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      updateUI({ loading: false });
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

      <UnifiedUpload
        onFileUpload={processFiles}
        acceptedTypes={['application/pdf']}
        maxFileSize={20}
        maxFiles={1}
        showPasteOption={false}
        title="Upload PDF Document"
        description="Choose an exam paper or study material to analyze with AI, or drag and drop a PDF file here"
        theme="default"
        className="mb-8"
      />

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
              onClick={() => updateQuestionnaire({ currentQuestionIndex: Math.max(0, currentQuestionIndex - 1) })}
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
                onClick={() => updateQuestionnaire({ currentQuestionIndex: Math.min(questions.length - 1, currentQuestionIndex + 1) })}
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
                  {scoringResult.feedback_items.map((item: Record<string, unknown>, index: number) => (
                    <div key={index} className={`flex items-start space-x-2 ${
                      item.type === 'positive' ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      <span className="text-sm">{item.message}</span>
                      </div>
                    ))}
                </div>

                {currentScenarioIndex < scenarios.length - 1 && (
                  <button
                    onClick={() => updateScenarios({ currentIndex: currentScenarioIndex + 1 })}
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
              {Object.entries(performanceReport.core_problems_resolved).map(([key, value]: [string, unknown]) => (
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
            {Object.entries(categoryBreakdown).map(([category, data]: [string, Record<string, unknown>]) => (
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
              {performanceReport.improvement_areas.map((area: Record<string, unknown>, index: number) => (
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
    <div className={`min-h-screen ${pageTheme.background}`}>
      {/* Back Button */}
      <BackButton variant="floating" />

      {renderPhaseIndicator()}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {renderCurrentPhase()}
      </div>
    </div>
  );
};

export default KnowMePage; 