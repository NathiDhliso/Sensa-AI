import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Brain } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'brain' | 'dots';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'brain':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={`${sizeClasses[size]} text-purple-600`}
          >
            <Brain className="w-full h-full" />
          </motion.div>
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-purple-600 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        );
      
      default:
        return (
          <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-600`} />
        );
    }
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {renderSpinner()}
      {text && (
        <span className={`${textSizeClasses[size]} text-gray-600 animate-pulse`}>
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;