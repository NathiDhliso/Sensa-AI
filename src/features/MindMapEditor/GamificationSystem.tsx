import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Zap, Target, Users, Brain, Clock,
  Award, Medal, Crown, Flame, Sparkles, TrendingUp,
  Gift, Unlock, CheckCircle, BarChart3, Calendar,
  X, ChevronRight, Plus, Share2, Download
} from 'lucide-react';
import { useCollaborationStore } from '../../stores/collaborationStore';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'collaboration' | 'learning' | 'creativity' | 'consistency' | 'leadership';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirements: {
    type: string;
    target: number;
    current: number;
  }[];
  unlockedAt?: Date;
  progress: number;
  isUnlocked: boolean;
  rewards: {
    type: 'points' | 'badge' | 'title' | 'feature' | 'cosmetic';
    value: string | number;
  }[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  earnedAt: Date;
  category: string;
}

interface LevelInfo {
  level: number;
  title: string;
  pointsRequired: number;
  pointsToNext: number;
  totalPoints: number;
  perks: string[];
}

interface Streak {
  type: 'daily' | 'weekly' | 'collaboration' | 'learning';
  current: number;
  best: number;
  lastActivity: Date;
  isActive: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  progress: number;
  target: number;
  expiresAt: Date;
  isCompleted: boolean;
  rewards: {
    type: string;
    value: string | number;
  }[];
}

interface GamificationSystemProps {
  sessionId: string;
  onClose: () => void;
  mode?: 'overview' | 'achievements' | 'leaderboard' | 'challenges';
}

const GamificationSystem: React.FC<GamificationSystemProps> = ({
  sessionId,
  onClose,
  mode = 'overview'
}) => {
  const { currentSession, participants } = useCollaborationStore();
  const [selectedTab, setSelectedTab] = useState(mode);
  const [userLevel, setUserLevel] = useState<LevelInfo | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [recentUnlocks, setRecentUnlocks] = useState<Achievement[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Mock data initialization
  useEffect(() => {
    const mockLevel: LevelInfo = {
      level: 7,
      title: 'Knowledge Architect',
      pointsRequired: 1500,
      pointsToNext: 350,
      totalPoints: 2150,
      perks: [
        'Custom node colors',
        'Advanced templates access',
        'Priority support',
        'Exclusive badges'
      ]
    };

    const mockAchievements: Achievement[] = [
      {
        id: 'first-collaboration',
        title: 'Team Player',
        description: 'Complete your first collaborative session',
        icon: Users,
        category: 'collaboration',
        rarity: 'common',
        points: 50,
        requirements: [{ type: 'collaborative_sessions', target: 1, current: 1 }],
        progress: 100,
        isUnlocked: true,
        unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        rewards: [{ type: 'points', value: 50 }, { type: 'badge', value: 'team-player' }]
      },
      {
        id: 'mind-mapper',
        title: 'Mind Mapper',
        description: 'Create 100 nodes across all sessions',
        icon: Brain,
        category: 'creativity',
        rarity: 'rare',
        points: 200,
        requirements: [{ type: 'nodes_created', target: 100, current: 87 }],
        progress: 87,
        isUnlocked: false,
        rewards: [{ type: 'points', value: 200 }, { type: 'title', value: 'Mind Mapper' }]
      },
      {
        id: 'speed-learner',
        title: 'Speed Learner',
        description: 'Complete 5 sessions in under 30 minutes each',
        icon: Zap,
        category: 'learning',
        rarity: 'epic',
        points: 500,
        requirements: [{ type: 'fast_sessions', target: 5, current: 3 }],
        progress: 60,
        isUnlocked: false,
        rewards: [{ type: 'points', value: 500 }, { type: 'feature', value: 'speed-mode' }]
      },
      {
        id: 'knowledge-sage',
        title: 'Knowledge Sage',
        description: 'Reach level 10 and maintain a 30-day streak',
        icon: Crown,
        category: 'consistency',
        rarity: 'legendary',
        points: 1000,
        requirements: [
          { type: 'level', target: 10, current: 7 },
          { type: 'streak_days', target: 30, current: 12 }
        ],
        progress: 45,
        isUnlocked: false,
        rewards: [
          { type: 'points', value: 1000 },
          { type: 'title', value: 'Knowledge Sage' },
          { type: 'cosmetic', value: 'golden-crown' }
        ]
      },
      {
        id: 'collaboration-master',
        title: 'Collaboration Master',
        description: 'Help 50 different users in collaborative sessions',
        icon: Trophy,
        category: 'leadership',
        rarity: 'epic',
        points: 750,
        requirements: [{ type: 'users_helped', target: 50, current: 23 }],
        progress: 46,
        isUnlocked: false,
        rewards: [{ type: 'points', value: 750 }, { type: 'badge', value: 'collaboration-master' }]
      }
    ];

    const mockBadges: Badge[] = [
      {
        id: 'team-player',
        name: 'Team Player',
        description: 'Completed first collaboration',
        icon: Users,
        color: 'bg-blue-500',
        earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        category: 'Collaboration'
      },
      {
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Active before 8 AM',
        icon: Clock,
        color: 'bg-yellow-500',
        earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        category: 'Consistency'
      },
      {
        id: 'creative-genius',
        name: 'Creative Genius',
        description: 'Created innovative mind map',
        icon: Sparkles,
        color: 'bg-purple-500',
        earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        category: 'Creativity'
      }
    ];

    const mockStreaks: Streak[] = [
      {
        type: 'daily',
        current: 12,
        best: 28,
        lastActivity: new Date(),
        isActive: true
      },
      {
        type: 'collaboration',
        current: 5,
        best: 15,
        lastActivity: new Date(),
        isActive: true
      },
      {
        type: 'learning',
        current: 8,
        best: 20,
        lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isActive: false
      }
    ];

    const mockChallenges: Challenge[] = [
      {
        id: 'daily-mapper',
        title: 'Daily Mapper',
        description: 'Create 5 new nodes today',
        type: 'daily',
        category: 'creativity',
        difficulty: 'easy',
        points: 25,
        progress: 3,
        target: 5,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        isCompleted: false,
        rewards: [{ type: 'points', value: 25 }]
      },
      {
        id: 'collaboration-champion',
        title: 'Collaboration Champion',
        description: 'Participate in 3 collaborative sessions this week',
        type: 'weekly',
        category: 'collaboration',
        difficulty: 'medium',
        points: 100,
        progress: 2,
        target: 3,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        isCompleted: false,
        rewards: [{ type: 'points', value: 100 }, { type: 'badge', value: 'weekly-champion' }]
      },
      {
        id: 'knowledge-explorer',
        title: 'Knowledge Explorer',
        description: 'Explore 10 different concept categories',
        type: 'special',
        category: 'learning',
        difficulty: 'hard',
        points: 200,
        progress: 7,
        target: 10,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isCompleted: false,
        rewards: [
          { type: 'points', value: 200 },
          { type: 'title', value: 'Knowledge Explorer' },
          { type: 'feature', value: 'advanced-search' }
        ]
      }
    ];

    setUserLevel(mockLevel);
    setAchievements(mockAchievements);
    setBadges(mockBadges);
    setStreaks(mockStreaks);
    setChallenges(mockChallenges);

    // Simulate recent unlock
    const recentlyUnlocked = mockAchievements.filter(a => 
      a.isUnlocked && a.unlockedAt && 
      Date.now() - a.unlockedAt.getTime() < 24 * 60 * 60 * 1000
    );
    setRecentUnlocks(recentlyUnlocked);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  if (!userLevel) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading gamification data...</p>
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
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gamification Hub</h2>
              <p className="text-sm text-gray-600">
                Track your progress, earn achievements, and compete with others
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Level indicator */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border">
              <Crown className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-sm font-medium">Level {userLevel.level}</div>
                <div className="text-xs text-gray-600">{userLevel.title}</div>
              </div>
            </div>
            
            {/* Points */}
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg">
              <Star className="w-4 h-4" />
              <span className="font-medium">{userLevel.totalPoints.toLocaleString()}</span>
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
            {['overview', 'achievements', 'leaderboard', 'challenges'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Level Progress */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">Level {userLevel.level}</h3>
                    <p className="text-purple-100">{userLevel.title}</p>
                  </div>
                  <Crown className="w-12 h-12 text-yellow-300" />
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{userLevel.totalPoints} points</span>
                    <span>{userLevel.pointsToNext} to next level</span>
                  </div>
                  <div className="w-full bg-purple-400 rounded-full h-3">
                    <div
                      className="bg-white rounded-full h-3 transition-all"
                      style={{
                        width: `${((userLevel.totalPoints - userLevel.pointsRequired) / 
                                (userLevel.pointsToNext + userLevel.totalPoints - userLevel.pointsRequired)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {userLevel.perks.map((perk, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Streaks */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Active Streaks
                  </h3>
                  <div className="space-y-3">
                    {streaks.filter(s => s.isActive).map((streak, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium capitalize">{streak.type}</div>
                          <div className="text-sm text-gray-600">Best: {streak.best} days</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-500">{streak.current}</div>
                          <div className="text-xs text-gray-500">days</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Badges */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Medal className="w-5 h-5 text-blue-500" />
                    Recent Badges
                  </h3>
                  <div className="space-y-3">
                    {badges.slice(0, 3).map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${badge.color} flex items-center justify-center`}>
                          <badge.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{badge.name}</div>
                          <div className="text-xs text-gray-600">{badge.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    Quick Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Achievements</span>
                      <span className="font-medium">{achievements.filter(a => a.isUnlocked).length}/{achievements.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Badges Earned</span>
                      <span className="font-medium">{badges.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best Streak</span>
                      <span className="font-medium">{Math.max(...streaks.map(s => s.best))} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Challenges</span>
                      <span className="font-medium">{challenges.filter(c => c.isCompleted).length}/{challenges.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Unlocks */}
              {recentUnlocks.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    Recent Achievements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recentUnlocks.map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <achievement.icon className="w-8 h-8 text-yellow-600" />
                        <div>
                          <div className="font-medium">{achievement.title}</div>
                          <div className="text-sm text-gray-600">+{achievement.points} points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'achievements' && (
            <div className="space-y-6">
              {/* Filter tabs */}
              <div className="flex gap-2 flex-wrap">
                {['all', 'collaboration', 'learning', 'creativity', 'consistency', 'leadership'].map((category) => (
                  <button
                    key={category}
                    className="px-3 py-1 text-sm border rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              {/* Achievements grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      achievement.isUnlocked ? getRarityColor(achievement.rarity) : 'border-gray-200 bg-gray-50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        achievement.isUnlocked ? 'bg-white' : 'bg-gray-200'
                      }`}>
                        <achievement.icon className={`w-6 h-6 ${
                          achievement.isUnlocked ? 'text-purple-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                            achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                            achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {achievement.rarity}
                          </span>
                          <span className="text-sm font-medium text-green-600">+{achievement.points} pts</span>
                        </div>
                      </div>
                    </div>
                    
                    {!achievement.isUnlocked && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 rounded-full h-2 transition-all"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600">
                          {achievement.requirements.map((req, index) => (
                            <div key={index}>
                              {req.current}/{req.target} {req.type.replace('_', ' ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {achievement.isUnlocked && achievement.unlockedAt && (
                      <div className="text-xs text-gray-500">
                        Unlocked {achievement.unlockedAt.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'leaderboard' && (
            <div className="space-y-6">
              {/* Leaderboard tabs */}
              <div className="flex gap-2">
                {['weekly', 'monthly', 'all-time'].map((period) => (
                  <button
                    key={period}
                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Top performers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((position) => (
                  <div key={position} className={`text-center p-6 rounded-lg ${
                    position === 1 ? 'bg-gradient-to-b from-yellow-100 to-yellow-200' :
                    position === 2 ? 'bg-gradient-to-b from-gray-100 to-gray-200' :
                    'bg-gradient-to-b from-orange-100 to-orange-200'
                  }`}>
                    <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      position === 1 ? 'bg-yellow-500' :
                      position === 2 ? 'bg-gray-500' :
                      'bg-orange-500'
                    }`}>
                      {position === 1 ? <Crown className="w-8 h-8 text-white" /> :
                       position === 2 ? <Medal className="w-8 h-8 text-white" /> :
                       <Award className="w-8 h-8 text-white" />}
                    </div>
                    <h3 className="font-semibold">User {position}</h3>
                    <p className="text-sm text-gray-600">Level {10 - position + 5}</p>
                    <p className="text-lg font-bold">{(3000 - position * 200).toLocaleString()} pts</p>
                  </div>
                ))}
              </div>

              {/* Full leaderboard */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">Weekly Leaderboard</h3>
                </div>
                <div className="divide-y">
                  {Array.from({ length: 10 }, (_, i) => i + 4).map((position) => (
                    <div key={position} className="flex items-center justify-between p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                          {position}
                        </div>
                        <div>
                          <div className="font-medium">User {position}</div>
                          <div className="text-sm text-gray-600">Level {Math.max(1, 10 - position)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{(3000 - position * 150).toLocaleString()} pts</div>
                        <div className="text-sm text-gray-600">+{Math.floor(Math.random() * 200 + 50)} this week</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'challenges' && (
            <div className="space-y-6">
              {/* Challenge categories */}
              <div className="flex gap-2 flex-wrap">
                {['daily', 'weekly', 'special'].map((type) => (
                  <button
                    key={type}
                    className="px-3 py-1 text-sm border rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Active challenges */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`border rounded-lg p-4 ${
                      challenge.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{challenge.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                      </div>
                      {challenge.isCompleted && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        challenge.type === 'daily' ? 'bg-blue-100 text-blue-700' :
                        challenge.type === 'weekly' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {challenge.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </span>
                      <span className="text-sm font-medium text-green-600">+{challenge.points} pts</span>
                    </div>
                    
                    {!challenge.isCompleted && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{challenge.progress}/{challenge.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 rounded-full h-2 transition-all"
                            style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600">
                          Expires in {formatTimeRemaining(challenge.expiresAt)}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-gray-600">
                        Rewards: {challenge.rewards.map(r => r.value).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Keep learning and collaborating to unlock more achievements!
          </div>
          
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm border rounded-md hover:bg-white transition-colors flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share Progress
            </button>
            <button
              onClick={triggerCelebration}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Celebrate!
            </button>
          </div>
        </div>
      </motion.div>

      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none"
          >
            <div className="text-6xl">
              🎉🎊✨🏆🎯
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GamificationSystem;