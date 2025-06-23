import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSmartNavigation } from '../hooks/useAuth';
import { 
  ArrowLeft, 
  Heart, 
  Music, 
  Camera, 
  BookOpen,
  Send,
  Lightbulb,
  Clock,
  Brain,
  Sparkles,
  Target,
  Zap,
  RotateCcw,
  Edit3,
  Eye
} from 'lucide-react';
import { sensaBrandColors } from '../styles/brandColors';
import { memoryService } from '../services/supabaseServices';
import { useMemoryStore, useUIStore } from '../stores';

const MemoryElicitation: React.FC = () => {
  const navigate = useNavigate();
  const { goBack } = useSmartNavigation();
  const { addNotification } = useUIStore();
  const { addMemory } = useMemoryStore();
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [memoryResponses, setMemoryResponses] = useState<Record<number, string>>({});
  const [analysisResults, setAnalysisResults] = useState<Record<number, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<Set<number>>(new Set());

  const memoryPrompts = [
    {
      icon: <Camera className="w-8 h-8 text-white" />,
      title: 'Childhood Sanctuary',
      prompt: 'Describe a place from your childhood that felt magical or special to you. What did it look like? How did it make you feel? Include any sensory details that come to mind.',
      category: 'Spatial Memory',
      color: 'from-blue-400 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      learningConnection: 'Helps Sensa identify your preferred learning environments and spatial reasoning patterns'
    },
    {
      icon: <BookOpen className="w-8 h-8 text-white" />,
      title: 'Learning Adventure',
      prompt: 'Tell us about a time when you learned something that completely amazed you as a child. What was it? Who was there? What emotions did you feel?',
      category: 'Learning Adventure',
      color: 'from-green-400 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      learningConnection: 'Reveals your natural curiosity patterns and optimal learning triggers for course analysis'
    },
    {
      icon: <Heart className="w-8 h-8 text-white" />,
      title: 'Safe Haven',
      prompt: 'Describe a moment or place from your childhood where you felt completely safe and happy. What sensory details do you remember?',
      category: 'Emotional Memory',
      color: 'from-rose-400 to-pink-500',
      bgGradient: 'from-rose-50 to-pink-50',
      learningConnection: 'Identifies emotional anchors that enhance memory formation and course retention'
    },
    {
      icon: <Music className="w-8 h-8 text-white" />,
      title: 'Creative Expression',
      prompt: 'Think of a time when you created something as a child - art, music, stories, or building something. What was the process like? How did it feel?',
      category: 'Creative Memory',
      color: 'from-purple-400 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      learningConnection: 'Uncovers your creative learning style and hands-on preferences for course engagement'
    },
    {
      icon: <Target className="w-8 h-8 text-white" />,
      title: 'Problem Solving',
      prompt: 'Recall a time when you had to figure something out on your own as a child. What was your approach? How did you feel when you solved it?',
      category: 'Cognitive Memory',
      color: 'from-amber-400 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50',
      learningConnection: 'Maps your natural problem-solving strategies and persistence patterns for course challenges'
    }
  ];

  const handleCardFlip = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleMemoryChange = (index: number, value: string) => {
    setMemoryResponses(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const analyzeMemory = async (index: number) => {
    const memory = memoryResponses[index];
    if (!memory?.trim()) return;

    setIsAnalyzing(prev => new Set([...prev, index]));
    
    try {
      // Save memory to Supabase
      const category = memoryPrompts[index].category;
      const savedMemory = await memoryService.saveMemory(category, memory);
      
      if (!savedMemory) {
        throw new Error('Failed to save memory');
      }
      
      // Now analyze the memory using ADK agents
      try {
        const { callEdgeFunction } = await import('../services/edgeFunctions');
        const analysis = await callEdgeFunction('adk-agents', {
          agent_type: 'memory_analysis',
          payload: {
            task: 'analyze_memory',
            memory_content: memory,
            category: category
          }
        });
        
        if (analysis && analysis.success) {
          // Update memory with analysis results
          await memoryService.updateMemoryAnalysis(savedMemory.id, analysis.analysis);
          
          // Add to local store with analysis
          addMemory({
            id: savedMemory.id,
            memory: memory,
            category: category,
            insights: analysis.analysis?.insights || ['Analysis completed'],
            learningStyle: analysis.analysis?.dominant_learning_style || 'Analyzed',
            emotionalTone: analysis.analysis?.emotional_tone || 'Analyzed',
            connections: analysis.analysis?.themes || [],
            timestamp: new Date(savedMemory.created_at)
          });
          
          setAnalysisResults(prev => ({
            ...prev,
            [index]: "Memory analyzed! Sensa has identified your learning patterns and emotional triggers."
          }));
        } else {
          throw new Error('Analysis failed');
        }
      } catch (analysisError) {
        console.error('Memory analysis failed:', analysisError);
        
        // Add to local store without analysis
        addMemory({
          id: savedMemory.id,
          memory: memory,
          category: category,
          insights: ['AI analysis temporarily unavailable'],
          learningStyle: 'Analysis pending',
          emotionalTone: 'Analysis pending',
          connections: [],
          timestamp: new Date(savedMemory.created_at)
        });
        
        setAnalysisResults(prev => ({
          ...prev,
          [index]: "Memory saved! AI analysis will be completed when services are available."
        }));
      }
      
      addNotification({
        type: 'success',
        title: 'Memory Saved',
        message: 'Your memory has been saved successfully. Analysis will happen automatically.',
        duration: 4000
      });
      
      // Auto-navigate to memory bank after a short delay to show the result
      setTimeout(() => {
        navigate('/memory-bank');
      }, 3000);
      
    } catch (error) {
      console.error('Failed to save memory:', error);
      addNotification({
        type: 'error',
        title: 'Error Saving Memory',
        message: 'There was a problem saving your memory. Please try again.',
        duration: 5000
      });
    } finally {
      setIsAnalyzing(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => goBack('/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-xl shadow-lg"
                  style={{ background: sensaBrandColors.gradients.memoryToLearning.css }}
                >
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Sensa Memory Integration</h1>
                  <p className="text-xs text-gray-500">Share memories to unlock personalized learning</p>
                </div>
              </div>
            </div>
            
            <motion.button
              onClick={() => navigate('/memory-bank')}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
              whileHover={{ x: 2 }}
            >
              <Eye className="w-4 h-4" />
              <span>View Memory Bank</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            className="flex justify-center mb-6"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div 
              className="p-4 rounded-full shadow-2xl"
              style={{ background: sensaBrandColors.gradients.transformation.css }}
            >
              <Brain className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-light text-gray-800 mb-4">
            Your memories are the key to
            <br />
            <span 
              className="font-medium bg-gradient-to-r bg-clip-text text-transparent"
              style={{ backgroundImage: sensaBrandColors.gradients.memoryToLearning.css }}
            >
              personalized learning
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Each memory you share helps Sensa AI understand your unique learning patterns, emotional triggers, and cognitive preferences. 
            Click any card below to begin sharing your story.
          </p>
        </motion.div>

        {/* Memory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {memoryPrompts.map((prompt, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative h-80 perspective-1000"
            >
              <motion.div
                className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer"
                animate={{ rotateY: flippedCards.has(index) ? 180 : 0 }}
                onClick={() => handleCardFlip(index)}
              >
                {/* Front of Card */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                  <div className="w-full h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                    {/* Card Header */}
                    <div 
                      className={`h-32 bg-gradient-to-r ${prompt.color} relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative z-10 p-6 flex items-center justify-between h-full">
                        <div className="flex items-center space-x-3">
                          {prompt.icon}
                          <div>
                            <h3 className="text-white font-semibold text-lg">{prompt.title}</h3>
                            <p className="text-white/90 text-sm">{prompt.category}</p>
                          </div>
                        </div>
                        <motion.div
                          className="text-white/70 group-hover:text-white transition-colors"
                          whileHover={{ rotate: 180 }}
                        >
                          <RotateCcw className="w-5 h-5" />
                        </motion.div>
                      </div>
                      
                      {/* Floating Elements */}
                      <motion.div
                        className="absolute top-4 right-4 opacity-20"
                        animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Sparkles className="w-6 h-6 text-white" />
                      </motion.div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex flex-col justify-between h-48">
                      <div>
                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                          {prompt.prompt}
                        </p>
                      </div>
                      
                      <div className={`bg-gradient-to-r ${prompt.bgGradient} rounded-lg p-3 border border-gray-200`}>
                        <div className="flex items-start space-x-2">
                          <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-700">
                            {prompt.learningConnection}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back of Card */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                  <div className="w-full h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    {/* Back Header */}
                    <div 
                      className={`h-20 bg-gradient-to-r ${prompt.color} relative`}
                    >
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative z-10 p-4 flex items-center justify-between h-full">
                        <div className="flex items-center space-x-2">
                          <Edit3 className="w-5 h-5 text-white" />
                          <span className="text-white font-medium">Share Your Memory</span>
                        </div>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardFlip(index);
                          }}
                          className="text-white/70 hover:text-white transition-colors p-1 rounded"
                          whileHover={{ rotate: 180 }}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Memory Input Area */}
                    <div className="p-4 h-60 flex flex-col">
                      <textarea
                        value={memoryResponses[index] || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleMemoryChange(index, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Share your memory with Sensa... Take your time and include any details that feel meaningful to you."
                        className="flex-1 w-full p-3 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none resize-none text-sm text-gray-700 placeholder-gray-400 bg-white"
                      />
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>This memory will enhance all your course analyses</span>
                        </div>
                        
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            analyzeMemory(index);
                          }}
                          disabled={!memoryResponses[index]?.trim() || isAnalyzing.has(index)}
                          className="flex items-center space-x-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                          whileHover={{ scale: memoryResponses[index]?.trim() && !isAnalyzing.has(index) ? 1.05 : 1 }}
                          whileTap={{ scale: memoryResponses[index]?.trim() && !isAnalyzing.has(index) ? 0.95 : 1 }}
                        >
                          {isAnalyzing.has(index) ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <Brain className="w-3 h-3" />
                              </motion.div>
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span>Analyze</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Analysis Result Overlay */}
              <AnimatePresence>
                {analysisResults[index] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className="absolute -bottom-4 left-0 right-0 z-10"
                  >
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 shadow-lg">
                      <div className="flex items-start space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Zap className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-green-800 text-sm mb-1">Sensa AI Insight</h4>
                          <p className="text-green-700 text-xs leading-relaxed">{analysisResults[index]}</p>
                          <p className="text-green-600 text-xs mt-2 font-medium">
                            ✨ Redirecting to your Memory Bank to see full analysis...
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <motion.button
            onClick={() => navigate('/course-analyzer')}
            className="text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-3 mx-auto"
            style={{ background: sensaBrandColors.gradients.memoryToLearning.css }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Brain className="w-5 h-5" />
            <span>Analyze a Course with Your Memories</span>
            <Sparkles className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200"
        >
          <h4 className="font-medium text-amber-800 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Sensa Memory Integration Tips
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-700">
            <ul className="space-y-2">
              <li>• Click any card to flip it and start sharing your memory</li>
              <li>• Focus on vivid sensory details - what you saw, heard, felt</li>
              <li>• Include emotions and feelings - they're crucial for learning connections</li>
            </ul>
            <ul className="space-y-2">
              <li>• Don't worry about perfect recall - impressions matter more</li>
              <li>• Each memory adds to your Sensa profile for better course analysis</li>
              <li>• Share as many or as few memories as feels comfortable</li>
            </ul>
          </div>
        </motion.div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default MemoryElicitation;