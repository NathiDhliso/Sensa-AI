import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Brain, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sensaBrandColors } from '../styles/brandColors';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const confirmed = searchParams.get('confirmed');
  const showConfirmationMessage = confirmed === 'true';

  useEffect(() => {
    // Clear any existing errors when component mounts
    setError(null);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-auth-email', {
        body: {
          emailType: 'RESET_PASSWORD',
          userData: { email }
        }
      });

      if (error) throw error;

      setResetEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-auth-email', {
        body: {
          emailType: 'MAGIC_LINK',
          userData: { email }
        }
      });

      if (error) throw error;

      setResetEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="flex justify-center mb-4"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div 
              className="p-4 rounded-2xl shadow-xl"
              style={{ background: sensaBrandColors.gradients.memoryToLearning.css }}
            >
              <Brain className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-light text-gray-800 mb-2">
            Welcome back to Sensa
          </h1>
          <p className="text-gray-600">
            Continue your memory-powered learning journey
          </p>
        </div>

        {/* Confirmation Message */}
        <AnimatePresence>
          {showConfirmationMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="text-green-800 font-medium">Email Confirmed!</h3>
                  <p className="text-green-700 text-sm">Your account has been verified. You can now sign in.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reset Email Sent Message */}
        <AnimatePresence>
          {resetEmailSent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-blue-800 font-medium">Email Sent!</h3>
                  <p className="text-blue-700 text-sm">Please check your inbox for further instructions.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              style={{ background: sensaBrandColors.gradients.memoryToLearning.css }}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Additional Options */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors disabled:opacity-50"
              >
                Forgot Password?
              </button>
              
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors disabled:opacity-50"
              >
                Send Magic Link
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </div>
        </motion.div>

        {/* Sensa Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4" style={{ color: sensaBrandColors.primary.amethyst.hex }} />
            <span>Powered by Sensa AI</span>
            <span>•</span>
            <span>sensalearn.co.za</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;