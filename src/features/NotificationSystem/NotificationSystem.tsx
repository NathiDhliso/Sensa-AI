import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Info, XCircle } from 'lucide-react';
import { useUIStore } from '../../stores';
import styles from './NotificationSystem.module.css';

interface AnimatedCheckmarkProps {
  size?: number;
  className?: string;
}

const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({ size = 24, className = "" }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      <motion.path
        d="m9 12 2 2 4-4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeInOut" }}
      />
    </motion.svg>
  );
};

const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useUIStore();

  // Filter out "Dashboard Updated" notifications
  const filteredNotifications = notifications.filter(
    notification => !(notification.title === 'Dashboard Updated' && notification.message === 'Your latest data has been loaded successfully')
  );

  const getIcon = (type: string) => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    
    switch (type) {
      case 'success':
        return <AnimatedCheckmark size={20} className={iconClass} />;
      case 'error':
        return <XCircle className={iconClass} />;
      case 'warning':
        return <AlertCircle className={iconClass} />;
      case 'info':
        return <Info className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getNotificationClasses = (type: string) => {
    const baseClass = styles.notification;
    
    switch (type) {
      case 'success':
        return `${baseClass} ${styles.notificationSuccess}`;
      case 'error':
        return `${baseClass} ${styles.notificationError}`;
      case 'warning':
        return `${baseClass} ${styles.notificationWarning}`;
      case 'info':
      default:
        return `${baseClass} ${styles.notificationInfo}`;
    }
  };

  const getTitleClass = (type: string) => {
    switch (type) {
      case 'success':
        return styles.notificationTitleSuccess;
      case 'error':
        return styles.notificationTitleError;
      case 'warning':
        return styles.notificationTitleWarning;
      case 'info':
      default:
        return styles.notificationTitleInfo;
    }
  };

  const getMessageClass = (type: string) => {
    switch (type) {
      case 'success':
        return styles.notificationMessageSuccess;
      case 'error':
        return styles.notificationMessageError;
      case 'warning':
        return styles.notificationMessageWarning;
      case 'info':
      default:
        return styles.notificationMessageInfo;
    }
  };

  const getCloseButtonClass = (type: string) => {
    const baseClass = styles.closeButton;
    
    switch (type) {
      case 'success':
        return `${baseClass} ${styles.closeButtonSuccess}`;
      case 'error':
        return `${baseClass} ${styles.closeButtonError}`;
      case 'warning':
        return `${baseClass} ${styles.closeButtonWarning}`;
      case 'info':
      default:
        return `${baseClass} ${styles.closeButtonInfo}`;
    }
  };

  return (
    <div className={styles.notificationContainer}>
      <AnimatePresence>
        {filteredNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={getNotificationClasses(notification.type)}
          >
            <div className={styles.notificationIcon}>
              {getIcon(notification.type)}
            </div>
            <div className={styles.notificationContent}>
              <h4 className={`${styles.notificationTitle} ${getTitleClass(notification.type)}`}>
                {notification.title}
              </h4>
              <p className={`${styles.notificationMessage} ${getMessageClass(notification.type)}`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={getCloseButtonClass(notification.type)}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;