import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Lightbulb,
  GitBranch,
  Play,
  FileText,
  Zap,
  Target,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  Eye,
  Save,
  Trash2,
  Clock,
  FolderOpen
} from 'lucide-react';
import { usePageTheme, useThemeClasses } from '../../contexts/themeUtils';
import { SensaAPI } from '../../services/api';
import type { BusinessLensInput, BusinessLensResponse, BusinessLensState } from './types';
import GraphvizViewer from './components/GraphvizViewer';

const BusinessLens: React.FC = () => {
  const navigate = useNavigate();
  const pageTheme = usePageTheme('businessLens');
  const themeClasses = useThemeClasses();

  const [state, setState] = useState<BusinessLensState>({
    isLoading: false,
    error: null,
    data: null,
    currentStep: 'input'
  });

  const [loadingProgress, setLoadingProgress] = useState({
    step: 1,
    message: 'Initializing...',
    progress: 0
  });

  const [formData, setFormData] = useState<BusinessLensInput>({
    companyName: '',
    companyType: '',
    studyGuideText: ''
  });

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isGraphvizModalOpen, setIsGraphvizModalOpen] = useState(false);
  const [savedResults, setSavedResults] = useState<Array<{id: string, name: string, data: BusinessLensResponse, timestamp: Date}>>([]);
  const [showSavedResults, setShowSavedResults] = useState(false);

  const handleInputChange = (field: keyof BusinessLensInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



















  const generateWorkflow = async () => {
    if (!formData.companyName.trim() || !formData.companyType.trim() || !formData.studyGuideText.trim()) {
      setState(prev => ({ ...prev, error: 'Please fill in all required fields.' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, currentStep: 'processing' }));
    
    // Progress tracking
    setLoadingProgress({ step: 1, message: 'Connecting to AI service...', progress: 10 });
    
    // Create a timeout promise for better user experience
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 2 minutes. The AI service may be busy.')), 120000);
    });

    try {
      setLoadingProgress({ step: 2, message: 'Extracting tools and technologies...', progress: 25 });
      
      // Simulate progress updates
      setTimeout(() => {
        setLoadingProgress({ step: 3, message: 'Creating realistic business scenario...', progress: 50 });
      }, 2000);
      
      setTimeout(() => {
        setLoadingProgress({ step: 4, message: 'Building workflow narrative...', progress: 75 });
      }, 4000);
      
      setTimeout(() => {
        setLoadingProgress({ step: 5, message: 'Generating workflow diagram...', progress: 90 });
      }, 6000);
      
      // Race between the API call and timeout
      const result = await Promise.race([
        SensaAPI.generateBusinessWorkflow({
          companyName: formData.companyName,
          companyType: formData.companyType,
          studyGuideText: formData.studyGuideText
        }),
        timeoutPromise
      ]) as Awaited<ReturnType<typeof SensaAPI.generateBusinessWorkflow>>;

      const response: BusinessLensResponse = {
        extractedTools: result.extractedTools,
        scenario: result.scenario,
        workflow: result.workflow,
        graphvizCode: result.graphvizCode,
        diagram: {
          nodes: [],
          edges: [],
          clusters: []
        }
      };

      setLoadingProgress({ step: 5, message: 'Complete!', progress: 100 });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        data: response,
        currentStep: 'results'
      }));
    } catch (error) {
      console.error('Error generating workflow:', error);
      
      // Show detailed error message with troubleshooting tips
      let errorMessage = 'AI service is currently unavailable';
      let troubleshootingTip = '';
      
      if (error instanceof Error) {
        if (error.message.includes('timed out')) {
          errorMessage = 'Request timed out';
          troubleshootingTip = 'The AI service is taking longer than expected. Please try again with a shorter study guide or try again later.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network connection error';
          troubleshootingTip = 'Please check your internet connection and try again.';
        } else if (error.message.includes('business_lens_workflow')) {
          errorMessage = 'Business Lens service unavailable';
          troubleshootingTip = 'The Business Lens AI service is currently being updated. Please try again in a few minutes.';
        } else {
          errorMessage = error.message;
          troubleshootingTip = 'Please try again with different input or contact support if the issue persists.';
        }
      }
      
      setLoadingProgress({ step: 1, message: 'Initializing...', progress: 0 });
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        currentStep: 'input',
        error: `${errorMessage}. ${troubleshootingTip}`
      }));
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadGraphviz = () => {
    if (!state.data?.graphvizCode) return;
    
    const blob = new Blob([state.data.graphvizCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.companyName.replace(/\s+/g, '_')}_workflow.dot`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clean text formatting by removing excessive asterisks and markdown
  const cleanText = (text: string): string => {
    return text
      .replace(/\*\*\*/g, '') // Remove triple asterisks
      .replace(/\*\*/g, '') // Remove double asterisks
      .replace(/\*/g, '') // Remove single asterisks
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
      .trim();
  };

  // Convert text to bullet points for better readability
  const formatAsBullets = (text: string): string[] => {
    // First try to split by natural paragraph breaks or double line breaks
    let bullets = text.split(/\n\s*\n|\. \n|\n\s*-|\n\s*•/).filter(p => p.trim().length > 0);
    
    // If we don't get enough bullets, fall back to sentence splitting
    if (bullets.length < 2) {
      bullets = text
        .split(/[.!?]\s+/) // Split by sentence endings
        .filter(sentence => sentence.trim().length > 20) // Filter out short fragments
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0);
    }
    
    // Clean up each bullet point
    return bullets.map(bullet => {
      return bullet
        .trim()
        .replace(/^[-•*]\s*/, '') // Remove bullet markers
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    }).filter(bullet => bullet.length > 15); // Filter very short bullets
  };

  // Create concise 3-5 word summaries from titles
  const createConciseSummary = (title: string): string => {
    const cleanedTitle = cleanText(title);
    const words = cleanedTitle.split(/\s+/).filter(word => word.length > 0);
    
    // Remove common words and keep the most important ones
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
    
    const importantWords = words.filter(word => 
      !stopWords.includes(word.toLowerCase()) && word.length > 2
    );
    
    // If we have too few important words, include some shorter ones
    if (importantWords.length < 3) {
      const additionalWords = words.filter(word => 
        !stopWords.includes(word.toLowerCase()) && 
        !importantWords.includes(word)
      );
      importantWords.push(...additionalWords.slice(0, 3 - importantWords.length));
    }
    
    // Take first 3-5 most important words, prioritizing nouns and adjectives
    const selectedWords = importantWords.slice(0, Math.min(5, Math.max(3, importantWords.length)));
    
    return selectedWords.join(' ');
  };

  // Load saved results from localStorage on component mount
  useEffect(() => {
    const savedResultsFromStorage = localStorage.getItem('businessLensSavedResults');
    if (savedResultsFromStorage) {
      try {
        const parsed = JSON.parse(savedResultsFromStorage);
        setSavedResults(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error('Error parsing saved results:', error);
      }
    }
  }, []);

  // Save current result
  const saveCurrentResult = () => {
    if (!state.data) return;
    
    const newSavedResult = {
      id: Date.now().toString(),
      name: formData.companyName || 'Unnamed Project',
      data: state.data,
      timestamp: new Date()
    };
    
    const updatedResults = [...savedResults, newSavedResult];
    setSavedResults(updatedResults);
    
    // Save to localStorage
    localStorage.setItem('businessLensSavedResults', JSON.stringify(updatedResults));
    
    // Show confirmation
    setCopiedSection('saved');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Load a saved result
  const loadSavedResult = (savedResult: {id: string, name: string, data: BusinessLensResponse}) => {
    setState({
      isLoading: false,
      error: null,
      data: savedResult.data,
      currentStep: 'results'
    });
    setShowSavedResults(false);
  };

  // Delete a saved result
  const deleteSavedResult = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    const updatedResults = savedResults.filter(result => result.id !== id);
    setSavedResults(updatedResults);
    localStorage.setItem('businessLensSavedResults', JSON.stringify(updatedResults));
  };

  const resetForm = () => {
    setState({
      isLoading: false,
      error: null,
      data: null,
      currentStep: 'input'
    });
    setFormData({
      companyName: '',
      companyType: '',
      studyGuideText: ''
    });
  };

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
            <motion.button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </motion.button>
            
            <div className="flex items-center gap-3">
              <div className={`${pageTheme.button} p-2 rounded-xl`}>
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${themeClasses.text.primary}`}>Business Lens</h1>
                <p className={`text-sm ${themeClasses.text.secondary}`}>Transform study content into business workflows</p>
              </div>
            </div>
            
            <motion.button
              onClick={() => setShowSavedResults(true)}
              className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors px-4 py-2 rounded-lg ${themeClasses.interactive.hover}`}
              whileHover={{ scale: 1.05 }}
            >
              <FolderOpen className="w-4 h-4" />
              Saved ({savedResults.length})
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <AnimatePresence mode="wait">
          {state.currentStep === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className={`${themeClasses.bg.card} rounded-2xl p-8 border ${themeClasses.border.light}`}>
                <div className="text-center mb-8">
                  <motion.div
                    className={`${pageTheme.button} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Lightbulb className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className={`text-3xl font-bold ${themeClasses.text.primary} mb-4`}>
                    Generate Business Workflows
                  </h2>
                  <p className={`${themeClasses.text.secondary} text-lg max-w-2xl mx-auto`}>
                    Transform any study guide or technical content into a complete project workflow 
                    with realistic business scenarios, step-by-step narratives, and visual diagrams.
                  </p>
                </div>

                {/* Input Form */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                        Company/Team Name *
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="e.g., TechCorp Solutions"
                        className={`w-full px-4 py-3 border ${themeClasses.border.light} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.bg.input} ${themeClasses.text.primary}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                        Company/Team Type *
                      </label>
                      <input
                        type="text"
                        value={formData.companyType}
                        onChange={(e) => handleInputChange('companyType', e.target.value)}
                        placeholder="e.g., In-house Cloud Platform Team, DevOps Consultancy"
                        className={`w-full px-4 py-3 border ${themeClasses.border.light} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.bg.input} ${themeClasses.text.primary}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                      Study Guide Content *
                    </label>
                    <textarea
                      value={formData.studyGuideText}
                      onChange={(e) => handleInputChange('studyGuideText', e.target.value)}
                      placeholder="Paste your study guide content, exam papers, or technical documentation here..."
                      rows={8}
                      className={`w-full px-4 py-3 border ${themeClasses.border.light} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.bg.input} ${themeClasses.text.primary} resize-none`}
                    />
                  </div>
                </div>

                {state.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mt-6"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span>{state.error}</span>
                  </motion.div>
                )}

                <div className="flex justify-center mt-8">
                  <motion.button
                    onClick={generateWorkflow}
                    disabled={state.isLoading}
                    className={`${pageTheme.button} text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play className="w-5 h-5" />
                    Generate Workflow
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {state.currentStep === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-96 max-w-md mx-auto"
            >
              <motion.div
                className={`${pageTheme.button} w-20 h-20 rounded-2xl flex items-center justify-center mb-6`}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className={`text-2xl font-bold ${themeClasses.text.primary} mb-6`}>
                Generating Your Business Workflow
              </h3>
              
              {/* Progress Bar */}
              <div className="w-full mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${themeClasses.text.primary}`}>
                    Step {loadingProgress.step} of 5
                  </span>
                  <span className={`text-sm ${themeClasses.text.secondary}`}>
                    {loadingProgress.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className={`${pageTheme.button} h-2 rounded-full`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${loadingProgress.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
              
              {/* Current Step Message */}
              <motion.div
                key={loadingProgress.message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className={`${themeClasses.text.primary} font-medium mb-2`}>
                  {loadingProgress.message}
                </p>
                <p className={`${themeClasses.text.secondary} text-sm`}>
                  This may take up to 2 minutes. Please don't close this page.
                </p>
              </motion.div>
              
              {/* Animated Dots */}
              <div className="flex space-x-1 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className={`w-2 h-2 ${pageTheme.button} rounded-full`}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {state.currentStep === 'results' && state.data && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Success Header */}
              <div className={`${themeClasses.bg.card} rounded-2xl p-6 border ${themeClasses.border.light}`}>
                <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                    Workflow Generated Successfully!
                  </h2>
                  <p className={themeClasses.text.secondary}>
                    Your business workflow for {formData.companyName} is ready
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={saveCurrentResult}
                  className={`flex items-center gap-2 ${pageTheme.button} text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity`}
                  whileHover={{ scale: 1.05 }}
                >
                  {copiedSection === 'saved' ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {copiedSection === 'saved' ? 'Saved!' : 'Save'}
                </motion.button>
                <motion.button
                  onClick={() => setShowSavedResults(true)}
                  className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors px-4 py-2 rounded-lg ${themeClasses.interactive.hover}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <FolderOpen className="w-4 h-4" />
                  Saved ({savedResults.length})
                </motion.button>
                <motion.button
                  onClick={resetForm}
                  className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors px-4 py-2 rounded-lg ${themeClasses.interactive.hover}`}
                  whileHover={{ scale: 1.05 }}
                >
                  Generate New
                </motion.button>
              </div>
            </div>
              </div>

              {/* Extracted Tools */}
              <div className={`${themeClasses.bg.card} rounded-2xl p-6 border ${themeClasses.border.light}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary} flex items-center gap-2`}>
                    <Target className="w-6 h-6 text-blue-600" />
                    Extracted Tools & Technologies
                  </h3>
                  <motion.button
                    onClick={() => copyToClipboard(
                      state.data.extractedTools.map(tool => `• ${tool.name}`).join('\n'),
                      'tools'
                    )}
                    className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors px-3 py-1 rounded-lg ${themeClasses.interactive.hover}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {copiedSection === 'tools' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedSection === 'tools' ? 'Copied!' : 'Copy'}
                  </motion.button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {state.data.extractedTools.map((tool, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${themeClasses.bg.secondary} rounded-lg p-3 text-center`}
                    >
                      <div className={`text-sm font-medium ${themeClasses.text.primary}`}>
                        {tool.name}
                      </div>
                      {tool.category && (
                        <div className={`text-xs ${themeClasses.text.tertiary} mt-1`}>
                          {tool.category}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Business Scenario */}
              <div className={`${themeClasses.bg.card} rounded-2xl p-6 border ${themeClasses.border.light}`}>
                <h3 className={`text-xl font-semibold ${themeClasses.text.primary} mb-6 flex items-center gap-2`}>
                  <Lightbulb className="w-6 h-6 text-amber-600" />
                  Business Scenario
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Problem Section */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <h4 className="font-semibold text-red-800 text-lg">Problem: {createConciseSummary(state.data.scenario.start.title)}</h4>
                    </div>
                    <div className="space-y-2">
                      {formatAsBullets(cleanText(state.data.scenario.start.description)).map((bullet, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-red-700 text-sm leading-relaxed">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Solution Section */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h4 className="font-semibold text-green-800 text-lg">Solution: {createConciseSummary(state.data.scenario.goal.title)}</h4>
                    </div>
                    <div className="space-y-2">
                      {formatAsBullets(cleanText(state.data.scenario.goal.description)).map((bullet, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-green-700 text-sm leading-relaxed">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow Narrative */}
              <div className={`${themeClasses.bg.card} rounded-2xl p-6 border ${themeClasses.border.light}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary} flex items-center gap-2`}>
                    <FileText className="w-6 h-6 text-purple-600" />
                    Project Workflow Narrative
                  </h3>
                  <motion.button
                    onClick={() => copyToClipboard(state.data.workflow.narrative, 'narrative')}
                    className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors px-3 py-1 rounded-lg ${themeClasses.interactive.hover}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {copiedSection === 'narrative' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedSection === 'narrative' ? 'Copied!' : 'Copy'}
                  </motion.button>
                </div>
                <div className={`${themeClasses.bg.secondary} rounded-lg p-4`}>
                  <p className={`${themeClasses.text.primary} leading-relaxed whitespace-pre-line`}>
                    {cleanText(state.data.workflow.narrative)}
                  </p>
                </div>
              </div>

              {/* Workflow Phases */}
              <div className={`${themeClasses.bg.card} rounded-2xl p-6 border ${themeClasses.border.light}`}>
                <h3 className={`text-xl font-semibold ${themeClasses.text.primary} mb-6 flex items-center gap-2`}>
                  <GitBranch className="w-6 h-6 text-indigo-600" />
                  Workflow Phases
                </h3>
                <div className="space-y-4">
                  {state.data.workflow.phases.map((phase, index) => (
                    <motion.div
                      key={phase.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className={`${themeClasses.bg.secondary} rounded-lg p-4 border-l-4 border-indigo-500`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold ${themeClasses.text.primary}`}>
                          Phase {index + 1}: {phase.title}
                        </h4>
                        <div className="flex gap-2">
                          {phase.tools.map((tool, toolIndex) => (
                            <span
                              key={toolIndex}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className={`${themeClasses.text.secondary} text-sm leading-relaxed`}>
                        {cleanText(phase.description)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Graphviz Code */}
              <div className={`${themeClasses.bg.card} rounded-2xl p-6 border ${themeClasses.border.light}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary} flex items-center gap-2`}>
                    <Eye className="w-6 h-6 text-green-600" />
                    Graphviz Diagram Code
                  </h3>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setIsGraphvizModalOpen(true)}
                      className={`flex items-center gap-2 ${pageTheme.button} text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Eye className="w-4 h-4" />
                      View Diagram
                    </motion.button>
                    <motion.button
                      onClick={() => copyToClipboard(state.data.graphvizCode, 'graphviz')}
                      className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors px-3 py-1 rounded-lg ${themeClasses.interactive.hover}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {copiedSection === 'graphviz' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedSection === 'graphviz' ? 'Copied!' : 'Copy'}
                    </motion.button>
                    <motion.button
                      onClick={downloadGraphviz}
                      className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors px-3 py-1 rounded-lg ${themeClasses.interactive.hover}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </motion.button>
                  </div>
                </div>
                <div className={`${themeClasses.bg.secondary} rounded-lg p-4 overflow-x-auto`}>
                  <pre className={`text-sm ${themeClasses.text.primary} whitespace-pre-wrap`}>
                    {state.data.graphvizCode}
                  </pre>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    <strong>💡 Tip:</strong> Copy this code and paste it into{' '}
                    <a 
                      href="https://dreampuf.github.io/GraphvizOnline/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-800"
                    >
                      Graphviz Online
                    </a>{' '}
                    or any Graphviz renderer to visualize your workflow diagram.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Results Modal */}
        <AnimatePresence>
          {showSavedResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSavedResults(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${themeClasses.bg.card} rounded-2xl shadow-2xl max-w-4xl max-h-[80vh] w-full flex flex-col`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className={`border-b ${themeClasses.border.light} px-6 py-4 rounded-t-2xl`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${pageTheme.button} rounded-lg`}>
                        <FolderOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Saved Results</h2>
                        <p className={`text-sm ${themeClasses.text.secondary}`}>Load previously generated workflows</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSavedResults(false)}
                      className={`p-2 hover:${themeClasses.interactive.hover} rounded-lg transition-colors`}
                    >
                      <ArrowLeft className={`w-5 h-5 ${themeClasses.text.secondary}`} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                  {savedResults.length === 0 ? (
                    <div className="text-center py-12">
                      <div className={`${themeClasses.text.tertiary} mb-4`}>
                        <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No saved results yet</p>
                        <p className="text-sm">Generate a workflow and save it to see it here</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {savedResults.map((result) => (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`${themeClasses.bg.secondary} rounded-lg p-4 border ${themeClasses.border.light} cursor-pointer hover:${themeClasses.interactive.hover} transition-colors`}
                          onClick={() => loadSavedResult(result)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className={`font-semibold ${themeClasses.text.primary} mb-1`}>
                                {result.name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm">
                                <div className={`flex items-center gap-1 ${themeClasses.text.secondary}`}>
                                  <Clock className="w-4 h-4" />
                                  {result.timestamp.toLocaleDateString()} at {result.timestamp.toLocaleTimeString()}
                                </div>
                                <div className={`flex items-center gap-1 ${themeClasses.text.secondary}`}>
                                  <Target className="w-4 h-4" />
                                  {result.data.extractedTools.length} tools
                                </div>
                                <div className={`flex items-center gap-1 ${themeClasses.text.secondary}`}>
                                  <GitBranch className="w-4 h-4" />
                                  {result.data.workflow.phases.length} phases
                                </div>
                              </div>
                            </div>
                            <motion.button
                              onClick={(e) => deleteSavedResult(result.id, e)}
                              className={`p-2 ${themeClasses.text.secondary} hover:text-red-600 transition-colors rounded-lg hover:bg-red-50`}
                              whileHover={{ scale: 1.1 }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Graphviz Viewer Modal */}
        {state.data && (
          <GraphvizViewer
            isOpen={isGraphvizModalOpen}
            onClose={() => setIsGraphvizModalOpen(false)}
            dotCode={state.data.graphvizCode}
            title={`${formData.companyName} Workflow Diagram`}
          />
        )}
      </div>
    </div>
  );
};

export default BusinessLens;