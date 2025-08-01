// Presence Service - Phase 2: Enhanced Interaction
// Redis-based real-time presence tracking with cursor positions and user activity

import { supabase } from '../lib/supabase';
import { useCollaborationStore } from '../stores/collaborationStore';

export interface UserPresence {
  user_id: string;
  user_name: string;
  user_color: string;
  session_id: string;
  cursor_position?: { x: number; y: number };
  is_active: boolean;
  is_typing: boolean;
  last_seen: string;
  activity_status: 'online' | 'away' | 'idle';
  current_tool?: string;
  viewport?: { x: number; y: number; zoom: number };
}

export interface PresenceUpdate {
  type: 'cursor' | 'activity' | 'typing' | 'tool' | 'viewport';
  data: Partial<UserPresence>;
  timestamp: string;
}

class PresenceService {
  private realtimeChannel: any = null;
  private currentSessionId: string | null = null;
  private currentUserId: string | null = null;
  private presenceData: Map<string, UserPresence> = new Map();
  private presenceCallbacks: ((presences: UserPresence[]) => void)[] = [];
  
  // Throttling for cursor updates
  private cursorThrottle: { [key: string]: number } = {};
  private readonly CURSOR_THROTTLE_MS = 100;
  
  // Activity tracking
  private activityTimer: NodeJS.Timeout | null = null;
  private typingTimer: NodeJS.Timeout | null = null;
  private readonly IDLE_TIMEOUT_MS = 30000; // 30 seconds
  private readonly TYPING_TIMEOUT_MS = 3000; // 3 seconds
  
  // Initialize presence tracking for a session
  async initializePresence(sessionId: string, userId: string): Promise<boolean> {
    try {
      // Prevent duplicate initialization
      if (this.currentSessionId === sessionId && this.currentUserId === userId && this.realtimeChannel) {
        console.log('🔄 Presence already initialized for session:', sessionId);
        return true;
      }

      // Cleanup existing presence if switching sessions
      if (this.realtimeChannel) {
        await this.cleanup();
      }

      this.currentSessionId = sessionId;
      this.currentUserId = userId;
      
      // Setup real-time channel for presence
      await this.setupPresenceChannel(sessionId);
      
      // Join presence
      await this.joinPresence();
      
      // Start activity monitoring
      this.startActivityMonitoring();
      
      console.log('✅ Presence initialized for session:', sessionId);
      return true;
    } catch (error) {
      console.error('Error initializing presence:', error);
      return false;
    }
  }
  
  // Setup real-time presence channel
  private async setupPresenceChannel(sessionId: string) {
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
    }
    
    this.realtimeChannel = supabase
      .channel(`presence_${sessionId}`, {
        config: {
          presence: {
            key: this.currentUserId!,
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handlePresenceJoin(key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handlePresenceLeave(key, leftPresences);
      })
      .on('broadcast', { event: 'presence_update' }, (payload) => {
        this.handlePresenceUpdate(payload.payload as PresenceUpdate);
      })
      .subscribe();
  }
  
  // Join presence
  private async joinPresence() {
    if (!this.realtimeChannel || !this.currentUserId || !this.currentSessionId) return;
    
    const collaborationStore = useCollaborationStore.getState();
    const currentParticipant = collaborationStore.participants.find(p => p.user_id === this.currentUserId);
    
    const presenceData: UserPresence = {
      user_id: this.currentUserId,
      user_name: currentParticipant?.name || 'Anonymous',
      user_color: currentParticipant?.color || '#3B82F6',
      session_id: this.currentSessionId,
      is_active: true,
      is_typing: false,
      last_seen: new Date().toISOString(),
      activity_status: 'online',
    };
    
    await this.realtimeChannel.track(presenceData);
  }
  
  // Update cursor position with throttling
  updateCursorPosition(x: number, y: number) {
    if (!this.currentUserId || !this.realtimeChannel) return;
    
    const now = Date.now();
    const lastUpdate = this.cursorThrottle[this.currentUserId] || 0;
    
    if (now - lastUpdate < this.CURSOR_THROTTLE_MS) return;
    
    this.cursorThrottle[this.currentUserId] = now;
    
    this.broadcastPresenceUpdate({
      type: 'cursor',
      data: {
        cursor_position: { x, y },
        last_seen: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }
  
  // Update typing status
  updateTypingStatus(isTyping: boolean) {
    if (!this.currentUserId || !this.realtimeChannel) return;
    
    this.broadcastPresenceUpdate({
      type: 'typing',
      data: {
        is_typing: isTyping,
        last_seen: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
    
    // Auto-clear typing status after timeout
    if (isTyping) {
      if (this.typingTimer) clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.updateTypingStatus(false);
      }, this.TYPING_TIMEOUT_MS);
    }
  }
  
  // Update current tool
  updateCurrentTool(tool: string) {
    if (!this.currentUserId || !this.realtimeChannel) return;
    
    this.broadcastPresenceUpdate({
      type: 'tool',
      data: {
        current_tool: tool,
        last_seen: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }
  
  // Update viewport
  updateViewport(x: number, y: number, zoom: number) {
    if (!this.currentUserId || !this.realtimeChannel) return;
    
    this.broadcastPresenceUpdate({
      type: 'viewport',
      data: {
        viewport: { x, y, zoom },
        last_seen: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }
  
  // Broadcast presence update
  private async broadcastPresenceUpdate(update: PresenceUpdate) {
    if (!this.realtimeChannel) return;
    
    await this.realtimeChannel.send({
      type: 'broadcast',
      event: 'presence_update',
      payload: {
        ...update,
        user_id: this.currentUserId,
      },
    });
  }
  
  // Handle presence sync
  private handlePresenceSync() {
    if (!this.realtimeChannel) return;
    
    const state = this.realtimeChannel.presenceState();
    const presences: UserPresence[] = [];
    
    for (const userId in state) {
      const presence = state[userId][0] as UserPresence;
      if (presence) {
        this.presenceData.set(userId, presence);
        presences.push(presence);
      }
    }
    
    this.notifyPresenceCallbacks(presences);
  }
  
  // Handle presence join
  private handlePresenceJoin(key: string, newPresences: any[]) {
    const presence = newPresences[0] as UserPresence;
    if (presence) {
      this.presenceData.set(key, presence);
      this.notifyPresenceCallbacks(Array.from(this.presenceData.values()));
    }
  }
  
  // Handle presence leave
  private handlePresenceLeave(key: string, leftPresences: any[]) {
    this.presenceData.delete(key);
    this.notifyPresenceCallbacks(Array.from(this.presenceData.values()));
  }
  
  // Handle presence updates
  private handlePresenceUpdate(update: PresenceUpdate & { user_id: string }) {
    const existingPresence = this.presenceData.get(update.user_id);
    if (existingPresence) {
      const updatedPresence = {
        ...existingPresence,
        ...update.data,
      };
      this.presenceData.set(update.user_id, updatedPresence);
      this.notifyPresenceCallbacks(Array.from(this.presenceData.values()));
    }
  }
  
  // Start activity monitoring
  private startActivityMonitoring() {
    // Reset activity timer on user interaction
    const resetActivityTimer = () => {
      if (this.activityTimer) clearTimeout(this.activityTimer);
      
      // Update activity status to online
      this.broadcastPresenceUpdate({
        type: 'activity',
        data: {
          activity_status: 'online',
          is_active: true,
          last_seen: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
      
      // Set idle timer
      this.activityTimer = setTimeout(() => {
        this.broadcastPresenceUpdate({
          type: 'activity',
          data: {
            activity_status: 'idle',
            is_active: false,
            last_seen: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
      }, this.IDLE_TIMEOUT_MS);
    };
    
    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetActivityTimer, true);
    });
    
    // Initial activity
    resetActivityTimer();
  }
  
  // Get current presences
  getPresences(): UserPresence[] {
    return Array.from(this.presenceData.values());
  }
  
  // Subscribe to presence updates
  onPresenceUpdate(callback: (presences: UserPresence[]) => void) {
    this.presenceCallbacks.push(callback);
    return () => {
      const index = this.presenceCallbacks.indexOf(callback);
      if (index > -1) {
        this.presenceCallbacks.splice(index, 1);
      }
    };
  }
  
  // Notify presence callbacks
  private notifyPresenceCallbacks(presences: UserPresence[]) {
    this.presenceCallbacks.forEach(callback => {
      try {
        callback(presences);
      } catch (error) {
        console.error('Error in presence callback:', error);
      }
    });
  }
  
  // Leave presence
  async leavePresence() {
    if (this.realtimeChannel) {
      await this.realtimeChannel.untrack();
    }
  }
  
  // Cleanup
  async cleanup() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    
    await this.leavePresence();
    
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    
    this.presenceData.clear();
    this.presenceCallbacks = [];
    this.currentSessionId = null;
    this.currentUserId = null;
  }
}

export const presenceService = new PresenceService();
export default presenceService;