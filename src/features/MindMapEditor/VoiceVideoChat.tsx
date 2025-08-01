// Voice/Video Chat Component - Phase 2: Interactive Communication
// WebRTC-based voice and video chat with backend signaling support

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, Settings, Users, Volume2, VolumeX } from 'lucide-react';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { webrtcService, PeerConnection } from '../../services/webrtcService';

interface VoiceVideoChatProps {
  className?: string;
}

export const VoiceVideoChat: React.FC<VoiceVideoChatProps> = ({ className = '' }) => {
  const { currentSession, participants, currentUser } = useCollaborationStore();
  const [isInCall, setIsInCall] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isWebRTCReady, setIsWebRTCReady] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());



  // Initialize WebRTC when session changes
  useEffect(() => {
    if (!currentSession?.id || !currentUser?.user_id) return;

    const initializeWebRTC = async () => {
      const success = await webrtcService.initializeWebRTC(currentSession.id, currentUser.user_id);
      if (success) {
        console.log('✅ WebRTC ready for session:', currentSession.id);
        setIsWebRTCReady(true);
      } else {
        console.error('❌ Failed to initialize WebRTC');
        setIsWebRTCReady(false);
      }
    };

    setIsWebRTCReady(false);
    initializeWebRTC();

    // Subscribe to peer updates
    const unsubscribePeers = webrtcService.onPeersUpdate((updatedPeers) => {
      setPeers(updatedPeers);
      
      // Update remote video elements
      updatedPeers.forEach(peer => {
        if (peer.stream) {
          const videoElement = remoteVideoRefs.current.get(peer.userId);
          if (videoElement && videoElement.srcObject !== peer.stream) {
            videoElement.srcObject = peer.stream;
          }
        }
      });
    });

    // Subscribe to audio level updates
    const unsubscribeAudio = webrtcService.onAudioLevel((level) => {
      setAudioLevel(level);
    });

    return () => {
      unsubscribePeers();
      unsubscribeAudio();
      webrtcService.cleanup();
    };
  }, [currentSession?.id, currentUser?.user_id]);

  // Update local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const joinCall = async () => {
    if (!currentSession?.id || !currentUser?.user_id || isInitializing) return;

    console.log('🎤 Attempting to join call...');
    setIsInitializing(true);
    try {
      // Start local media
      console.log('🎥 Starting local media...');
      const stream = await webrtcService.startLocalMedia(isVideoEnabled, isAudioEnabled);
      if (stream) {
        console.log('✅ Local media started successfully');
        setLocalStream(stream);
        
        // Join the call
        console.log('📞 Joining WebRTC call...');
        const success = await webrtcService.joinCall();
        if (success) {
          console.log('✅ Successfully joined call');
          setIsInCall(true);
        } else {
          console.error('❌ Failed to join call');
        }
      } else {
        console.error('❌ Failed to start local media');
      }
    } catch (error) {
      console.error('❌ Error joining call:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const leaveCall = async () => {
    setIsInCall(false);
    setLocalStream(null);
    setPeers([]);
    
    await webrtcService.leaveCall();
  };

  const toggleAudio = () => {
    console.log('🎤 Toggling audio...');
    const enabled = webrtcService.toggleAudio();
    console.log('🎤 Audio enabled:', enabled);
    setIsAudioEnabled(enabled);
  };

  const toggleVideo = () => {
    console.log('🎥 Toggling video...');
    const enabled = webrtcService.toggleVideo();
    console.log('🎥 Video enabled:', enabled);
    setIsVideoEnabled(enabled);
  };

  const startVideoCall = async () => {
    console.log('🎥 Starting video call...');
    
    if (!isWebRTCReady) {
      console.log('⏳ WebRTC not ready yet, please wait...');
      return;
    }
    
    if (!isInCall) {
      console.log('🎥 Not in call, enabling video and joining...');
      setIsVideoEnabled(true);
      await joinCall();
    } else {
      console.log('🎥 Already in call, toggling video...');
      toggleVideo();
    }
  };



  if (!currentSession) {
    return null;
  }

  return (
    <div className={`bg-white border-l border-gray-200 ${className}`}>
      {/* Voice/Video Controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Voice & Video</h3>
        
        {!isInCall ? (
          <div className="space-y-2">
            <button
              onClick={joinCall}
              disabled={isInitializing}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Phone className="w-4 h-4" />
              <span>{isInitializing ? 'Joining...' : 'Join Call'}</span>
            </button>
            
            <button
              onClick={startVideoCall}
              disabled={isInitializing}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Video className="w-4 h-4" />
              <span>{isInitializing ? 'Starting...' : 'Start Video Call'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAudio}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isAudioEnabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="text-sm">{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
              </button>
              
              <button
                onClick={toggleVideo}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isVideoEnabled
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span className="text-sm">{isVideoEnabled ? 'Stop Video' : 'Start Video'}</span>
              </button>
            </div>
            
            <button
              onClick={leaveCall}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Call</span>
            </button>
          </div>
        )}
      </div>

      {/* Local Video */}
      {isInCall && isVideoEnabled && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-32 bg-gray-900 rounded-lg object-cover"
            />
            
            {/* Audio Level Indicator */}
            {isAudioEnabled && (
              <div className="absolute bottom-2 right-2">
                <div className="flex items-end space-x-1 h-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 bg-green-500 rounded-t ${
                        audioLevel > (i + 1) * 0.2 ? 'opacity-100' : 'opacity-30'
                      }`}
                      style={{ height: `${(i + 1) * 20}%` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">You</p>
        </div>
      )}

      {/* Remote Videos */}
      {peers.map(peer => (
        <div key={peer.userId} className="p-4 border-b border-gray-200">
          <div className="relative">
            <video
              ref={el => {
                if (el) {
                  remoteVideoRefs.current.set(peer.userId, el);
                  if (peer.stream) {
                    el.srcObject = peer.stream;
                  }
                }
              }}
              autoPlay
              playsInline
              className="w-full h-32 bg-gray-900 rounded-lg object-cover"
            />
            
            {/* Peer status indicators */}
            <div className="absolute bottom-2 left-2 flex space-x-1">
              {peer.isAudioEnabled && (
                <div className="p-1 bg-gray-700 rounded text-white">
                  <Mic className="w-3 h-3" />
                </div>
              )}
              {peer.isVideoEnabled && (
                <div className="p-1 bg-gray-700 rounded text-white">
                  <Video className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{peer.userName}</p>
        </div>
      ))}

      {/* Participants List */}
      <div className="p-4">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>Participants ({participants.length})</span>
        </h4>
        <div className="space-y-2">
          {participants.map(participant => {
            const peer = peers.find(p => p.userId === participant.user_id);
            const isInCall = peer !== undefined;
            
            return (
              <div key={participant.user_id} className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: participant.color }}
                >
                  {participant.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <span className="text-sm text-gray-700 flex-1">
                  {participant.name || participant.email}
                  {participant.user_id === currentUser?.user_id && ' (You)'}
                </span>
                <div className="flex items-center space-x-1">
                  {isInCall && (
                    <>
                      {peer?.isAudioEnabled && <Mic className="w-3 h-3 text-green-600" />}
                      {peer?.isVideoEnabled && <Video className="w-3 h-3 text-blue-600" />}
                    </>
                  )}
                  <div className={`w-2 h-2 rounded-full ${
                    isInCall ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VoiceVideoChat;