import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthForm from './AuthForm';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { sensaBrandColors } from '../../styles/brandColors';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
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
          <p className="text-gray-600">Loading Sensa...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => window.location.reload()} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;