import { supabase } from '../lib/supabase';
import { useCollaborationStore } from '../stores/collaborationStore';

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  user_color: string;
  message: string;
  message_type: 'text' | 'system' | 'ai_suggestion' | 'voice_transcript';
  thread_id?: string;
  is_pinned: boolean;
  processed_content?: string;
  sentiment_score?: number;
  mentions?: string[];
  attachments?: any[];
  created_at: string;
  edited_at?: string;
}

export interface ChatSuggestion {
  id: string;
  type: 'question_response' | 'brainstorming' | 'clarification' | 'mindmap_specific' | 'resource' | 'general_help';
  content: string;
  confidence: number;
  context: {
    recent_messages: string[];
    mindmap_state?: any;
    user_context?: any;
  };
  created_at: string;
}

class ChatService {
  private realtimeChannel: any = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private suggestionCallbacks: ((suggestion: ChatSuggestion) => void)[] = [];

  // Initialize real-time chat for a session
  async initializeChat(sessionId: string) {
    if (this.realtimeChannel) {
      await this.cleanup();
    }

    // Subscribe to real-time chat messages
    this.realtimeChannel = supabase
      .channel(`chat_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            this.notifyMessageCallbacks(payload.new as ChatMessage);
          }
        }
      )
      .subscribe();

    console.log('✅ Chat initialized for session:', sessionId);
  }

  // Send a chat message
  async sendMessage(sessionId: string, content: string, replyToId?: string): Promise<ChatMessage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const collaborationStore = useCollaborationStore.getState();
      const currentParticipant = collaborationStore.participants.find(p => p.user_id === user.id);

      // Insert message into database
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          user_name: currentParticipant?.name || user.email?.split('@')[0] || 'Anonymous',
          user_color: currentParticipant?.color || '#3B82F6',
          message: content.trim(),
          message_type: 'text',
          thread_id: replyToId,
          is_pinned: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      // Trigger AI processing via Edge Function (async, don't await)
      this.processMessageWithAI(message.id, sessionId, content).catch(error => {
        console.error('Background AI processing failed:', error);
      });

      return message;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }

  // Get chat history for a session
  async getChatHistory(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }

      return messages || [];
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      return [];
    }
  }

  // Pin/unpin a message
  async toggleMessagePin(messageId: string, isPinned: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_pinned: isPinned })
        .eq('id', messageId);

      if (error) {
        console.error('Error toggling message pin:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleMessagePin:', error);
      return false;
    }
  }

  // Search messages
  async searchMessages(sessionId: string, query: string): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .textSearch('content', query)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching messages:', error);
        return [];
      }

      return messages || [];
    } catch (error) {
      console.error('Error in searchMessages:', error);
      return [];
    }
  }

  // Get AI suggestions for current context
  async getAISuggestions(sessionId: string, mindmapState?: any): Promise<ChatSuggestion[]> {
    try {
      // Get recent messages for context
      const recentMessages = await this.getChatHistory(sessionId, 10);
      
      const { data, error } = await supabase.functions.invoke('generate-chat-suggestion', {
        body: {
          session_id: sessionId,
          conversation_history: recentMessages.map(m => ({
            user_name: m.user_name,
            message: m.message,
            message_type: m.message_type,
            created_at: m.created_at
          })),
          mindmap_state: mindmapState || { nodes: [], edges: [] },
          user_message: recentMessages.length > 0 ? recentMessages[recentMessages.length - 1].message : ''
        }
      });

      if (error) {
        console.error('Error getting AI suggestions:', error);
        return [];
      }

      return data?.suggestions || [];
    } catch (error) {
      console.error('Error in getAISuggestions:', error);
      return [];
    }
  }

  // Process message with AI (background)
  private async processMessageWithAI(messageId: string, sessionId: string, content: string) {
    try {
      // Get current user and collaboration context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('User not authenticated, skipping AI processing');
        return;
      }

      const collaborationStore = useCollaborationStore.getState();
      const participants = collaborationStore.participants;
      const recentMessages = await this.getChatHistory(sessionId, 5);

      // Call Edge Function for AI processing with correct parameters
      const { error } = await supabase.functions.invoke('process-chat-message', {
        body: {
          message: content,
          session_id: sessionId,
          user_id: user.id,
          context: {
            participants: participants.map(p => ({ id: p.user_id, name: p.name })),
            recent_messages: recentMessages.map(m => ({ message: m.message, user_name: m.user_name })),
            mindmap_context: true
          }
        }
      });

      if (error) {
        console.error('Error processing message with AI:', error);
      }
    } catch (error) {
      console.error('Error in processMessageWithAI:', error);
    }
  }

  // Subscribe to new messages
  onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  // Subscribe to AI suggestions
  onSuggestion(callback: (suggestion: ChatSuggestion) => void) {
    this.suggestionCallbacks.push(callback);
    return () => {
      this.suggestionCallbacks = this.suggestionCallbacks.filter(cb => cb !== callback);
    };
  }

  // Notify message callbacks
  private notifyMessageCallbacks(message: ChatMessage) {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });
  }

  // Notify suggestion callbacks
  private notifySuggestionCallbacks(suggestion: ChatSuggestion) {
    this.suggestionCallbacks.forEach(callback => {
      try {
        callback(suggestion);
      } catch (error) {
        console.error('Error in suggestion callback:', error);
      }
    });
  }

  // Cleanup
  async cleanup() {
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.messageCallbacks = [];
    this.suggestionCallbacks = [];
    console.log('🧹 Chat service cleaned up');
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;