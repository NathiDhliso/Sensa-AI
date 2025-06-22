import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore } from '../../stores';
import styles from '../../styles/components/NotificationSystem.module.css';

const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useUIStore();

  // Filter out "Dashboard Updated" notifications
  const filteredNotifications = notifications.filter(
    notification => !(notification.title === 'Dashboard Updated' && notification.message === 'Your latest data has been loaded successfully')
  );

  const getNotificationIcon = (type: NotificationType) => {
    const baseClass = 'w-5 h-5 flex-shrink-0';
    
    switch (type) {
      case 'success':
        return <CheckCircle className={`${baseClass} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${baseClass} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${baseClass} text-yellow-500`} />;
      case 'info':
      default:
        return <Info className={`${baseClass} text-blue-500`} />;
    }
  };

  const getNotificationStyle = (type: NotificationType) => {
    const baseClass = 'border-l-4 shadow-lg backdrop-blur-sm';
    
    switch (type) {
      case 'success':
        return `${baseClass} bg-green-50/90 border-green-400 text-green-800`;
      case 'error':
        return `${baseClass} bg-red-50/90 border-red-400 text-red-800`;
      case 'warning':
        return `${baseClass} bg-yellow-50/90 border-yellow-400 text-yellow-800`;
      case 'info':
      default:
        return `${baseClass} bg-blue-50/90 border-blue-400 text-blue-800`;
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
              {getNotificationIcon(notification.type)}
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