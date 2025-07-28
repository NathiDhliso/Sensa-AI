import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Brain,
  Search,
  Heart,
  Sparkles,
  Star,
  ArrowRight,
  Upload,
  Eye,
  Compass,
  Clock,
  Users,
  ChevronRight,
  Lightbulb,
  Target,
  BookOpen,
  Award
} from 'lucide-react';
import { usePageTheme, useThemeClasses, withPageTheme } from '../../contexts/ThemeContext';
import { useMemoryStore, useCourseStore, useUIStore } from '../../stores';
import { courseService, memoryService } from '../../services/supabaseServices';
import type { Course, DashboardStats, MemoryConnection } from '../../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const pageTheme = usePageTheme('home');
  const themeClasses = useThemeClasses();
  
  // Zustand stores
  const { 
    memories, 
    hasMemories, 
    getConnectionCount,
    setMemories
  } = useMemoryStore();
  
  const { 
    getAnalysisCount,
    setCourses
  } = useCourseStore();
  
  const { 
    loading,
    setLoading
  } = useUIStore();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading('dashboard', true);

      // Load courses and memories in parallel
      const [coursesData, memoriesData] = await Promise.all([
        courseService.getCourses(),
        memoryService.getUserMemories()
      ]);

      // Update course store
      if (coursesData && coursesData.length > 0) {
        const transformedCourses: Course[] = coursesData.slice(0, 3).map(course => ({
          id: course.id,
          title: course.name,
          subtitle: `Master ${course.field.toLowerCase()}`,
          description: course.description || `Develop expertise in ${course.field}`,
          category: course.field,
          difficulty: course.difficulty,
          duration: course.duration,
          university: course.university,
          skills: course.syllabus?.slice(0, 3) || ['Core Concepts', 'Practical Skills', 'Advanced Applications'],
          icon: getCourseIcon(course.field),
          color: getCourseColor(course.field),
          students: 'N/A',
          dreamJob: `${course.field} Specialist`
        }));
        setCourses(transformedCourses);
      }

      // Update memory store
      if (memoriesData && memoriesData.length > 0) {
        const transformedMemories = memoriesData.map(memory => ({
          id: memory.id,
          memory: memory.text_content,
          category: memory.category,
          insights: memory.sensa_analysis?.insights || ['Analysis pending...'],
          learningStyle: memory.sensa_analysis?.learningStyle || 'Analysis pending',
          emotionalTone: memory.sensa_analysis?.emotionalTone || 'Analysis pending',
          connections: memory.sensa_analysis?.connections || [],
          timestamp: new Date(memory.created_at)
        }));
        setMemories(transformedMemories);
      }

      // Removed notification for dashboard updates

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // No error notification to avoid distraction
    } finally {
      setLoading('dashboard', false);
    }
  }, [setLoading, setCourses, setMemories]);

  const processPendingMemories = useCallback(async () => {
    try {
      const result = await memoryService.processPendingMemories();
      if (result.success && result.processed && result.processed > 0) {
        console.log(`Processed ${result.processed} memories from onboarding`);
        // Reload dashboard data to show the new memories
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to process pending memories:', error);
    }
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
    // Process any pending memories from onboarding
    processPendingMemories();
  }, [loadDashboardData, processPendingMemories]);

  const getCourseIcon = (field: string): string => {
    const iconMap: Record<string, string> = {
      'Computer Science': '💻',
      'Psychology': '🧠',
      'Medicine': '🩺',
      'Engineering': '⚡',
      'Mechanical Engineering': '⚙️',
      'Business': '📊',
      'Business Management': '💼',
      'Technology': '☁️',
      'Architecture': '🏛️',
      'Accounting': '📈',
      'Mathematics': '📐',
      'Economics': '📊',
      'Chemistry': '⚗️',
      'Biology': '🔬',
      'Sociology': '👥',
      'Law': '⚖️',
      'History': '📚'
    };
    return iconMap[field] || '📚';
  };

  const getCourseColor = (field: string): string => {
    // Using theme-consistent colors instead of hardcoded gradients
    const colorMap: Record<string, string> = {
      'Computer Science': 'from-blue-500 to-indigo-600',
      'Psychology': 'from-purple-500 to-pink-600',
      'Medicine': 'from-red-500 to-rose-600',
      'Engineering': 'from-yellow-500 to-orange-600',
      'Mechanical Engineering': 'from-gray-500 to-slate-600',
      'Business': 'from-emerald-500 to-teal-600',
      'Business Management': 'from-blue-500 to-indigo-600',
      'Technology': 'from-cyan-500 to-blue-600',
      'Architecture': 'from-slate-500 to-gray-600',
      'Accounting': 'from-green-500 to-emerald-600',
      'Mathematics': 'from-amber-500 to-orange-600',
      'Economics': 'from-teal-500 to-cyan-600',
      'Chemistry': 'from-green-500 to-emerald-600',
      'Biology': 'from-lime-500 to-green-600',
      'Sociology': 'from-purple-500 to-pink-600',
      'Law': 'from-gray-500 to-slate-600',
      'History': 'from-amber-500 to-yellow-600'
    };
    return colorMap[field] || 'from-gray-500 to-slate-600';
  };

  // Calculate dashboard stats from store
  const dashboardStats: DashboardStats = {
    coursesAnalyzed: getAnalysisCount(),
    memoryConnections: getConnectionCount(),
    avgMatchScore: hasMemories() ? '85%' : 'N/A'
  };

  // Generate memory connections from store data
  const memoryConnections: MemoryConnection[] = hasMemories() 
    ? memories.slice(0, 2).map((memory, index) => ({
        memory: memory.memory.substring(0, 50) + '...',
        connection: index === 0 ? 'Learning Pattern Analysis' : 'Memory-Based Insights',
        course: 'Course Analysis',
        strength: 85 + index * 5
      }))
    : [];

  if (loading.dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${pageTheme.button}`}
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
          <p className={themeClasses.text.secondary}>Loading your Sensa dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Real South African university foundational modules based on comprehensive analysis
  const sampleCourses: Course[] = [
    {
      id: 'CSC1015F',
      title: 'Introduction to Computer Science I',
      subtitle: 'Programming fundamentals with Python',
      description: 'Introduces fundamental programming concepts, problem-solving, and algorithm development using Python programming language',
      category: 'Computer Science',
      difficulty: 'Beginner',
      duration: '1 semester',
      university: 'University of Cape Town',
      skills: ['Python Programming', 'Algorithm Development', 'Problem Solving'],
      icon: '💻',
      color: 'from-blue-500 via-indigo-500 to-purple-600',
      students: '450+ students',
      dreamJob: 'Software Developer'
    },
    {
      id: 'ACCN1006A',
      title: 'Accounting I',
      subtitle: 'Financial accounting fundamentals',
      description: 'Introduces the fundamental principles of financial accounting, the accounting cycle, and the preparation of financial statements',
      category: 'Accounting',
      difficulty: 'Beginner',
      duration: '1 semester',
      university: 'University of the Witwatersrand',
      skills: ['Financial Statements', 'Accounting Cycle', 'Financial Reporting'],
      icon: '📈',
      color: 'from-green-400 via-emerald-500 to-teal-600',
      students: '380+ students',
      dreamJob: 'Financial Analyst'
    },
    {
      id: 'PSYC1004F',
      title: 'Introduction to Psychology I',
      subtitle: 'Understanding human behavior',
      description: 'Provides a broad overview of psychology, covering its history, major perspectives, and key areas of study including cognitive, social, and developmental psychology',
      category: 'Psychology',
      difficulty: 'Beginner',
      duration: '1 semester',
      university: 'University of Cape Town',
      skills: ['Research Methods', 'Human Behavior', 'Psychological Theories'],
      icon: '🧠',
      color: 'from-purple-400 via-pink-500 to-rose-600',
      students: '520+ students',
      dreamJob: 'Clinical Psychologist'
    },
    {
      id: 'MAM1020F',
      title: 'Mathematics 1A for Engineers',
      subtitle: 'Foundation calculus for engineering',
      description: 'A foundational calculus course for engineering students, covering limits, differentiation, and integration with engineering applications',
      category: 'Mathematics',
      difficulty: 'Intermediate',
      duration: '1 semester',
      university: 'University of Cape Town',
      skills: ['Calculus', 'Differential Equations', 'Mathematical Modeling'],
      icon: '📐',
      color: 'from-amber-400 via-orange-500 to-red-600',
      students: '650+ students',
      dreamJob: 'Engineering Consultant'
    },
    {
      id: 'ECO1010F',
      title: 'Microeconomics I',
      subtitle: 'Individual economic behavior',
      description: 'Introduces the theory of consumer behavior, firm behavior, and market structures including competition and monopoly in South African context',
      category: 'Economics',
      difficulty: 'Intermediate',
      duration: '1 semester',
      university: 'University of Cape Town',
      skills: ['Market Analysis', 'Economic Theory', 'Policy Evaluation'],
      icon: '📊',
      color: 'from-cyan-400 via-teal-500 to-blue-600',
      students: '400+ students',
      dreamJob: 'Economic Analyst'
    },
    {
      id: 'CEM1000W',
      title: 'Chemistry I',
      subtitle: 'Fundamental chemical principles',
      description: 'A year-long introduction to fundamental principles of chemistry, including atomic structure, bonding, stoichiometry, and chemical reactions',
      category: 'Chemistry',
      difficulty: 'Intermediate',
      duration: '1 year',
      university: 'University of Cape Town',
      skills: ['Chemical Bonding', 'Stoichiometry', 'Laboratory Techniques'],
      icon: '⚗️',
      color: 'from-emerald-400 via-green-500 to-teal-600',
      students: '320+ students',
      dreamJob: 'Chemical Engineer'
    },
    {
      id: 'SOC1001F',
      title: 'Introduction to Sociology',
      subtitle: 'Understanding society and social structures',
      description: 'Introduces the sociological imagination and how social structures like family, education, and work shape individual lives in South African society',
      category: 'Sociology',
      difficulty: 'Beginner',
      duration: '1 semester',
      university: 'University of Cape Town',
      skills: ['Social Analysis', 'Research Methods', 'Critical Thinking'],
      icon: '👥',
      color: 'from-indigo-400 via-purple-500 to-pink-600',
      students: '290+ students',
      dreamJob: 'Social Researcher'
    },
    {
      id: 'BIO1000F',
      title: 'Cell Biology',
      subtitle: 'Life at the cellular level',
      description: 'Explores the structure, function, and biochemistry of the cell as the fundamental unit of life, including molecular mechanisms',
      category: 'Biology',
      difficulty: 'Intermediate',
      duration: '1 semester',
      university: 'University of Cape Town',
      skills: ['Cellular Processes', 'Molecular Biology', 'Laboratory Skills'],
      icon: '🔬',
      color: 'from-lime-400 via-green-500 to-emerald-600',
      students: '380+ students',
      dreamJob: 'Research Scientist'
    },
    {
      id: 'PVL1003W',
      title: 'Foundations of South African Law',
      subtitle: 'Legal system fundamentals',
      description: 'Introduces the history, sources, and structure of the South African legal system, including court hierarchy and legal reasoning',
      category: 'Law',
      difficulty: 'Intermediate',
      duration: '1 year',
      university: 'University of Cape Town',
      skills: ['Legal Reasoning', 'Constitutional Law', 'Case Analysis'],
      icon: '⚖️',
      color: 'from-slate-400 via-gray-500 to-zinc-600',
      students: '250+ students',
      dreamJob: 'Legal Advocate'
    },
    {
      id: 'MECN2024A',
      title: 'Applied Mechanics A',
      subtitle: 'Engineering statics and dynamics',
      description: 'A core second-year course covering the principles of statics and the mechanics of rigid bodies for mechanical engineering applications',
      category: 'Mechanical Engineering',
      difficulty: 'Advanced',
      duration: '1 semester',
      university: 'University of the Witwatersrand',
      skills: ['Statics', 'Dynamics', 'Force Analysis'],
      icon: '⚙️',
      color: 'from-gray-400 via-slate-500 to-gray-600',
      students: '180+ students',
      dreamJob: 'Mechanical Engineer'
    },
    {
      id: 'HIS1012F',
      title: 'The Making of the Modern World',
      subtitle: 'Global historical developments',
      description: 'A survey of major global historical developments that have shaped the contemporary world, with focus on South African perspectives',
      category: 'History',
      difficulty: 'Beginner',
      duration: '1 semester',
      university: 'University of Cape Town',
      skills: ['Historical Analysis', 'Critical Thinking', 'Research Skills'],
      icon: '📚',
      color: 'from-yellow-400 via-amber-500 to-orange-600',
      students: '200+ students',
      dreamJob: 'Historical Researcher'
    },
    {
      id: 'BUS1036F',
      title: 'Evidence-based Management',
      subtitle: 'Data-driven business decisions',
      description: 'Introduces the practice of making managerial decisions based on critical evaluation of the best available evidence and data',
      category: 'Business Management',
      difficulty: 'Intermediate',
      duration: '1 semester',
      university: 'University of Cape Town',
      skills: ['Data Analysis', 'Decision Making', 'Strategic Planning'],
      icon: '💼',
      color: 'from-blue-400 via-indigo-500 to-purple-600',
      students: '300+ students',
      dreamJob: 'Business Analyst'
    }
  ];

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
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className={`${pageTheme.button} p-2 rounded-xl`}>
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className={`text-xl font-bold ${themeClasses.text.primary}`}>Sensa</h1>
                <p className={`text-sm ${themeClasses.text.secondary}`}>Where your memories unlock infinite possibilities</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="text-lg font-bold text-blue-600">
                    🎯 {dashboardStats.coursesAnalyzed}
                  </div>
                  <div className={`text-xs ${themeClasses.text.tertiary}`}>Courses Analyzed</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <div className="text-lg font-bold text-rose-600">
                    💝 {dashboardStats.memoryConnections}
                  </div>
                  <div className={`text-xs ${themeClasses.text.tertiary}`}>Memory Connections</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="text-lg font-bold text-amber-600">
                    ⭐ {dashboardStats.avgMatchScore}
                  </div>
                  <div className={`text-xs ${themeClasses.text.tertiary}`}>Avg. Match Score</div>
                </motion.div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/privacy')}
                className={`p-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors rounded-lg ${themeClasses.interactive.hover}`}
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 px-4 pb-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative ${pageTheme.button} rounded-3xl p-8 md:p-12 mb-8 overflow-hidden`}
        >
          <motion.div
            className="absolute top-8 right-8 opacity-20"
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles className="w-16 h-16 text-white" />
          </motion.div>
          
          <motion.div
            className="absolute bottom-8 left-8 opacity-20"
            animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          >
            <Heart className="w-12 h-12 text-white" />
          </motion.div>

          <div className="relative z-10 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Your next breakthrough
                <br />
                <span className="font-bold">starts with a memory</span>
              </h2>
              <p className="text-white/90 text-lg leading-relaxed">
                Every course becomes personal when connected to your unique story. 
                Let Sensa transform any subject into a journey that resonates with who you are.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                onClick={() => navigate('/integrated-learning')}
                className="group flex items-center gap-3 bg-white text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search className="w-6 h-6 text-indigo-600" />
                <span>Integrated Learning Hub</span>
                <motion.div
                  className="group-hover:translate-x-1 transition-transform"
                >
                  <ArrowRight className="w-5 h-5 text-indigo-600" />
                </motion.div>
              </motion.button>
              
              <motion.button
                onClick={() => navigate('/integrated-learning?tab=upload')}
                className="flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-all border border-white/30"
                whileHover={{ scale: 1.05 }}
              >
                <Upload className="w-5 h-5" />
                <span>Upload Materials</span>
              </motion.button>
              
              <motion.button
                onClick={() => navigate('/prime-me')}
                className="flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-all border border-white/30"
                whileHover={{ scale: 1.05 }}
              >
                <Compass className="w-5 h-5" />
                <span>Prime Me</span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Cards */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-semibold ${themeClasses.text.primary}`}>
                    Available Courses
                  </h2>
                  <p className={`${themeClasses.text.secondary}`}>
                    Courses ready for your personalized analysis
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="w-6 h-6 text-amber-500" />
                </motion.div>
              </div>

              <div className="space-y-4">
                {sampleCourses.slice(0, 3).map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group cursor-pointer"
                    onClick={() => navigate('/integrated-learning')}
                  >
                    <div className={`${themeClasses.bg.card} border ${themeClasses.border.light} rounded-2xl p-6 ${themeClasses.interactive.hover} transition-all duration-300 relative overflow-hidden`}>
                      <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r ${course.color}`} />
                      
                      <div className="relative z-10">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${course.color} flex items-center justify-center text-xl`}>
                              {course.icon}
                            </div>
                            
                          <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} truncate`}>{course.title}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${themeClasses.bg.secondary} ${themeClasses.text.tertiary}`}>
                                {course.difficulty}
                              </span>
                              </div>
                            <p className={`${themeClasses.text.secondary} text-sm mb-2`}>{course.subtitle}</p>
                            <p className={`${themeClasses.text.tertiary} text-sm mb-3 line-clamp-2`}>{course.description}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm">
                                <span className={`flex items-center ${themeClasses.text.tertiary}`}>
                                  <Clock className="w-4 h-4 mr-1" />
                                  {course.duration}
                                </span>
                                <span className={`flex items-center ${themeClasses.text.tertiary}`}>
                                  <Users className="w-4 h-4 mr-1" />
                                  {course.students}
                                </span>
                              </div>
                          <motion.div
                                className={`p-2 rounded-lg ${themeClasses.interactive.hover} group-hover:${themeClasses.bg.secondary} transition-colors`}
                                whileHover={{ x: 4 }}
                          >
                                <ChevronRight className={`w-5 h-5 ${themeClasses.text.tertiary} group-hover:${themeClasses.text.secondary}`} />
                          </motion.div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Memory Connections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`${themeClasses.bg.card} border ${themeClasses.border.light} rounded-2xl p-6`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-rose-500" />
                <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Your Memory Magic</h3>
              </div>
              
              <p className={`${themeClasses.text.secondary} text-sm mb-4`}>
                {memoryConnections.length > 0 
                  ? 'See how your memories are connecting to learning opportunities'
                  : 'Share memories to see personalized learning connections'
                }
              </p>
              
              {memoryConnections.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {memoryConnections.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={`${themeClasses.bg.secondary} rounded-lg p-3`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`${themeClasses.text.tertiary} text-xs italic`}>"{insight.memory}"</span>
                        <span className="text-xs font-medium text-green-600">{insight.strength}% match</span>
                      </div>
                      <div className={`${themeClasses.text.secondary} text-xs`}>
                        connects to <span className="font-medium">{insight.connection}</span>
                      </div>
                      <div className={`${themeClasses.text.tertiary} text-xs`}>in {insight.course}</div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-rose-600 mb-3">No memory connections yet</p>
                </div>
              )}
              
              <motion.button
                onClick={() => navigate('/memory-elicitation')}
                className={`w-full ${pageTheme.button} text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-all`}
                whileHover={{ scale: 1.02 }}
              >
                {memoryConnections.length > 0 ? 'Share More Memories' : 'Start Sharing Memories'}
              </motion.button>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`${themeClasses.bg.card} border ${themeClasses.border.light} rounded-2xl p-6`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Ready to Grow?</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Share Memories Button */}
                <motion.button
                  className="group relative bg-gradient-to-br from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 border-2 border-rose-200 hover:border-rose-300 rounded-xl transition-all duration-300 aspect-square flex flex-col items-center justify-center shadow-lg hover:shadow-xl overflow-hidden"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/memory-elicitation')}
                >
                  <div className={`${pageTheme.button} rounded-2xl shadow-lg mb-2 group-hover:scale-110 transition-transform duration-300 p-2`}>
                    <Brain className="text-white w-6 h-6" />
                  </div>
                  <h3 className={`font-bold ${themeClasses.text.primary} text-center text-sm`}>
                    Memories
                  </h3>
                  <div className="absolute bottom-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="text-rose-600 w-4 h-4" />
                  </div>
                </motion.button>

                {/* Know Me Button */}
                <motion.button
                  className="group relative bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 hover:border-indigo-300 rounded-xl transition-all duration-300 aspect-square flex flex-col items-center justify-center shadow-lg hover:shadow-xl overflow-hidden"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/know-me')}
                >
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg mb-2 group-hover:scale-110 transition-transform duration-300 p-2">
                    <Target className="text-white w-6 h-6" />
                  </div>
                  <h3 className={`font-bold ${themeClasses.text.primary} text-center text-sm`}>
                    Know Me
                  </h3>
                  <div className="absolute bottom-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="text-indigo-600 w-4 h-4" />
                  </div>
                </motion.button>

                {/* Memory Bank Button */}
                <motion.button
                  className="group relative bg-gradient-to-br from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 border-2 border-green-200 hover:border-green-300 rounded-xl transition-all duration-300 aspect-square flex flex-col items-center justify-center shadow-lg hover:shadow-xl overflow-hidden"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/memory-bank')}
                >
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg mb-2 group-hover:scale-110 transition-transform duration-300 p-2">
                    <Eye className="text-white w-6 h-6" />
                  </div>
                  <h3 className={`font-bold ${themeClasses.text.primary} text-center text-sm`}>
                    View Profile
                  </h3>
                  <div className="absolute bottom-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="text-green-600 w-4 h-4" />
                  </div>
                </motion.button>

                {/* Prime Me Button */}
                <motion.button
                  className="group relative bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 hover:border-purple-300 rounded-xl transition-all duration-300 aspect-square flex flex-col items-center justify-center shadow-lg hover:shadow-xl overflow-hidden"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/prime-me')}
                >
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg mb-2 group-hover:scale-110 transition-transform duration-300 p-2">
                    <Compass className="text-white w-6 h-6" />
                  </div>
                  <h3 className={`font-bold ${themeClasses.text.primary} text-center text-sm`}>
                    Prime Me
                  </h3>
                  <div className="absolute bottom-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="text-purple-600 w-4 h-4" />
                  </div>
                </motion.button>

                {/* Study Guide Generator Button */}
                <motion.button
                  className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-300 aspect-square flex flex-col items-center justify-center shadow-lg hover:shadow-xl overflow-hidden"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/study-guide-generator')}
                >
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg mb-2 group-hover:scale-110 transition-transform duration-300 p-2">
                    <BookOpen className="text-white w-6 h-6" />
                  </div>
                  <h3 className={`font-bold ${themeClasses.text.primary} text-center text-sm`}>
                    Study Guides
                  </h3>
                  <div className="absolute bottom-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="text-blue-600 w-4 h-4" />
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Achievement Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`${themeClasses.bg.card} border ${themeClasses.border.light} rounded-2xl p-6`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Your Journey So Far</h3>
              </div>
              
              <div className="text-center">
                <motion.div
                  className="text-4xl mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {dashboardStats.memoryConnections > 0 ? '🎉' : '🌱'}
                </motion.div>
                <p className={`${themeClasses.text.secondary} text-sm mb-4`}>
                  {dashboardStats.memoryConnections > 0 
                    ? `You've created ${dashboardStats.memoryConnections} meaningful connections between your memories and learning opportunities!`
                    : 'Your learning journey is just beginning! Share your first memory to start creating connections.'
                  }
                </p>
                <div className={`${themeClasses.bg.secondary} rounded-lg p-3`}>
                  <div className={`${themeClasses.text.tertiary} text-xs mb-1`}>
                    {dashboardStats.memoryConnections > 0 ? 'Next milestone' : 'First milestone'}
                  </div>
                  <div className={`${themeClasses.text.secondary} text-sm font-medium mb-2`}>
                    {dashboardStats.memoryConnections > 0 
                      ? '10 connections to unlock advanced insights'
                      : 'Share your first memory to begin'
                    }
                  </div>
                  <div className={`w-full ${themeClasses.bg.tertiary} rounded-full h-2`}>
                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((dashboardStats.memoryConnections / 10) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardWithTheme = withPageTheme(Dashboard, 'home');
DashboardWithTheme.displayName = 'Dashboard';
export default DashboardWithTheme;