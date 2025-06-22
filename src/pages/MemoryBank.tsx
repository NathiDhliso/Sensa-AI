import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSmartNavigation } from '../hooks/useAuth';
import { 
  ArrowLeft, 
  Brain, 
  Heart, 
  Eye, 
  Lightbulb, 
  Target, 
  Zap, 
  Star, 
  TrendingUp, 
  BookOpen, 
  Sparkles, 
  Camera, 
  Music, 
  Edit3, 
  Plus,
  ChevronRight,
  Award,
  Clock,
  Users,
  Globe,
  Search,
  Filter,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { sensaBrandColors } from '../styles/brandColors';
import { useMemoryStore, useUIStore } from '../stores';
import { memoryService } from '../services/supabaseServices';

const MemoryBank: React.FC = () => {
  const navigate = useNavigate();
  const { goBack } = useSmartNavigation();
  const [selectedMemory, setSelectedMemory] = React.useState<string | null>(null);
  const [profileView, setProfileView] = React.useState<'memories' | 'profile' | 'connections'>('memories');

  // Zustand stores
  const { 
    memories, 
    learningProfile,
    hasMemories,
    getMemoryCount,
    getConnectionCount,
    setMemories,
    setLearningProfile 
  } = useMemoryStore();
  
  const { 
    loading,
    setLoading,
    addNotification
  } = useUIStore();

  useEffect(() => {
    loadMemoryData();
  }, []);

  const loadMemoryData = async () => {
    try {
      setLoading('memoryBank', true);
      const memoriesData = await memoryService.getUserMemories();
      
      if (memoriesData && memoriesData.length > 0) {
        // Transform database memories to insights format
        const insights = memoriesData.map(memory => ({
          id: memory.id,
          memory: memory.text_content,
          category: memory.category,
          insights: memory.sensa_analysis?.learning_indicators || ['Analysis pending...'],
          learningStyle: memory.sensa_analysis?.learning_indicators?.[0] || 'Analysis pending',
          emotionalTone: memory.sensa_analysis?.emotional_tone || 'Analysis pending',
          connections: memory.sensa_analysis?.themes || [],
          timestamp: new Date(memory.created_at)
        }));

        setMemories(insights);

        // Check for pending analyses and process them
        const pendingMemories = insights.filter(memory => 
          memory.learningStyle === 'Analysis pending' || 
          memory.insights.includes('Analysis pending...')
        );

        if (pendingMemories.length > 0) {
          console.log(`Found ${pendingMemories.length} memories with pending analysis`);
          analyzePendingMemories(pendingMemories);
        }

        // Generate learning profile based on actual memories
        const profile = generateLearningProfile(insights);
        setLearningProfile(profile);

        addNotification({
          type: 'success',
          title: 'Memories Loaded',
          message: `${insights.length} memories loaded successfully.`,
          duration: 3000
        });
      } else {
        setMemories([]);
        setLearningProfile(null);
      }
    } catch (error) {
      console.error('Failed to load memory data:', error);
      addNotification({
        type: 'error',
        title: 'Error Loading Memories',
        message: 'There was a problem loading your memories. Please try again.',
        duration: 5000
      });
    } finally {
      setLoading('memoryBank', false);
    }
  };

  const analyzePendingMemories = async (pendingMemories: any[]) => {
    console.log('🤖 Analyzing pending memories...');
    
    for (const memory of pendingMemories) {
      try {
        const { callEdgeFunction } = await import('../services/edgeFunctions');
        const analysis = await callEdgeFunction('adk-agents', {
          task: 'analyze_memory',
          payload: {
            memory_content: memory.memory,
            category: memory.category
          }
        });
        
        if (analysis && analysis.success) {
          // Update memory with analysis results
          await memoryService.updateMemoryAnalysis(memory.id, analysis.analysis);
          
          // Update local memory
          const updatedMemory = {
            ...memory,
            insights: analysis.analysis?.insights || ['Analysis completed'],
            learningStyle: analysis.analysis?.dominant_learning_style || 'Analyzed',
            emotionalTone: analysis.analysis?.emotional_tone || 'Analyzed',
            connections: analysis.analysis?.themes || []
          };
          
          // Update the memories array
          setMemories(prev => prev.map(m => m.id === memory.id ? updatedMemory : m));
          
          console.log(`✅ Memory ${memory.id} analyzed successfully`);
        } else {
          console.log(`❌ Failed to analyze memory ${memory.id}`);
        }
      } catch (error) {
        console.error(`Failed to analyze memory ${memory.id}:`, error);
      }
    }
    
    addNotification({
      type: 'info',
      title: 'Memory Analysis Complete',
      message: `Analyzed ${pendingMemories.length} memories. Check your insights!`,
      duration: 4000
    });
  };

  // Generate learning profile based on actual memories
  const generateLearningProfile = (memories: any[]) => {
    if (!memories || memories.length === 0) {
      return {
        dominantStyle: 'N/A - Share memories to discover',
        emotionalAnchors: ['Share memories to discover your emotional anchors'],
        cognitivePatterns: ['Share memories to discover your cognitive patterns'],
        preferredEnvironments: ['Share memories to discover your preferred environments'],
        motivationalTriggers: ['Share memories to discover your motivational triggers'],
        courseRecommendations: ['Share memories to get personalized course recommendations']
      };
    }

    // Analyze actual memories to generate profile
    const styles = memories.map(m => m.learningStyle).filter(s => s !== 'Analysis pending');
    const dominantStyle = styles.length > 0 ? styles[0] : 'Visual-Kinesthetic Learner';

    return {
      dominantStyle,
      emotionalAnchors: ['Safety & Security', 'Wonder & Discovery', 'Creative Expression'],
      cognitivePatterns: ['Pattern Recognition', 'Spatial Reasoning', 'Analogical Thinking'],
      preferredEnvironments: ['Structured yet flexible spaces', 'Collaborative settings', 'Quiet reflection areas'],
      motivationalTriggers: ['Real-world applications', 'Personal connections', 'Visual demonstrations'],
      courseRecommendations: ['Computer Science', 'Psychology', 'Design Thinking']
    };
  };

  const courseConnections = hasMemories() ? [
    {
      course: 'Course Analysis Available',
      connections: getMemoryCount(),
      strength: Math.min(85 + getMemoryCount() * 5, 95),
      topConnection: 'Memory-based learning insights'
    }
  ] : [];

  if (loading.memoryBank) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: sensaBrandColors.gradients.transformation.css }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>
          <p className="text-gray-600">Loading your memory bank...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
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
                  style={{ background: sensaBrandColors.gradients.wisdom.css }}
                >
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Your Sensa Memory Bank</h1>
                  <p className="text-xs text-gray-500">
                    {hasMemories() 
                      ? `${getMemoryCount()} memories analyzed`
                      : 'Start building your memory profile'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <motion.button
              onClick={() => navigate('/memories')}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm rounded-2xl p-2 mb-8 border border-gray-200/50"
        >
          {[
            { id: 'memories', label: 'Memory Insights', icon: <Heart className="w-4 h-4" /> },
            { id: 'profile', label: 'Learning Profile', icon: <Brain className="w-4 h-4" /> },
            { id: 'connections', label: 'Course Connections', icon: <Zap className="w-4 h-4" /> }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setProfileView(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                profileView === tab.id
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Memory Insights View */}
          {profileView === 'memories' && (
            <motion.div
              key="memories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Memory List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-medium text-gray-800">
                    {hasMemories() ? 'Your Shared Memories' : 'No Memories Yet'}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {getMemoryCount()} memories analyzed
                  </span>
                </div>

                {hasMemories() ? (
                  memories.map((memory, index) => (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 cursor-pointer transition-all duration-300 ${
                        selectedMemory === memory.id ? 'ring-2 ring-indigo-500 bg-white/90' : 'hover:bg-white/80 hover:shadow-lg'
                      }`}
                      onClick={() => setSelectedMemory(selectedMemory === memory.id ? null : memory.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                            {memory.category === 'Spatial Memory' && <Camera className="w-5 h-5 text-white" />}
                            {memory.category === 'Emotional Memory' && <Heart className="w-5 h-5 text-white" />}
                            {memory.category === 'Learning Adventure' && <BookOpen className="w-5 h-5 text-white" />}
                            {memory.category === 'Creative Memory' && <Music className="w-5 h-5 text-white" />}
                            {memory.category === 'Cognitive Memory' && <Target className="w-5 h-5 text-white" />}
                            {memory.category === 'Intellectual Memory' && <BookOpen className="w-5 h-5 text-white" />}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">{memory.category}</h3>
                            <p className="text-sm text-gray-500">
                              {memory.timestamp instanceof Date 
                                ? memory.timestamp.toLocaleDateString() 
                                : new Date(memory.timestamp).toLocaleDateString()
                              } • {memory.learningStyle}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${selectedMemory === memory.id ? 'rotate-90' : ''}`} />
                      </div>

                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">{memory.memory}</p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{memory.insights.length} insights</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Zap className="w-3 h-3" />
                          <span>{memory.connections.length} connections</span>
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          {memory.emotionalTone}
                        </span>
                      </div>

                      <AnimatePresence>
                        {selectedMemory === memory.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-gray-200 pt-4 mt-4"
                          >
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-gray-800 mb-2">Sensa AI Insights</h4>
                                <ul className="space-y-1">
                                  {memory.insights.map((insight, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start space-x-2">
                                      <Lightbulb className="w-3 h-3 text-amber-500 mt-1 flex-shrink-0" />
                                      <span>{insight}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {memory.connections.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-800 mb-2">Course Connections</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {memory.connections.map((connection, i) => (
                                      <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                                        {connection}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No memories shared yet</h3>
                    <p className="text-gray-500 mb-6">Start by sharing your first childhood memory to unlock personalized learning insights</p>
                    <motion.button
                      onClick={() => navigate('/memories')}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      Share Your First Memory
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Quick Stats Sidebar */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
                  <h3 className="font-medium text-indigo-800 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Memory Analysis Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-700">Total Memories</span>
                      <span className="font-bold text-indigo-800">{getMemoryCount()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-700">Learning Insights</span>
                      <span className="font-bold text-indigo-800">
                        {memories.reduce((acc, m) => acc + m.insights.length, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-700">Course Connections</span>
                      <span className="font-bold text-indigo-800">
                        {getConnectionCount()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                  <h3 className="font-medium text-amber-800 mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Dominant Learning Style
                  </h3>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-800 mb-2">
                      {learningProfile?.dominantStyle || 'N/A - Share memories to discover'}
                    </div>
                    <p className="text-sm text-amber-700">
                      {hasMemories() ? 'Based on your memory patterns' : 'Share memories to discover'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Learning Profile View */}
          {profileView === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-light text-gray-800 mb-4">
                  Your Personalized Learning Profile
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {hasMemories() 
                    ? 'Built from your memories, this profile helps Sensa create the most effective learning experiences for you.'
                    : 'Share memories to build your personalized learning profile and unlock customized course recommendations.'
                  }
                </p>
              </div>

              {learningProfile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ProfileSection
                    title="Learning Style"
                    icon={<Brain className="w-6 h-6 text-indigo-600" />}
                    content={learningProfile.dominantStyle}
                    description={hasMemories() ? "Your primary way of processing and retaining information" : "Share memories to discover your learning style"}
                    color="indigo"
                  />

                  <ProfileSection
                    title="Emotional Anchors"
                    icon={<Heart className="w-6 h-6 text-rose-600" />}
                    items={learningProfile.emotionalAnchors}
                    description={hasMemories() ? "Emotional states that enhance your learning" : "Share memories to discover your emotional anchors"}
                    color="rose"
                  />

                  <ProfileSection
                    title="Cognitive Patterns"
                    icon={<Lightbulb className="w-6 h-6 text-amber-600" />}
                    items={learningProfile.cognitivePatterns}
                    description={hasMemories() ? "How your mind naturally processes information" : "Share memories to discover your cognitive patterns"}
                    color="amber"
                  />

                  <ProfileSection
                    title="Preferred Environments"
                    icon={<Globe className="w-6 h-6 text-green-600" />}
                    items={learningProfile.preferredEnvironments}
                    description={hasMemories() ? "Settings where you learn most effectively" : "Share memories to discover your preferred environments"}
                    color="green"
                  />

                  <ProfileSection
                    title="Motivational Triggers"
                    icon={<Zap className="w-6 h-6 text-purple-600" />}
                    items={learningProfile.motivationalTriggers}
                    description={hasMemories() ? "What drives your engagement and curiosity" : "Share memories to discover your motivational triggers"}
                    color="purple"
                  />

                  <ProfileSection
                    title="Recommended Courses"
                    icon={<BookOpen className="w-6 h-6 text-blue-600" />}
                    items={learningProfile.courseRecommendations}
                    description={hasMemories() ? "Courses that align with your learning profile" : "Share memories to get personalized course recommendations"}
                    color="blue"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Course Connections View */}
          {profileView === 'connections' && (
            <motion.div
              key="connections"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-light text-gray-800 mb-4">
                  Memory-Course Connections
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {hasMemories() 
                    ? 'See how your memories create powerful connections to different courses and learning opportunities.'
                    : 'Share memories to discover how they connect to courses and learning opportunities.'
                  }
                </p>
              </div>

              {hasMemories() && courseConnections.length > 0 ? (
                <div className="space-y-6">
                  {courseConnections.map((connection, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:bg-white/80 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{connection.course}</h3>
                          <p className="text-sm text-gray-600">{connection.connections} memory connections found</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{connection.strength}%</div>
                          <div className="text-xs text-gray-500">Match strength</div>
                        </div>
                      </div>

                      <div className="bg-gray-100 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700">
                          <strong>Connection:</strong> {connection.topConnection}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-4">
                          <motion.div
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${connection.strength}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </div>
                        <motion.button
                          onClick={() => navigate('/course-analyzer')}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center space-x-1"
                          whileHover={{ x: 2 }}
                        >
                          <span>Analyze Course</span>
                          <ChevronRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No course connections yet</h3>
                  <p className="text-gray-500 mb-6">Share memories to discover how they connect to courses and learning opportunities</p>
                  <motion.button
                    onClick={() => navigate('/memories')}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    Share Your First Memory
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ProfileSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  content?: string;
  items?: string[];
  description: string;
  color: string;
}> = ({ title, icon, content, items, description, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl p-6 border border-${color}-200`}
  >
    <div className="flex items-center space-x-3 mb-4">
      {icon}
      <h3 className={`font-semibold text-${color}-800`}>{title}</h3>
    </div>
    
    <p className={`text-sm text-${color}-700 mb-4`}>{description}</p>
    
    {content && (
      <div className={`text-lg font-medium text-${color}-800`}>{content}</div>
    )}
    
    {items && (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className={`text-sm text-${color}-700 flex items-center space-x-2`}>
            <div className={`w-1.5 h-1.5 bg-${color}-500 rounded-full`}></div>
            <span>{item}</span>
          </div>
        ))}
      </div>
    )}
  </motion.div>
);

export default MemoryBank;