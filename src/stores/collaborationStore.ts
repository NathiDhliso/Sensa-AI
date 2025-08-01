// Collaboration Store - Real-time collaboration state management
// Manages session state, participants, operations, and real-time synchronization

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { 
  collaborationService,
  CollaborationSession,
  SessionParticipant,
  MindmapOperation,
  MindmapSnapshot,
  CursorUpdate
} from '../services/collaborationService';
import { presenceService, UserPresence } from '../services/presenceService';
import { chatService, ChatMessage } from '../services/chatService';

// Store state interface
interface CollaborationState {
  // Session management
  currentSession: CollaborationSession | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  
  // Participants
  participants: SessionParticipant[];
  currentUser: SessionParticipant | null;
  
  // Phase 2: Presence tracking
  presences: UserPresence[];
  isPresenceEnabled: boolean;
  
  // Operations and synchronization
  pendingOperations: MindmapOperation[];
  operationHistory: MindmapOperation[];
  
  // Snapshots
  snapshots: MindmapSnapshot[];
  
  // Current mindmap state (for snapshots)
  currentMindmapState: { nodes: any[]; edges: any[] };
  
  // Phase 2: Chat state
  chatMessages: ChatMessage[];
  unreadMessageCount: number;
  isTyping: boolean;
  typingUsers: string[];
  
  // UI state
  showParticipants: boolean;
  showChat: boolean;
  isVoiceEnabled: boolean;
  isVideoEnabled: boolean;
  chatActiveTab: 'messages' | 'voice' | 'video';
  
  // Actions
  createSession: (sessionName: string, sessionType?: 'public' | 'private' | 'invite_only') => Promise<CollaborationSession>;
  joinSession: (sessionId: string, role?: 'participant' | 'observer') => Promise<void>;
  leaveSession: () => Promise<void>;
  
  updateCursorPosition: (x: number, y: number) => void;
  addOperation: (operation: Omit<MindmapOperation, 'id' | 'timestamp' | 'user_id' | 'session_id'>) => Promise<void>;
  createSnapshot: (snapshotName?: string, isAutoSave?: boolean) => Promise<void>;
  
  updateMindmapState: (nodes: any[], edges: any[]) => void;
  
  // Phase 2: Presence actions
  updatePresencePosition: (x: number, y: number) => void;
  updateTypingStatus: (isTyping: boolean) => void;
  updateCurrentTool: (tool: string) => void;
  updateViewport: (x: number, y: number, zoom: number) => void;
  
  // Phase 2: Chat actions
  sendChatMessage: (content: string, replyToId?: string) => Promise<void>;
  loadChatHistory: () => Promise<void>;
  markMessagesAsRead: () => void;
  
  setShowParticipants: (show: boolean) => void;
  setShowChat: (show: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setChatActiveTab: (tab: 'messages' | 'voice' | 'video') => void;
  
  clearError: () => void;
  reset: () => void;
}

// Create the collaboration store
export const useCollaborationStore = create<CollaborationState>()(subscribeWithSelector((set, get) => {
  // Set up collaboration service callbacks
  collaborationService.onConnectionStatusChange = (status) => {
    set({ 
      connectionStatus: status,
      isConnected: status === 'connected'
    });
  };
  
  collaborationService.onError = (error) => {
    set({ error });
  };
  
  collaborationService.onSessionUpdate = (session) => {
    set({ currentSession: session });
  };
  
  collaborationService.onParticipantUpdate = (participants) => {
    const { currentUser } = get();
    const updatedCurrentUser = currentUser 
      ? participants.find(p => p.id === currentUser.id) || currentUser
      : null;
    
    set({ 
      participants,
      currentUser: updatedCurrentUser
    });
  };
  
  collaborationService.onOperationReceived = (operation) => {
    set({
      operationHistory: [...get().operationHistory, operation]
    });
  };
  
  collaborationService.onCursorUpdate = (cursor: CursorUpdate) => {
    set({
      participants: get().participants.map(p => 
        p.user_id === cursor.user_id 
          ? { ...p, cursor_position: cursor.cursor_position }
          : p
      )
    });
  };
  
  // Phase 2: Setup presence service callbacks
  presenceService.onPresenceUpdate((presences) => {
    set({ presences });
    
    // Update typing users list
    const typingUsers = presences
      .filter(p => p.is_typing && p.user_id !== get().currentUser?.user_id)
      .map(p => p.user_name);
    set({ typingUsers });
  });
  
  // Phase 2: Setup chat service callbacks
  chatService.onMessage((message) => {
    const { chatMessages, showChat } = get();
    set({
      chatMessages: [...chatMessages, message],
      unreadMessageCount: showChat ? 0 : get().unreadMessageCount + 1
    });
  });
  
  return {
    // Initial state
    currentSession: null,
    isConnected: false,
    connectionStatus: 'disconnected',
    error: null,
    
    participants: [],
    currentUser: null,
    
    // Phase 2: Presence state
    presences: [],
    isPresenceEnabled: false,
    
    pendingOperations: [],
    operationHistory: [],
    
    snapshots: [],
    
    currentMindmapState: { nodes: [], edges: [] },
    
    // Phase 2: Chat state
    chatMessages: [],
    unreadMessageCount: 0,
    isTyping: false,
    typingUsers: [],
    
    showParticipants: false,
    showChat: false,
    isVoiceEnabled: false,
    isVideoEnabled: false,
    chatActiveTab: 'messages',

    // Actions
    createSession: async (sessionName: string, sessionType = 'private') => {
      try {
        set({ error: null });
        const session = await collaborationService.createSession(sessionName, sessionType);
        
        // Auto-join the created session
        await collaborationService.joinSession(session.id, 'facilitator');
        
        return session;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
        set({ error: errorMessage });
        throw error;
      }
    },

    
    joinSession: async (sessionId: string, role = 'participant') => {
      try {
        set({ error: null });
        await collaborationService.joinSession(sessionId, role);
        
        // Phase 2: Initialize presence and chat services
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await presenceService.initializePresence(sessionId, user.id);
          await chatService.initializeChat(sessionId);
          
          set({ isPresenceEnabled: true });
          
          // Load chat history
          get().loadChatHistory();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to join session';
        set({ error: errorMessage });
        throw error;
      }
    },

    
    leaveSession: async () => {
      try {
        await collaborationService.leaveSession();
        
        // Reset state
        set({
          currentSession: null,
          currentUser: null,
          participants: [],
          connectionStatus: 'disconnected',
          isConnected: false,
          pendingOperations: [],
          operationHistory: [],
          snapshots: [],
          currentMindmapState: { nodes: [], edges: [] }
        });
      } catch (error) {
        console.error('Error leaving session:', error);
      }
    },

    
    updateCursorPosition: (x: number, y: number) => {
      collaborationService.sendCursorUpdate(x, y);
    },

    
    addOperation: async (operation: Omit<MindmapOperation, 'id' | 'timestamp' | 'user_id' | 'session_id'>) => {
      try {
        // Add to pending operations locally
        set({
          pendingOperations: [...get().pendingOperations, operation as MindmapOperation]
        });
        
        // Send to collaboration service
        await collaborationService.sendOperation(operation);
        
        // Remove from pending operations
        set({
          pendingOperations: get().pendingOperations.filter(op => op !== operation)
        });
      } catch (error) {
        console.error('Error adding operation:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to add operation' });
      }
    },

    
    createSnapshot: async (snapshotName?: string, isAutoSave = false) => {
      try {
        const { currentMindmapState } = get();
        
        const snapshot = await collaborationService.createSnapshot(
          currentMindmapState,
          snapshotName,
          isAutoSave
        );
        
        set({
          snapshots: [snapshot, ...get().snapshots]
        });
      } catch (error) {
        console.error('Error creating snapshot:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to create snapshot' });
      }
    },

    
    updateMindmapState: (nodes: any[], edges: any[]) => {
      set({ currentMindmapState: { nodes, edges } });
    },

    // Phase 2: Presence actions
    updatePresencePosition: (x: number, y: number) => {
      presenceService.updateCursorPosition(x, y);
    },

    updateTypingStatus: (isTyping: boolean) => {
      presenceService.updateTypingStatus(isTyping);
      set({ isTyping });
    },

    updateCurrentTool: (tool: string) => {
      presenceService.updateCurrentTool(tool);
    },

    updateViewport: (x: number, y: number, zoom: number) => {
      presenceService.updateViewport(x, y, zoom);
    },

    // Phase 2: Chat actions
    sendChatMessage: async (content: string, replyToId?: string) => {
      try {
        const { currentSession } = get();
        if (!currentSession) throw new Error('No active session');
        
        const message = await chatService.sendMessage(currentSession.id, content, replyToId);
        if (message) {
          set({
            chatMessages: [...get().chatMessages, message]
          });
        }
      } catch (error) {
        console.error('Error sending chat message:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to send message' });
      }
    },

    loadChatHistory: async () => {
      try {
        const { currentSession } = get();
        if (!currentSession) return;
        
        const messages = await chatService.getChatHistory(currentSession.id);
        set({ chatMessages: messages });
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    },

    markMessagesAsRead: () => {
      set({ unreadMessageCount: 0 });
    },

    
    // UI actions
    setShowParticipants: (show: boolean) => set({ showParticipants: show }),
    setShowChat: (show: boolean) => {
      set({ showChat: show });
      if (show) {
        // Mark messages as read when chat is opened
        get().markMessagesAsRead();
      }
    },
    setVoiceEnabled: (enabled: boolean) => set({ isVoiceEnabled: enabled }),
    setVideoEnabled: (enabled: boolean) => set({ isVideoEnabled: enabled }),
    setChatActiveTab: (tab: 'messages' | 'voice' | 'video') => {
      set({ chatActiveTab: tab });
    },
    
    clearError: () => set({ error: null }),
    
    reset: () => {
      // Cleanup Phase 2 services
      presenceService.cleanup();
      chatService.cleanup();
      
      set({
        currentSession: null,
        isConnected: false,
        connectionStatus: 'disconnected',
        error: null,
        participants: [],
        currentUser: null,
        presences: [],
        isPresenceEnabled: false,
        pendingOperations: [],
        operationHistory: [],
        snapshots: [],
        currentMindmapState: { nodes: [], edges: [] },
        chatMessages: [],
        unreadMessageCount: 0,
        isTyping: false,
        typingUsers: [],
        showParticipants: false,
        showChat: false,
        isVoiceEnabled: false,
        isVideoEnabled: false,
        chatActiveTab: 'messages'
      });
    }
  };
}));