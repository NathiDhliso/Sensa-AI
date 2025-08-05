import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Target,
  Search,
  Lightbulb,
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';
import { useThemeClasses } from '../../contexts/themeUtils';
import { useUIStore } from '../../stores';
import { supabaseServices } from '../../services';
import { Button } from '../../components';

interface AnalysisState {
  initialSolution: string;
  standardResults: string[];
  childFriendlyResults: string[];
  isLoading: boolean;
  currentView: 'standard' | 'child-friendly';
  error: string | null;
  progress: {
    currentStep: number;
    totalSteps: number;
    currentStepName: string;
  };
}

interface RootProblemModalProps {
  nodeId: string;
  nodeLabel: string;
  onProblemSelect: (problem: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  initialSolution?: string;
  isMinimized?: boolean;
}

const RootProblemModal: React.FC<RootProblemModalProps> = ({
  nodeId,
  nodeLabel,
  onProblemSelect,
  onClose,
  onMinimize,
  initialSolution = '',
  isMinimized = false
}) => {
  const themeClasses = useThemeClasses();
  const { theme, addNotification } = useUIStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const [analysis, setAnalysis] = useState<AnalysisState>({
    initialSolution: initialSolution || nodeLabel || '',
    standardResults: [],
    childFriendlyResults: [],
    isLoading: false,
    currentView: 'standard',
    error: null,
    progress: {
      currentStep: 0,
      totalSteps: 10, // 5 steps for each analysis type
      currentStepName: ''
    }
  });

  // Effect to update initial solution when props change
  useEffect(() => {
    const newInitialSolution = initialSolution || nodeLabel || '';
    if (newInitialSolution !== analysis.initialSolution) {
      setAnalysis(prev => ({
        ...prev,
        initialSolution: newInitialSolution
      }));
    }
  }, [initialSolution, nodeLabel]);

  // Standard prompts for 5-Why analysis - STRICT single sentence responses only
  const standardPrompts = [
    'IMPORTANT: Answer in exactly ONE sentence only. No explanations, no lists, no elaboration. What specific technical problem does this solution address? Solution: "${context}"',
    'IMPORTANT: Answer in exactly ONE sentence only. No explanations, no elaboration. The problem is: "${context}". Why does this problem impact users or systems?',
    'IMPORTANT: Answer in exactly ONE sentence only. No explanations, no elaboration. It impacts because: "${context}". What causes this impact to occur?',
    'IMPORTANT: Answer in exactly ONE sentence only. No explanations, no elaboration. The cause is: "${context}". Why does this cause exist?',
    'IMPORTANT: Answer in exactly ONE sentence only. No explanations, no elaboration. It exists because: "${context}". What is the fundamental root cause?'
  ];

  // Child-friendly prompts for 5-Why analysis - STRICT single sentence responses only
  const childFriendlyPrompts = [
    'IMPORTANT: Answer in exactly ONE simple sentence only. No explanations, no lists. Here\'s an idea: "${context}". What problem is it trying to fix?',
    'IMPORTANT: Answer in exactly ONE simple sentence only. No explanations. The problem is: "${context}". Why is that a big deal?',
    'IMPORTANT: Answer in exactly ONE simple sentence only. No explanations. It\'s a problem because: "${context}". Why does that happen?',
    'IMPORTANT: Answer in exactly ONE simple sentence only. No explanations. It happens because: "${context}". Why doesn\'t someone just fix that?',
    'IMPORTANT: Answer in exactly ONE simple sentence only. No explanations. They don\'t fix it because: "${context}". What\'s the real, deep-down reason for all of this?'
  ];

  const copyToClipboard = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  // Mirror the dashboard implementation with progress tracking
  const runAnalysis = async (prompts: string[], isChildFriendly: boolean, stepOffset: number = 0, initialSolution: string) => {
    // Validate that we have a valid initial solution
    if (!initialSolution || !initialSolution.trim()) {
      throw new Error('Initial solution is required for analysis');
    }

    const results = [initialSolution];
    let currentContext = initialSolution;

    for (let i = 0; i < prompts.length; i++) {
      try {
        // Update progress
        const currentStep = stepOffset + i + 1;
        const stepName = `${isChildFriendly ? 'Child-Friendly' : 'Standard'} Analysis - Step ${i + 1}/5`;
        
        setAnalysis(prev => ({
          ...prev,
          progress: {
            ...prev.progress,
            currentStep,
            currentStepName: stepName
          }
        }));

        // Validate current context before creating prompt
        if (!currentContext || !currentContext.trim()) {
          throw new Error('Context is empty - cannot continue analysis');
        }

        // Replace ${context} placeholder with the current context
        const prompt = prompts[i].replace('${context}', currentContext.trim());
        
        // Additional validation to ensure prompt is not empty
        if (!prompt || prompt.trim().length < 20) {
          throw new Error(`Generated prompt is too short or empty. Context: "${currentContext.trim()}", Prompt: "${prompt}"`);
        }
        
        // Validate that the context was properly replaced
        if (prompt.includes('${context}')) {
          throw new Error('Failed to replace context placeholder in prompt');
        }
        
        const response = await supabaseServices.callADKAgents({
          agent_type: 'orchestrator',
          task: 'root_problem_analysis',
          payload: {
            message: prompt,
            context: 'root-problem-analysis',
            step: i + 1,
            analysis_type: isChildFriendly ? 'child-friendly' : 'standard'
          }
        });

        if (response.success && response.data?.response) {
          // The AI's response becomes the new context for the next step
          currentContext = response.data.response;
          results.push(currentContext);
        } else {
          throw new Error('Failed to get AI response');
        }
      } catch (error) {
        console.error(`Error in ${isChildFriendly ? 'child-friendly' : 'standard'} analysis step ${i + 1}:`, error);
        throw error;
      }
    }

    return results;
  };

  const performAnalysis = useCallback(async () => {
    const trimmedSolution = analysis.initialSolution?.trim() || '';
    
    if (!trimmedSolution) {
      addNotification({
        type: 'error',
        message: 'Please enter a solution to analyze before starting the analysis'
      });
      setAnalysis(prev => ({
        ...prev,
        error: 'No solution provided for analysis'
      }));
      return;
    }

    if (trimmedSolution.length < 10) {
      addNotification({
        type: 'error',
        message: 'Please provide a more detailed solution description (at least 10 characters)'
      });
      setAnalysis(prev => ({
        ...prev,
        error: 'Solution description is too short for meaningful analysis'
      }));
      return;
    }

    setAnalysis(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      standardResults: [],
      childFriendlyResults: [],
      progress: {
        currentStep: 0,
        totalSteps: 10,
        currentStepName: 'Starting analysis...'
      }
    }));

    try {
      // Run both analyses in parallel with progress tracking
      const [standardResults, childFriendlyResults] = await Promise.all([
        runAnalysis(standardPrompts, false, 0, trimmedSolution), // Steps 1-5
        runAnalysis(childFriendlyPrompts, true, 5, trimmedSolution) // Steps 6-10
      ]);

      setAnalysis(prev => ({
        ...prev,
        standardResults,
        childFriendlyResults,
        isLoading: false,
        progress: {
          currentStep: 10,
          totalSteps: 10,
          currentStepName: 'Analysis complete!'
        }
      }));

      addNotification({
        type: 'success',
        message: 'Root cause analysis completed successfully!'
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to complete analysis. Please try again.'
      }));
      addNotification({
        type: 'error',
        message: 'Analysis failed. Please try again.'
      });
    }
  }, [analysis.initialSolution, standardPrompts, childFriendlyPrompts, addNotification]);

  const handleProblemSelect = useCallback((problem: string) => {
    onProblemSelect(problem);
    onClose();
  }, [onProblemSelect, onClose]);

  const currentResults = analysis.currentView === 'standard' ? analysis.standardResults : analysis.childFriendlyResults;
  const hasResults = currentResults.length > 0;

  // Minimized view
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className={`${themeClasses.bg.card} rounded-lg shadow-lg p-4 border ${themeClasses.border.light} max-w-xs`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-500 p-1 rounded">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className={`text-sm font-medium ${themeClasses.text.primary}`}>
                Root Analysis
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onMinimize && onMinimize()}
                className={`p-1 rounded ${themeClasses.interactive.hover} ${themeClasses.text.secondary}`}
                title="Maximize"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className={`p-1 rounded ${themeClasses.interactive.hover} ${themeClasses.text.secondary}`}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {analysis.isLoading && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className={themeClasses.text.secondary}>
                Step {analysis.progress.currentStep}/5
              </span>
            </div>
          )}
          
          {hasResults && (
            <div className={`text-xs ${themeClasses.text.secondary} mt-2`}>
              Found {currentResults.length} root causes
            </div>
          )}
          
          {analysis.error && (
            <div className="text-xs text-red-600 mt-2">
              Analysis failed
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Full modal view
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`${themeClasses.bg.card} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${themeClasses.text.primary}`}>
                  Root Problem Analysis
                </h2>
                <p className={`text-sm ${themeClasses.text.secondary}`}>
                  Discover the true cause with 5-Why AI analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onMinimize && (
                <button
                  onClick={onMinimize}
                  className={`p-2 rounded-lg ${themeClasses.interactive.hover} ${themeClasses.text.secondary} hover:${themeClasses.text.primary}`}
                  title="Minimize"
                >
                  <Minus className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${themeClasses.interactive.hover} ${themeClasses.text.secondary} hover:${themeClasses.text.primary}`}
                title="Close (stop analysis)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Input Section */}
            <div className={`${themeClasses.bg.secondary} rounded-xl p-6 mb-6`}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
                  What solution are you analyzing?
                </h3>
              </div>
              
              <textarea
                value={analysis.initialSolution}
                onChange={(e) => setAnalysis(prev => ({ ...prev, initialSolution: e.target.value }))}
                placeholder="Enter the solution you want to analyze (e.g., 'We implemented a new project management system to improve team productivity')..."
                className={`w-full h-32 p-4 border ${themeClasses.border.light} rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${themeClasses.bg.primary} ${themeClasses.text.primary}`}
                disabled={analysis.isLoading}
              />
              
              {/* Input validation feedback */}
              {analysis.initialSolution.trim().length > 0 && analysis.initialSolution.trim().length < 10 && (
                <div className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Please provide a more detailed solution description (at least 10 characters)</span>
                </div>
              )}
              
              {analysis.initialSolution.trim().length === 0 && (
                <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4" />
                  <span>Describe the solution or approach you want to analyze for root causes</span>
                </div>
              )}
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${themeClasses.text.secondary}`}>View Mode:</span>
                  <button
                    onClick={() => setAnalysis(prev => ({ 
                      ...prev, 
                      currentView: prev.currentView === 'standard' ? 'child-friendly' : 'standard' 
                    }))}
                    className="flex items-center gap-2 text-sm font-medium"
                    disabled={analysis.isLoading}
                  >
                    {analysis.currentView === 'standard' ? (
                      <>
                        <ToggleLeft className={`w-5 h-5 ${themeClasses.text.secondary}`} />
                        <span className={themeClasses.text.secondary}>Standard</span>
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-5 h-5 text-indigo-500" />
                        <span className="text-indigo-500">Child-Friendly</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={performAnalysis}
                    disabled={analysis.isLoading || !analysis.initialSolution.trim()}
                    className="flex items-center gap-2"
                  >
                    {analysis.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Full Analysis</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>



            {/* Progress Indicator */}
            <AnimatePresence>
              {analysis.isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`${themeClasses.bg.secondary} rounded-xl p-4 mb-6`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="w-5 h-5 text-indigo-500" style={{ animation: 'spin 1s linear infinite' }} />
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${themeClasses.text.primary} mb-1`}>
                        {analysis.progress.currentStepName}
                      </div>
                      <div className={`text-xs ${themeClasses.text.secondary}`}>
                        Step {analysis.progress.currentStep} of {analysis.progress.totalSteps}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className={`w-full ${themeClasses.bg.primary} rounded-full h-2`}>
                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(analysis.progress.currentStep / analysis.progress.totalSteps) * 100}%` 
                      }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Section */}
            <AnimatePresence>
              {hasResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`${themeClasses.bg.secondary} rounded-xl p-6`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-indigo-500" />
                      <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
                        5-Why Analysis Results ({analysis.currentView === 'standard' ? 'Standard' : 'Child-Friendly'})
                      </h3>
                    </div>
                    
                    <button
                      onClick={() => setAnalysis(prev => ({ 
                        ...prev, 
                        currentView: prev.currentView === 'standard' ? 'child-friendly' : 'standard' 
                      }))}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg ${themeClasses.interactive.hover} ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">Switch View</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {currentResults.map((result, index) => (
                      <motion.div
                        key={`${analysis.currentView}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${themeClasses.bg.primary} rounded-lg p-4 border ${themeClasses.border.light}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="bg-indigo-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                {index + 1}
                              </div>
                              <span className={`text-sm font-medium ${themeClasses.text.secondary}`}>
                                Why #{index + 1}
                              </span>
                            </div>
                            <p className={`${themeClasses.text.primary} leading-relaxed`}>
                              {result}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(result, index)}
                              className={`p-2 rounded-lg ${themeClasses.interactive.hover} ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
                              title="Copy to clipboard"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleProblemSelect(result)}
                              className="flex items-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
                              title="Add to mindmap"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {hasResults && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className={`mt-6 p-4 ${themeClasses.bg.primary} rounded-lg border ${themeClasses.border.light}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className={`font-medium ${themeClasses.text.primary}`}>Analysis Complete!</span>
                      </div>
                      <p className={`text-sm ${themeClasses.text.secondary}`}>
                        You've successfully identified the root cause through 5 levels of analysis. 
                        Click the + button next to any problem to attach it to your mindmap node.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {analysis.error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">Analysis Error</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{analysis.error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RootProblemModal;