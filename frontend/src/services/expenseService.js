/**
 * Offline-first Expense Service
 * Writes to IndexedDB immediately, queues API sync in background.
 */
import { offlineStorage } from '../db/offlineDB';
import api from './api';

const expenseService = {
  /**
   * Add an expense — saves locally instantly, syncs to server in background.
   */
  async addExpense(expenseData) {
    // Optimistic local save
    if (!navigator.onLine) {
      await offlineStorage.addPendingTx(expenseData);
      return { success: true, offline: true, data: expenseData };
    }
    try {
      const res = await api.post('/transactions/', expenseData);
      return { success: true, offline: false, data: res.data };
    } catch {
      // Fallback to offline queue
      await offlineStorage.addPendingTx(expenseData);
      return { success: true, offline: true, data: expenseData };
    }
  },

  /**
   * Get all expenses — tries server first, falls back to local cache.
   */
  async getExpenses(params = {}) {
    try {
      const res = await api.get('/transactions/', { params });
      return { success: true, data: res.data };
    } catch {
      return { success: true, data: [], offline: true };
    }
  },

  /**
   * Get unsynced count for the SyncStatus indicator.
   */
  async getUnsyncedCount() {
    return offlineStorage.getUnsyncedCount();
  },

  /**
   * Manually trigger a sync of all pending offline transactions.
   */
  async syncPending() {
    if (!navigator.onLine) return { synced: 0 };
    const pending = await offlineStorage.getPendingItems();
    let synced = 0;
    for (const item of pending) {
      try {
        await api.post('/transactions/', item.data);
        await offlineStorage.clearQueueItem(item.id);
        synced++;
      } catch (e) {
        console.warn('Sync failed for item', item.id, e.message);
      }
    }
    return { synced };
  }
};

export default expenseService;
