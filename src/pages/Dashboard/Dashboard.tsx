import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Settings, 
  ChevronRight,
  Target,
  Brain,
  Search,
  Heart,
  Sparkles,
  Star,
  Users,
  Globe,
  Award,
  Lightbulb,
  ArrowRight,
  Upload,
  Eye
} from 'lucide-react';
import { sensaBrandColors } from '../../styles/brandColors';
import { useMemoryStore, useCourseStore, useUIStore } from '../../stores';
import { courseService, memoryService } from '../../services/supabaseServices';
import type { Course, DashboardStats, MemoryConnection } from '../../types';
import styles from '../../styles/components/Dashboard.module.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
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

  useEffect(() => {
    loadDashboardData();
    // Process any pending memories from onboarding
    processPendingMemories();
  }, []);

  const processPendingMemories = async () => {
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
  };

  const loadDashboardData = async () => {
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
  };

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
    const colorMap: Record<string, string> = {
      'Computer Science': 'from-blue-500 via-indigo-500 to-purple-600',
      'Psychology': 'from-purple-400 via-pink-500 to-rose-600',
      'Medicine': 'from-red-400 via-pink-500 to-rose-600',
      'Engineering': 'from-yellow-400 via-orange-500 to-red-600',
      'Mechanical Engineering': 'from-gray-400 via-slate-500 to-gray-600',
      'Business': 'from-emerald-400 via-teal-500 to-cyan-600',
      'Business Management': 'from-blue-400 via-indigo-500 to-purple-600',
      'Technology': 'from-blue-400 via-cyan-500 to-teal-600',
      'Architecture': 'from-gray-400 via-slate-500 to-gray-600',
      'Accounting': 'from-green-400 via-emerald-500 to-teal-600',
      'Mathematics': 'from-amber-400 via-orange-500 to-red-600',
      'Economics': 'from-cyan-400 via-teal-500 to-blue-600',
      'Chemistry': 'from-emerald-400 via-green-500 to-teal-600',
      'Biology': 'from-lime-400 via-green-500 to-emerald-600',
      'Sociology': 'from-indigo-400 via-purple-500 to-pink-600',
      'Law': 'from-slate-400 via-gray-500 to-zinc-600',
      'History': 'from-yellow-400 via-amber-500 to-orange-600'
    };
    return colorMap[field] || 'from-gray-400 via-gray-500 to-gray-600';
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
          <p className="text-gray-600">Loading your Sensa dashboard...</p>
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
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div className={styles.headerContent}>
          <div className="flex items-center justify-between">
            <motion.div 
              className={styles.logo}
              whileHover={{ scale: 1.02 }}
            >
              <div 
                className={styles.logoIcon}
                style={{ background: sensaBrandColors.gradients.memoryToLearning.css }}
              >
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className={styles.logoText}>
                <h1>Sensa</h1>
                <p>Where your memories unlock infinite possibilities</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <div className={styles.statsContainer}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={styles.statItem}
                >
                  <div className={styles.statValue + " text-blue-600"}>
                    🎯 {dashboardStats.coursesAnalyzed}
                  </div>
                  <div className={styles.statLabel}>Courses Analyzed</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className={styles.statItem}
                >
                  <div className={styles.statValue + " text-rose-600"}>
                    💝 {dashboardStats.memoryConnections}
                  </div>
                  <div className={styles.statLabel}>Memory Connections</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className={styles.statItem}
                >
                  <div className={styles.statValue + " text-amber-600"}>
                    ⭐ {dashboardStats.avgMatchScore}
                  </div>
                  <div className={styles.statLabel}>Avg. Match Score</div>
                </motion.div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/privacy')}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className={styles.mainContent}>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.heroSection}
          style={{ background: sensaBrandColors.gradients.transformation.css }}
        >
          <motion.div
            className="absolute top-8 right-8 opacity-20"
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles className="w-16 h-16" />
          </motion.div>
          
          <motion.div
            className="absolute bottom-8 left-8 opacity-20"
            animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          >
            <Heart className="w-12 h-12" />
          </motion.div>

          <div className={styles.heroContent}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <h2 className={styles.heroTitle}>
                Your next breakthrough
                <br />
                <span className={styles.heroTitleBold}>starts with a memory</span>
              </h2>
              <p className={styles.heroDescription}>
                Every course becomes personal when connected to your unique story. 
                Let Sensa transform any subject into a journey that resonates with who you are.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={styles.buttonContainer}
            >
              <motion.button
                onClick={() => navigate('/integrated-learning')}
                className={styles.primaryButton}
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
                className={styles.secondaryButton}
                whileHover={{ scale: 1.05 }}
              >
                <Upload className="w-5 h-5" />
                <span>Upload Materials</span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        <div className={styles.contentGrid}>
          {/* Course Cards */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={styles.courseSection}
            >
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    Available Courses
                  </h2>
                  <p className={styles.sectionDescription}>
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

              <div className={styles.courseList}>
                {sampleCourses.slice(0, 3).map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group cursor-pointer"
                    onClick={() => navigate('/integrated-learning')}
                  >
                    <div className={styles.courseCard}>
                      <div 
                        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500"
                        style={{ background: `linear-gradient(135deg, ${course.color.split(' ')[1]} 0%, ${course.color.split(' ')[3]} 100%)` }}
                      />
                      
                      <div className="relative z-10">
                        <div className={styles.courseHeader}>
                          <div className="flex items-start space-x-4 flex-1">
                            <div className={`${styles.courseIcon} bg-gradient-to-r ${course.color}`}>
                              {course.icon}
                            </div>
                            
                            <div className={styles.courseInfo}>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className={styles.courseTitle}>{course.title}</h3>
                                <motion.div
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  whileHover={{ scale: 1.2 }}
                                >
                                  <Sparkles className="w-4 h-4 text-amber-500" />
                                </motion.div>
                              </div>
                              <p className={styles.courseSubtitle}>{course.subtitle}</p>
                              <p className={styles.courseUniversity}>{course.university}</p>
                              <p className={styles.courseDescription}>{course.description}</p>
                              
                              <div className={styles.courseMetadata}>
                                <span className={styles.metadataItem}>
                                  <Clock className="w-4 h-4" />
                                  <span>{course.duration}</span>
                                </span>
                                <span className={styles.metadataItem}>
                                  <Target className="w-4 h-4" />
                                  <span>{course.difficulty}</span>
                                </span>
                                <span className={styles.metadataItem}>
                                  <Users className="w-4 h-4" />
                                  <span>{course.students}</span>
                                </span>
                              </div>
                              
                              <div className={styles.skillTags}>
                                {course.skills.map((skill, skillIndex) => (
                                  <span
                                    key={skillIndex}
                                    className={styles.skillTag}
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <motion.div
                            className="text-gray-400 group-hover:text-indigo-600 transition-colors"
                            whileHover={{ x: 5 }}
                          >
                            <ChevronRight className="w-6 h-6" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={styles.exploreButton}
              >
                <motion.button
                  onClick={() => navigate('/integrated-learning')}
                  className={styles.exploreAllButton}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Globe className="w-5 h-5" />
                  <span>Explore All Courses</span>
                  <Sparkles className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            {/* Memory Connections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={styles.memoryCard}
            >
              <div className={styles.cardHeader}>
                <Heart className="w-5 h-5 text-rose-500" />
                <h3 className={styles.cardTitle}>Your Memory Magic</h3>
              </div>
              
              <p className={styles.cardDescription}>
                {memoryConnections.length > 0 
                  ? 'See how your memories are connecting to learning opportunities'
                  : 'Share memories to see personalized learning connections'
                }
              </p>
              
              {memoryConnections.length > 0 ? (
                <div className={styles.memoryList}>
                  {memoryConnections.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={styles.memoryItem}
                    >
                      <div className={styles.memoryHeader}>
                        <span className={styles.memoryText}>"{insight.memory}"</span>
                        <span className={styles.memoryStrength}>{insight.strength}% match</span>
                      </div>
                      <div className={styles.memoryConnection}>
                        connects to <span className="font-medium">{insight.connection}</span>
                      </div>
                      <div className={styles.memoryCourse}>in {insight.course}</div>
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
                className={styles.memoryButton}
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
              className={styles.actionsCard}
            >
              <div className={styles.cardHeader}>
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <h3 className={styles.cardTitle}>Ready to Grow?</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Share Memories Button */}
                <motion.button
                  className="group relative bg-gradient-to-br from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 border-2 border-rose-200 hover:border-rose-300 rounded-xl transition-all duration-300 aspect-square flex flex-col items-center justify-center shadow-lg hover:shadow-xl overflow-hidden min-h-0 max-h-full"
                  style={{ padding: 'clamp(0.75rem, 3vw, 1.25rem)' }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/memory-elicitation')}
                >
                  <div 
                    className="rounded-2xl shadow-lg mb-1 group-hover:scale-110 transition-transform duration-300 flex-shrink-0 overflow-hidden"
                    style={{ 
                      background: sensaBrandColors.gradients.transformation.css,
                      padding: 'clamp(0.4rem, 1.5vw, 0.6rem)'
                    }}
                  >
                    <Brain className="text-white flex-shrink-0" style={{ width: 'clamp(1.25rem, 4.5vw, 1.75rem)', height: 'clamp(1.25rem, 4.5vw, 1.75rem)' }} />
                  </div>
                  <h3 className="font-bold text-gray-800 text-center leading-tight flex-shrink-0 overflow-hidden" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.9rem)' }}>
                    Memories
                  </h3>
                  <div className="absolute opacity-60 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden" style={{ bottom: 'clamp(0.4rem, 1.5vw, 0.6rem)', right: 'clamp(0.4rem, 1.5vw, 0.6rem)' }}>
                    <ArrowRight className="text-rose-600 flex-shrink-0" style={{ width: 'clamp(0.9rem, 2.5vw, 1.1rem)', height: 'clamp(0.9rem, 2.5vw, 1.1rem)' }} />
                  </div>
                </motion.button>

                {/* Know Me Button */}
                <motion.button
                  className="group relative bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 hover:border-indigo-300 rounded-xl transition-all duration-300 aspect-square flex flex-col items-center justify-center shadow-lg hover:shadow-xl overflow-hidden min-h-0"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/know-me')}
                >
                  <div 
                    className="rounded-2xl shadow-lg mb-1 group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                      padding: 'clamp(0.4rem, 1.5vw, 0.6rem)'
                    }}
                  >
                    <Target className="text-white flex-shrink-0" style={{ width: 'clamp(1.25rem, 4.5vw, 1.75rem)', height: 'clamp(1.25rem, 4.5vw, 1.75rem)' }} />
                  </div>
                  <h3 className="font-bold text-gray-800 text-center leading-tight flex-shrink-0 overflow-hidden" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.9rem)' }}>
                    Know Me
                  </h3>
                  <div className="absolute opacity-60 group-hover:opacity-100 transition-opacity duration-300" style={{ bottom: 'clamp(0.4rem, 1.5vw, 0.6rem)', right: 'clamp(0.4rem, 1.5vw, 0.6rem)' }}>
                    <ArrowRight className="text-indigo-600 flex-shrink-0" style={{ width: 'clamp(0.9rem, 2.5vw, 1.1rem)', height: 'clamp(0.9rem, 2.5vw, 1.1rem)' }} />
                  </div>
                </motion.button>

                {/* Memory Bank Button */}
                <motion.button
                  className="group relative bg-gradient-to-br from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 border-2 border-green-200 hover:border-green-300 rounded-xl transition-all duration-300 aspect-square flex flex-col items-center justify-center shadow-lg hover:shadow-xl overflow-hidden min-h-0"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/memory-bank')}
                >
                  <div 
                    className="rounded-2xl shadow-lg mb-1 group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(to right, #10b981, #059669)',
                      padding: 'clamp(0.4rem, 1.5vw, 0.6rem)'
                    }}
                  >
                    <Eye className="text-white flex-shrink-0" style={{ width: 'clamp(1.25rem, 4.5vw, 1.75rem)', height: 'clamp(1.25rem, 4.5vw, 1.75rem)' }} />
                  </div>
                  <h3 className="font-bold text-gray-800 text-center leading-tight flex-shrink-0 overflow-hidden" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.9rem)' }}>
                    View Profile
                  </h3>
                  <div className="absolute opacity-60 group-hover:opacity-100 transition-opacity duration-300" style={{ bottom: 'clamp(0.4rem, 1.5vw, 0.6rem)', right: 'clamp(0.4rem, 1.5vw, 0.6rem)' }}>
                    <ArrowRight className="text-green-600 flex-shrink-0" style={{ width: 'clamp(0.9rem, 2.5vw, 1.1rem)', height: 'clamp(0.9rem, 2.5vw, 1.1rem)' }} />
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Achievement Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={styles.progressCard}
            >
              <div className={styles.cardHeader}>
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className={styles.cardTitle}>Your Journey So Far</h3>
              </div>
              
              <div className="text-center">
                <motion.div
                  className={styles.progressEmoji}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {dashboardStats.memoryConnections > 0 ? '🎉' : '🌱'}
                </motion.div>
                <p className={styles.progressText}>
                  {dashboardStats.memoryConnections > 0 
                    ? `You've created ${dashboardStats.memoryConnections} meaningful connections between your memories and learning opportunities!`
                    : 'Your learning journey is just beginning! Share your first memory to start creating connections.'
                  }
                </p>
                <div className={styles.milestoneBox}>
                  <div className={styles.milestoneLabel}>
                    {dashboardStats.memoryConnections > 0 ? 'Next milestone' : 'First milestone'}
                  </div>
                  <div className={styles.milestoneText}>
                    {dashboardStats.memoryConnections > 0 
                      ? '10 connections to unlock advanced insights'
                      : 'Share your first memory to begin'
                    }
                  </div>
                  <div className={styles.progressBar}>
                    <motion.div
                      className={styles.progressFill}
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

export default Dashboard;