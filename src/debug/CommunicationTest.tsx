// Debug component to test chat and voice/video functionality
import React, { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';
import { webrtcService } from '../services/webrtcService';
import { useCollaborationStore } from '../stores/collaborationStore';

export const CommunicationTest: React.FC = () => {
  const [chatStatus, setChatStatus] = useState<string>('Not initialized');
  const [webrtcStatus, setWebrtcStatus] = useState<string>('Not initialized');
  const [testMessage, setTestMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const { currentSession, currentUser } = useCollaborationStore();

  useEffect(() => {
    if (currentSession?.id) {
      testChatInitialization();
      testWebRTCInitialization();
    }
  }, [currentSession?.id]);

  const testChatInitialization = async () => {
    try {
      setChatStatus('Initializing...');
      await chatService.initializeChat(currentSession!.id);
      setChatStatus('✅ Chat initialized successfully');
    } catch (error) {
      setChatStatus(`❌ Chat initialization failed: ${error}`);
      setError(`Chat error: ${error}`);
    }
  };

  const testWebRTCInitialization = async () => {
    try {
      setWebrtcStatus('Initializing...');
      if (currentUser?.user_id) {
        const success = await webrtcService.initializeWebRTC(currentSession!.id, currentUser.user_id);
        setWebrtcStatus(success ? '✅ WebRTC initialized successfully' : '❌ WebRTC initialization failed');
      } else {
        setWebrtcStatus('❌ No current user found');
      }
    } catch (error) {
      setWebrtcStatus(`❌ WebRTC initialization failed: ${error}`);
      setError(`WebRTC error: ${error}`);
    }
  };

  const testSendMessage = async () => {
    if (!testMessage.trim() || !currentSession?.id) return;
    
    try {
      setError('');
      const message = await chatService.sendMessage(currentSession.id, testMessage);
      if (message) {
        setTestMessage('');
        setError('✅ Message sent successfully');
      } else {
        setError('❌ Failed to send message');
      }
    } catch (error) {
      setError(`❌ Send message error: ${error}`);
    }
  };

  const testMediaAccess = async () => {
    try {
      setError('');
      const stream = await webrtcService.startLocalMedia(false, true);
      if (stream) {
        setError('✅ Media access granted');
        // Stop the stream after test
        stream.getTracks().forEach(track => track.stop());
      } else {
        setError('❌ Media access denied');
      }
    } catch (error) {
      setError(`❌ Media access error: ${error}`);
    }
  };

  if (!currentSession) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please join a collaboration session first to test communication features.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Communication Features Test</h2>
      
      <div className="space-y-4">
        {/* Session Info */}
        <div className="p-3 bg-blue-50 rounded">
          <p><strong>Session ID:</strong> {currentSession.id}</p>
          <p><strong>User ID:</strong> {currentUser?.user_id || 'Not found'}</p>
        </div>

        {/* Chat Status */}
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Chat Service Status</h3>
          <p>{chatStatus}</p>
        </div>

        {/* WebRTC Status */}
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">WebRTC Service Status</h3>
          <p>{webrtcStatus}</p>
        </div>

        {/* Test Message */}
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Test Chat Message</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={testSendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>

        {/* Test Media Access */}
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Test Media Access</h3>
          <button
            onClick={testMediaAccess}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Microphone Access
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`p-3 rounded ${
            error.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationTest;