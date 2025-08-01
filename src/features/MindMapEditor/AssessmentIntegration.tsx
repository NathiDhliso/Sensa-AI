import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, Users, Target, Award, Brain,
  FileText, MessageSquare, TrendingUp, AlertCircle,
  Play, Pause, RotateCcw, Send, Eye, Edit3, X,
  ChevronRight, ChevronDown, Star, Zap
} from 'lucide-react';
import { useCollaborationStore } from '../../stores/collaborationStore';

interface AssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'short-answer' | 'concept-map' | 'peer-review' | 'reflection';
  title: string;
  description: string;
  points: number;
  timeLimit?: number;
  options?: string[];
  correctAnswer?: string | string[];
  rubric?: {
    criteria: string;
    levels: { score: number; description: string }[];
  }[];
  collaborativeMode: boolean;
  requiredNodes?: string[];
  requiredConnections?: string[];
}

interface AssessmentSession {
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  timeLimit: number;
  allowCollaboration: boolean;
  showResultsImmediately: boolean;
  passingScore: number;
  attempts: number;
  status: 'draft' | 'active' | 'completed' | 'grading';
  participants: {
    userId: string;
    name: string;
    status: 'not-started' | 'in-progress' | 'completed' | 'submitted';
    score?: number;
    timeSpent: number;
    responses: Record<string, any>;
  }[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface PeerReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  targetUserId: string;
  questionId: string;
  criteria: {
    name: string;
    score: number;
    maxScore: number;
    feedback: string;
  }[];
  overallFeedback: string;
  submittedAt: Date;
}

interface AssessmentIntegrationProps {
  sessionId: string;
  onClose: () => void;
  mode?: 'create' | 'take' | 'review' | 'results';
  assessmentId?: string;
}

const AssessmentIntegration: React.FC<AssessmentIntegrationProps> = ({
  sessionId,
  onClose,
  mode = 'create',
  assessmentId
}) => {
  const { currentSession, participants } = useCollaborationStore();
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
  const [selectedTab, setSelectedTab] = useState<'questions' | 'collaboration' | 'analytics'>('questions');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // Mock assessment data
  useEffect(() => {
    const mockAssessment: AssessmentSession = {
      id: assessmentId || 'assessment-1',
      title: 'Machine Learning Concepts Assessment',
      description: 'Collaborative assessment on fundamental ML concepts and their relationships',
      timeLimit: 45 * 60, // 45 minutes
      allowCollaboration: true,
      showResultsImmediately: false,
      passingScore: 70,
      attempts: 2,
      status: mode === 'create' ? 'draft' : 'active',
      participants: participants.map(p => ({
        userId: p.user_id,
        name: p.name || p.email,
        status: 'not-started' as const,
        timeSpent: 0,
        responses: {}
      })),
      questions: [
        {
          id: 'q1',
          type: 'concept-map',
          title: 'ML Algorithm Relationships',
          description: 'Create a concept map showing the relationships between different machine learning algorithms',
          points: 25,
          timeLimit: 15 * 60,
          collaborativeMode: true,
          requiredNodes: ['Supervised Learning', 'Unsupervised Learning', 'Neural Networks'],
          requiredConnections: ['is-a', 'uses', 'related-to']
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          title: 'Deep Learning Fundamentals',
          description: 'Which of the following best describes backpropagation?',
          points: 10,
          timeLimit: 5 * 60,
          collaborativeMode: false,
          options: [
            'A method for forward propagation in neural networks',
            'An algorithm for calculating gradients and updating weights',
            'A technique for data preprocessing',
            'A type of activation function'
          ],
          correctAnswer: 'An algorithm for calculating gradients and updating weights'
        },
        {
          id: 'q3',
          type: 'peer-review',
          title: 'Concept Map Peer Review',
          description: 'Review and provide feedback on your peer\'s concept map',
          points: 15,
          collaborativeMode: true,
          rubric: [
            {
              criteria: 'Conceptual Accuracy',
              levels: [
                { score: 4, description: 'All concepts are accurately represented' },
                { score: 3, description: 'Most concepts are accurate with minor errors' },
                { score: 2, description: 'Some concepts are accurate but several errors exist' },
                { score: 1, description: 'Many conceptual errors present' }
              ]
            },
            {
              criteria: 'Relationship Quality',
              levels: [
                { score: 4, description: 'Relationships are clear, logical, and well-labeled' },
                { score: 3, description: 'Most relationships are appropriate' },
                { score: 2, description: 'Some relationships are unclear or incorrect' },
                { score: 1, description: 'Relationships are poorly defined' }
              ]
            }
          ]
        },
        {
          id: 'q4',
          type: 'reflection',
          title: 'Learning Reflection',
          description: 'Reflect on your collaborative learning experience and key insights gained',
          points: 10,
          collaborativeMode: false
        }
      ],
      createdAt: new Date(),
      startedAt: mode !== 'create' ? new Date() : undefined
    };

    setCurrentAssessment(mockAssessment);
    if (mode === 'take' && mockAssessment.timeLimit) {
      setTimeRemaining(mockAssessment.timeLimit);
    }
  }, [assessmentId, mode, participants]);

  // Timer effect
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            // Auto-submit assessment
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isActive, timeRemaining]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartAssessment = () => {
    setIsActive(true);
    if (currentAssessment) {
      setCurrentAssessment({
        ...currentAssessment,
        startedAt: new Date(),
        status: 'active'
      });
    }
  };

  const handleSubmitResponse = (questionId: string, response: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  const handleSubmitAssessment = () => {
    if (currentAssessment) {
      setCurrentAssessment({
        ...currentAssessment,
        status: 'completed',
        completedAt: new Date()
      });
      setIsActive(false);
    }
  };

  const toggleQuestionExpansion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const renderQuestionContent = (question: AssessmentQuestion) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  onChange={(e) => handleSubmitResponse(question.id, e.target.value)}
                  className="text-blue-600"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'short-answer':
        return (
          <textarea
            className="w-full p-3 border rounded-lg resize-none"
            rows={4}
            placeholder="Enter your answer here..."
            onChange={(e) => handleSubmitResponse(question.id, e.target.value)}
          />
        );
      
      case 'concept-map':
        return (
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Concept Map Builder</span>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Required nodes: {question.requiredNodes?.join(', ')}
            </div>
            <div className="h-64 bg-white border rounded flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Concept map builder would be integrated here</p>
                <p className="text-xs">Connected to main mindmap editor</p>
              </div>
            </div>
          </div>
        );
      
      case 'peer-review':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Peer Review Assignment</span>
              </div>
              <p className="text-sm text-yellow-700">
                You will review a randomly assigned peer's work based on the rubric below.
              </p>
            </div>
            
            {question.rubric?.map((criterion, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">{criterion.criteria}</h4>
                <div className="space-y-2">
                  {criterion.levels.map((level, levelIndex) => (
                    <label key={levelIndex} className="flex items-start gap-3 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`${question.id}-${index}`}
                        value={level.score}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">{level.score} points</div>
                        <div className="text-sm text-gray-600">{level.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            
            <div>
              <label className="block text-sm font-medium mb-2">Overall Feedback</label>
              <textarea
                className="w-full p-3 border rounded-lg resize-none"
                rows={3}
                placeholder="Provide constructive feedback to your peer..."
              />
            </div>
          </div>
        );
      
      case 'reflection':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Reflection Prompts</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• What were the most important concepts you learned?</li>
                <li>• How did collaboration enhance your understanding?</li>
                <li>• What challenges did you encounter and how did you overcome them?</li>
                <li>• How will you apply these concepts in the future?</li>
              </ul>
            </div>
            
            <textarea
              className="w-full p-3 border rounded-lg resize-none"
              rows={6}
              placeholder="Share your reflections on the learning experience..."
              onChange={(e) => handleSubmitResponse(question.id, e.target.value)}
            />
          </div>
        );
      
      default:
        return <div>Question type not supported</div>;
    }
  };

  if (!currentAssessment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{currentAssessment.title}</h2>
              <p className="text-sm text-gray-600">{currentAssessment.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            {mode === 'take' && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
            )}
            
            {/* Status */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentAssessment.status === 'active' ? 'bg-green-100 text-green-700' :
              currentAssessment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {currentAssessment.status.toUpperCase()}
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b">
          <div className="flex">
            {['questions', 'collaboration', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedTab === 'questions' && (
            <div className="p-6">
              {mode === 'take' && !isActive && currentAssessment.status === 'draft' && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Start Assessment?</h3>
                  <p className="text-gray-600 mb-6">
                    This assessment contains {currentAssessment.questions.length} questions and has a time limit of {formatTime(currentAssessment.timeLimit)}.
                  </p>
                  <button
                    onClick={handleStartAssessment}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Play className="w-5 h-5" />
                    Start Assessment
                  </button>
                </div>
              )}
              
              {(mode !== 'take' || isActive || currentAssessment.status === 'completed') && (
                <div className="space-y-6">
                  {currentAssessment.questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg">
                      <button
                        onClick={() => toggleQuestionExpansion(question.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            responses[question.id] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {responses[question.id] ? <CheckCircle className="w-4 h-4" /> : index + 1}
                          </div>
                          <div className="text-left">
                            <h3 className="font-medium">{question.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{question.points} points</span>
                              {question.timeLimit && <span>{formatTime(question.timeLimit)} limit</span>}
                              {question.collaborativeMode && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  Collaborative
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {expandedQuestions.has(question.id) ? 
                          <ChevronDown className="w-5 h-5" /> : 
                          <ChevronRight className="w-5 h-5" />
                        }
                      </button>
                      
                      <AnimatePresence>
                        {expandedQuestions.has(question.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t"
                          >
                            <div className="p-4">
                              <p className="text-gray-700 mb-4">{question.description}</p>
                              {renderQuestionContent(question)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {selectedTab === 'collaboration' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Participants
                  </h3>
                  <div className="space-y-3">
                    {currentAssessment.participants.map((participant) => (
                      <div key={participant.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{participant.name}</div>
                          <div className="text-sm text-gray-600">
                            Status: {participant.status.replace('-', ' ')}
                          </div>
                        </div>
                        <div className="text-right">
                          {participant.score !== undefined && (
                            <div className="text-lg font-bold text-green-600">{participant.score}%</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {formatTime(participant.timeSpent)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    Collaboration Features
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Real-time collaboration enabled</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <span>Shared concept mapping</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span>Peer review system</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-yellow-600" />
                      <span>Discussion threads</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedTab === 'analytics' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Progress Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">75%</div>
                      <div className="text-sm text-gray-600">Average Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">32m</div>
                      <div className="text-sm text-gray-600">Average Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">4/5</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    Performance Insights
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Strong conceptual understanding</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span>Excellent collaboration skills</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span>Creative problem solving</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span>Time management needs improvement</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Learning Objectives
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ML Fundamentals</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="w-full bg-green-500 h-2 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Algorithm Comparison</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="w-4/5 bg-blue-500 h-2 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Practical Application</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="w-3/5 bg-yellow-500 h-2 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === 'take' && isActive && (
          <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsActive(false)}
                className="px-4 py-2 border rounded-lg hover:bg-white transition-colors flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {currentAssessment.questions.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border rounded-lg hover:bg-white transition-colors">
                Save Draft
              </button>
              <button
                onClick={handleSubmitAssessment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Assessment
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AssessmentIntegration;