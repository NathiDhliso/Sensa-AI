import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Brain, BookOpen, Shield, Zap, Target, Sparkles } from 'lucide-react';
import { usePageTheme, useThemeClasses, withPageTheme } from '../../contexts/ThemeContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const pageTheme = usePageTheme('home');
  const themeClasses = useThemeClasses();

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden ${pageTheme.background}`}>
      {/* Header with Sensa Branding */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className={`${pageTheme.button} p-2 rounded-xl`}>
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>Sensa</h1>
              <p className={`text-xs ${themeClasses.text.tertiary}`}>sensalearn.co.za</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/login')}
              className={`${themeClasses.text.secondary} px-4 py-2 rounded-lg text-sm font-medium hover:${themeClasses.text.primary} transition-colors`}
              whileHover={{ scale: 1.05 }}
            >
              Sign In
            </motion.button>
            <motion.button
              onClick={() => navigate('/onboarding')}
              className={`${pageTheme.button} text-white px-6 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-10 opacity-20"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Brain className={`w-8 h-8 ${pageTheme.accent}`} />
      </motion.div>

      <motion.div
        className="absolute top-32 right-16 opacity-20"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      >
        <Heart className={`w-6 h-6 text-pink-500`} />
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-20 opacity-20"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 2 }}
      >
        <BookOpen className={`w-7 h-7 ${pageTheme.accent}`} />
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mx-auto mt-20 z-10"
      >
        {/* Hero Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className={`${pageTheme.button} p-6 rounded-3xl shadow-2xl`}>
            <div className="flex items-center gap-3">
              <Brain className="w-12 h-12 text-white" />
              <div className="text-left">
                <h1 className="text-4xl font-bold text-white">Sensa</h1>
                <p className="text-white/90 text-sm">Your memories unlock any course</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.h2
          className={`text-4xl md:text-6xl font-light ${themeClasses.text.primary} mb-6 leading-tight`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Your memories unlock
          <br />
          <span className="font-medium bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            any course
          </span>
        </motion.h2>

        <motion.p
          className={`text-xl md:text-2xl ${themeClasses.text.secondary} mb-12 font-light leading-relaxed`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Transform any course into personalized learning through your childhood memories.
          <br />
          <span className="font-medium bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI-powered course analysis meets memory-driven education.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mb-6"
        >
          <motion.button
            onClick={() => navigate('/onboarding')}
            className={`${pageTheme.button} text-white px-12 py-4 rounded-full text-lg font-medium transition-all shadow-lg hover:shadow-2xl`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Sensa Journey
          </motion.button>

          <div className={`flex items-center justify-center gap-2 text-sm ${themeClasses.text.tertiary} mt-4`}>
            <Shield className="w-4 h-4" />
            <span>Your memories are private and secure</span>
          </div>
        </motion.div>
      </motion.div>

      {/* The Sensa Difference - Repositioned */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className={`mt-16 ${pageTheme.card} backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border border-white/20`}
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h3 className={`text-2xl font-medium ${themeClasses.text.primary}`}>The Sensa Difference</h3>
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <p className={`${themeClasses.text.secondary} mb-8`}>Two powerful features, one transformative learning experience</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className={`${themeClasses.bg.primary} rounded-xl p-6 border ${themeClasses.border.light}`}>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Target className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h4 className={`text-lg font-medium ${themeClasses.text.primary} mb-2`}>Memory Integration</h4>
                <p className={`${themeClasses.text.secondary} text-sm`}>Your personal stories become the foundation for understanding complex concepts</p>
              </div>
            </div>

            <div className={`${themeClasses.bg.primary} rounded-xl p-6 border ${themeClasses.border.light}`}>
              <div className={`w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className={`text-lg font-medium ${themeClasses.text.primary} mb-2`}>Course Intelligence</h4>
                <p className={`${themeClasses.text.secondary} text-sm`}>AI analyzes any course content and creates personalized learning pathways</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Core Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.1 }}
        className="mt-16 max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-4"
      >
        <FeatureCard
          icon={<Brain className="w-8 h-8 text-white" />}
          title="Memory-Powered Learning"
          description="Upload any course material and watch Sensa create connections to your personal memories"
          features={[
            "Childhood memory integration",
            "Emotional learning connections",
            "Personalized analogies",
            "Deep retention techniques"
          ]}
          pageTheme={pageTheme}
          themeClasses={themeClasses}
        />

        <FeatureCard
          icon={<BookOpen className="w-8 h-8 text-white" />}
          title="Universal Course Analysis"
          description="From textbooks to videos, Sensa transforms any educational content into your learning language"
          features={[
            "Multi-format support",
            "Intelligent content parsing",
            "Key concept extraction",
            "Learning objective mapping"
          ]}
          pageTheme={pageTheme}
          themeClasses={themeClasses}
        />

        <FeatureCard
          icon={<Shield className="w-8 h-8 text-white" />}
          title="Privacy-First Approach"
          description="Your memories stay yours. Sensa processes everything locally and securely"
          features={[
            "End-to-end encryption",
            "Local processing",
            "No data sharing",
            "Complete control"
          ]}
          pageTheme={pageTheme}
          themeClasses={themeClasses}
        />
      </motion.div>
    </div>
  );
};

// Updated FeatureCard component to use theme system
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  pageTheme: any;
  themeClasses: any;
}> = ({ icon, title, description, features, pageTheme, themeClasses }) => (
  <motion.div
    className={`${themeClasses.bg.card} rounded-2xl p-6 text-center hover:${themeClasses.interactive.hover} transition-all duration-300 border ${themeClasses.border.light}`}
    whileHover={{ scale: 1.02 }}
  >
    <div className={`${pageTheme.button} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
      {icon}
    </div>
    <h3 className={`text-xl font-semibold ${themeClasses.text.primary} mb-3`}>{title}</h3>
    <p className={`${themeClasses.text.secondary} mb-6 text-sm leading-relaxed`}>{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
        <li key={index} className={`${themeClasses.text.secondary} text-sm flex items-center justify-center gap-2`}>
          <div className={`w-1.5 h-1.5 ${pageTheme.accent} rounded-full`} />
          {feature}
          </li>
        ))}
      </ul>
  </motion.div>
);

export default withPageTheme(LandingPage, 'home');