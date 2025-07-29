import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Brain, 
  Heart, 
  Eye, 
  Lightbulb, 
  Target,
  BookOpen
} from 'lucide-react';
import { usePageTheme } from '../../../contexts/themeUtils';
import { useMemoryStore, useUIStore } from '../../../stores';
import { memoryService } from '../../../services/supabaseServices';

const MemoryBank: React.FC = () => {
  const navigate = useNavigate();
  const pageTheme = usePageTheme('memory');
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [profileView, setProfileView] = useState<'memories' | 'profile' | 'connections'>('memories');
  
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

  // Load memory data on mount
  useEffect(() => {
    const loadMemoryData = async () => {
      try {
        setLoading('memoryBank', true);
        const memoriesData = await memoryService.getUserMemories();
        
        if (memoriesData && memoriesData.length > 0) {
          // Transform database memories to insights format
          const insights = memoriesData.map(memory => ({
            id: memory.id || `memory_${Date.now()}`,
            memory: memory.text_content || '',
            category: memory.category || 'general',
            insights: memory.sensa_analysis?.insights || ['Analysis pending'],
            learningStyle: memory.sensa_analysis?.learningStyle || 'Analysis pending',
            emotionalTone: memory.sensa_analysis?.emotionalTone || 'Analysis pending',
            connections: memory.sensa_analysis?.connections || [],
            timestamp: new Date(memory.created_at || Date.now())
          }));

          setMemories(insights);

          // Only set learning profile if we have actual analysis data
          if (memoriesData.some(memory => memory.sensa_analysis)) {
            const analysisData = memoriesData.find(memory => memory.sensa_analysis)?.sensa_analysis;
            if (analysisData) {
              setLearningProfile({
                dominantStyle: analysisData.dominantStyle || 'Analysis pending',
                emotionalAnchors: analysisData.emotionalAnchors || [],
                cognitivePatterns: analysisData.cognitivePatterns || [],
                preferredEnvironments: analysisData.preferredEnvironments || [],
                motivationalTriggers: analysisData.motivationalTriggers || [],
                courseRecommendations: analysisData.courseRecommendations || []
              });
            }
          }

          addNotification({
            type: 'success',
            title: 'Memories Loaded',
            message: `${insights.length} memories loaded successfully.`,
            duration: 3000
          });
        } else {
          setMemories([]);
          setLearningProfile({
            dominantStyle: 'N/A - Share memories to discover',
            emotionalAnchors: ['Share memories to discover your emotional anchors'],
            cognitivePatterns: ['Share memories to discover your cognitive patterns'],
            preferredEnvironments: ['Share memories to discover your preferred environments'],
            motivationalTriggers: ['Share memories to discover your motivational triggers'],
            courseRecommendations: ['Share memories to get personalized course recommendations']
          });
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

    loadMemoryData();
  }, [setLoading, setMemories, setLearningProfile, addNotification]);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const stats = [
    { 
      label: 'Total Memories', 
      value: getMemoryCount(), 
      icon: Brain,
      color: '#6B46C1' // Primary amethyst color
    },
    { 
      label: 'Learning Connections', 
      value: getConnectionCount(), 
      icon: Target,
      color: '#7C2D92' // Secondary plum color
    },
    { 
      label: 'Insight Categories', 
      value: memories.length > 0 ? '5+' : '0', 
      icon: Lightbulb,
      color: '#F97316' // Accent coral color
    }
  ];

  return (
    <div className="min-h-screen" style={{
      background: pageTheme?.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#1a1a1a'
    }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={handleGoBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </motion.button>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ background: pageTheme.gradients.transformation }}
              >
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Memory Bank</h1>
                <p className="text-sm text-gray-600">Your learning insights & connections</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'memories', label: 'My Memories', icon: Brain },
                { id: 'profile', label: 'Learning Profile', icon: Heart },
                { id: 'connections', label: 'Connections', icon: Target }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setProfileView(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      profileView === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {profileView === 'memories' && (
              <div>
                {memories.length > 0 ? (
                  <div className="grid gap-4">
                    {memories.map((memory, index) => (
                      <motion.div
                        key={memory.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                                {memory.category}
                              </span>
                              <span className="text-xs text-gray-500">
                                {memory.timestamp.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-900 mb-2">{memory.memory}</p>
                            <div className="text-sm text-gray-600">
                              <p><strong>Learning Style:</strong> {memory.learningStyle}</p>
                              <p><strong>Emotional Tone:</strong> {memory.emotionalTone}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No memories yet</h3>
                    <p className="text-gray-600 mb-4">Start by sharing some of your learning experiences.</p>
                    <button
                      onClick={() => navigate('/memory-elicitation')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Share a Memory
                    </button>
                  </div>
                )}
              </div>
            )}

            {profileView === 'profile' && learningProfile && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Dominant Learning Style</h3>
                  <p className="text-purple-700 font-medium">{learningProfile.dominantStyle}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Emotional Anchors</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {learningProfile.emotionalAnchors.map((anchor, index) => (
                        <li key={index}>• {anchor}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Cognitive Patterns</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      {learningProfile.cognitivePatterns.map((pattern, index) => (
                        <li key={index}>• {pattern}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {profileView === 'connections' && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Learning Connections</h3>
                <p className="text-gray-600">Connections between your memories and courses will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MemoryBank;