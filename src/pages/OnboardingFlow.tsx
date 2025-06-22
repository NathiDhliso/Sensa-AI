import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Brain,
  Lightbulb,
  MessageCircle,
  Zap,
  Eye,
  Camera,
  BookOpen,
  Target,
  Clock,
  CheckCircle,
  Cpu,
  Mail
} from 'lucide-react';
// Import ADK system services
import { MemoryProfile } from '../types';
import { supabase } from '../lib/supabase';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  type: 'welcome' | 'memory' | 'dynamic' | 'completion' | 'signup';
  prompt?: string;
  category?: string;
  icon?: React.ReactNode;
  aiGenerated?: boolean;
}

interface MemoryResponse {
  stepId: string;
  content: string;
  themes?: string[];
  emotionalTone?: string;
  confidence?: number;
}

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [memoryResponses, setMemoryResponses] = useState<MemoryResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setMemoryProfile] = useState<MemoryProfile | null>(null);
  const [, setDynamicSteps] = useState<OnboardingStep[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const navigate = useNavigate();

  // AI agents now integrated into ADK system

  const baseSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Sensa',
      subtitle: 'Let\'s discover what makes you unique',
      type: 'welcome'
    },
    {
      id: 'signup',
      title: 'Create Your Sensa Account',
      subtitle: 'Join the memory-powered learning revolution',
      type: 'signup'
    },
    {
      id: 'childhood_place',
      title: 'Your Childhood Canvas',
      subtitle: 'Paint us a picture of where you grew up',
      type: 'memory',
      prompt: 'Describe a place from your childhood that felt magical or special to you. What did it look like? How did it make you feel? Include any sensory details that come to mind.',
      category: 'Spatial',
      icon: <Camera className="w-6 h-6 text-blue-500" />
    },
    {
      id: 'learning_moment',
      title: 'Moments of Wonder',
      subtitle: 'When did learning feel like an adventure?',
      type: 'memory',
      prompt: 'Tell us about a time when you learned something that completely amazed you as a child. What was it? Who was there? What emotions did you feel?',
      category: 'Intellectual',
      icon: <BookOpen className="w-6 h-6 text-green-500" />
    },
    {
      id: 'comfort_memory',
      title: 'Safe Spaces',
      subtitle: 'Everyone needs a refuge',
      type: 'memory',
      prompt: 'Describe a moment or place from your childhood where you felt completely safe and happy. What sensory details do you remember?',
      category: 'Emotional',
      icon: <Heart className="w-6 h-6 text-rose-500" />
    }
  ];

  const [allSteps, setAllSteps] = useState<OnboardingStep[]>(baseSteps);

  // Process memory response with AI
  const processMemoryResponse = async (stepId: string, content: string) => {
    if (!content.trim()) return;

    setIsProcessing(true);
    
    try {
      // Analyze the current memory
      const memoryResponse: MemoryResponse = {
        stepId,
        content,
        themes: await extractThemes(content),
        emotionalTone: await analyzeEmotionalTone(content),
        confidence: Math.random() * 0.3 + 0.7 // Mock confidence score
      };

      setMemoryResponses(prev => [...prev, memoryResponse]);

      // Generate AI insights
      const insights = await generateInsights(content, stepId);
      setAiInsights(insights);

      // Generate follow-up questions if we have enough context
      if (memoryResponses.length >= 1) {
        const followUpStep = await generateDynamicStep(memoryResponses.concat([memoryResponse]));
        if (followUpStep) {
          setDynamicSteps(prev => [...prev, followUpStep]);
          
          // Insert the dynamic step after current step
          setAllSteps(prev => {
            const newSteps = [...prev];
            newSteps.splice(currentStep + 1, 0, followUpStep);
            return newSteps;
          });
        }
      }

    } catch (error) {
      console.error('Sensa memory processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract themes from memory content
  const extractThemes = async (content: string): Promise<string[]> => {
    // Mock theme extraction - in production would use actual AI
    const themes = [];
    if (content.toLowerCase().includes('build') || content.toLowerCase().includes('construct')) {
      themes.push('Construction & Building');
    }
    if (content.toLowerCase().includes('safe') || content.toLowerCase().includes('comfort')) {
      themes.push('Safety & Security');
    }
    if (content.toLowerCase().includes('discover') || content.toLowerCase().includes('explore')) {
      themes.push('Discovery & Exploration');
    }
    if (content.toLowerCase().includes('create') || content.toLowerCase().includes('art')) {
      themes.push('Creative Expression');
    }
    return themes;
  };

  // Analyze emotional tone
  const analyzeEmotionalTone = async (content: string): Promise<string> => {
    // Mock emotional analysis
    const positiveWords = ['happy', 'joy', 'love', 'excited', 'wonderful', 'amazing'];
    const nostalgicWords = ['remember', 'used to', 'back then', 'childhood'];
    
    const hasPositive = positiveWords.some(word => content.toLowerCase().includes(word));
    const hasNostalgic = nostalgicWords.some(word => content.toLowerCase().includes(word));
    
    if (hasPositive && hasNostalgic) return 'Warm & Nostalgic';
    if (hasPositive) return 'Joyful & Energetic';
    if (hasNostalgic) return 'Reflective & Thoughtful';
    return 'Contemplative';
  };

  // Generate AI insights about the memory
  const generateInsights = async (_content: string, _stepId: string): Promise<string> => {
    // Mock insight generation
    const insights = [
      "Sensa AI can sense themes of creativity and safe exploration in your memory. This suggests you learn best when you feel secure to experiment.",
      "Your memory shows strong visual and spatial elements. Sensa will use this to create visual learning pathways for your courses.",
      "The emotional warmth in your story indicates that positive associations help you remember better. We'll use this in your course analysis.",
      "Your attention to sensory details suggests you're a kinesthetic learner who benefits from hands-on experiences."
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  };

  // Generate dynamic follow-up questions
  const generateDynamicStep = async (responses: MemoryResponse[]): Promise<OnboardingStep | null> => {
    // Analyze patterns across responses to generate targeted questions
    const allThemes = responses.flatMap(r => r.themes || []);
    
    // Check if allThemes is empty before calling reduce
    if (allThemes.length === 0) {
      return null;
    }
    
    const dominantTheme = allThemes.reduce((a, b, i, arr) => 
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );

    if (dominantTheme === 'Construction & Building') {
      return {
        id: `dynamic_building_${Date.now()}`,
        title: 'The Builder\'s Mind',
        subtitle: 'Sensa AI notices you have a connection to building and creating',
        type: 'dynamic',
        prompt: 'Tell me about a time when you built something with your hands - maybe with blocks, in sand, or even helping an adult with a project. What was the most satisfying part?',
        category: 'Creative Process',
        icon: <Target className="w-6 h-6 text-purple-500" />,
        aiGenerated: true
      };
    }

    if (dominantTheme === 'Discovery & Exploration') {
      return {
        id: `dynamic_exploration_${Date.now()}`,
        title: 'The Explorer\'s Spirit',
        subtitle: 'Your curiosity seems to drive your learning',
        type: 'dynamic',
        prompt: 'Describe a time when you discovered something unexpected - maybe a hidden place, an interesting object, or a surprising fact. What made that discovery special?',
        category: 'Curiosity Pattern',
        icon: <Eye className="w-6 h-6 text-amber-500" />,
        aiGenerated: true
      };
    }

    return null;
  };

  // Handle response changes with real-time processing
  const handleResponseChange = (value: string) => {
    setCurrentResponse(value);
    
    // Trigger AI processing after user stops typing (debounced)
    if (value.length > 50) {
      const timeoutId = setTimeout(() => {
        processMemoryResponse(allSteps[currentStep].id, value);
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSignup = async () => {
    if (!userEmail || !userPassword || !userFullName) {
      setSignupError('Please fill in all fields');
      return;
    }

    setSignupLoading(true);
    setSignupError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }

      const { error } = await supabase.functions.invoke('send-auth-email', {
        body: {
          emailType: 'CONFIRM_SIGNUP',
          userData: {
            email: userEmail,
            password: userPassword,
            fullName: userFullName
          }
        }
      });

      if (error) throw error;

      // Move to next step (completion)
      setCurrentStep(currentStep + 1);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setSignupError(errorMessage);
    } finally {
      setSignupLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < allSteps.length - 1) {
      // Handle signup step
      if (allSteps[currentStep].type === 'signup') {
        await handleSignup();
        return;
      }

      // Save current response
      if (currentResponse.trim()) {
        setResponses(prev => ({ ...prev, [allSteps[currentStep].id]: currentResponse }));
        
        // Process memory if it's a memory step
        if (allSteps[currentStep].type === 'memory' || allSteps[currentStep].type === 'dynamic') {
          await processMemoryResponse(allSteps[currentStep].id, currentResponse);
        }
      }
      
      setCurrentStep(currentStep + 1);
      setCurrentResponse('');
      setAiInsights('');
    } else {
      // Complete onboarding and build final memory profile
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setIsProcessing(true);
    
    try {
      // Process memories locally (no database save since user isn't authenticated yet)
      const allMemories = Object.entries(responses)
        .filter(([, content]) => content.trim())
        .map(([stepId, content]) => ({ stepId, content }));
      
      const memoryAnalyses = [];
      
      // Store memories locally without analysis (analysis will happen after authentication)
      for (const memory of allMemories) {
        try {
          const stepData = allSteps.find(step => step.id === memory.stepId);
          const category = stepData?.category || 'general';
          
          // Store memory info locally (no API calls during onboarding)
          memoryAnalyses.push({
            stepId: memory.stepId,
            content: memory.content,
            category,
            analysis: null // Will be analyzed after authentication
          });
        } catch (error) {
          console.error('Failed to process memory:', error);
          // Continue with other memories even if one fails
        }
      }
      
      // Store all data locally for later database save after authentication
      localStorage.setItem('sensaOnboardingResponses', JSON.stringify(responses));
      localStorage.setItem('sensaMemoryAnalyses', JSON.stringify(memoryAnalyses));
      localStorage.setItem('sensaPendingMemories', JSON.stringify(allMemories));
      
      // Add completion step
      const completionStep: OnboardingStep = {
        id: 'completion',
        title: 'Check Your Email',
        subtitle: 'Almost there! Just one more step',
        type: 'completion'
      };
      
      setAllSteps(prev => [...prev, completionStep]);
      setCurrentStep(allSteps.length);
      
    } catch (error) {
      console.error('Sensa onboarding completion failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCurrentResponse(responses[allSteps[currentStep - 1].id] || '');
    }
  };

  const currentStepData = allSteps[currentStep];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Enhanced Progress Bar with Sensa Branding */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              {/* Back button - only show on signup step */}
              {currentStepData?.type === 'signup' && (
                <motion.button
                  whileHover={{ scale: 1.1, x: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/login')}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                </motion.button>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-800">Sensa</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Step {currentStep + 1} of {allSteps.length}</span>
                {isProcessing && (
                  <div className="flex items-center space-x-2 text-indigo-600">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Cpu className="w-4 h-4" />
                    </motion.div>
                    <span className="text-xs">AI Processing...</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-600">{Math.round(((currentStep + 1) / allSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / allSteps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-3xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <motion.h1
                  className="text-3xl md:text-4xl font-light text-gray-800 mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {currentStepData?.title}
                </motion.h1>
                <motion.p
                  className="text-lg text-gray-600"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentStepData?.subtitle}
                </motion.p>
                
                {currentStepData?.aiGenerated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center space-x-2 mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Sensa AI-Generated Question</span>
                  </motion.div>
                )}
              </div>

              {/* Step Content */}
              {currentStepData?.type === 'welcome' && <WelcomeStep />}
              
              {currentStepData?.type === 'signup' && (
                <SignupStep
                  userEmail={userEmail}
                  setUserEmail={setUserEmail}
                  userPassword={userPassword}
                  setUserPassword={setUserPassword}
                  userFullName={userFullName}
                  setUserFullName={setUserFullName}
                  signupError={signupError}
                  signupLoading={signupLoading}
                />
              )}
              
              {(currentStepData?.type === 'memory' || currentStepData?.type === 'dynamic') && (
                <MemoryPromptStep
                  stepData={currentStepData}
                  currentResponse={currentResponse}
                  onResponseChange={handleResponseChange}
                  aiInsights={aiInsights}
                  isProcessing={isProcessing}
                />
              )}
              
              {currentStepData?.type === 'completion' && (
                <CompletionStep userEmail={userEmail} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <motion.div
            className="flex justify-between items-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={currentStepData?.type === 'completion' ? () => navigate('/login') : handleNext}
              disabled={
                isProcessing || 
                signupLoading ||
                (currentStepData?.type === 'signup' && (!userEmail || !userPassword || !userFullName)) ||
                (currentStepData?.type !== 'welcome' && currentStepData?.type !== 'completion' && currentStepData?.type !== 'signup' && !currentResponse.trim())
              }
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {currentStepData?.type === 'completion' ? 'Go to Login' : 
                 currentStepData?.type === 'signup' ? 'Create Account' : 'Continue'}
              </span>
              {currentStepData?.type === 'completion' ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const WelcomeStep: React.FC = () => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-200/50 shadow-xl"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.3 }}
  >
    <div className="flex justify-center mb-6">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-4 rounded-full">
        <Brain className="w-8 h-8 text-white" />
      </div>
    </div>
    <h3 className="text-xl font-medium text-gray-800 mb-4">Your memories hold the key to personalized learning</h3>
    <p className="text-gray-600 leading-relaxed mb-6">
      Instead of lengthy assessments, Sensa will have a gentle conversation about your childhood experiences. 
      Our AI agents will analyze your stories in real-time to create learning content that truly resonates with who you are.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-indigo-50 rounded-lg p-4">
        <Brain className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
        <h4 className="font-medium text-indigo-800 text-sm mb-1">Real-time Analysis</h4>
        <p className="text-indigo-600 text-xs">Sensa AI processes your memories as you share them</p>
      </div>
      
      <div className="bg-purple-50 rounded-lg p-4">
        <MessageCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
        <h4 className="font-medium text-purple-800 text-sm mb-1">Dynamic Questions</h4>
        <p className="text-purple-600 text-xs">Follow-up questions adapt to your responses</p>
      </div>
      
      <div className="bg-green-50 rounded-lg p-4">
        <Sparkles className="w-6 h-6 text-green-600 mx-auto mb-2" />
        <h4 className="font-medium text-green-800 text-sm mb-1">Instant Insights</h4>
        <p className="text-green-600 text-xs">See how your memories shape your learning style</p>
      </div>
    </div>
    
    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
      <Clock className="w-4 h-4" />
      <span>This will take about 5-7 minutes</span>
    </div>
  </motion.div>
);

const SignupStep: React.FC<{
  userEmail: string;
  setUserEmail: (email: string) => void;
  userPassword: string;
  setUserPassword: (password: string) => void;
  userFullName: string;
  setUserFullName: (name: string) => void;
  signupError: string | null;
  signupLoading: boolean;
}> = ({ userEmail, setUserEmail, userPassword, setUserPassword, userFullName, setUserFullName, signupError, signupLoading }) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-xl"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.3 }}
  >
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={userFullName}
          onChange={(e) => setUserFullName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Enter your full name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          type="password"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Create a secure password"
          required
          minLength={6}
        />
        <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
      </div>

      {signupError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <p className="text-red-600 text-sm">{signupError}</p>
        </motion.div>
      )}

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
        <p className="text-sm text-amber-800">
          📧 After creating your account, you'll receive a confirmation email. Click the link in the email to verify your account and complete the signup process.
        </p>
      </div>
    </div>
  </motion.div>
);

const MemoryPromptStep: React.FC<{
  stepData: OnboardingStep;
  currentResponse: string;
  onResponseChange: (value: string) => void;
  aiInsights: string;
  isProcessing: boolean;
}> = ({ stepData, currentResponse, onResponseChange, aiInsights, isProcessing }) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-xl"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.3 }}
  >
    <div className="mb-6">
      <div className="flex items-center space-x-3 mb-4">
        {stepData.icon}
        <div>
          <span className="text-sm text-gray-500">{stepData.category}</span>
          {stepData.aiGenerated && (
            <div className="flex items-center space-x-1 text-xs text-indigo-600">
              <Zap className="w-3 h-3" />
              <span>Personalized by Sensa AI</span>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-lg text-gray-700 leading-relaxed mb-6">{stepData.prompt}</p>
      
      <div className="relative">
        <textarea
          value={currentResponse}
          onChange={(e) => onResponseChange(e.target.value)}
          placeholder="Share your memory here... Take your time and include any details that feel important to you."
          className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none resize-none text-gray-700 placeholder-gray-400 bg-white/90 transition-all"
        />
        
        {isProcessing && (
          <div className="absolute bottom-4 right-4 flex items-center space-x-2 text-indigo-600">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-4 h-4" />
            </motion.div>
            <span className="text-xs">Sensa AI analyzing...</span>
          </div>
        )}
      </div>
    </div>

    {/* AI Insights */}
    <AnimatePresence>
      {aiInsights && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200"
        >
          <div className="flex items-start space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-medium text-indigo-800 text-sm mb-1">Sensa AI Insight</h4>
              <p className="text-indigo-700 text-sm leading-relaxed">{aiInsights}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="text-center mt-6">
      <p className="text-sm text-gray-500">
        💡 There are no right or wrong answers - Sensa is simply getting to know you
      </p>
    </div>
  </motion.div>
);

const CompletionStep: React.FC<{ userEmail: string }> = ({ userEmail }) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-200/50 shadow-xl"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.3 }}
  >
    <div className="flex justify-center mb-6">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-full">
        <Mail className="w-8 h-8 text-white" />
      </div>
    </div>
    
    <h3 className="text-xl font-medium text-gray-800 mb-4">Check Your Email</h3>
    <p className="text-gray-600 leading-relaxed mb-6">
      We've sent a confirmation email to <strong>{userEmail}</strong>. 
      Please click the link in the email to verify your account and complete your Sensa registration.
    </p>

    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
      <h4 className="font-medium text-blue-800 mb-4">What happens next?</h4>
      
      <div className="space-y-3 text-left">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 p-1 rounded-full mt-1">
            <CheckCircle className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <h5 className="text-sm font-medium text-blue-700">1. Check your email</h5>
            <p className="text-xs text-blue-600">Look for an email from Sensa in your inbox</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 p-1 rounded-full mt-1">
            <CheckCircle className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <h5 className="text-sm font-medium text-blue-700">2. Click the confirmation link</h5>
            <p className="text-xs text-blue-600">This will verify your email address</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 p-1 rounded-full mt-1">
            <CheckCircle className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <h5 className="text-sm font-medium text-blue-700">3. Sign in to Sensa</h5>
            <p className="text-xs text-blue-600">You'll be redirected to the login page automatically</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
      <p className="text-sm text-amber-800">
        ✨ <strong>Your memory profile is ready!</strong> Once you sign in, you'll have access to personalized course analysis based on the memories you've shared.
      </p>
    </div>
  </motion.div>
);

export default OnboardingFlow;