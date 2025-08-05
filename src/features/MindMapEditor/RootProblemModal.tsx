import React, { useState, useCallback } from 'react';
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
import { callEdgeFunction } from '../../services/edgeFunctions';
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
  const { addNotification } = useUIStore();
  
  const [analysis, setAnalysis] = useState<AnalysisState>({
    initialSolution: initialSolution || nodeLabel,
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
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Standard prompts for 5-Why analysis
  const standardPrompts = [
    'Analyze the following solution and identify the single, most direct problem it solves. State the problem in one short sentence. Solution: "${context}"',
    'The problem is: "${context}". Why is this a significant problem? Summarize the reason in one concise sentence.',
    'It\'s a problem because: "${context}". What is the direct underlying cause? Describe the cause in one short sentence.',
    'The cause is: "${context}". Why does this cause persist? Explain why in one concise sentence.',
    'It persists because: "${context}". What is the absolute fundamental, root-cause reason for this entire chain of issues? State the root cause in one short, impactful sentence.'
  ];

  // Child-friendly prompts for 5-Why analysis
  const childFriendlyPrompts = [
    'Here\'s an idea: "${context}". What problem is it trying to fix? Tell me in one super simple sentence, like for a kid.',
    'The problem is: "${context}". Why is that a big deal? Explain why it\'s a problem in one simple sentence.',
    'It\'s a problem because: "${context}". Why does that happen? Tell me the reason in one easy sentence.',
    'It happens because: "${context}". Why doesn\'t someone just fix that? Give me one simple reason.',
    'They don\'t fix it because: "${context}". What\'s the real, real, deep-down reason for all of this? Tell me the big secret in one super simple sentence.'
  ];



  // Optimized sequential analysis with progressive display and faster processing
  const runOptimizedSequentialAnalysis = async (prompts: string[], isChildFriendly: boolean, stepOffset: number = 0) => {
    const results = [];
    let currentContext = analysis.initialSolution;
    const analysisType = isChildFriendly ? 'child-friendly' : 'standard';

    for (let i = 0; i < prompts.length; i++) {
      try {
        const stepNumber = stepOffset + i + 1;
        const stepName = `${analysisType} analysis - Step ${i + 1}/5`;
        
        // Update progress immediately
        setAnalysis(prev => ({
          ...prev,
          progress: {
            ...prev.progress,
            currentStep: stepNumber,
            currentStepName: stepName
          }
        }));

        // Optimized prompt with clearer instructions for faster AI processing
        const optimizedPrompt = prompts[i].replace('${context}', currentContext) + 
          ' Respond with exactly one concise sentence. Be direct and specific.';
        
        // Use Promise.race for faster timeout and better error handling
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        );
        
        const apiPromise = callEdgeFunction('process-chat-message', {
          message: optimizedPrompt,
          context: `root-problem-analysis-${analysisType}-${i}`,
          temperature: 0.3, // Lower temperature for more focused, faster responses
          max_tokens: 100 // Limit tokens for faster processing
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);

        if (response.success && response.data?.response) {
          currentContext = response.data.response.trim();
          results.push(currentContext);
          
          // Progressive display - show results as they come in
          setAnalysis(prev => {
            const newResults = isChildFriendly 
              ? [...prev.childFriendlyResults]
              : [...prev.standardResults];
            
            // Add the new result
            if (newResults.length <= i + 1) {
              newResults.push(currentContext);
            } else {
              newResults[i + 1] = currentContext;
            }
            
            return {
              ...prev,
              [isChildFriendly ? 'childFriendlyResults' : 'standardResults']: newResults
            };
          });
        } else {
          throw new Error('Failed to get AI response');
        }
      } catch (error) {
        console.error(`Error in ${analysisType} analysis step ${i + 1}:`, error);
        throw error;
      }
    }

    return results;
  };

  // Fast initial analysis that provides immediate value
  const runQuickAnalysis = async () => {
    try {
      const quickPrompt = `Quickly identify the main problem this solution addresses and suggest the most likely root cause. Solution: "${analysis.initialSolution}". Respond with: Problem: [one sentence] | Root Cause: [one sentence]`;
      
      const response = await callEdgeFunction('process-chat-message', {
        message: quickPrompt,
        context: 'quick-root-analysis',
        temperature: 0.2,
        max_tokens: 80
      });

      if (response.success && response.data?.response) {
        const quickResult = response.data.response;
        // Show quick result immediately
        setAnalysis(prev => ({
          ...prev,
          standardResults: [prev.initialSolution, quickResult],
          progress: {
            ...prev.progress,
            currentStepName: 'Quick analysis complete - running detailed analysis...'
          }
        }));
        return quickResult;
      }
    } catch (error) {
      console.log('Quick analysis failed, proceeding with full analysis');
    }
    return null;
  };

  const handleStartAnalysis = async () => {
    if (!analysis.initialSolution.trim()) {
      addNotification({
        type: 'error',
        message: 'Please enter a solution to analyze'
      });
      return;
    }

    setAnalysis(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      standardResults: [prev.initialSolution], // Reset with initial solution
      childFriendlyResults: [prev.initialSolution],
      progress: {
        currentStep: 0,
        totalSteps: 11, // Quick + 5 standard + 5 child-friendly
        currentStepName: 'Starting quick analysis...'
      }
    }));

    try {
      // Step 1: Quick analysis for immediate feedback (1-2 seconds)
      await runQuickAnalysis();
      
      // Step 2: Run optimized standard analysis (steps 2-6)
      setAnalysis(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          currentStep: 1,
          currentStepName: 'Running detailed standard analysis...'
        }
      }));
      
      const standardResults = await runOptimizedSequentialAnalysis(standardPrompts, false, 1);
      
      // Step 3: Run optimized child-friendly analysis (steps 7-11)
      setAnalysis(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          currentStep: 6,
          currentStepName: 'Running child-friendly analysis...'
        }
      }));
      
      const childFriendlyResults = await runOptimizedSequentialAnalysis(childFriendlyPrompts, true, 6);

      // Final update
      setAnalysis(prev => ({
        ...prev,
        isLoading: false,
        progress: {
          currentStep: 11,
          totalSteps: 11,
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
        error: 'Failed to complete analysis. Please try again.',
        progress: {
          ...prev.progress,
          currentStepName: 'Analysis failed'
        }
      }));
      addNotification({
        type: 'error',
        message: 'Analysis failed. Please try again.'
      });
    }
  };

  // Smart mode selection based on solution complexity
  const handleSmartAnalysis = async () => {
    if (!analysis.initialSolution.trim()) {
      addNotification({
        type: 'error',
        message: 'Please enter a solution to analyze'
      });
      return;
    }

    const solutionLength = analysis.initialSolution.length;
    const isComplex = solutionLength > 200 || analysis.initialSolution.includes('multiple') || analysis.initialSolution.includes('complex');
    
    if (isComplex) {
      // For complex solutions, run full analysis
      await handleStartAnalysis();
    } else {
      // For simple solutions, run quick analysis only
      setAnalysis(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        standardResults: [prev.initialSolution],
        progress: {
          currentStep: 0,
          totalSteps: 1,
          currentStepName: 'Running smart quick analysis...'
        }
      }));

      try {
        await runQuickAnalysis();
        
        setAnalysis(prev => ({
          ...prev,
          isLoading: false,
          progress: {
            currentStep: 1,
            totalSteps: 1,
            currentStepName: 'Quick analysis complete!'
          }
        }));

        addNotification({
          type: 'success',
          message: 'Quick analysis completed! Click "Full Analysis" for detailed 5-Why breakdown.'
        });
      } catch (error) {
        console.error('Smart analysis failed:', error);
        setAnalysis(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to complete analysis. Please try again.'
        }));
      }
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      addNotification({
        type: 'success',
        message: 'Copied to clipboard!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to copy to clipboard'
      });
    }
  };

  const handleSelectAndAttach = (problem: string) => {
    onProblemSelect(problem);
    addNotification({
      type: 'success',
      message: 'Problem attached to node!'
    });
    onClose();
  };

  const currentResults = analysis.currentView === 'standard' 
    ? analysis.standardResults 
    : analysis.childFriendlyResults;

  const hasResults = currentResults.length > 1;

  // Minimized view
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className={`${themeClasses.bg.card} rounded-lg shadow-lg border p-4 max-w-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <span className={`text-sm font-medium ${themeClasses.text.primary}`}>
                AI Analysis Running
              </span>
            </div>
            <div className="flex items-center gap-1">
              {onMinimize && (
                <button
                  onClick={onMinimize}
                  className={`p-1 rounded ${themeClasses.interactive.hover} ${themeClasses.text.secondary}`}
                  title="Restore"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className={`p-1 rounded ${themeClasses.interactive.hover} ${themeClasses.text.secondary}`}
                title="Stop analysis"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {analysis.isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-500" style={{ animation: 'spin 1s linear infinite' }} />
                <span className={`text-xs ${themeClasses.text.secondary}`}>
                  {analysis.progress.currentStepName}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(analysis.progress.currentStep / analysis.progress.totalSteps) * 100}%` }}
                />
              </div>
              <div className={`text-xs ${themeClasses.text.tertiary} text-center`}>
                {analysis.progress.currentStep}/{analysis.progress.totalSteps}
              </div>
            </div>
          )}
          {!analysis.isLoading && hasResults && (
            <div className={`text-xs ${themeClasses.text.secondary}`}>
              Analysis complete! Click to view results.
            </div>
          )}
        </div>
      </motion.div>
    );
  }

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
                  title="Minimize (continue in background)"
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
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                        <span className={themeClasses.text.secondary}>Standard</span>
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-5 h-5 text-indigo-500" />
                        <span className={themeClasses.text.primary}>Child-Friendly</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className={`text-xs ${themeClasses.text.tertiary} bg-blue-50 p-3 rounded-lg`}>
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-blue-700">Smart Analysis:</span> Quick 2-second analysis for simple solutions. 
                      <span className="font-medium text-indigo-700">Full Analysis:</span> Complete 5-Why breakdown (30-60 seconds).
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSmartAnalysis}
                    disabled={analysis.isLoading || !analysis.initialSolution.trim()}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
                  >
                    {analysis.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4" style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4" />
                        <span>Smart Analysis</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={analysis.isLoading || !analysis.initialSolution.trim()}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    {analysis.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4" style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Full Analysis...</span>
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
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${themeClasses.bg.primary} rounded-lg p-4 relative group`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {index === 0 ? (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  S
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {index}
                                </div>
                              )}
                              <span className={`text-sm font-medium ${themeClasses.text.secondary}`}>
                                {index === 0 ? 'Initial Solution' : `Why #${index}`}
                              </span>
                            </div>
                            <p className={`${themeClasses.text.primary} leading-relaxed`}>{result}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleCopy(result, index)}
                              className={`p-2 rounded-lg ${themeClasses.interactive.hover} opacity-0 group-hover:opacity-100 transition-opacity`}
                            >
                              {copiedIndex === index ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            
                            {index > 0 && (
                              <button
                                onClick={() => handleSelectAndAttach(result)}
                                className={`p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors opacity-0 group-hover:opacity-100`}
                                title="Attach to node"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {currentResults.length === 6 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Analysis Complete!</span>
                      </div>
                      <p className="text-green-700 text-sm">
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