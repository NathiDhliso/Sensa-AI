import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Volume2, MousePointer, Keyboard, X,
  Accessibility, RotateCcw, ZoomIn, ZoomOut,
  Mic, MicOff
} from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  voiceCommands: boolean;
  audioFeedback: boolean;
  focusIndicators: boolean;
  colorBlindSupport: boolean;
  magnification: number;
  speechRate: number;
  speechVolume: number;
  autoAnnounce: boolean;
  skipAnimations: boolean;
}

interface VoiceCommand {
  command: string;
  description: string;
  action: () => void;
  enabled: boolean;
}

interface AccessibilityFeaturesProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
  onVoiceCommand?: (command: string) => void;
}

const AccessibilityFeatures: React.FC<AccessibilityFeaturesProps> = ({
  onSettingsChange,
  onVoiceCommand
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    voiceCommands: false,
    audioFeedback: false,
    focusIndicators: true,
    colorBlindSupport: false,
    magnification: 1,
    speechRate: 1,
    speechVolume: 0.8,
    autoAnnounce: true,
    skipAnimations: false
  });
  
  const [showPanel, setShowPanel] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentFocus, setCurrentFocus] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const speechRecognition = useRef<any>(null);
  const focusableElements = useRef<HTMLElement[]>([]);
  const currentFocusIndex = useRef(0);
  const announcementQueue = useRef<string[]>([]);

  // Voice commands configuration
  const voiceCommands: VoiceCommand[] = [
    {
      command: 'add node',
      description: 'Add a new node to the mind map',
      action: () => announce('Adding new node'),
      enabled: settings.voiceCommands
    },
    {
      command: 'delete node',
      description: 'Delete the selected node',
      action: () => announce('Deleting selected node'),
      enabled: settings.voiceCommands
    },
    {
      command: 'zoom in',
      description: 'Zoom into the mind map',
      action: () => announce('Zooming in'),
      enabled: settings.voiceCommands
    },
    {
      command: 'zoom out',
      description: 'Zoom out of the mind map',
      action: () => announce('Zooming out'),
      enabled: settings.voiceCommands
    },
    {
      command: 'center view',
      description: 'Center the mind map view',
      action: () => announce('Centering view'),
      enabled: settings.voiceCommands
    },
    {
      command: 'save map',
      description: 'Save the current mind map',
      action: () => announce('Saving mind map'),
      enabled: settings.voiceCommands
    },
    {
      command: 'undo',
      description: 'Undo the last action',
      action: () => announce('Undoing last action'),
      enabled: settings.voiceCommands
    },
    {
      command: 'redo',
      description: 'Redo the last undone action',
      action: () => announce('Redoing action'),
      enabled: settings.voiceCommands
    }
  ];

  // Initialize accessibility features
  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applySettings(parsed);
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.current = window.speechSynthesis;
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = true;
      speechRecognition.current.interimResults = false;
      speechRecognition.current.lang = 'en-US';
      
      speechRecognition.current.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        handleVoiceCommand(command);
      };
      
      speechRecognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    // Update focusable elements
    updateFocusableElements();

    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
    };
  }, []);

  // Apply settings to DOM
  useEffect(() => {
    applySettings(settings);
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    onSettingsChange?.(settings);
  }, [settings]); // Removed onSettingsChange from dependencies to prevent infinite loops

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!settings.keyboardNavigation || !keyboardShortcuts) return;

      // Global shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'k':
            event.preventDefault();
            setShowPanel(true);
            announce('Accessibility panel opened');
            break;
          case '=':
          case '+':
            event.preventDefault();
            handleZoom(0.1);
            break;
          case '-':
            event.preventDefault();
            handleZoom(-0.1);
            break;
          case '0':
            event.preventDefault();
            setSettings(prev => ({ ...prev, magnification: 1 }));
            announce('Zoom reset to 100%');
            break;
        }
      }

      // Navigation shortcuts
      switch (event.key) {
        case 'Tab':
          if (event.shiftKey) {
            navigateFocus(-1);
          } else {
            navigateFocus(1);
          }
          break;
        case 'Escape':
          setShowPanel(false);
          announce('Panel closed');
          break;
        case 'F1':
          event.preventDefault();
          announceHelp();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigation, keyboardShortcuts]);

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (newSettings.largeText) {
      root.style.fontSize = '1.2em';
    } else {
      root.style.fontSize = '';
    }
    
    // Reduced motion
    if (newSettings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
    }
    
    // Magnification
    root.style.setProperty('--zoom-level', newSettings.magnification.toString());
    
    // Focus indicators
    if (newSettings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
    
    // Color blind support
    if (newSettings.colorBlindSupport) {
      root.classList.add('colorblind-friendly');
    } else {
      root.classList.remove('colorblind-friendly');
    }
  };

  const updateFocusableElements = () => {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    focusableElements.current = Array.from(
      document.querySelectorAll(selectors.join(', '))
    ) as HTMLElement[];
  };

  const navigateFocus = (direction: number) => {
    updateFocusableElements();
    const elements = focusableElements.current;
    
    if (elements.length === 0) return;
    
    currentFocusIndex.current = Math.max(0, Math.min(
      elements.length - 1,
      currentFocusIndex.current + direction
    ));
    
    const element = elements[currentFocusIndex.current];
    element.focus();
    setCurrentFocus(element.id || element.tagName);
    
    if (settings.audioFeedback) {
      announce(`Focused on ${element.getAttribute('aria-label') || element.textContent || element.tagName}`);
    }
  };

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.screenReader && !settings.audioFeedback) return;
    
    setAnnouncements(prev => [...prev.slice(-4), message]);
    
    if (settings.audioFeedback && speechSynthesis.current) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = settings.speechRate;
      utterance.volume = settings.speechVolume;
      speechSynthesis.current.speak(utterance);
    }
    
    // Also announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [settings.screenReader, settings.audioFeedback, settings.speechRate, settings.speechVolume]);

  const handleVoiceCommand = (command: string) => {
    const matchedCommand = voiceCommands.find(vc => 
      command.includes(vc.command) && vc.enabled
    );
    
    if (matchedCommand) {
      matchedCommand.action();
      onVoiceCommand?.(command);
    } else {
      announce(`Command not recognized: ${command}`);
    }
  };

  const toggleVoiceRecognition = () => {
    if (!speechRecognition.current) {
      announce('Voice recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      speechRecognition.current.stop();
      setIsListening(false);
      announce('Voice recognition stopped');
    } else {
      speechRecognition.current.start();
      setIsListening(true);
      announce('Voice recognition started. Say a command.');
    }
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.5, Math.min(3, settings.magnification + delta));
    setSettings(prev => ({ ...prev, magnification: newZoom }));
    announce(`Zoom level: ${Math.round(newZoom * 100)}%`);
  };

  const announceHelp = () => {
    const helpText = `
      Accessibility help: 
      Press Ctrl+K to open accessibility panel.
      Press Ctrl+Plus to zoom in, Ctrl+Minus to zoom out.
      Press Tab to navigate between elements.
      Press F1 for this help message.
      Press Escape to close panels.
    `;
    announce(helpText, 'assertive');
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      voiceCommands: false,
      audioFeedback: false,
      focusIndicators: true,
      colorBlindSupport: false,
      magnification: 1,
      speechRate: 1,
      speechVolume: 0.8,
      autoAnnounce: true,
      skipAnimations: false
    };
    
    setSettings(defaultSettings);
    announce('Accessibility settings reset to defaults');
  };

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-300"
        aria-label="Open accessibility settings"
        title="Accessibility Settings (Ctrl+K)"
      >
        <Accessibility className="w-6 h-6" />
      </button>

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcements[announcements.length - 1]}
      </div>

      {/* Accessibility Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-labelledby="accessibility-title"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <Accessibility className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 id="accessibility-title" className="text-xl font-semibold">
                      Accessibility Settings
                    </h2>
                    <p className="text-sm text-gray-600">
                      Customize the interface for your needs
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close accessibility panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visual Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Visual
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span>High contrast mode</span>
                        <input
                          type="checkbox"
                          checked={settings.highContrast}
                          onChange={(e) => setSettings(prev => ({ ...prev, highContrast: e.target.checked }))}
                          className="rounded"
                          aria-describedby="high-contrast-desc"
                        />
                      </label>
                      <p id="high-contrast-desc" className="text-xs text-gray-600">
                        Increases contrast for better visibility
                      </p>
                      
                      <label className="flex items-center justify-between">
                        <span>Large text</span>
                        <input
                          type="checkbox"
                          checked={settings.largeText}
                          onChange={(e) => setSettings(prev => ({ ...prev, largeText: e.target.checked }))}
                          className="rounded"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span>Enhanced focus indicators</span>
                        <input
                          type="checkbox"
                          checked={settings.focusIndicators}
                          onChange={(e) => setSettings(prev => ({ ...prev, focusIndicators: e.target.checked }))}
                          className="rounded"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span>Color blind support</span>
                        <input
                          type="checkbox"
                          checked={settings.colorBlindSupport}
                          onChange={(e) => setSettings(prev => ({ ...prev, colorBlindSupport: e.target.checked }))}
                          className="rounded"
                        />
                      </label>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Magnification: {Math.round(settings.magnification * 100)}%
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleZoom(-0.1)}
                            className="p-1 border rounded hover:bg-gray-50"
                            aria-label="Zoom out"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={settings.magnification}
                            onChange={(e) => setSettings(prev => ({ ...prev, magnification: parseFloat(e.target.value) }))}
                            className="flex-1"
                            aria-label="Magnification level"
                          />
                          <button
                            onClick={() => handleZoom(0.1)}
                            className="p-1 border rounded hover:bg-gray-50"
                            aria-label="Zoom in"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Motion & Interaction */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <MousePointer className="w-5 h-5" />
                      Motion & Interaction
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span>Reduced motion</span>
                        <input
                          type="checkbox"
                          checked={settings.reducedMotion}
                          onChange={(e) => setSettings(prev => ({ ...prev, reducedMotion: e.target.checked }))}
                          className="rounded"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span>Skip animations</span>
                        <input
                          type="checkbox"
                          checked={settings.skipAnimations}
                          onChange={(e) => setSettings(prev => ({ ...prev, skipAnimations: e.target.checked }))}
                          className="rounded"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span>Keyboard navigation</span>
                        <input
                          type="checkbox"
                          checked={settings.keyboardNavigation}
                          onChange={(e) => setSettings(prev => ({ ...prev, keyboardNavigation: e.target.checked }))}
                          className="rounded"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span>Keyboard shortcuts</span>
                        <input
                          type="checkbox"
                          checked={keyboardShortcuts}
                          onChange={(e) => setKeyboardShortcuts(e.target.checked)}
                          className="rounded"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Audio Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Volume2 className="w-5 h-5" />
                      Audio
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span>Screen reader support</span>
                        <input
                          type="checkbox"
                          checked={settings.screenReader}
                          onChange={(e) => setSettings(prev => ({ ...prev, screenReader: e.target.checked }))}
                          className="rounded"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span>Audio feedback</span>
                        <input
                          type="checkbox"
                          checked={settings.audioFeedback}
                          onChange={(e) => setSettings(prev => ({ ...prev, audioFeedback: e.target.checked }))}
                          className="rounded"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between">
                        <span>Auto-announce changes</span>
                        <input
                          type="checkbox"
                          checked={settings.autoAnnounce}
                          onChange={(e) => setSettings(prev => ({ ...prev, autoAnnounce: e.target.checked }))}
                          className="rounded"
                        />
                      </label>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Speech rate: {settings.speechRate}x
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={settings.speechRate}
                          onChange={(e) => setSettings(prev => ({ ...prev, speechRate: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Speech volume: {Math.round(settings.speechVolume * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.speechVolume}
                          onChange={(e) => setSettings(prev => ({ ...prev, speechVolume: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Voice Commands */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Mic className="w-5 h-5" />
                      Voice Commands
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span>Enable voice commands</span>
                        <input
                          type="checkbox"
                          checked={settings.voiceCommands}
                          onChange={(e) => setSettings(prev => ({ ...prev, voiceCommands: e.target.checked }))}
                          className="rounded"
                        />
                      </label>
                      
                      {settings.voiceCommands && (
                        <div className="space-y-2">
                          <button
                            onClick={toggleVoiceRecognition}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              isListening 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {isListening ? (
                              <>
                                <MicOff className="w-4 h-4" />
                                Stop Listening
                              </>
                            ) : (
                              <>
                                <Mic className="w-4 h-4" />
                                Start Listening
                              </>
                            )}
                          </button>
                          
                          <div className="text-sm text-gray-600">
                            <p className="font-medium mb-1">Available commands:</p>
                            <ul className="space-y-1 text-xs">
                              {voiceCommands.slice(0, 4).map((cmd, index) => (
                                <li key={index} className="flex justify-between">
                                  <span>"{cmd.command}"</span>
                                  <span className="text-gray-500">{cmd.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts Reference */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Keyboard className="w-5 h-5" />
                    Keyboard Shortcuts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex justify-between py-1">
                        <span>Open accessibility panel</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+K</kbd>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Zoom in</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl++</kbd>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Zoom out</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+-</kbd>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between py-1">
                        <span>Reset zoom</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+0</kbd>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Navigate elements</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Tab</kbd>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Help</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F1</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
                <button
                  onClick={resetSettings}
                  className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Defaults
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={announceHelp}
                    className="px-3 py-2 text-sm border rounded-lg hover:bg-white transition-colors"
                  >
                    Help (F1)
                  </button>
                  <button
                    onClick={() => setShowPanel(false)}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for accessibility features */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
          
          .high-contrast {
            filter: contrast(150%) brightness(1.2);
          }
          
          .enhanced-focus *:focus {
            outline: 3px solid #3b82f6 !important;
            outline-offset: 2px !important;
          }
          
          .colorblind-friendly {
            --primary-color: #0066cc;
            --secondary-color: #ff6600;
            --success-color: #009900;
            --warning-color: #ffcc00;
            --error-color: #cc0000;
          }
          
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
          
          [data-zoom] {
            transform: scale(var(--zoom-level, 1));
            transform-origin: top left;
          }
        `
      }} />
    </>
  );
};

export default AccessibilityFeatures;