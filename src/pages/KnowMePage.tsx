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
  Award,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { callEdgeFunction } from '../services/edgeFunctions';

// Types
interface KnowMePhase {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'active' | 'completed';
}

interface CoreTopic {
  topic_name: string;
  description: string;
  key_concepts: string[];
  difficulty_level: string;
  prerequisites: string[];
  estimated_study_time: string;
}

interface Question {
  id: string;
  type: string;
  question: string;
  purpose: string;
  related_topics: string[];
}

interface Scenario {
  scenario_id: string;
  topic_name: string;
  scenario_title: string;
  scenario_description: string;
  question: string;
  context_type: string;
  difficulty_level: string;
  key_concepts_tested: string[];
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
    estimated_exam_score: number;
    confidence_level: string;
    total_questions_answered: number;
  };
  topic_breakdown: Record<string, any>;
  predictive_insights: {
    predicted_exam_score: string;
    strongest_areas: string[];
    weakest_areas: string[];
    exam_readiness: string;
    key_insights: string[];
  };
  improvement_areas: any[];
  study_recommendations: any;
}

const KnowMePage: React.FC = () => {
  const { user } = useAuthStore();
  
  // Phase management
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phases, setPhases] = useState<KnowMePhase[]>([
    { id: 'upload', title: 'Upload Material', description: 'Upload your study PDF', icon: Upload, status: 'active' },
    { id: 'questionnaire', title: 'Know Me Questions', description: 'Tell us about yourself', icon: Brain, status: 'pending' },
    { id: 'scenarios', title: 'Scenario Questions', description: 'Apply your knowledge', icon: Target, status: 'pending' },
    { id: 'report', title: 'Performance Report', description: 'Your personalized insights', icon: BarChart3, status: 'pending' }
  ]);

  // Phase 1: PDF Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [knowledgeAnalysis, setKnowledgeAnalysis] = useState<any>(null);
  const [coreTopics, setCoreTopics] = useState<CoreTopic[]>([]);
  const [questionnaire, setQuestionnaire] = useState<any>(null);

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

  // Phase 1: PDF Upload and Analysis
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    setLoading(true);
    setError(null);

    try {
      // Extract text from PDF (simplified - in real implementation, use PDF.js or similar)
      const formData = new FormData();
      formData.append('file', file);
      
      // For demo purposes, we'll simulate PDF text extraction
      const simulatedText = `
        This is a sample study material about ${file.name.replace('.pdf', '')}. 
        It covers various topics including fundamental concepts, practical applications, 
        and advanced techniques. The material is designed for intermediate to advanced learners 
        and includes real-world examples and case studies.
      `;
      
      setExtractedText(simulatedText);

      // Call Knowledge Extraction Agent
      const knowledgeResult = await callEdgeFunction('adk-agents', {
        payload: {
          action: 'know_me_start',
          pdf_content: simulatedText,
          user_id: user?.id || 'demo-user'
        }
      });

      if (knowledgeResult.success) {
        setKnowledgeAnalysis(knowledgeResult.knowledge_analysis);
        setCoreTopics(knowledgeResult.knowledge_analysis?.core_topics || []);
        setQuestionnaire(knowledgeResult.knowledge_analysis?.questionnaire);
        moveToNextPhase();
      } else {
        throw new Error(knowledgeResult.error || 'Failed to analyze PDF');
      }

    } catch (err) {
      setError(`Failed to process PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
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
        question: questionnaire?.questions?.find((q: Question) => q.id === questionId)?.question || ''
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
      setError(`Failed to process questionnaire: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      console.error('Failed to get real-time hints:', err);
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
      setError(`Failed to score answer: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      setError(`Failed to generate report: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Voice recording functionality (placeholder for future Eleven Labs integration)
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Integrate with Eleven Labs voice-to-text
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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Study Material</h2>
        <p className="text-gray-600 text-lg">
          Upload a PDF of your course material or exam guide to get started with personalized preparation
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {uploadedFile ? (
          <div className="space-y-4">
            <FileText className="mx-auto text-green-500" size={48} />
            <div>
              <p className="font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {loading && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                <span className="text-sm text-gray-600">Analyzing PDF content...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="mx-auto text-gray-400" size={48} />
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Choose PDF File
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Supported format: PDF (max 50MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {coreTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6"
        >
          <h3 className="font-semibold text-green-800 mb-4">
            ✓ Identified {coreTopics.length} Core Topics:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coreTopics.map((topic, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-900">{topic.topic_name}</h4>
                <p className="text-sm text-gray-600">{topic.description}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs rounded">
                  {topic.difficulty_level}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderPhase2Questionnaire = () => {
    if (!questionnaire?.questions) return null;

    const questions: Question[] = questionnaire.questions;
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const allQuestionsAnswered = questions.every(q => questionnaireResponses[q.id]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{questionnaire.title}</h2>
          <p className="text-gray-600 text-lg">{questionnaire.description}</p>
          <div className="mt-4 text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length} • {questionnaire.estimated_time}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                {currentQuestion.type}
              </span>
              <span className="ml-2">{currentQuestion.purpose}</span>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 mb-4">
              {currentQuestion.question}
            </h3>

            <textarea
              value={questionnaireResponses[currentQuestion.id] || ''}
              onChange={(e) => handleQuestionnaireResponse(currentQuestion.id, e.target.value)}
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
                    questionnaireResponses[questions[index].id] ? 'bg-green-500' :
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
                disabled={!questionnaireResponses[currentQuestion.id]}
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Scenario-Based Questions</h2>
          <p className="text-gray-600 text-lg">
            Apply your knowledge to real-world scenarios based on your personal experiences
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
                  {currentScenario.topic_name}
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
                  placeholder="Explain your approach, reasoning, and solution..."
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  disabled={hasResult}
                />

                {!hasResult && (
                  <button
                    onClick={() => submitScenarioAnswer(currentScenario.scenario_id)}
                    disabled={currentAnswer.length < 50 || loading}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Scoring...' : 'Submit Answer'}
                  </button>
                )}
              </div>
            </div>

            {/* Scoring Results */}
            {hasResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t pt-6"
              >
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800">Score Results</h4>
                    <div className="flex items-center space-x-2">
                      <Star className="text-yellow-500" size={20} />
                      <span className="text-2xl font-bold text-green-700">
                        {scoringResult.percentage}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-green-700 mb-3">
                    {scoringResult.overall_feedback}
                  </p>

                  <div className="space-y-2">
                    {scoringResult.feedback_items?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        {item.type === 'positive' && <CheckCircle className="text-green-500" size={16} />}
                        {item.type === 'bonus' && <Star className="text-yellow-500" size={16} />}
                        {item.type === 'missing' && <AlertCircle className="text-orange-500" size={16} />}
                        <span className={
                          item.type === 'positive' ? 'text-green-700' :
                          item.type === 'bonus' ? 'text-yellow-700' :
                          'text-orange-700'
                        }>
                          {item.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {currentScenarioIndex < scenarios.length - 1 ? (
                  <button
                    onClick={() => setCurrentScenarioIndex(currentScenarioIndex + 1)}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Next Scenario →
                  </button>
                ) : (
                  <button
                    onClick={generateFinalReport}
                    disabled={loading}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Generating Report...' : 'View Performance Report'}
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Progress</h3>
              <div className="space-y-2">
                {scenarios.map((scenario, index) => (
                  <div
                    key={scenario.scenario_id}
                    className={`flex items-center space-x-2 p-2 rounded ${
                      index === currentScenarioIndex ? 'bg-indigo-50 border border-indigo-200' :
                      scoringResults[scenario.scenario_id] ? 'bg-green-50' :
                      'bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      scoringResults[scenario.scenario_id] ? 'bg-green-500' :
                      index === currentScenarioIndex ? 'bg-indigo-500' :
                      'bg-gray-300'
                    }`} />
                    <span className="text-sm font-medium truncate">
                      {scenario.topic_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Hints */}
            {realTimeHints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="text-yellow-600" size={20} />
                  <h3 className="font-semibold text-yellow-800">Live Hints</h3>
                </div>
                <div className="space-y-2">
                  {realTimeHints.map((hint, index) => (
                    <p key={index} className="text-sm text-yellow-700">
                      {hint}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Key Concepts */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Key Concepts</h3>
              <div className="space-y-2">
                {currentScenario.key_concepts_tested?.map((concept, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                    <span className="text-sm text-gray-700">{concept}</span>
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

    const { overall_metrics, topic_breakdown, predictive_insights, improvement_areas, study_recommendations } = performanceReport;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Performance Report</h2>
          <p className="text-gray-600 text-lg">
            Personalized insights and recommendations for your exam preparation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Performance */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="mr-2 text-indigo-500" />
                Overall Performance
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                    {overall_metrics.estimated_exam_score}%
                  </div>
                  <div className="text-sm text-gray-600">Estimated Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {overall_metrics.confidence_level}
                  </div>
                  <div className="text-sm text-gray-600">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {overall_metrics.total_questions_answered}
                  </div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {predictive_insights.exam_readiness}
                  </div>
                  <div className="text-sm text-gray-600">Readiness</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Predicted Exam Score Range</h4>
                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded">
                  <p className="text-indigo-800 font-medium">
                    {predictive_insights.predicted_exam_score}
                  </p>
                </div>
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Topic Performance</h3>
              <div className="space-y-4">
                {Object.entries(topic_breakdown).map(([topic, data]: [string, any]) => (
                  <div key={topic} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">{topic}</h4>
                      <span className="text-lg font-bold text-indigo-600">
                        {data.average_score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${data.average_score}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {data.total_questions} questions • Range: {data.score_range}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h3>
              <div className="space-y-3">
                {predictive_insights.key_insights?.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Strengths & Weaknesses */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Strengths & Areas to Improve</h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-green-700 mb-2 flex items-center">
                  <Award className="mr-1" size={16} />
                  Strongest Areas
                </h4>
                <div className="space-y-1">
                  {predictive_insights.strongest_areas?.map((area, index) => (
                    <div key={index} className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                      {area}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-orange-700 mb-2 flex items-center">
                  <Target className="mr-1" size={16} />
                  Areas to Improve
                </h4>
                <div className="space-y-1">
                  {predictive_insights.weakest_areas?.map((area, index) => (
                    <div key={index} className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Study Recommendations */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="mr-2" />
                Study Plan
              </h3>
              
              {improvement_areas?.map((area, index) => (
                <div key={index} className="mb-4 p-3 bg-gray-50 rounded">
                  <h4 className="font-medium text-gray-900 text-sm">{area.topic}</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Priority: {area.priority_level} • {area.estimated_improvement_time}
                  </p>
                  <div className="space-y-1">
                    {area.specific_actions?.slice(0, 2).map((action: string, i: number) => (
                      <p key={i} className="text-xs text-gray-700">• {action}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="font-bold mb-4">Next Steps</h3>
              <div className="space-y-3">
                <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded transition-colors">
                  Download Full Report
                </button>
                <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded transition-colors">
                  Create Study Schedule
                </button>
                <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded transition-colors">
                  Take Another Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Know Me Assessment
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform any PDF into a personalized exam preparation experience. 
            Our AI analyzes your study material and creates scenarios based on your personal experiences.
          </p>
        </div>

        {/* Phase Indicator */}
        {renderPhaseIndicator()}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2"
            >
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              <div className="text-red-700">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase Content */}
        <AnimatePresence mode="wait">
          {currentPhase === 0 && renderPhase1Upload()}
          {currentPhase === 1 && renderPhase2Questionnaire()}
          {currentPhase === 2 && renderPhase3Scenarios()}
          {currentPhase === 3 && renderPhase4Report()}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Sensa AI • Privacy-focused personalized learning</p>
        </div>
      </div>
    </div>
  );
};

export default KnowMePage; 