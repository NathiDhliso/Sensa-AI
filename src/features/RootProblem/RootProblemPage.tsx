import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Search,
  Lightbulb,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { usePageTheme, useThemeClasses } from '../../contexts/themeUtils';
import { useUIStore } from '../../stores';
import { supabaseServices } from '../../services';
import { BackButton } from '../../components';

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

const RootProblemPage: React.FC = () => {
  const navigate = useNavigate();
  const pageTheme = usePageTheme('home');
  const themeClasses = useThemeClasses();
  const { addNotification } = useUIStore();
  
  const [analysis, setAnalysis] = useState<AnalysisState>({
    initialSolution: '',
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

  // Standard prompts for 5-Why analysis - exact prompts as specified
  const standardPrompts = [
    'Analyze the following solution and identify the single, most direct problem it solves. State the problem in one short sentence. Solution: "${context}"',
    'The problem is: "${context}". Why is this a significant problem? Summarize the reason in one concise sentence.',
    'It\'s a problem because: "${context}". What is the direct underlying cause? Describe the cause in one short sentence.',
    'The cause is: "${context}". Why does this cause persist? Explain why in one concise sentence.',
    'It persists because: "${context}". What is the absolute fundamental, root-cause reason for this entire chain of issues? State the root cause in one short, impactful sentence.'
  ];

  // Child-friendly prompts for 5-Why analysis - exact prompts as specified
  const childFriendlyPrompts = [
    'Here\'s an idea: "${context}". What problem is it trying to fix? Tell me in one super simple sentence, like for a kid.',
    'The problem is: "${context}". Why is that a big deal? Explain why it\'s a problem in one simple sentence.',
    'It\'s a problem because: "${context}". Why does that happen? Tell me the reason in one easy sentence.',
    'It happens because: "${context}". Why doesn\'t someone just fix that? Give me one simple reason.',
    'They don\'t fix it because: "${context}". What\'s the real, real, deep-down reason for all of this? Tell me the big secret in one super simple sentence.'
  ];

  const runAnalysis = async (prompts: string[], isChildFriendly: boolean, stepOffset: number = 0) => {
    const results = [analysis.initialSolution];
    let currentContext = analysis.initialSolution;

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

        // Replace ${context} placeholder with the current context
        const prompt = prompts[i].replace('${context}', currentContext);
        
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
        runAnalysis(standardPrompts, false, 0), // Steps 1-5
        runAnalysis(childFriendlyPrompts, true, 5) // Steps 6-10
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

  const currentResults = analysis.currentView === 'standard' 
    ? analysis.standardResults 
    : analysis.childFriendlyResults;

  const hasResults = currentResults.length > 1;

  return (
    <div className={`min-h-screen ${pageTheme.background}`}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton />
              <div className="flex items-center gap-3">
                <div className={`${pageTheme.button} p-2 rounded-xl`}>
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>Root Problem Analysis</h1>
                  <p className={`text-sm ${themeClasses.text.secondary}`}>Discover the true cause with 5-Why AI analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${themeClasses.bg.card} border ${themeClasses.border.light} rounded-2xl p-6 mb-6`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>What solution are you analyzing?</h2>
          </div>
          
          <textarea
            value={analysis.initialSolution}
            onChange={(e) => setAnalysis(prev => ({ ...prev, initialSolution: e.target.value }))}
            placeholder="Enter the solution you want to analyze (e.g., 'We implemented a new project management system to improve team productivity')..."
            className={`w-full h-32 p-4 border ${themeClasses.border.light} rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${themeClasses.bg.primary} ${themeClasses.text.primary}`}
            disabled={analysis.isLoading}
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <span className={`text-sm ${themeClasses.text.secondary}`}>Analysis Mode:</span>
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
            
            <motion.button
              onClick={handleStartAnalysis}
              disabled={analysis.isLoading || !analysis.initialSolution.trim()}
              className={`flex items-center gap-2 ${pageTheme.button} text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={{ scale: analysis.isLoading ? 1 : 1.05 }}
              whileTap={{ scale: analysis.isLoading ? 1 : 0.95 }}
            >
              {analysis.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Start Analysis</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <AnimatePresence>
          {analysis.isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${themeClasses.bg.card} border ${themeClasses.border.light} rounded-2xl p-6 mb-6`}
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
              <div className={`w-full ${themeClasses.bg.secondary} rounded-full h-2`}>
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
              className={`${themeClasses.bg.card} border ${themeClasses.border.light} rounded-2xl p-6`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
                    5-Why Analysis Results ({analysis.currentView === 'standard' ? 'Standard' : 'Child-Friendly'})
                  </h2>
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
                    className={`${themeClasses.bg.secondary} rounded-lg p-4 relative group`}
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
                      
                      <button
                        onClick={() => handleCopy(result, index)}
                        className={`ml-4 p-2 rounded-lg ${themeClasses.interactive.hover} opacity-0 group-hover:opacity-100 transition-opacity`}
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
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
                    The final "Why #5" represents the fundamental issue that needs to be addressed.
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
    </div>
  );
};

export default RootProblemPage;