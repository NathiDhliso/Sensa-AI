import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Menu, X, Users, MessageCircle, Plus, Settings,
  Maximize2, Minimize2, RotateCcw, RotateCw, Save,
  Share2, Download, Upload, Mic, MicOff, Video,
  VideoOff, Phone, PhoneOff, Volume2, VolumeX,
  ZoomIn, ZoomOut, Move, Edit3, Trash2, Copy,
  MoreVertical, ChevronUp, ChevronDown, Smartphone
} from 'lucide-react';
import { useCollaborationStore } from '../../stores/collaborationStore';

interface MobileOptimizationProps {
  children: React.ReactNode;
  sessionId: string;
  onMenuToggle?: (isOpen: boolean) => void;
}

interface TouchGesture {
  type: 'tap' | 'double-tap' | 'long-press' | 'pinch' | 'pan' | 'swipe';
  startTime: number;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  scale?: number;
  velocity?: { x: number; y: number };
}

interface MobileToolbar {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  action: () => void;
  isActive?: boolean;
  badge?: number;
}

const MobileOptimization: React.FC<MobileOptimizationProps> = ({
  children,
  sessionId,
  onMenuToggle
}) => {
  const { participants, isConnected } = useCollaborationStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'participants' | 'chat' | 'tools'>('none');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [currentGesture, setCurrentGesture] = useState<TouchGesture | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Detect mobile device and orientation
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                            window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
      
      const isLandscape = window.innerWidth > window.innerHeight;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Handle virtual keyboard
  useEffect(() => {
    const handleViewportChange = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight);
      setKeyboardHeight(keyboardHeight);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
  }, []);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };

    // Detect double tap
    if (now - lastTapRef.current < 300) {
      handleDoubleTap(touch.clientX, touch.clientY);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }

    setCurrentGesture({
      type: 'tap',
      startTime: now,
      startPosition: { x: touch.clientX, y: touch.clientY },
      currentPosition: { x: touch.clientX, y: touch.clientY }
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!currentGesture || !touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Handle pinch zoom
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      setCurrentGesture(prev => prev ? {
        ...prev,
        type: 'pinch',
        scale: distance / 100 // Normalize scale
      } : null);
    }
    // Handle pan
    else if (distance > 10) {
      setCurrentGesture(prev => prev ? {
        ...prev,
        type: 'pan',
        currentPosition: { x: touch.clientX, y: touch.clientY }
      } : null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!currentGesture || !touchStartRef.current) return;

    const now = Date.now();
    const duration = now - currentGesture.startTime;
    
    // Long press detection
    if (duration > 500 && currentGesture.type === 'tap') {
      handleLongPress(currentGesture.startPosition.x, currentGesture.startPosition.y);
    }

    setCurrentGesture(null);
    touchStartRef.current = null;
  };

  const handleDoubleTap = (x: number, y: number) => {
    // Zoom in/out on double tap
    setZoom(prev => prev === 1 ? 2 : 1);
  };

  const handleLongPress = (x: number, y: number) => {
    // Show context menu on long press
    console.log('Long press detected at:', x, y);
  };

  const handlePanGesture = (info: PanInfo) => {
    if (currentGesture?.type === 'pan') {
      setPanOffset(prev => ({
        x: prev.x + info.delta.x,
        y: prev.y + info.delta.y
      }));
    }
  };

  const toggleMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    onMenuToggle?.(newState);
  };

  const togglePanel = (panel: typeof activePanel) => {
    setActivePanel(activePanel === panel ? 'none' : panel);
  };

  const mobileToolbars: MobileToolbar[] = [
    {
      id: 'participants',
      icon: Users,
      label: 'Participants',
      action: () => togglePanel('participants'),
      isActive: activePanel === 'participants',
      badge: participants.length
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Chat',
      action: () => togglePanel('chat'),
      isActive: activePanel === 'chat'
    },
    {
      id: 'add',
      icon: Plus,
      label: 'Add Node',
      action: () => console.log('Add node')
    },
    {
      id: 'voice',
      icon: isVoiceActive ? Mic : MicOff,
      label: 'Voice',
      action: () => setIsVoiceActive(!isVoiceActive),
      isActive: isVoiceActive
    },
    {
      id: 'video',
      icon: isVideoActive ? Video : VideoOff,
      label: 'Video',
      action: () => setIsVideoActive(!isVideoActive),
      isActive: isVideoActive
    },
    {
      id: 'tools',
      icon: MoreVertical,
      label: 'More',
      action: () => togglePanel('tools'),
      isActive: activePanel === 'tools'
    }
  ];

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gray-100"
      style={{ paddingBottom: keyboardHeight }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-3">
          <button
            onClick={toggleMenu}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Mobile Mode</span>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div
        className="pt-16 pb-20 h-full"
        style={{
          transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center center'
        }}
        drag={currentGesture?.type === 'pan'}
        onPan={handlePanGesture}
        dragConstraints={containerRef}
        dragElastic={0.1}
      >
        {children}
      </motion.div>

      {/* Mobile Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Collaboration Menu</h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Save className="w-5 h-5 text-blue-600" />
                      <span className="text-xs">Save</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Share2 className="w-5 h-5 text-green-600" />
                      <span className="text-xs">Share</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Download className="w-5 h-5 text-purple-600" />
                      <span className="text-xs">Export</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Upload className="w-5 h-5 text-orange-600" />
                      <span className="text-xs">Upload</span>
                    </button>
                  </div>
                </div>

                {/* Participants */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Participants ({participants.length})</h3>
                  <div className="space-y-2">
                    {participants.slice(0, 5).map((participant) => (
                      <div key={participant.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: participant.color }}
                        >
                          {(participant.name || participant.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {participant.name || participant.email}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">{participant.role}</div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          participant.is_online ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                    ))}
                    {participants.length > 5 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        +{participants.length - 5} more participants
                      </div>
                    )}
                  </div>
                </div>

                {/* Settings */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Settings</h3>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Touch Feedback</span>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Auto-save</span>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Notifications</span>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
        {/* Expandable toolbar */}
        <AnimatePresence>
          {isToolbarExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b bg-gray-50 overflow-hidden"
            >
              <div className="p-3 grid grid-cols-4 gap-2">
                <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-xs">Undo</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white">
                  <RotateCw className="w-4 h-4" />
                  <span className="text-xs">Redo</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white">
                  <Copy className="w-4 h-4" />
                  <span className="text-xs">Copy</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs">Delete</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main toolbar */}
        <div className="flex items-center justify-between p-2">
          <button
            onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isToolbarExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center gap-1">
            {mobileToolbars.map((tool) => (
              <button
                key={tool.id}
                onClick={tool.action}
                className={`relative p-2 rounded-lg transition-colors ${
                  tool.isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <tool.icon className="w-5 h-5" />
                {tool.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {tool.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="w-8" /> {/* Spacer for balance */}
        </div>
      </div>

      {/* Mobile Panels */}
      <AnimatePresence>
        {activePanel !== 'none' && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-xl z-30 max-h-80 overflow-y-auto"
          >
            <div className="p-4">
              {activePanel === 'participants' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Participants</h3>
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div key={participant.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: participant.color }}
                        >
                          {(participant.name || participant.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{participant.name || participant.email}</div>
                          <div className="text-sm text-gray-600 capitalize">{participant.role}</div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          participant.is_online ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activePanel === 'chat' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Chat</h3>
                  <div className="space-y-3 mb-4">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="text-sm font-medium">John Doe</div>
                      <div className="text-sm text-gray-600">Great collaboration so far!</div>
                      <div className="text-xs text-gray-500 mt-1">2 minutes ago</div>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-3">
                      <div className="text-sm font-medium">You</div>
                      <div className="text-sm text-gray-600">Thanks! Let's add more concepts.</div>
                      <div className="text-xs text-gray-500 mt-1">1 minute ago</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                      Send
                    </button>
                  </div>
                </div>
              )}
              
              {activePanel === 'tools' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tools</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Edit3 className="w-5 h-5" />
                      <span className="text-xs">Edit</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Move className="w-5 h-5" />
                      <span className="text-xs">Move</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Settings className="w-5 h-5" />
                      <span className="text-xs">Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch Feedback */}
      {currentGesture && (
        <div
          className="fixed w-8 h-8 bg-blue-500 bg-opacity-30 rounded-full pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: currentGesture.currentPosition.x,
            top: currentGesture.currentPosition.y
          }}
        />
      )}

      {/* Orientation Helper */}
      {orientation === 'portrait' && (
        <div className="fixed top-20 left-4 right-4 bg-blue-100 border border-blue-200 rounded-lg p-3 z-30">
          <div className="flex items-center gap-2 text-blue-700">
            <Smartphone className="w-4 h-4" />
            <span className="text-sm">Tip: Rotate to landscape for better collaboration experience</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileOptimization;