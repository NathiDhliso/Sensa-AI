import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, Edit, MousePointer } from 'lucide-react';
import { useCollaborationStore } from '../../stores/collaborationStore';

interface PresenceIndicatorProps {
  className?: string;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ className = '' }) => {
  const { presences, participants, isPresenceEnabled } = useCollaborationStore();

  if (!isPresenceEnabled || Object.keys(presences).length === 0) {
    return null;
  }

  const activeUsers = Object.entries(presences).filter(([_, presence]) => 
    presence.isActive && Date.now() - presence.lastSeen < 30000 // Active within last 30 seconds
  );

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'select': return <MousePointer className="w-3 h-3" />;
      case 'edit': return <Edit className="w-3 h-3" />;
      case 'view': return <Eye className="w-3 h-3" />;
      default: return <MousePointer className="w-3 h-3" />;
    }
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'editing': return 'bg-green-500';
      case 'viewing': return 'bg-blue-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]"
      >
        <div className="flex items-center space-x-2 mb-3">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            Active Users ({activeUsers.length})
          </span>
        </div>
        
        <div className="space-y-2">
          <AnimatePresence>
            {activeUsers.map(([userId, presence]) => {
              const participant = participants.find(p => p.user_id === userId);
              if (!participant) return null;
              
              return (
                <motion.div
                  key={userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50"
                >
                  {/* User Avatar */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 relative"
                    style={{ backgroundColor: participant.user_color }}
                  >
                    {participant.user_name[0]?.toUpperCase() || '?'}
                    
                    {/* Activity Status Dot */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                        getActivityColor(presence.activity)
                      }`}
                    />
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {participant.user_name}
                      </span>
                      {getToolIcon(presence.currentTool)}
                    </div>
                    
                    {presence.isTyping && (
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-xs text-green-600 italic"
                      >
                        typing...
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Cursor Position Indicator */}
                  {presence.cursorPosition && (
                    <div className="text-xs text-gray-500">
                      <MousePointer className="w-3 h-3" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        
        {activeUsers.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-2">
            No active users
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PresenceIndicator;