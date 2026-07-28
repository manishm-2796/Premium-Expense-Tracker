import { useState, useEffect } from 'react';
import { syncQueueManager } from '../services/syncQueueManager';
import { offlineStorage } from '../db/offlineDB';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(syncQueueManager.isSyncing);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateStatus = async () => {
      const count = await offlineStorage.getUnsyncedCount();
      setPendingCount(count);
      setIsSyncing(syncQueueManager.isSyncing);
    };

    updateStatus();
    const unsubscribe = syncQueueManager.subscribe(updateStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const triggerSync = () => {
    syncQueueManager.processQueue();
  };

  return { isOnline, pendingCount, isSyncing, triggerSync };
}
