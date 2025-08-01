// Collaborative Chat Component - Phase 2: Interactive Communication
// Real-time chat with backend-powered message processing and moderation

import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, Search, Pin, MoreVertical, Bot, Lightbulb, Reply, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { chatService, ChatMessage, ChatSuggestion } from '../../services/chatService';

interface CollaborativeChatProps {
  className?: string;
}

export const CollaborativeChat: React.FC<CollaborativeChatProps> = ({ className = '' }) => {
  const { 
    currentSession, 
    participants, 
    chatMessages, 
    typingUsers, 
    sendChatMessage, 
    updateTypingStatus 
  } = useCollaborationStore();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ChatSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Handle typing status
  const handleTyping = () => {
    updateTypingStatus(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 3000);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Get AI suggestions when messages change
  useEffect(() => {
    if (!currentSession?.id || chatMessages.length === 0) return;

    const getAISuggestions = async () => {
      try {
        const suggestions = await chatService.getAISuggestions(currentSession.id);
        setAiSuggestions(suggestions.slice(0, 3)); // Show top 3 suggestions
      } catch (error) {
        console.error('Error getting AI suggestions:', error);
      }
    };

    // Debounce suggestions
     const timeoutId = setTimeout(getAISuggestions, 1000);
     return () => clearTimeout(timeoutId);
   }, [chatMessages, currentSession?.id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentSession?.id || isLoading) return;

    setIsLoading(true);
    try {
      await sendChatMessage(newMessage.trim(), replyingTo?.id);
      setNewMessage('');
      setReplyingTo(null);
      updateTypingStatus(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAISuggestions = async () => {
    if (!currentSession?.id) return;

    try {
      const suggestions = await chatService.getAISuggestions(currentSession.id);
      setAiSuggestions(suggestions);
      if (suggestions.length > 0) {
        setShowSuggestions(true);
        setTimeout(() => setShowSuggestions(false), 15000);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  // Typing indicator component
  const TypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="px-4 py-2 text-sm text-gray-500 italic"
      >
        {typingUsers.length === 1 ? (
          <span>{typingUsers[0]} is typing...</span>
        ) : typingUsers.length === 2 ? (
          <span>{typingUsers[0]} and {typingUsers[1]} are typing...</span>
        ) : (
          <span>{typingUsers.length} people are typing...</span>
        )}
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="ml-1"
        >
          •••
        </motion.span>
      </motion.div>
    );
  };

  const toggleMessagePin = async (messageId: string, currentPinState: boolean) => {
    const success = await chatService.toggleMessagePin(messageId, !currentPinState);
    if (success) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, is_pinned: !currentPinState }
            : msg
        )
      );
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentSession?.id) return;
    
    const results = await chatService.searchMessages(currentSession.id, searchQuery);
    setMessages(results);
  };

  const clearSearch = async () => {
    setSearchQuery('');
    setShowSearch(false);
    if (currentSession?.id) {
      const history = await chatService.getChatHistory(currentSession.id);
      setMessages(history);
    }
  };

  const applySuggestion = (suggestion: ChatSuggestion) => {
    setNewMessage(suggestion.content);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };



  if (!currentSession) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 ${className}`}>
        Join a collaboration session to start chatting
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white border-l border-gray-200 ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">Team Chat</h3>
          <p className="text-sm text-gray-500">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className={`p-2 rounded-lg transition-colors ${
              showSuggestions
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Toggle AI Suggestions"
          >
            <Bot className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${
              showSearch 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Search Messages"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search messages..."
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Search
            </button>
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Reply Banner */}
      {replyingTo && (
        <div className="p-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-8 bg-blue-500 rounded"></div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Replying to {replyingTo.user_name}
              </p>
              <p className="text-sm text-blue-600 truncate max-w-xs">
                {replyingTo.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-blue-200 rounded"
          >
            <X className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message) => (
          <div key={message.id} className="group">
            {/* Message bubble */}
            <div className={`flex items-start space-x-3 ${
              message.message_type === 'ai_suggestion' ? 'bg-green-50 p-3 rounded-lg' : ''
            }`}>
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                style={{ backgroundColor: message.user_color }}
              >
                {message.message_type === 'ai_suggestion' ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  message.user_name[0]?.toUpperCase() || '?'
                )}
              </div>
              
              {/* Message content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {message.user_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                  {message.is_pinned && (
                    <Pin className="w-3 h-3 text-yellow-500" />
                  )}
                  {message.message_type === 'ai_suggestion' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      AI Suggestion
                    </span>
                  )}
                </div>
                
                {/* Enhanced content display */}
                <div className="text-sm text-gray-800">
                  {message.processed_content || message.message}
                  
                  {/* Sentiment indicator */}
                  {message.sentiment_score !== undefined && (
                    <div className="mt-1 text-xs text-gray-500">
                      Sentiment: {message.sentiment_score > 0.5 ? '😊' : message.sentiment_score < -0.5 ? '😔' : '😐'}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Message actions */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                <button
                  onClick={() => setReplyingTo(message)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Reply"
                >
                  <Reply className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  onClick={() => toggleMessagePin(message.id, message.is_pinned)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title={message.is_pinned ? 'Unpin' : 'Pin'}
                >
                  <Pin className={`w-3 h-3 ${
                    message.is_pinned ? 'text-yellow-500' : 'text-gray-500'
                  }`} />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <MoreVertical className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        <AnimatePresence>
          <TypingIndicator />
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* AI Suggestions Panel */}
      {showSuggestions && aiSuggestions.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-green-50">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">AI Suggestions</span>
            <button
              onClick={() => setShowSuggestions(false)}
              className="ml-auto p-1 hover:bg-green-200 rounded"
            >
              <X className="w-3 h-3 text-green-600" />
            </button>
          </div>
          <div className="space-y-2">
            {aiSuggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => applySuggestion(suggestion)}
                className="w-full text-left p-3 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-green-700 capitalize">
                    {suggestion.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-green-600">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-800">{suggestion.content}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <Smile className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeChat;