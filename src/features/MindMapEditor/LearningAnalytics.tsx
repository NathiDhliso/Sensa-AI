import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, Clock, Users, Target, Award,
  Brain, Lightbulb, MessageSquare, Activity, Calendar,
  Download, Filter, RefreshCw, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { useCollaborationStore } from '../../stores/collaborationStore';

interface LearningMetrics {
  sessionDuration: number;
  nodesCreated: number;
  edgesCreated: number;
  collaborativeActions: number;
  chatMessages: number;
  focusTime: number;
  breaksCount: number;
  conceptsExplored: string[];
  learningObjectives: {
    id: string;
    title: string;
    progress: number;
    completed: boolean;
  }[];
  cognitiveLoad: {
    timestamp: number;
    level: 'low' | 'medium' | 'high';
    indicators: string[];
  }[];
  collaborationPatterns: {
    type: 'leader' | 'contributor' | 'observer' | 'facilitator';
    score: number;
    behaviors: string[];
  };
  knowledgeConstruction: {
    phase: 'exploration' | 'integration' | 'resolution' | 'application';
    duration: number;
    activities: string[];
  }[];
}

interface LearningInsight {
  id: string;
  type: 'strength' | 'improvement' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'cognitive' | 'collaborative' | 'metacognitive' | 'motivational';
}

interface LearningAnalyticsProps {
  sessionId: string;
  onClose: () => void;
  mode?: 'realtime' | 'summary' | 'detailed';
}

const LearningAnalytics: React.FC<LearningAnalyticsProps> = ({
  sessionId,
  onClose,
  mode = 'realtime'
}) => {
  const { currentSession, participants, operationHistory } = useCollaborationStore();
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'session' | 'hour' | 'day'>('session');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const generateMockMetrics = (): LearningMetrics => {
      const sessionStart = Date.now() - (45 * 60 * 1000); // 45 minutes ago
      
      return {
        sessionDuration: 45 * 60, // 45 minutes in seconds
        nodesCreated: 23,
        edgesCreated: 18,
        collaborativeActions: 67,
        chatMessages: 15,
        focusTime: 38 * 60, // 38 minutes
        breaksCount: 3,
        conceptsExplored: [
          'Machine Learning', 'Neural Networks', 'Deep Learning',
          'Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning'
        ],
        learningObjectives: [
          { id: '1', title: 'Understand ML fundamentals', progress: 85, completed: false },
          { id: '2', title: 'Compare learning algorithms', progress: 100, completed: true },
          { id: '3', title: 'Apply concepts to real problems', progress: 60, completed: false },
          { id: '4', title: 'Collaborate effectively', progress: 90, completed: false }
        ],
        cognitiveLoad: [
          { timestamp: sessionStart, level: 'low', indicators: ['steady pace', 'clear structure'] },
          { timestamp: sessionStart + 15*60*1000, level: 'medium', indicators: ['increased complexity', 'multiple concepts'] },
          { timestamp: sessionStart + 30*60*1000, level: 'high', indicators: ['rapid changes', 'deep analysis'] },
          { timestamp: sessionStart + 40*60*1000, level: 'medium', indicators: ['synthesis phase', 'consolidation'] }
        ],
        collaborationPatterns: {
          type: 'contributor',
          score: 78,
          behaviors: [
            'Active participation in discussions',
            'Builds on others\' ideas',
            'Asks clarifying questions',
            'Shares relevant examples'
          ]
        },
        knowledgeConstruction: [
          {
            phase: 'exploration',
            duration: 12 * 60,
            activities: ['Initial brainstorming', 'Concept identification', 'Resource gathering']
          },
          {
            phase: 'integration',
            duration: 18 * 60,
            activities: ['Connecting concepts', 'Building relationships', 'Collaborative mapping']
          },
          {
            phase: 'resolution',
            duration: 10 * 60,
            activities: ['Resolving conflicts', 'Clarifying understanding', 'Consensus building']
          },
          {
            phase: 'application',
            duration: 5 * 60,
            activities: ['Practical examples', 'Real-world connections', 'Future planning']
          }
        ]
      };
    };

    const generateInsights = (metrics: LearningMetrics): LearningInsight[] => {
      return [
        {
          id: '1',
          type: 'achievement',
          title: 'Excellent Collaboration',
          description: 'You\'ve demonstrated strong collaborative skills with 67 interactive actions.',
          actionable: false,
          priority: 'high',
          category: 'collaborative'
        },
        {
          id: '2',
          type: 'strength',
          title: 'Deep Concept Exploration',
          description: 'You\'ve explored 6 key concepts, showing thorough understanding.',
          actionable: false,
          priority: 'medium',
          category: 'cognitive'
        },
        {
          id: '3',
          type: 'recommendation',
          title: 'Consider Taking Breaks',
          description: 'Your focus time is excellent, but regular breaks could enhance retention.',
          actionable: true,
          priority: 'medium',
          category: 'metacognitive'
        },
        {
          id: '4',
          type: 'improvement',
          title: 'Increase Chat Participation',
          description: 'More active discussion could enhance collaborative learning.',
          actionable: true,
          priority: 'low',
          category: 'collaborative'
        }
      ];
    };

    setTimeout(() => {
      const mockMetrics = generateMockMetrics();
      setMetrics(mockMetrics);
      setInsights(generateInsights(mockMetrics));
      setIsLoading(false);
    }, 1000);
  }, [sessionId]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getCognitiveLoadColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Award className="w-4 h-4 text-yellow-500" />;
      case 'strength': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'improvement': return <Target className="w-4 h-4 text-orange-500" />;
      default: return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="bg-white rounded-lg p-8 flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg">Analyzing learning patterns...</span>
        </div>
      </motion.div>
    );
  }

  if (!metrics) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Learning Analytics</h2>
              <p className="text-sm text-gray-600">
                Session insights and collaborative learning patterns
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Timeframe selector */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="session">This Session</option>
              <option value="hour">Last Hour</option>
              <option value="day">Today</option>
            </select>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overview Metrics */}
            <div className="lg:col-span-2">
              <div className="bg-white border rounded-lg">
                <button
                  onClick={() => toggleSection('overview')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Session Overview
                  </h3>
                  {expandedSections.has('overview') ? 
                    <ChevronUp className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                </button>
                
                <AnimatePresence>
                  {expandedSections.has('overview') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t"
                    >
                      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">
                            {formatDuration(metrics.sessionDuration)}
                          </div>
                          <div className="text-sm text-gray-600">Duration</div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <Brain className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">
                            {metrics.nodesCreated}
                          </div>
                          <div className="text-sm text-gray-600">Concepts</div>
                        </div>
                        
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-600">
                            {metrics.collaborativeActions}
                          </div>
                          <div className="text-sm text-gray-600">Interactions</div>
                        </div>
                        
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <MessageSquare className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-orange-600">
                            {metrics.chatMessages}
                          </div>
                          <div className="text-sm text-gray-600">Messages</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Learning Objectives */}
              <div className="bg-white border rounded-lg mt-6">
                <button
                  onClick={() => toggleSection('objectives')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Learning Objectives
                  </h3>
                  {expandedSections.has('objectives') ? 
                    <ChevronUp className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                </button>
                
                <AnimatePresence>
                  {expandedSections.has('objectives') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t"
                    >
                      <div className="p-4 space-y-3">
                        {metrics.learningObjectives.map((objective) => (
                          <div key={objective.id} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{objective.title}</span>
                                <span className="text-sm text-gray-600">{objective.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    objective.completed ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${objective.progress}%` }}
                                />
                              </div>
                            </div>
                            {objective.completed && (
                              <Award className="w-5 h-5 text-yellow-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cognitive Load */}
              <div className="bg-white border rounded-lg mt-6">
                <button
                  onClick={() => toggleSection('cognitive')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Cognitive Load Analysis
                  </h3>
                  {expandedSections.has('cognitive') ? 
                    <ChevronUp className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                </button>
                
                <AnimatePresence>
                  {expandedSections.has('cognitive') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t"
                    >
                      <div className="p-4">
                        <div className="space-y-3">
                          {metrics.cognitiveLoad.map((load, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="text-xs text-gray-500 w-16">
                                {new Date(load.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                getCognitiveLoadColor(load.level)
                              }`}>
                                {load.level.toUpperCase()}
                              </div>
                              <div className="flex-1 text-sm text-gray-600">
                                {load.indicators.join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Insights Panel */}
            <div className="space-y-6">
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    Learning Insights
                  </h3>
                </div>
                
                <div className="p-4 space-y-3">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        insight.type === 'achievement' ? 'border-yellow-400 bg-yellow-50' :
                        insight.type === 'strength' ? 'border-green-400 bg-green-50' :
                        insight.type === 'recommendation' ? 'border-blue-400 bg-blue-50' :
                        'border-orange-400 bg-orange-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                          {insight.actionable && (
                            <div className="mt-2">
                              <span className="text-xs bg-white px-2 py-1 rounded border">
                                Actionable
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collaboration Pattern */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Collaboration Style
                  </h3>
                </div>
                
                <div className="p-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-blue-600 capitalize">
                      {metrics.collaborationPatterns.type}
                    </div>
                    <div className="text-sm text-gray-600">Collaboration Style</div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${metrics.collaborationPatterns.score}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {metrics.collaborationPatterns.score}% effectiveness
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Behaviors:</h4>
                    {metrics.collaborationPatterns.behaviors.map((behavior, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full" />
                        {behavior}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Analytics updated in real-time • Last refresh: {new Date().toLocaleTimeString()}
          </div>
          
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm border rounded-md hover:bg-white transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Share Insights
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LearningAnalytics;