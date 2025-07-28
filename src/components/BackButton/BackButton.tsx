import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './BackButton.module.css';

export interface BackButtonProps {
  to?: string;
  label?: string;
  variant?: 'default' | 'minimal' | 'floating';
  className?: string;
  onClick?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({
  to = '/dashboard',
  label = 'Back to Dashboard',
  variant = 'default',
  className = '',
  onClick
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return styles.minimal;
      case 'floating':
        return styles.floating;
      default:
        return styles.default;
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`${styles.backButton} ${getVariantClasses()} ${className}`}
      whileHover={{ scale: 1.05, x: -2 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ArrowLeft className={styles.icon} />
      <span className={styles.label}>{label}</span>
    </motion.button>
  );
};

export default BackButton;
