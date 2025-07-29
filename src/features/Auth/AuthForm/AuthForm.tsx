import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { usePageTheme } from '../../../contexts/themeUtils';
// Using hardcoded theme-consistent gradient classes
import styles from './AuthForm.module.css';

interface AuthFormProps {
  onSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signUp, signIn } = useAuth();
  const pageTheme = usePageTheme('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
      onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.authCard}
      >
        {/* Header */}
        <div className={styles.header}>
          <motion.div
            className={styles.logoContainer}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div 
              className={styles.logoIcon}
              style={{ background: pageTheme.gradients.memoryToLearning }}
            >
              <Brain className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <h1 className={styles.title}>
            Welcome to Sensa
          </h1>
          <p className={styles.subtitle}>
            {isSignUp 
              ? 'Create your account to begin your personalized learning journey'
              : 'Sign in to continue your memory-powered learning experience'
            }
          </p>
        </div>

        {/* Form */}
        <motion.div
          className={styles.formContainer}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Full Name
                </label>
                <div className={styles.inputContainer}>
                  <User className={styles.inputIcon} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={styles.formInput}
                    placeholder="Enter your full name"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Email Address
              </label>
              <div className={styles.inputContainer}>
                <Mail className={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Password
              </label>
              <div className={styles.inputContainer}>
                <Lock className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${styles.formInput} ${styles.passwordInput}`}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.togglePasswordButton}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.errorContainer}
              >
                <div className={styles.errorContent}>
                  <div className={styles.errorIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className={styles.errorMessage}>{error}</p>
                </div>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
              style={{ background: pageTheme.gradients.memoryToLearning }}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className={styles.alternateAction}>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className={styles.alternateActionButton}
            >
              {isSignUp 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={styles.branding}
        >
          <div className={styles.brandingContent}>
            <Sparkles className={styles.brandingIcon} />
            <span>Powered by Sensa AI</span>
            <span>•</span>
            <span>sensalearn.co.za</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthForm;