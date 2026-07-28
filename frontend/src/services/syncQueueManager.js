import { offlineStorage } from '../db/offlineDB';
import { transactionService } from './api';

class SyncQueueManager {
  constructor() {
    this.isSyncing = false;
    this.listeners = new Set();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  async queueAction(txData) {
    await offlineStorage.addPendingTx(txData);
    this.notify();
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;
    this.notify();

    try {
      const items = await offlineStorage.getPendingItems();
      for (const item of items) {
        if (item.action === 'CREATE_TRANSACTION') {
          try {
            await transactionService.create(item.data);
            await offlineStorage.clearQueueItem(item.id);
          } catch (err) {
            console.error('Failed to sync transaction item:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error processing sync queue:', err);
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }
}

export const syncQueueManager = new SyncQueueManager();
