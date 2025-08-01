import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, Cloud, CloudOff, Download, Upload,
  RefreshCw, AlertCircle, CheckCircle, Clock, Database,
  Signal, SignalHigh, SignalLow, SignalZero,
  HardDrive, Upload as CloudUpload, X, Settings, Info, Zap
} from 'lucide-react';
import { useCollaborationStore } from '../../stores/collaborationStore';

interface OfflineData {
  id: string;
  type: 'mindmap' | 'operation' | 'message' | 'file';
  data: any;
  timestamp: number;
  sessionId: string;
  userId: string;
  synced: boolean;
  retryCount: number;
  lastRetry?: number;
}

interface SyncStatus {
  isOnline: boolean;
  isConnected: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  failedOperations: number;
  syncInProgress: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  estimatedSyncTime: number;
}

interface ConflictResolution {
  id: string;
  type: 'node' | 'edge' | 'property';
  localVersion: any;
  remoteVersion: any;
  timestamp: number;
  resolved: boolean;
  resolution?: 'local' | 'remote' | 'merge';
}

interface OfflineSyncProps {
  sessionId: string;
  onSyncComplete?: (success: boolean) => void;
  onConflictDetected?: (conflicts: ConflictResolution[]) => void;
}

const OfflineSync: React.FC<OfflineSyncProps> = ({
  sessionId,
  onSyncComplete,
  onConflictDetected
}) => {
  const { isConnected } = useCollaborationStore();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isConnected: false,
    lastSync: null,
    pendingOperations: 0,
    failedOperations: 0,
    syncInProgress: false,
    connectionQuality: 'offline',
    estimatedSyncTime: 0
  });
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(30); // seconds
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0 });
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTestRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (autoSync) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ 
        ...prev, 
        isOnline: false, 
        connectionQuality: 'offline' 
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync]);

  // Monitor connection quality
  useEffect(() => {
    const testConnection = async () => {
      if (!navigator.onLine) {
        setSyncStatus(prev => ({ ...prev, connectionQuality: 'offline' }));
        return;
      }

      try {
        const start = Date.now();
        const response = await fetch('/api/ping', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        const latency = Date.now() - start;

        let quality: SyncStatus['connectionQuality'];
        if (latency < 100) quality = 'excellent';
        else if (latency < 300) quality = 'good';
        else quality = 'poor';

        setSyncStatus(prev => ({ 
          ...prev, 
          connectionQuality: quality,
          isConnected: response.ok
        }));
      } catch (error) {
        setSyncStatus(prev => ({ 
          ...prev, 
          connectionQuality: 'offline',
          isConnected: false
        }));
      }
    };

    testConnection();
    connectionTestRef.current = setInterval(testConnection, 10000); // Test every 10 seconds

    return () => {
      if (connectionTestRef.current) {
        clearInterval(connectionTestRef.current);
      }
    };
  }, []);

  // Auto-sync interval
  useEffect(() => {
    if (autoSync && syncStatus.isOnline && syncStatus.isConnected) {
      syncIntervalRef.current = setInterval(() => {
        if (offlineData.filter(d => !d.synced).length > 0) {
          triggerSync();
        }
      }, syncInterval * 1000);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, syncStatus.isOnline, syncStatus.isConnected, syncInterval, offlineData]);

  // Load offline data from localStorage
  useEffect(() => {
    const loadOfflineData = () => {
      try {
        const stored = localStorage.getItem(`offline-data-${sessionId}`);
        if (stored) {
          const data = JSON.parse(stored);
          setOfflineData(data);
          setSyncStatus(prev => ({
            ...prev,
            pendingOperations: data.filter((d: OfflineData) => !d.synced).length,
            failedOperations: data.filter((d: OfflineData) => d.retryCount > 3).length
          }));
        }
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    };

    loadOfflineData();
    calculateStorageUsage();
  }, [sessionId]);

  // Save offline data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`offline-data-${sessionId}`, JSON.stringify(offlineData));
      calculateStorageUsage();
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, [offlineData, sessionId]);

  const calculateStorageUsage = () => {
    try {
      const used = new Blob([localStorage.getItem(`offline-data-${sessionId}`) || '']).size;
      const available = 5 * 1024 * 1024; // Assume 5MB limit
      setStorageUsage({ used, available });
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
    }
  };

  const addOfflineData = (type: OfflineData['type'], data: any) => {
    const newData: OfflineData = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      sessionId,
      userId: 'current-user', // Should come from auth
      synced: false,
      retryCount: 0
    };

    setOfflineData(prev => [...prev, newData]);
    setSyncStatus(prev => ({
      ...prev,
      pendingOperations: prev.pendingOperations + 1
    }));

    // Try to sync immediately if online
    if (syncStatus.isOnline && syncStatus.isConnected && autoSync) {
      setTimeout(() => triggerSync(), 1000);
    }
  };

  const triggerSync = async () => {
    if (syncStatus.syncInProgress || !syncStatus.isOnline || !syncStatus.isConnected) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      const unsyncedData = offlineData.filter(d => !d.synced && d.retryCount < 5);
      const estimatedTime = unsyncedData.length * 0.5; // 0.5 seconds per operation
      
      setSyncStatus(prev => ({ ...prev, estimatedSyncTime: estimatedTime }));

      for (const item of unsyncedData) {
        try {
          await syncSingleItem(item);
          
          setOfflineData(prev => 
            prev.map(d => 
              d.id === item.id 
                ? { ...d, synced: true, retryCount: 0 }
                : d
            )
          );
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
          
          setOfflineData(prev => 
            prev.map(d => 
              d.id === item.id 
                ? { ...d, retryCount: d.retryCount + 1, lastRetry: Date.now() }
                : d
            )
          );
        }
      }

      const finalUnsyncedCount = offlineData.filter(d => !d.synced).length;
      const failedCount = offlineData.filter(d => d.retryCount > 3).length;
      
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSync: new Date(),
        pendingOperations: finalUnsyncedCount,
        failedOperations: failedCount,
        estimatedSyncTime: 0
      }));

      onSyncComplete?.(failedCount === 0);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({ ...prev, syncInProgress: false, estimatedSyncTime: 0 }));
      onSyncComplete?.(false);
    }
  };

  const syncSingleItem = async (item: OfflineData): Promise<void> => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Network error'));
        }
      }, 500);
    });
  };

  const resolveConflict = (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    setConflicts(prev => 
      prev.map(c => 
        c.id === conflictId 
          ? { ...c, resolved: true, resolution }
          : c
      )
    );
  };

  const clearSyncedData = () => {
    setOfflineData(prev => prev.filter(d => !d.synced));
    setSyncStatus(prev => ({ ...prev, pendingOperations: prev.pendingOperations }));
  };

  const retryFailedOperations = () => {
    setOfflineData(prev => 
      prev.map(d => 
        d.retryCount > 3 
          ? { ...d, retryCount: 0, lastRetry: undefined }
          : d
      )
    );
    
    if (syncStatus.isOnline && syncStatus.isConnected) {
      triggerSync();
    }
  };

  const getConnectionIcon = () => {
    switch (syncStatus.connectionQuality) {
      case 'excellent': return <SignalHigh className="w-4 h-4 text-green-500" />;
      case 'good': return <Signal className="w-4 h-4 text-yellow-500" />;
      case 'poor': return <SignalLow className="w-4 h-4 text-orange-500" />;
      default: return <SignalZero className="w-4 h-4 text-red-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      {/* Sync Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowSyncPanel(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
            syncStatus.isOnline && syncStatus.isConnected
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          {getConnectionIcon()}
          {syncStatus.syncInProgress ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : syncStatus.isOnline && syncStatus.isConnected ? (
            <Cloud className="w-4 h-4" />
          ) : (
            <CloudOff className="w-4 h-4" />
          )}
          
          {syncStatus.pendingOperations > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              {syncStatus.pendingOperations}
            </span>
          )}
        </button>
      </div>

      {/* Offline Banner */}
      <AnimatePresence>
        {!syncStatus.isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 bg-orange-500 text-white p-3 z-40"
          >
            <div className="flex items-center justify-center gap-2">
              <WifiOff className="w-5 h-5" />
              <span className="font-medium">You're offline</span>
              <span className="text-orange-100">• Changes will sync when connection is restored</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Panel */}
      <AnimatePresence>
        {showSyncPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold">Offline Sync</h2>
                    <p className="text-sm text-gray-600">
                      Manage offline data and synchronization
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSyncPanel(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-96">
                {/* Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getConnectionIcon()}
                      <span className="font-medium">Connection</span>
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {syncStatus.connectionQuality}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CloudUpload className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Pending</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {syncStatus.pendingOperations} operations
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Last Sync</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {syncStatus.lastSync ? formatTimeAgo(syncStatus.lastSync.getTime()) : 'Never'}
                    </div>
                  </div>
                </div>

                {/* Sync Controls */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={triggerSync}
                    disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {syncStatus.syncInProgress ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {syncStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
                  </button>
                  
                  {syncStatus.failedOperations > 0 && (
                    <button
                      onClick={retryFailedOperations}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Failed ({syncStatus.failedOperations})
                    </button>
                  )}
                  
                  <button
                    onClick={clearSyncedData}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Database className="w-4 h-4" />
                    Clear Synced
                  </button>
                </div>

                {/* Settings */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Sync Settings
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Auto-sync when online</span>
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={(e) => setAutoSync(e.target.checked)}
                        className="rounded"
                      />
                    </label>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sync interval</span>
                      <select
                        value={syncInterval}
                        onChange={(e) => setSyncInterval(Number(e.target.value))}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value={10}>10 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={300}>5 minutes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Storage Usage */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    Storage Usage
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used: {formatBytes(storageUsage.used)}</span>
                      <span>Available: {formatBytes(storageUsage.available)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2 transition-all"
                        style={{ width: `${(storageUsage.used / storageUsage.available) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Offline Data List */}
                {offlineData.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Offline Data ({offlineData.length} items)</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {offlineData.slice(0, 10).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-white border rounded">
                          <div className="flex items-center gap-2">
                            {item.synced ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : item.retryCount > 3 ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-orange-500" />
                            )}
                            <div>
                              <div className="text-sm font-medium capitalize">{item.type}</div>
                              <div className="text-xs text-gray-500">
                                {formatTimeAgo(item.timestamp)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {item.retryCount > 0 && `Retries: ${item.retryCount}`}
                          </div>
                        </div>
                      ))}
                      
                      {offlineData.length > 10 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          +{offlineData.length - 10} more items
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conflicts */}
                {conflicts.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3 text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Sync Conflicts ({conflicts.filter(c => !c.resolved).length})
                    </h3>
                    <div className="space-y-3">
                      {conflicts.filter(c => !c.resolved).map((conflict) => (
                        <div key={conflict.id} className="border border-red-200 rounded-lg p-3">
                          <div className="font-medium text-sm mb-2">
                            {conflict.type} conflict detected
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => resolveConflict(conflict.id, 'local')}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Keep Local
                            </button>
                            <button
                              onClick={() => resolveConflict(conflict.id, 'remote')}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Keep Remote
                            </button>
                            <button
                              onClick={() => resolveConflict(conflict.id, 'merge')}
                              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              Merge
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {syncStatus.syncInProgress && (
                    <span>Syncing... {Math.round(syncStatus.estimatedSyncTime)}s remaining</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-sm border rounded-md hover:bg-white transition-colors flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Help
                  </button>
                  <button
                    onClick={() => setShowSyncPanel(false)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Hook for using offline sync in components
export const useOfflineSync = (sessionId: string) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addOfflineOperation = (type: string, data: any) => {
    if (!isOnline) {
      const operation = {
        id: `offline-${Date.now()}`,
        type,
        data,
        timestamp: Date.now(),
        sessionId,
        synced: false
      };
      
      const existing = JSON.parse(localStorage.getItem(`offline-data-${sessionId}`) || '[]');
      existing.push(operation);
      localStorage.setItem(`offline-data-${sessionId}`, JSON.stringify(existing));
      
      setPendingOperations(existing.filter((op: any) => !op.synced).length);
    }
  };

  return {
    isOnline,
    pendingOperations,
    addOfflineOperation
  };
};

export default OfflineSync;