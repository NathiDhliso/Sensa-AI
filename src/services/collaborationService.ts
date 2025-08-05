// Collaboration Service - Real-time WebSocket and Supabase integration
// Handles real-time communication, operational transforms, and session management

import { createClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Types for collaboration
export interface CollaborationSession {
  id: string;
  session_name: string;
  description?: string;
  epistemic_driver_id?: string;
  created_by: string;
  is_active: boolean;
  max_participants?: number;
  session_type: 'public' | 'private' | 'invite_only';
  expires_at?: string;
  session_settings?: any;
  created_at: string;
  updated_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  email?: string;
  name?: string;
  role: 'facilitator' | 'participant' | 'observer';
  color?: string;
  is_online: boolean;
  cursor_position?: { x: number; y: number };
  joined_at: string;
  last_seen: string;
  permissions?: any;
}

export interface MindmapOperation {
  id?: string;
  session_id: string;
  user_id: string;
  operation_type: 'add_node' | 'edit_node' | 'delete_node' | 'move_node' | 'add_edge' | 'edit_edge' | 'delete_edge' | 'batch_operation' | 'undo' | 'redo';
  operation_data: any;
  timestamp: string;
  applied: boolean;
  sequence_number?: number;
}

export interface MindmapSnapshot {
  id?: string;
  session_id: string;
  nodes_data: any[];
  edges_data: any[];
  created_by: string;
  snapshot_name?: string;
  is_checkpoint: boolean;
  operation_sequence: number;
  created_at: string;
}

export interface CursorUpdate {
  user_id: string;
  session_id: string;
  position: { x: number; y: number };
  timestamp: string;
}

// Operational Transform utilities
class OperationalTransform {
  // Transform operations to resolve conflicts
  static transformOperation(op1: MindmapOperation, op2: MindmapOperation): MindmapOperation {
    // Simple conflict resolution - later timestamp wins
    if (op1.timestamp > op2.timestamp) {
      return op1;
    }
    return op2;
  }

  // Apply operation to current state
  static applyOperation(currentState: { nodes: any[]; edges: any[] }, operation: MindmapOperation) {
    const { operation_type, operation_data } = operation;
    const newState = { ...currentState };

    switch (operation_type) {
      case 'add_node':
        newState.nodes = [...newState.nodes, operation_data];
        break;
      
      case 'edit_node':
        newState.nodes = newState.nodes.map(node => 
          node.id === operation_data.id ? { ...node, ...operation_data } : node
        );
        break;
      
      case 'delete_node':
        newState.nodes = newState.nodes.filter(node => node.id !== operation_data.id);
        // Also remove connected edges
        newState.edges = newState.edges.filter(edge => 
          edge.source !== operation_data.id && edge.target !== operation_data.id
        );
        break;
      
      case 'move_node':
        newState.nodes = newState.nodes.map(node => 
          node.id === operation_data.nodeId 
            ? { ...node, position: operation_data.position }
            : node
        );
        break;
      
      case 'add_edge':
        newState.edges = [...newState.edges, operation_data];
        break;
      
      case 'edit_edge':
        newState.edges = newState.edges.map(edge => 
          edge.id === operation_data.id ? { ...edge, ...operation_data } : edge
        );
        break;
      
      case 'delete_edge':
        newState.edges = newState.edges.filter(edge => edge.id !== operation_data.id);
        break;
    }

    return newState;
  }
}

// Main collaboration service class
export class CollaborationService {
  private static instance: CollaborationService;
  private realtimeChannel: RealtimeChannel | null = null;
  private currentSessionId: string | null = null;
  private operationQueue: MindmapOperation[] = [];
  private isProcessingQueue = false;
  private cursorThrottle: { [key: string]: number } = {};
  private readonly CURSOR_THROTTLE_MS = 100;
  private retryAttempts = 0;
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private retryTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;

  // Event callbacks
  public onSessionUpdate?: (session: CollaborationSession) => void;
  public onParticipantUpdate?: (participants: SessionParticipant[]) => void;
  public onOperationReceived?: (operation: MindmapOperation) => void;
  public onCursorUpdate?: (cursor: CursorUpdate) => void;
  public onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;
  public onError?: (error: string) => void;

  private constructor() {}

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  // Session Management
  async createSession(
    sessionName: string,
    sessionType: 'public' | 'private' | 'invite_only' = 'private',
    maxParticipants?: number
  ): Promise<CollaborationSession> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('collaboration_sessions')
        .insert({
          session_name: sessionName,
          created_by: user.id,
          session_type: sessionType,
          max_participants: maxParticipants,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async joinSession(sessionId: string, role: 'participant' | 'observer' = 'participant'): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.currentSessionId === sessionId) {
      console.log('🔄 Already connecting or connected to session:', sessionId);
      return;
    }

    try {
      this.isConnecting = true;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if session exists and is active
      const { data: session, error: sessionError } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found or inactive');
      }

      // Generate a random color for the user
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
      const userColor = colors[Math.floor(Math.random() * colors.length)];

      // Add or update participant (trigger is now fixed)
      const { error: participantError } = await supabase
        .from('session_participants')
        .upsert({
          session_id: sessionId,
          user_id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split('@')[0],
          role: role,
          color: userColor,
          is_online: true,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'session_id,user_id'
        });

      if (participantError) throw participantError;

      // Set up real-time connection
      await this.setupRealtimeConnection(sessionId);
      this.currentSessionId = sessionId;

      // Notify about the current session
      this.onSessionUpdate?.(session);
      
      this.onConnectionStatusChange?.('connected');
    } catch (error) {
      console.error('Error joining session:', error);
      this.onError?.(error instanceof Error ? error.message : 'Failed to join session');
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async leaveSession(): Promise<void> {
    try {
      if (!this.currentSessionId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update participant status
        await supabase
          .from('session_participants')
          .update({ 
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('session_id', this.currentSessionId)
          .eq('user_id', user.id);
      }

      // Clean up retry timeout
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }

      // Reset retry attempts and connection state
      this.retryAttempts = 0;
      this.isConnecting = false;

      // Clean up real-time connection
      if (this.realtimeChannel) {
        await supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }

      this.currentSessionId = null;
      this.onConnectionStatusChange?.('disconnected');
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  }

  // Real-time connection setup with retry logic
  private async setupRealtimeConnection(sessionId: string): Promise<void> {
    // Prevent multiple simultaneous setup attempts
    if (this.realtimeChannel && this.currentSessionId === sessionId && this.realtimeChannel.state === 'joined') {
      console.log('🔄 Real-time connection already active for session:', sessionId);
      return;
    }

    // Prevent setup during connection process
    if (this.isConnecting) {
      console.log('🔄 Connection already in progress, skipping setup');
      return;
    }

    try {
      this.onConnectionStatusChange?.('connecting');

      // Clear any existing retry timeout
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }

      // Remove existing channel if any
      if (this.realtimeChannel) {
        console.log('🧹 Cleaning up existing channel');
        await supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }

      // Create new channel with unique identifier
      const channelName = `session:${sessionId}:${Date.now()}`;
      console.log('📡 Creating new channel:', channelName);
      this.realtimeChannel = supabase.channel(channelName);

      // Listen to participant changes
      this.realtimeChannel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${sessionId}`
          },
          (payload: RealtimePostgresChangesPayload<SessionParticipant>) => {
            this.handleParticipantChange(payload);
          }
        )
        // Listen to operations
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mindmap_operations',
            filter: `session_id=eq.${sessionId}`
          },
          (payload: RealtimePostgresChangesPayload<MindmapOperation>) => {
            if (payload.new) {
              this.handleOperationReceived(payload.new);
            }
          }
        )
        // Listen to cursor updates (broadcast)
        .on('broadcast', { event: 'cursor_update' }, (payload) => {
          this.onCursorUpdate?.(payload.payload as CursorUpdate);
        })
        .subscribe((status) => {
          console.log('📡 Channel status changed:', status);
          if (status === 'SUBSCRIBED') {
            this.retryAttempts = 0; // Reset retry counter on success
            this.onConnectionStatusChange?.('connected');
            console.log('✅ Real-time connection established successfully');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Channel error occurred');
            this.handleConnectionError(sessionId);
          } else if (status === 'TIMED_OUT') {
            console.warn('⏰ Channel connection timed out');
            this.handleConnectionError(sessionId);
          } else if (status === 'CLOSED') {
            console.warn('🔌 Channel connection closed');
            // Only retry if we didn't intentionally close the connection
            if (this.currentSessionId === sessionId) {
              this.handleConnectionError(sessionId);
            }
          }
        });

      // Load initial participants
      await this.loadParticipants(sessionId);
    } catch (error) {
      console.error('Error setting up real-time connection:', error);
      this.handleConnectionError(sessionId);
    }
  }

  // Handle connection errors with retry logic
  private handleConnectionError(sessionId: string): void {
    // Don't retry if we're no longer connected to this session
    if (this.currentSessionId !== sessionId) {
      console.log('🚫 Skipping retry - session changed');
      return;
    }

    // Don't retry if already connecting
    if (this.isConnecting) {
      console.log('🚫 Skipping retry - already connecting');
      return;
    }

    this.onConnectionStatusChange?.('error');
    
    if (this.retryAttempts < this.MAX_RETRY_ATTEMPTS) {
      this.retryAttempts++;
      const retryDelay = Math.min(1000 * Math.pow(2, this.retryAttempts - 1), 10000); // Exponential backoff, max 10s
      
      console.log(`🔄 Retrying real-time connection (attempt ${this.retryAttempts}/${this.MAX_RETRY_ATTEMPTS}) in ${retryDelay}ms`);
      
      // Clear any existing timeout
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
      }
      
      this.retryTimeout = setTimeout(() => {
        // Double-check we're still on the same session before retrying
        if (this.currentSessionId === sessionId) {
          this.setupRealtimeConnection(sessionId).catch(error => {
            console.error('❌ Retry failed:', error);
          });
        } else {
          console.log('🚫 Session changed during retry, aborting');
        }
      }, retryDelay);
    } else {
      console.error('❌ Max retry attempts reached. Real-time connection failed.');
      this.onError?.('Real-time connection failed after multiple attempts. Some features may not work properly.');
      // Reset retry attempts for future connections
      this.retryAttempts = 0;
    }
  }

  // Load participants for a session
  private async loadParticipants(sessionId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      this.onParticipantUpdate?.(data || []);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  }

  // Handle participant changes
  private handleParticipantChange(payload: RealtimePostgresChangesPayload<SessionParticipant>): void {
    // Reload all participants when there's a change
    if (this.currentSessionId) {
      this.loadParticipants(this.currentSessionId);
    }
  }

  // Handle received operations
  private handleOperationReceived(operation: MindmapOperation): void {
    // Add to queue for processing
    this.operationQueue.push(operation);
    this.processOperationQueue();
  }

  // Process operation queue with conflict resolution
  private async processOperationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.operationQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    try {
      // Sort operations by timestamp
      this.operationQueue.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Process each operation
      while (this.operationQueue.length > 0) {
        const operation = this.operationQueue.shift()!;
        
        // Skip operations from current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user && operation.user_id === user.id) continue;
        
        // Apply operation
        this.onOperationReceived?.(operation);
        
        // Mark as applied
        await supabase
          .from('mindmap_operations')
          .update({ applied: true })
          .eq('id', operation.id!);
      }
    } catch (error) {
      console.error('Error processing operation queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Send operation
  async sendOperation(operation: Omit<MindmapOperation, 'id' | 'timestamp' | 'user_id' | 'session_id'>): Promise<void> {
    try {
      if (!this.currentSessionId) throw new Error('No active session');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('mindmap_operations')
        .insert({
          ...operation,
          session_id: this.currentSessionId,
          user_id: user.id,
          timestamp: new Date().toISOString(),
          applied: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending operation:', error);
      this.onError?.(error instanceof Error ? error.message : 'Failed to send operation');
    }
  }

  // Send cursor update
  async sendCursorUpdate(x: number, y: number): Promise<void> {
    try {
      if (!this.currentSessionId || !this.realtimeChannel) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Throttle cursor updates
      const now = Date.now();
      const lastUpdate = this.cursorThrottle[user.id] || 0;
      if (now - lastUpdate < this.CURSOR_THROTTLE_MS) return;
      
      this.cursorThrottle[user.id] = now;

      const cursorUpdate: CursorUpdate = {
        user_id: user.id,
        session_id: this.currentSessionId,
        position: { x, y },
        timestamp: new Date().toISOString()
      };

      await this.realtimeChannel.send({
        type: 'broadcast',
        event: 'cursor_update',
        payload: cursorUpdate
      });
    } catch (error) {
      console.error('Error sending cursor update:', error);
    }
  }

  // Create snapshot
  async createSnapshot(
    snapshotData: { nodes: any[]; edges: any[] },
    snapshotName?: string,
    isAutoSave = false
  ): Promise<MindmapSnapshot> {
    try {
      if (!this.currentSessionId) throw new Error('No active session');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('mindmap_snapshots')
        .insert({
          session_id: this.currentSessionId,
          nodes_data: snapshotData.nodes,
          edges_data: snapshotData.edges,
          created_by: user.id,
          snapshot_name: snapshotName,
          is_checkpoint: isAutoSave,
          operation_sequence: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }

  // Get session snapshots
  async getSnapshots(sessionId: string): Promise<MindmapSnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('mindmap_snapshots')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting snapshots:', error);
      return [];
    }
  }

  // Get current session
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // Check connection status
  isConnected(): boolean {
    return this.realtimeChannel?.state === 'joined';
  }
}

// Export singleton instance
export const collaborationService = CollaborationService.getInstance();
export default collaborationService;