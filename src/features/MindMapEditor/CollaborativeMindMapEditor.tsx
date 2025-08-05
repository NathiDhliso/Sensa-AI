// Phase 1: Foundation & Core Sync - Collaborative Mind Map Editor
// Extends the existing mindmap editor with real-time collaboration features

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  MarkerType,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ConnectionMode,
  Viewport,
  NodeChange,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageCircle, Share2, History, Settings,
  UserPlus, Crown, Eye, Mic, MicOff, Video, VideoOff,
  Download, Save, RotateCcw, RotateCw, X, Upload, Palette,
  Layout, FileText, Image, Pen, Layers, BarChart3,
  GraduationCap, Trophy, Smartphone, Wifi, Eraser, Circle,
  Triangle, ArrowRight, Minus, MousePointer
} from 'lucide-react';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { collaborationService } from '../../services/collaborationService';
import { Button } from '../../components';
import SimpleAdvancedNode, { SimpleAdvancedNodeData as AdvancedNodeData } from './SimpleAdvancedNode';
import MultimediaNode, { MultimediaNodeData } from './MultimediaNode';
import { CollaborativeChat } from './CollaborativeChat';
import { VoiceVideoChat } from './VoiceVideoChat';
import { PresenceIndicator } from './PresenceIndicator';
import FileSharing from './FileSharing';
import DrawingOverlay from './DrawingOverlay';
import CommunicationTest from '../../debug/CommunicationTest';
import CollaborativeTemplates from './CollaborativeTemplates';
import EnhancedExport from './EnhancedExport';
import LearningAnalytics from './LearningAnalytics';
import AssessmentIntegration from './AssessmentIntegration';
import GamificationSystem from './GamificationSystem';
import MobileOptimization from './MobileOptimization';
import OfflineSync from './OfflineSync';
import AccessibilityFeatures from './AccessibilityFeatures';
import RootProblemModal from './RootProblemModal';
import '@xyflow/react/dist/style.css';

// Node types for React Flow
const nodeTypes = {
  advanced: SimpleAdvancedNode,
  multimedia: MultimediaNode,
};

// Collaborative cursor component
interface CollaborativeCursorProps {
  user: {
    id: string;
    name?: string;
    color: string;
    cursor_position?: { x: number; y: number };
  };
}

const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({ user }) => {
  if (!user.cursor_position) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={{
        left: user.cursor_position.x,
        top: user.cursor_position.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor */}
      <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow-sm">
        <path
          d="M0 0L0 16L5 12L8 16L12 14L8 10L16 10L0 0Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* User name label */}
      <div
        className="absolute top-5 left-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name || 'Anonymous'}
      </div>
    </div>
  );
};

// Enhanced participants panel with communication controls
const ParticipantsPanel: React.FC = () => {
  const { participants, currentUser, currentSession } = useCollaborationStore();
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'voice'>('participants');

  const copyInviteLink = useCallback(() => {
    if (currentSession) {
      const inviteUrl = `${window.location.origin}/collaborate/${currentSession.id}`;
      navigator.clipboard.writeText(inviteUrl);
      // TODO: Show toast notification
    }
  }, [currentSession]);

  return (
    <div className="bg-white rounded-lg shadow-lg border min-w-64 h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'participants'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 People
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'voice'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🎤 Voice
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'participants' && (
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Participants ({participants.length})
              </h3>
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Invite participants"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Invite section */}
            <AnimatePresence>
              {showInvite && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <p className="text-sm text-blue-800 mb-2">Share this session:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentSession ? `${window.location.origin}/collaborate/${currentSession.id}` : ''}
                      readOnly
                      className="flex-1 px-2 py-1 text-xs border rounded bg-white"
                    />
                    <Button
                      onClick={copyInviteLink}
                      variant="outline"
                      className="px-2 py-1 text-xs"
                    >
                      Copy
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Participants list */}
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: participant.color }}
                  >
                    {participant.name?.[0] || participant.email[0].toUpperCase()}
                  </div>
                  
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {participant.name || participant.email}
                      </span>
                      {participant.role === 'facilitator' && (
                        <Crown className="w-3 h-3 text-yellow-500" title="Facilitator" />
                      )}
                      {participant.role === 'observer' && (
                        <Eye className="w-3 h-3 text-gray-500" title="Observer" />
                      )}
                      {participant.id === currentUser?.id && (
                        <span className="text-xs text-blue-600">(You)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {participant.is_online ? 'Online' : 'Offline'}
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div
                    className={`w-2 h-2 rounded-full ${
                      participant.is_online ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                </div>
              ))}
            </div>
            
            {participants.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                No participants yet.
                <br />
                Invite others to collaborate!
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'chat' && (
          <CollaborativeChat className="h-full" />
        )}
        
        {activeTab === 'voice' && (
          <VoiceVideoChat className="h-full" />
        )}
      </div>
    </div>
  );
};

// Main collaborative editor component
interface CollaborativeMindMapEditorProps {
  sessionId?: string;
  initialData?: { nodes: Node[]; edges: Edge[] };
  onSave?: (data: { nodes: Node[]; edges: Edge[] }) => void;
  onClose?: () => void;
}

const CollaborativeMindMapEditorInternal: React.FC<CollaborativeMindMapEditorProps> = ({
  sessionId,
  initialData,
  onSave,
  onClose
}) => {
  // Collaboration store
  const {
    currentSession,
    isConnected,
    connectionStatus,
    participants,
    currentUser,
    joinSession,
    leaveSession,
    updateCursorPosition,
    addOperation,
    createSnapshot,
    updatePresencePosition,
    updateCurrentTool,
    updateViewport,
    error
  } = useCollaborationStore();

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || []);
  const { fitView } = useReactFlow();

  // UI state
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatActiveTab, setChatActiveTab] = useState<'messages' | 'voice'>('messages');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  
  // Phase 3 UI state
  const [showFileSharing, setShowFileSharing] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [currentDrawingTool, setCurrentDrawingTool] = useState<'select' | 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'text'>('select');
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [drawingSize, setDrawingSize] = useState(3);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEnhancedExport, setShowEnhancedExport] = useState(false);
  const [currentNodeType, setCurrentNodeType] = useState<'advanced' | 'multimedia'>('advanced');
  
  // Phase 4 UI state
  const [showLearningAnalytics, setShowLearningAnalytics] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [showMobileView, setShowMobileView] = useState(false);
  
  // Root Problem Modal state - support multiple concurrent analyses
  const [activeAnalyses, setActiveAnalyses] = useState<Map<string, {
    nodeId: string;
    nodeLabel: string;
    isVisible: boolean;
    isMinimized: boolean;
    isRunning: boolean;
  }>>(new Map());
  
  // Debug state
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const isLoadingSessionRef = useRef<boolean>(false);

  // Load session data when joining
  useEffect(() => {
    const loadSessionData = async () => {
      console.log('🔄 Loading session data for sessionId:', sessionId);
      console.log('📊 Current session state:', currentSession);
      
      if (sessionId && !currentSession && sessionId !== 'demo-session' && !isLoadingSessionRef.current) {
        try {
          isLoadingSessionRef.current = true;
          console.log('🚀 Joining session:', sessionId);
          await joinSession(sessionId);
          console.log('✅ Successfully joined session');
          
          // Load existing snapshots to get the latest mindmap state
          console.log('📸 Loading snapshots for session:', sessionId);
          const snapshots = await collaborationService.getSnapshots(sessionId);
          console.log('📸 Found snapshots:', snapshots.length);
          
          if (snapshots.length > 0) {
            // Load the most recent snapshot
            const latestSnapshot = snapshots[0];
            console.log('📸 Loading latest snapshot:', latestSnapshot);
            setNodes(latestSnapshot.nodes_data || []);
        setEdges(latestSnapshot.edges_data || []);
            console.log('✅ Loaded existing mindmap data');
          } else {
            console.log('🆕 No existing snapshots, creating starter content');
            // No existing data, create starter content for new sessions
            const starterNodes = [
              {
                id: '1',
                type: 'advanced',
                position: { x: 250, y: 100 },
                data: {
                  label: 'Welcome to Collaborative Session!',
                  description: 'Start building your mindmap together',
                  category: 'main',
                  priority: 'high',
                  tags: ['collaboration', 'start'],
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
                  label: 'Add Your Ideas',
                  description: 'Click to edit and add your thoughts',
                  category: 'idea',
                  priority: 'medium',
                  tags: ['brainstorm'],
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
                  label: 'Connect Concepts',
                  description: 'Drag to create connections between ideas',
                  category: 'connection',
                  priority: 'medium',
                  tags: ['link'],
                  attachments: [],
                  links: [],
                  color: '#F59E0B'
                } as AdvancedNodeData
              }
            ];
            
            const starterEdges = [
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
            ];
            
            console.log('🎨 Setting starter nodes and edges');
            setNodes(starterNodes);
            setEdges(starterEdges);
            
            // Create initial snapshot for the session
            console.log('💾 Creating initial snapshot');
            await collaborationService.createSnapshot(
              { nodes: starterNodes, edges: starterEdges },
              'Initial Session Setup',
              true
            );
            console.log('✅ Created initial snapshot');
          }
        } catch (error) {
          console.error('❌ Error loading session data:', error);
        } finally {
          isLoadingSessionRef.current = false;
        }
      } else if (sessionId === 'demo-session') {
        console.log('🎭 Demo mode detected, using initial data');
      } else {
        console.log('⏭️ Skipping session load - no sessionId or session already exists');
      }
    };
    
    loadSessionData();
  }, [sessionId, currentSession, joinSession, setNodes, setEdges]);

  // Demo mode flag
  const isDemoMode = sessionId === 'demo-session';

  // Listen for updateNode events from SimpleAdvancedNode components
  useEffect(() => {
    const handleUpdateNode = (event: CustomEvent) => {
      const { id, updates } = event.detail;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
      
      // Send collaboration operation for node update (skip in demo mode)
      if (!isDemoMode) {
        addOperation({
          operation_type: 'edit_node',
          operation_data: {
            nodeId: id,
            updates: updates
          },
          applied: false
        });
      }
    };

    const handleOpenRootProblemModal = (event: CustomEvent) => {
      const { nodeId, nodeLabel } = event.detail;
      
      // Check if analysis already exists for this node
      if (activeAnalyses.has(nodeId)) {
        // If exists but minimized, restore it
        setActiveAnalyses(prev => {
          const updated = new Map(prev);
          const existing = updated.get(nodeId)!;
          updated.set(nodeId, {
            ...existing,
            isVisible: true,
            isMinimized: false
          });
          return updated;
        });
      } else {
        // Create new analysis
        setActiveAnalyses(prev => {
          const updated = new Map(prev);
          updated.set(nodeId, {
            nodeId,
            nodeLabel,
            isVisible: true,
            isMinimized: false,
            isRunning: false
          });
          return updated;
        });
      }
    };

    window.addEventListener('updateNode', handleUpdateNode as EventListener);
    window.addEventListener('openRootProblemModal', handleOpenRootProblemModal as EventListener);
    
    return () => {
      window.removeEventListener('updateNode', handleUpdateNode as EventListener);
      window.removeEventListener('openRootProblemModal', handleOpenRootProblemModal as EventListener);
    };
  }, [setNodes, addOperation, isDemoMode]);

  // Handle cursor movement
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDemoMode || (!isConnected || !canvasRef.current)) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Update presence position (includes cursor tracking)
    updatePresencePosition(x, y);
    // Also update legacy cursor position for existing cursors
    updateCursorPosition(x, y);
  }, [isDemoMode, isConnected, updatePresencePosition, updateCursorPosition]);

  // Handle viewport changes
  const handleViewportChange = useCallback((viewport: Viewport) => {
    if (!isDemoMode) {
      updateViewport(viewport.x, viewport.y, viewport.zoom);
    }
  }, [isDemoMode, updateViewport]);

  // Handle node changes with collaboration
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    
    if (!isDemoMode) {
      // Update tool when dragging nodes
      const isDragging = changes.some(change => change.type === 'position' && change.dragging);
      if (isDragging) {
        updateCurrentTool('move');
      } else {
        updateCurrentTool('select');
      }
      
      // Send operations for each change
      changes.forEach(change => {
        if (change.type === 'position' && change.dragging === false) {
          addOperation({
            operation_type: 'move_node',
            operation_data: {
              nodeId: change.id,
              position: change.position
            },
            applied: false
          });
        }
      });
    }
  }, [isDemoMode, onNodesChange, addOperation, updateCurrentTool]);

  // Handle edge connections
  const onConnect = useCallback((connection: Connection) => {
    const newEdge = {
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
    };
    
    setEdges(eds => addEdge(newEdge, eds));
    
    // Send operation (skip in demo mode)
    if (!isDemoMode) {
      addOperation({
        operation_type: 'add_edge',
        operation_data: newEdge,
        applied: false
      });
    }
  }, [isDemoMode, setEdges, addOperation]);

  // Handle node addition
  const addNode = useCallback((nodeType: 'advanced' | 'multimedia' = currentNodeType) => {
    // Update current tool to indicate node creation (skip in demo mode)
    if (!isDemoMode) {
      updateCurrentTool('create');
    }
    
    const baseNodeData = {
      label: 'New Node',
      shape: 'rectangle' as const,
      color: '#6B46C1',
      textColor: '#FFFFFF',
      borderColor: '#4C1D95',
      fontSize: 14,
      fontWeight: 'normal' as const,
      borderWidth: 2,
      borderRadius: 8
    };
    
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: nodeType === 'multimedia' 
        ? {
            ...baseNodeData,
            mediaFiles: [],
            showMediaPreview: true,
            mediaLayout: 'thumbnail' as const
          } as MultimediaNodeData
        : baseNodeData as AdvancedNodeData,
    };
    
    setNodes(nds => [...nds, newNode]);
    
    // Send operation (skip in demo mode)
    if (!isDemoMode) {
      addOperation({
        operation_type: 'add_node',
        operation_data: newNode,
        applied: false
      });
      
      // Reset tool after creation
      setTimeout(() => updateCurrentTool('select'), 1000);
    }
  }, [isDemoMode, setNodes, addOperation, updateCurrentTool, currentNodeType]);
  
  // Handle template selection
  const handleTemplateSelect = useCallback((template: { id: string; nodes: Node[]; edges: Edge[] }) => {
    if (template.nodes && template.edges) {
      setNodes(template.nodes);
      setEdges(template.edges);
      
      // Send operation for template application
      addOperation({
        operation_type: 'batch_operation',
        operation_data: { templateId: template.id, nodes: template.nodes, edges: template.edges },
        applied: false
      });
    }
    setShowTemplates(false);
  }, [setNodes, setEdges, addOperation]);
  
  // Handle file selection from file sharing
  const handleFileSelect = useCallback((file: { name: string; url: string; type: string; size: number }) => {
    // Create a multimedia node with the selected file
    const newNode: Node = {
      id: `file-node-${Date.now()}`,
      type: 'multimedia',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: file.file.name,
        shape: 'rectangle',
        color: '#6B46C1',
        textColor: '#FFFFFF',
        borderColor: '#4C1D95',
        fontSize: 14,
        fontWeight: 'normal',
        borderWidth: 2,
        borderRadius: 8,
        mediaFiles: [file],
        primaryMedia: file,
        showMediaPreview: true,
        mediaLayout: 'preview'
      } as MultimediaNodeData,
    };
    
    setNodes(nds => [...nds, newNode]);
    
    // Send operation
    addOperation({
      operation_type: 'add_node',
      operation_data: newNode,
      applied: false
    });
    
    setShowFileSharing(false);
  }, [setNodes, addOperation]);
  
  // Handle root problem selection
  const handleRootProblemSelect = useCallback((nodeId: string, problem: string) => {
    // Update the node with the selected root problem
    setNodes(nds => nds.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, rootProblem: problem } }
        : node
    ));
    
    // Send operation for node update
    addOperation({
      operation_type: 'edit_node',
      operation_data: { 
        nodeId: nodeId, 
        updates: { rootProblem: problem } 
      },
      applied: false
    });
  }, [setNodes, addOperation]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!isDemoMode) {
      await createSnapshot('Manual Save', false);
    }
    onSave?.({ nodes, edges });
  }, [isDemoMode, createSnapshot, onSave, nodes, edges]);

  // Handle close
  const handleClose = useCallback(async () => {
    if (!isDemoMode) {
      await leaveSession();
    }
    onClose?.();
  }, [isDemoMode, leaveSession, onClose]);

  if (!isDemoMode && connectionStatus === 'connecting') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Connecting to collaboration session...</p>
        </div>
      </div>
    );
  }

  if (!isDemoMode && error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <X className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Collaborative Mind Map</h2>
            {currentSession && (
              <span className="text-purple-200 text-sm">
                {currentSession.session_name}
              </span>
            )}
            
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isDemoMode ? 'bg-blue-400' : (isConnected ? 'bg-green-400' : 'bg-red-400')
              }`} />
              <span className="text-sm">
                {isDemoMode ? 'Demo Mode' : (isConnected ? 'Connected' : 'Disconnected')}
              </span>
            </div>
          </div>
          
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            {/* Voice/Video controls */}
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`p-2 rounded transition-colors ${
                isVoiceEnabled ? 'bg-green-500' : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
              title={isVoiceEnabled ? 'Mute' : 'Unmute'}
            >
              {isVoiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`p-2 rounded transition-colors ${
                isVideoEnabled ? 'bg-green-500' : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
              title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
            >
              {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
            
            <div className="w-px h-6 bg-white bg-opacity-30" />
            
            {/* Panel toggles */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`p-2 rounded transition-colors ${
                showParticipants ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
              title="Toggle Participants"
            >
              <Users className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded transition-colors ${
                showChat ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
              title="Toggle Chat"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-white bg-opacity-30" />
            
            {/* Phase 3 Features */}
            <button
              onClick={() => setShowFileSharing(true)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="File Sharing"
            >
              <Upload className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowDrawingTools(!showDrawingTools)}
              className={`p-2 rounded transition-colors ${
                showDrawingTools
                  ? 'bg-blue-500 text-white'
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
              title="Drawing Tools"
            >
              <Pen className="w-4 h-4" />
            </button>
            
            <button
               onClick={() => setShowTemplates(true)}
               className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
               title="Templates"
             >
               <Layout className="w-4 h-4" />
             </button>
            
            <div className="w-px h-6 bg-white bg-opacity-30" />
            
            {/* Actions */}
            <button
              onClick={handleSave}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowEnhancedExport(true)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Enhanced Export"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-white bg-opacity-30" />
            
            {/* Phase 4 Features */}
            <button
              onClick={() => setShowLearningAnalytics(true)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Learning Analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowAssessment(true)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Assessment Integration"
            >
              <GraduationCap className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowGamification(true)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Gamification"
            >
              <Trophy className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowMobileView(true)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors md:hidden"
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            
            {/* Debug Panel Toggle */}
            <button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className={`p-2 rounded transition-colors ${
                showDebugPanel
                  ? 'bg-red-500 text-white'
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
              title="Debug Communication"
            >
              🐛
            </button>
            
            <button
              onClick={handleClose}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex relative">
          {/* Participants panel */}
          <AnimatePresence>
            {showParticipants && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 280 }}
                exit={{ width: 0 }}
                className="bg-gray-50 border-r overflow-hidden"
              >
                <div className="p-4 h-full overflow-y-auto">
                  <ParticipantsPanel />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="flex-1 relative"
            onMouseMove={handleMouseMove}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onViewportChange={handleViewportChange}
              connectionMode={ConnectionMode.Loose}
              fitView
              className="bg-gray-50"
              nodesDraggable={true}
              nodesConnectable={true}
              elementsSelectable={true}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              
              <MiniMap
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
                zoomable
                pannable
              />
              
              <Controls showZoom showFitView showInteractive />
              
              {/* Drawing Tools Panel */}
              {showDrawingTools && (
                <Panel position="top-left" className="m-4" style={{ zIndex: 1001 }}>
                  <div className="bg-white rounded-lg shadow-lg border p-3 flex flex-col gap-3" style={{ zIndex: 1001 }}>
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Pen className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Drawing Tools</span>
                      <button
                        onClick={() => setShowDrawingTools(false)}
                        className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Tool Selection */}
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'select', icon: MousePointer, name: 'Select' },
                        { id: 'pen', icon: Pen, name: 'Pen' },
                        { id: 'highlighter', icon: Palette, name: 'Highlighter' },
                        { id: 'eraser', icon: Eraser, name: 'Eraser' },
                        { id: 'rectangle', icon: Layout, name: 'Rectangle' },
                        { id: 'circle', icon: Circle, name: 'Circle' },
                        { id: 'triangle', icon: Triangle, name: 'Triangle' },
                        { id: 'arrow', icon: ArrowRight, name: 'Arrow' },
                        { id: 'line', icon: Minus, name: 'Line' },
                        { id: 'text', icon: FileText, name: 'Text' }
                      ].map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => setCurrentDrawingTool(tool.id as any)}
                          className={`p-2 rounded transition-colors ${
                            currentDrawingTool === tool.id
                              ? 'bg-blue-100 text-blue-600 border-2 border-blue-300'
                              : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                          title={tool.name}
                        >
                          <tool.icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                    
                    {/* Color Selection */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Color:</span>
                      <div className="flex gap-1">
                        {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map(color => (
                          <button
                            key={color}
                            onClick={() => setDrawingColor(color)}
                            className={`w-6 h-6 rounded border-2 transition-all ${
                              drawingColor === color ? 'border-gray-600 scale-110' : 'border-gray-200 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Size Selection */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Size:</span>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={drawingSize}
                        onChange={(e) => setDrawingSize(Number(e.target.value))}
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-xs text-gray-500 w-6 font-medium">{drawingSize}</span>
                    </div>
                    
                    {/* Clear Drawing Button */}
                    <button
                      onClick={() => {
                        // Clear drawing functionality will be implemented
                        console.log('Clear drawing');
                      }}
                      className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </Panel>
              )}
              
              {/* Drawing Overlay */}
              <DrawingOverlay
                isActive={showDrawingTools}
                currentTool={currentDrawingTool}
                color={drawingColor}
                size={drawingSize}
                onDrawingChange={(data) => {
                  // Handle drawing data changes
                  console.log('Drawing data:', data);
                }}
              />
              
              {/* Add node panel */}
              <Panel position="top-left">
                <div className="bg-white rounded-lg shadow-lg p-2">
                  <div className="flex flex-col gap-2">
                    {/* Node type selector */}
                    <div className="flex gap-1 p-1 bg-gray-100 rounded">
                      <button
                        onClick={() => setCurrentNodeType('advanced')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          currentNodeType === 'advanced' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        title="Advanced Node"
                      >
                        <Layers className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setCurrentNodeType('multimedia')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          currentNodeType === 'multimedia' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        title="Multimedia Node"
                      >
                        <Image className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Add node button */}
                    <button
                      onClick={() => addNode()}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title={`Add ${currentNodeType === 'multimedia' ? 'Multimedia' : 'Advanced'} Node`}
                    >
                      <span className="text-2xl">+</span>
                    </button>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
            
            {/* Collaborative cursors */}
            {participants
              .filter(p => p.id !== currentUser?.id && p.cursor_position)
              .map(participant => (
                <CollaborativeCursor
                  key={participant.id}
                  user={participant}
                />
              ))
            }
            
            {/* Presence Indicator */}
            <PresenceIndicator />
          </div>
          
          {/* Enhanced communication panel */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 320 }}
                exit={{ width: 0 }}
                className="bg-gray-50 border-l overflow-hidden"
              >
                <div className="p-4 h-full">
                  <div className="bg-white rounded-lg shadow-lg border h-full flex flex-col">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200">
                      <button 
                        onClick={() => setChatActiveTab('messages')}
                        className={`flex-1 px-3 py-2 text-sm font-medium ${
                          chatActiveTab === 'messages'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        💬 Chat
                      </button>
                      <button 
                        onClick={() => setChatActiveTab('voice')}
                        className={`flex-1 px-3 py-2 text-sm font-medium ${
                          chatActiveTab === 'voice'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        🎤 Voice
                      </button>
                    </div>
                    
                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden">
                      {chatActiveTab === 'messages' && (
                        <CollaborativeChat className="h-full" />
                      )}
                      {chatActiveTab === 'voice' && (
                        <VoiceVideoChat className="h-full" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Phase 3 Modals */}
          <AnimatePresence>
            {showFileSharing && (
              <FileSharing
                sessionId={sessionId || ''}
                onFileSelect={handleFileSelect}
                onClose={() => setShowFileSharing(false)}
              />
            )}
          </AnimatePresence>
          

          
          <AnimatePresence>
            {showTemplates && (
              <CollaborativeTemplates
                onTemplateSelect={handleTemplateSelect}
                onClose={() => setShowTemplates(false)}
                mode="select"
              />
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {showEnhancedExport && (
              <EnhancedExport
                nodes={nodes}
                edges={edges}
                canvasRef={canvasRef}
                sessionId={sessionId}
                onClose={() => setShowEnhancedExport(false)}
              />
            )}
          </AnimatePresence>
          
          {/* Phase 4 Modals */}
          <AnimatePresence>
            {showLearningAnalytics && (
              <LearningAnalytics
                sessionId={sessionId || ''}
                onClose={() => setShowLearningAnalytics(false)}
              />
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {showAssessment && (
              <AssessmentIntegration
                sessionId={sessionId || ''}
                mindMapData={{
                  nodes: nodes.map(node => ({
                    id: node.id,
                    data: node.data,
                    position: node.position,
                    type: node.type
                  })),
                  edges: edges.map(edge => ({
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    type: edge.type
                  }))
                }}
                onClose={() => setShowAssessment(false)}
                onAssessmentComplete={(results) => {
                  console.log('Assessment completed:', results);
                  // Handle assessment results
                }}
              />
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {showGamification && (
              <GamificationSystem
                userId={currentUser?.id || 'anonymous'}
                sessionId={sessionId || ''}
                onClose={() => setShowGamification(false)}
                onAchievementUnlocked={(achievement) => {
                  console.log('Achievement unlocked:', achievement);
                  // Handle achievement notifications
                }}
              />
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {showMobileView && (
              <MobileOptimization
                mindMapData={{
                  nodes: nodes.map(node => ({
                    id: node.id,
                    data: node.data,
                    position: node.position,
                    type: node.type
                  })),
                  edges: edges.map(edge => ({
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    type: edge.type
                  }))
                }}
                onClose={() => setShowMobileView(false)}
                onNodeAdd={(nodeData) => {
                  addNode(nodeData.position.x, nodeData.position.y);
                }}
                onNodeUpdate={(nodeId, updates) => {
                  setNodes(nds => nds.map(node => 
                    node.id === nodeId ? { ...node, ...updates } : node
                  ));
                }}
              />
            )}
          </AnimatePresence>
          
          {/* Offline Sync Component */}
          <OfflineSync
            sessionId={sessionId || ''}
            onSyncComplete={(success) => {
              console.log('Sync completed:', success);
              // Handle sync completion
            }}
            onConflictDetected={(conflicts) => {
              console.log('Conflicts detected:', conflicts);
              // Handle sync conflicts
            }}
          />
          
          {/* Accessibility Features */}
          <AccessibilityFeatures
            onSettingsChange={(settings) => {
              console.log('Accessibility settings changed:', settings);
              // Apply accessibility settings
            }}
            onVoiceCommand={(command) => {
              console.log('Voice command:', command);
              // Handle voice commands
              if (command.includes('add node')) {
                addNode(250, 250);
              } else if (command.includes('save')) {
                handleSave();
              }
              // Add more voice command handlers
            }}
          />
          
          {/* Root Problem Modals - Multiple concurrent analyses */}
          <AnimatePresence>
            {Array.from(activeAnalyses.entries()).map(([nodeId, analysis]) => (
              (analysis.isVisible || analysis.isMinimized) && (
                <RootProblemModal
                  key={nodeId}
                  nodeId={nodeId}
                  nodeLabel={analysis.nodeLabel}
                  onProblemSelect={(problem: string) => handleRootProblemSelect(nodeId, problem)}
                  onClose={() => {
                    setActiveAnalyses(prev => {
                      const updated = new Map(prev);
                      updated.delete(nodeId);
                      return updated;
                    });
                  }}
                  onMinimize={() => {
                    setActiveAnalyses(prev => {
                      const updated = new Map(prev);
                      const existing = updated.get(nodeId)!;
                      updated.set(nodeId, {
                        ...existing,
                        isVisible: analysis.isMinimized ? true : false,
                        isMinimized: analysis.isMinimized ? false : true
                      });
                      return updated;
                    });
                  }}
                  isMinimized={analysis.isMinimized}
                />
              )
            ))}
          </AnimatePresence>
          
          {/* Debug Panel */}
          <AnimatePresence>
            {showDebugPanel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-4 right-4 z-50"
              >
                <CommunicationTest />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Wrapped component with ReactFlowProvider
export const CollaborativeMindMapEditor: React.FC<CollaborativeMindMapEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CollaborativeMindMapEditorInternal {...props} />
    </ReactFlowProvider>
  );
};

export default CollaborativeMindMapEditor;