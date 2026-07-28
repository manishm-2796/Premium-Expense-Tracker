import React from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function SyncStatus() {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div 
      style={{
        padding: '0.4rem 0.85rem',
        borderRadius: '20px',
        fontSize: '0.78rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        backgroundColor: !isOnline ? 'rgba(239, 68, 68, 0.15)' : isSyncing ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
        color: !isOnline ? '#ef4444' : isSyncing ? '#f59e0b' : '#10b981',
        border: `1px solid ${!isOnline ? 'rgba(239, 68, 68, 0.3)' : isSyncing ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
        cursor: 'pointer'
      }}
      onClick={triggerSync}
      title="Click to trigger background sync"
    >
      {!isOnline ? (
        <>
          <WifiOff size={14} />
          <span>Offline ({pendingCount} pending)</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="spinner" size={14} />
          <span>Syncing {pendingCount} changes...</span>
        </>
      ) : (
        <>
          <CheckCircle2 size={14} />
          <span>All Synced</span>
        </>
      )}
    </div>
  );
}
