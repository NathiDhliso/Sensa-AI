import { supabase } from '../lib/supabase';

export interface PeerConnection {
  id: string;
  userId: string;
  userName: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
  audioLevel: number;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left' | 'media-state-changed';
  from: string;
  to?: string;
  data: any;
  sessionId: string;
}

class WebRTCService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private realtimeChannel: any = null;
  private currentSessionId: string | null = null;
  private currentUserId: string | null = null;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioLevelCallbacks: ((level: number) => void)[] = [];
  private peerCallbacks: ((peers: PeerConnection[]) => void)[] = [];

  // ICE servers configuration
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  // Initialize WebRTC for a session
  async initializeWebRTC(sessionId: string, userId: string): Promise<boolean> {
    try {
      this.currentSessionId = sessionId;
      this.currentUserId = userId;

      // Setup signaling channel
      await this.setupSignalingChannel(sessionId);

      console.log('✅ WebRTC initialized for session:', sessionId);
      return true;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      return false;
    }
  }

  // Start local media (audio/video)
  async startLocalMedia(video: boolean = false, audio: boolean = true): Promise<MediaStream | null> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
        video: video ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Setup audio level monitoring
      if (audio) {
        this.setupAudioLevelMonitoring(this.localStream);
      }

      // Add local stream to all existing peer connections
      this.peerConnections.forEach(peer => {
        this.localStream?.getTracks().forEach(track => {
          peer.connection.addTrack(track, this.localStream!);
        });
      });

      console.log('✅ Local media started:', { video, audio });
      return this.localStream;
    } catch (error) {
      console.error('Error starting local media:', error);
      return null;
    }
  }

  // Stop local media
  stopLocalMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.audioAnalyser = null;
    }

    console.log('🛑 Local media stopped');
  }

  // Toggle audio
  toggleAudio(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.broadcastMediaStateChange();
      return audioTrack.enabled;
    }
    return false;
  }

  // Toggle video
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.broadcastMediaStateChange();
      return videoTrack.enabled;
    }
    return false;
  }

  // Join voice/video call
  async joinCall(): Promise<boolean> {
    if (!this.currentSessionId || !this.currentUserId) return false;

    try {
      // Notify other participants that user joined
      await this.sendSignalingMessage({
        type: 'user-joined',
        from: this.currentUserId,
        data: { userId: this.currentUserId },
        sessionId: this.currentSessionId
      });

      return true;
    } catch (error) {
      console.error('Error joining call:', error);
      return false;
    }
  }

  // Leave voice/video call
  async leaveCall(): Promise<void> {
    if (!this.currentSessionId || !this.currentUserId) return;

    try {
      // Notify other participants that user left
      await this.sendSignalingMessage({
        type: 'user-left',
        from: this.currentUserId,
        data: { userId: this.currentUserId },
        sessionId: this.currentSessionId
      });

      // Close all peer connections
      this.peerConnections.forEach(peer => {
        peer.connection.close();
      });
      this.peerConnections.clear();

      // Stop local media
      this.stopLocalMedia();

      console.log('👋 Left call');
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  }

  // Create peer connection
  private async createPeerConnection(userId: string, userName: string): Promise<PeerConnection> {
    const connection = new RTCPeerConnection({ iceServers: this.iceServers });
    
    const peer: PeerConnection = {
      id: `${userId}_${Date.now()}`,
      userId,
      userName,
      connection,
      audioLevel: 0,
      isVideoEnabled: false,
      isAudioEnabled: false
    };

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        connection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    connection.ontrack = (event) => {
      peer.stream = event.streams[0];
      this.notifyPeerCallbacks();
    };

    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          from: this.currentUserId!,
          to: userId,
          data: event.candidate,
          sessionId: this.currentSessionId!
        });
      }
    };

    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      console.log(`Peer ${userId} connection state:`, connection.connectionState);
      if (connection.connectionState === 'disconnected' || connection.connectionState === 'failed') {
        this.removePeerConnection(userId);
      }
    };

    this.peerConnections.set(userId, peer);
    return peer;
  }

  // Remove peer connection
  private removePeerConnection(userId: string) {
    const peer = this.peerConnections.get(userId);
    if (peer) {
      peer.connection.close();
      this.peerConnections.delete(userId);
      this.notifyPeerCallbacks();
    }
  }

  // Setup signaling channel
  private async setupSignalingChannel(sessionId: string): Promise<void> {
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
    }

    return new Promise((resolve, reject) => {
      this.realtimeChannel = supabase
        .channel(`webrtc_${sessionId}`)
        .on(
          'broadcast',
          { event: 'signaling' },
          (payload) => {
            this.handleSignalingMessage(payload.payload as SignalingMessage);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ WebRTC signaling channel ready');
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ WebRTC signaling channel failed:', status);
            reject(new Error(`Signaling channel failed: ${status}`));
          }
        });
    });
  }

  // Send signaling message
  private async sendSignalingMessage(message: SignalingMessage) {
    if (!this.realtimeChannel) return;

    await this.realtimeChannel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: message
    });
  }

  // Handle signaling messages
  private async handleSignalingMessage(message: SignalingMessage) {
    if (message.from === this.currentUserId) return; // Ignore own messages

    try {
      switch (message.type) {
        case 'user-joined':
          await this.handleUserJoined(message);
          break;
        case 'user-left':
          this.handleUserLeft(message);
          break;
        case 'offer':
          await this.handleOffer(message);
          break;
        case 'answer':
          await this.handleAnswer(message);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(message);
          break;
        case 'media-state-changed':
          this.handleMediaStateChange(message);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  // Handle user joined
  private async handleUserJoined(message: SignalingMessage) {
    const { userId } = message.data;
    if (this.peerConnections.has(userId)) return;

    // Create peer connection and send offer
    const peer = await this.createPeerConnection(userId, `User ${userId}`);
    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);

    await this.sendSignalingMessage({
      type: 'offer',
      from: this.currentUserId!,
      to: userId,
      data: offer,
      sessionId: this.currentSessionId!
    });
  }

  // Handle user left
  private handleUserLeft(message: SignalingMessage) {
    const { userId } = message.data;
    this.removePeerConnection(userId);
  }

  // Handle offer
  private async handleOffer(message: SignalingMessage) {
    const peer = await this.createPeerConnection(message.from, `User ${message.from}`);
    await peer.connection.setRemoteDescription(message.data);
    
    const answer = await peer.connection.createAnswer();
    await peer.connection.setLocalDescription(answer);

    await this.sendSignalingMessage({
      type: 'answer',
      from: this.currentUserId!,
      to: message.from,
      data: answer,
      sessionId: this.currentSessionId!
    });
  }

  // Handle answer
  private async handleAnswer(message: SignalingMessage) {
    const peer = this.peerConnections.get(message.from);
    if (peer) {
      await peer.connection.setRemoteDescription(message.data);
    }
  }

  // Handle ICE candidate
  private async handleIceCandidate(message: SignalingMessage) {
    const peer = this.peerConnections.get(message.from);
    if (peer) {
      await peer.connection.addIceCandidate(message.data);
    }
  }

  // Handle media state change
  private handleMediaStateChange(message: SignalingMessage) {
    const peer = this.peerConnections.get(message.from);
    if (peer) {
      peer.isAudioEnabled = message.data.isAudioEnabled;
      peer.isVideoEnabled = message.data.isVideoEnabled;
      this.notifyPeerCallbacks();
    }
  }

  // Broadcast media state change
  private async broadcastMediaStateChange() {
    if (!this.localStream || !this.currentSessionId || !this.currentUserId) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    const videoTrack = this.localStream.getVideoTracks()[0];

    await this.sendSignalingMessage({
      type: 'media-state-changed',
      from: this.currentUserId,
      data: {
        isAudioEnabled: audioTrack?.enabled || false,
        isVideoEnabled: videoTrack?.enabled || false
      },
      sessionId: this.currentSessionId
    });
  }

  // Setup audio level monitoring
  private setupAudioLevelMonitoring(stream: MediaStream) {
    try {
      this.audioContext = new AudioContext();
      this.audioAnalyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.audioAnalyser);

      this.audioAnalyser.fftSize = 256;
      const bufferLength = this.audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (!this.audioAnalyser) return;

        this.audioAnalyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const level = average / 255;

        this.audioLevelCallbacks.forEach(callback => {
          try {
            callback(level);
          } catch (error) {
            console.error('Error in audio level callback:', error);
          }
        });

        requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio level monitoring:', error);
    }
  }

  // Subscribe to audio level updates
  onAudioLevel(callback: (level: number) => void) {
    this.audioLevelCallbacks.push(callback);
    return () => {
      this.audioLevelCallbacks = this.audioLevelCallbacks.filter(cb => cb !== callback);
    };
  }

  // Subscribe to peer updates
  onPeersUpdate(callback: (peers: PeerConnection[]) => void) {
    this.peerCallbacks.push(callback);
    return () => {
      this.peerCallbacks = this.peerCallbacks.filter(cb => cb !== callback);
    };
  }

  // Notify peer callbacks
  private notifyPeerCallbacks() {
    const peers = Array.from(this.peerConnections.values());
    this.peerCallbacks.forEach(callback => {
      try {
        callback(peers);
      } catch (error) {
        console.error('Error in peer callback:', error);
      }
    });
  }

  // Get current peers
  getPeers(): PeerConnection[] {
    return Array.from(this.peerConnections.values());
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Check if audio is enabled
  isAudioEnabled(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack?.enabled || false;
  }

  // Check if video is enabled
  isVideoEnabled(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    return videoTrack?.enabled || false;
  }

  // Cleanup
  async cleanup() {
    await this.leaveCall();
    
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    this.audioLevelCallbacks = [];
    this.peerCallbacks = [];
    this.currentSessionId = null;
    this.currentUserId = null;

    console.log('🧹 WebRTC service cleaned up');
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
export default webrtcService;