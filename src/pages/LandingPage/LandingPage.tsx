import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Brain, BookOpen, Shield, Zap, Target, Sparkles } from 'lucide-react';
import { sensaBrandColors, sensaBrandMessaging } from '../../styles/brandColors';
import styles from '../../styles/components/LandingPage.module.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Header with Sensa Branding */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div className={styles.headerContent}>
          <motion.div 
            className={styles.logo}
            whileHover={{ scale: 1.05 }}
          >
            <div 
              className={styles.logoIcon}
              style={{ background: sensaBrandColors.gradients.memoryToLearning.css }}
            >
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className={styles.logoText}>
              <h1 className={styles.logoTitle}>Sensa</h1>
              <p className={styles.logoSubtitle}>sensalearn.co.za</p>
            </div>
          </motion.div>
          
          <div className={styles.navButtons}>
            <motion.button
              onClick={() => navigate('/login')}
              className={styles.signInButton}
              whileHover={{ scale: 1.05 }}
            >
              Sign In
            </motion.button>
            <motion.button
              onClick={() => navigate('/onboarding')}
              className={styles.getStartedButton}
              style={{ background: sensaBrandColors.gradients.memoryToLearning.css }}
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
        className={`${styles.floatingElement} top-20 left-10`}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Brain className="w-8 h-8" style={{ color: sensaBrandColors.primary.amethyst.hex }} />
      </motion.div>
      
      <motion.div
        className={`${styles.floatingElement} top-32 right-16`}
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      >
        <Heart className="w-6 h-6" style={{ color: sensaBrandColors.secondary.rose.hex }} />
      </motion.div>

      <motion.div
        className={`${styles.floatingElement} bottom-32 left-20`}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 2 }}
      >
        <BookOpen className="w-7 h-7" style={{ color: sensaBrandColors.primary.coral.hex }} />
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className={styles.mainContent}
      >
        {/* Hero Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className={styles.heroLogo}
        >
          <div 
            className={styles.heroLogoContainer}
            style={{ background: sensaBrandColors.gradients.memoryToLearning.css }}
          >
            <div className={styles.heroLogoContent}>
              <Brain className="w-12 h-12 text-white" />
              <div className="text-left">
                <h1 className="text-4xl font-bold text-white">Sensa</h1>
                <p className="text-white/90 text-sm">{sensaBrandMessaging.primaryTagline}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.h2
          className={styles.heroTitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Your memories unlock
          <br />
          <span 
            className={`${styles.heroTitleHighlight} gradient-text`}
            style={{ backgroundImage: sensaBrandColors.gradients.memoryToLearning.css }}
          >
            any course
          </span>
        </motion.h2>

        <motion.p
          className={styles.heroDescription}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Transform any course into personalized learning through your childhood memories.
          <br />
          <span 
            className={`${styles.descriptionHighlight} gradient-text`}
            style={{ backgroundImage: sensaBrandColors.gradients.wisdom.css }}
          >
            AI-powered course analysis meets memory-driven education.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className={styles.ctaContainer}
        >
          <motion.button
            onClick={() => navigate('/onboarding')}
            className={styles.ctaButton}
            style={{ background: sensaBrandColors.gradients.memoryToLearning.css }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Sensa Journey
          </motion.button>

          <div className={styles.privacyNote}>
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
        className={styles.sensaDifference}
      >
        <div className="text-center">
          <div className={styles.differenceHeader}>
            <Sparkles className="w-6 h-6" style={{ color: sensaBrandColors.secondary.amber.hex }} />
            <h3 className={styles.differenceTitle}>The Sensa Difference</h3>
            <Sparkles className="w-6 h-6" style={{ color: sensaBrandColors.secondary.amber.hex }} />
          </div>
          <p className={styles.differenceDescription}>Two powerful features, one transformative learning experience</p>
          
          <div className={styles.differenceFeatures}>
            <div className={styles.featureCard}>
              <div 
                className={styles.featureIcon}
                style={{ backgroundColor: sensaBrandColors.secondary.rose.hex + '20' }}
              >
                <Target className="w-5 h-5" style={{ color: sensaBrandColors.secondary.rose.hex }} />
              </div>
              <div className={styles.featureContent}>
                <h4 className={styles.featureTitle}>Memory Integration</h4>
                <p className={styles.featureDescription}>Your personal stories become the foundation for understanding complex concepts</p>
              </div>
            </div>
            
            <div className={styles.featureCard}>
              <div 
                className={styles.featureIcon}
                style={{ backgroundColor: sensaBrandColors.primary.amethyst.hex + '20' }}
              >
                <Zap className="w-5 h-5" style={{ color: sensaBrandColors.primary.amethyst.hex }} />
              </div>
              <div className={styles.featureContent}>
                <h4 className={styles.featureTitle}>Course Intelligence</h4>
                <p className={styles.featureDescription}>AI breaks down any course into digestible, personally relevant learning paths</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Core Features */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.1 }}
        className={styles.coreFeatures}
      >
        <FeatureCard
          icon={<Heart className="w-8 h-8 text-white" />}
          title="Memory-Powered Learning"
          description="Share your childhood memories and watch Sensa's AI create personalized learning connections that resonate with your unique experiences"
          features={['Real-time memory analysis', 'Emotional learning anchors', 'Personal story integration']}
          gradient={sensaBrandColors.gradients.wisdom.css}
        />
        
        <FeatureCard
          icon={<Brain className="w-8 h-8 text-white" />}
          title="AI Course Analysis"
          description="Analyze any course from universities worldwide and get detailed breakdowns tailored to your memory profile and learning style"
          features={['200+ university courses', 'Professional certifications', 'Personalized pathways']}
          gradient={sensaBrandColors.gradients.growth.css}
        />
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.3 }}
        className={styles.footer}
      >
        <div className={styles.footerContent}>
          <Brain className="w-4 h-4" style={{ color: sensaBrandColors.primary.amethyst.hex }} />
          <span>Powered by Sensa AI</span>
          <span>•</span>
          <span>sensalearn.co.za</span>
        </div>
      </motion.footer>
    </div>
  );
};

const FeatureCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  features: string[];
  gradient: string;
}> = ({ icon, title, description, features, gradient }) => (
  <motion.div
    className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/80 transition-all duration-300 border border-gray-200/50"
    whileHover={{ y: -5, scale: 1.02 }}
  >
    <div 
      className="p-4 text-center"
      style={{ background: gradient }}
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <h3 className="text-xl font-medium text-white">{title}</h3>
    </div>
    <div className="p-6">
      <p className="text-gray-600 text-sm leading-relaxed mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: sensaBrandColors.primary.amethyst.hex }}
            ></div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

export default LandingPage;