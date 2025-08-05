// Collaboration Page - Entry point for collaborative mindmap sessions
// Handles session joining, creation, and routing to the collaborative editor

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Plus, Share2, Clock, Settings, ArrowLeft,
  Copy, Check, AlertCircle, Loader2, X, Eye
} from 'lucide-react';
import { MarkerType } from '@xyflow/react';
import { useCollaborationStore } from '../stores/collaborationStore';
import { CollaborativeMindMapEditor } from '../features/MindMapEditor/CollaborativeMindMapEditor';
import { SimpleAdvancedNodeData as AdvancedNodeData } from '../features/MindMapEditor/SimpleAdvancedNode';
import { Button } from '../components';
import { useAuth } from '../hooks/useAuth';

// Session creation form component
const CreateSessionForm: React.FC<{
  onCreateSession: (name: string, type: 'public' | 'private' | 'invite_only') => void;
  isLoading: boolean;
}> = ({ onCreateSession, isLoading }) => {
  const [sessionName, setSessionName] = useState('');
  const [sessionType, setSessionType] = useState<'public' | 'private' | 'invite_only'>('private');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionName.trim()) {
      onCreateSession(sessionName.trim(), sessionType);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border p-6 max-w-md w-full"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Create Collaboration Session
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Name
          </label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Enter session name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Type
          </label>
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as 'public' | 'private' | 'invite_only')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value="private">Private (Invite only)</option>
            <option value="invite_only">Invite Only</option>
            <option value="public">Public (Anyone can join)</option>
          </select>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={!sessionName.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
};

// Session info component
const SessionInfo: React.FC<{
  sessionId: string;
  onJoinSession: () => void;
  isLoading: boolean;
}> = ({ sessionId, onJoinSession, isLoading }) => {
  const [copied, setCopied] = useState(false);
  
  const inviteUrl = `${window.location.origin}/collaborate/${sessionId}`;
  
  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border p-6 max-w-md w-full"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Join Collaboration Session
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session ID
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono">
            {sessionId}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invite Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={copyInviteLink}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
              title="Copy invite link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
        
        <Button
          onClick={onJoinSession}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              Join Session
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

// Main collaboration page component
export const CollaborationPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const {
    currentSession,
    connectionStatus,
    error,
    createSession,
    joinSession,
    leaveSession,
    clearError
  } = useCollaborationStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🔐 User not authenticated, redirecting to login');
      navigate('/login?redirect=/collaborate' + (sessionId ? `/${sessionId}` : ''), { replace: true });
    }
  }, [user, authLoading, navigate, sessionId]);
  
  // Auto-join session if sessionId is provided in URL
  useEffect(() => {
    if (sessionId && !currentSession && connectionStatus === 'disconnected' && !isLoading && user) {
      handleJoinSession();
    }
  }, [sessionId, currentSession, connectionStatus, isLoading, user]);
  
  // Show editor when connected to a session
  useEffect(() => {
    if (currentSession && connectionStatus === 'connected') {
      setShowEditor(true);
    } else {
      setShowEditor(false);
    }
  }, [currentSession, connectionStatus]);
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }
  
  const handleCreateSession = async (name: string, type: 'public' | 'private' | 'invite_only') => {
    try {
      setIsLoading(true);
      clearError();
      
      const session = await createSession(name, type);
      
      // Navigate to the session URL
      navigate(`/collaborate/${session.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleJoinSession = async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      clearError();
      
      const role = searchParams.get('role') as 'participant' | 'observer' || 'participant';
      await joinSession(sessionId, role);
    } catch (error) {
      console.error('Failed to join session:', error);
      
      // If session not found, redirect to main collaboration page
      if (error instanceof Error && error.message.includes('Session not found')) {
        navigate('/collaborate', { replace: true });
        // Note: Error will be handled by the collaboration store
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLeaveSession = async () => {
    try {
      await leaveSession();
      navigate('/collaborate', { replace: true });
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  };
  
  const handleCloseEditor = () => {
    handleLeaveSession();
  };
  
  // Show collaborative editor if connected to a session OR in demo mode
  if (showEditor && currentSession) {
    return (
      <CollaborativeMindMapEditor
        sessionId={currentSession.id}
        onClose={handleCloseEditor}
      />
    );
  }

  // Demo mode - show editor without real collaboration
  const isDemoMode = searchParams.get('demo') === 'true';
  if (isDemoMode) {
    return (
      <CollaborativeMindMapEditor
        sessionId="demo-session"
        initialData={{
          nodes: [
            {
              id: '1',
              type: 'advanced',
              position: { x: 250, y: 100 },
              data: {
                label: 'Welcome to Collaborative Mind Mapping!',
                description: 'This is a demo of the collaborative features',
                category: 'main',
                priority: 'high',
                tags: ['demo', 'collaboration'],
                attachments: [],
                links: [],
                color: '#8B5CF6'
              } as AdvancedNodeData
            },
            {
              id: '2',
              type: 'advanced',
              position: { x: 100, y: 250 },
              data: {
                label: 'Real-time Editing',
                description: 'Multiple users can edit simultaneously',
                category: 'feature',
                priority: 'medium',
                tags: ['realtime'],
                attachments: [],
                links: [],
                color: '#10B981'
              } as AdvancedNodeData
            },
            {
              id: '3',
              type: 'advanced',
              position: { x: 400, y: 250 },
              data: {
                label: 'Phase 4 Features',
                description: 'Learning analytics, assessments, gamification',
                category: 'feature',
                priority: 'high',
                tags: ['phase4', 'analytics'],
                attachments: [],
                links: [],
                color: '#F59E0B'
              } as AdvancedNodeData
            }
          ],
          edges: [
            {
              id: 'e1-2',
              source: '1',
              target: '2',
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed }
            },
            {
              id: 'e1-3',
              source: '1',
              target: '3',
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed }
            }
          ]
        }}
        onClose={() => navigate('/collaborate')}
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                Collaborative Mind Mapping
              </h1>
            </div>
            
            {/* Connection status */}
            {connectionStatus !== 'disconnected' && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600 capitalize">
                  {connectionStatus}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 max-w-md w-full"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          
          {/* Loading state */}
          {connectionStatus === 'connecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">
                {sessionId ? 'Joining session...' : 'Connecting...'}
              </p>
            </motion.div>
          )}
          
          {/* Session form or info */}
          {connectionStatus === 'disconnected' && (
            <>
              {sessionId ? (
                <SessionInfo
                  sessionId={sessionId}
                  onJoinSession={handleJoinSession}
                  isLoading={isLoading}
                />
              ) : (
                <>
                  <CreateSessionForm
                    onCreateSession={handleCreateSession}
                    isLoading={isLoading}
                  />
                  
                  {/* Quick Test Session Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mt-4"
                  >
                    <div className="text-center">
                      <Button
                        onClick={() => handleCreateSession('Test Session', 'private')}
                        variant="outline"
                        className="px-6 py-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        disabled={isLoading}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Quick Test Session
                      </Button>
                    </div>
                  </motion.div>
                  
                  {/* Demo Mode Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-6"
                  >
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3">
                        Want to try the features first?
                      </p>
                      <Button
                        onClick={() => navigate('/collaborate?demo=true')}
                        variant="outline"
                        className="px-6 py-2"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Try Demo Mode
                      </Button>
                    </div>
                  </motion.div>
                </>
              )}
              
              {/* Features info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-12 max-w-4xl w-full"
              >
                <h3 className="text-lg font-semibold text-gray-800 text-center mb-8">
                  Collaborative Features
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                    <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-800 mb-2">Real-time Collaboration</h4>
                    <p className="text-sm text-gray-600">
                      Work together with multiple participants in real-time
                    </p>
                  </div>
                  
                  <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                    <Share2 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-800 mb-2">Easy Sharing</h4>
                    <p className="text-sm text-gray-600">
                      Share sessions with invite links and manage permissions
                    </p>
                  </div>
                  
                  <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                    <Clock className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-800 mb-2">Version History</h4>
                    <p className="text-sm text-gray-600">
                      Track changes and restore previous versions
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;