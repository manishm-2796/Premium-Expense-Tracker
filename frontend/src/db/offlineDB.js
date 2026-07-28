// IndexedDB Storage Abstraction for Offline Storage
const DB_NAME = 'ExpenseTrackerOfflineDB';
const DB_VERSION = 1;

class OfflineStorage {
  getIdb() {
    if (typeof window === 'undefined') return null;
    return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  }

  async openDB() {
    const idb = this.getIdb();
    if (!idb) return null;

    return new Promise((resolve, reject) => {
      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'localId', autoIncrement: true });
          txStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async addPendingTx(txData) {
    try {
      const db = await this.openDB();
      if (!db) return false;

      return new Promise((resolve, reject) => {
        const tx = db.transaction(['transactions', 'syncQueue'], 'readwrite');
        const txStore = tx.objectStore('transactions');
        const queueStore = tx.objectStore('syncQueue');

        const record = { ...txData, synced: false, createdAt: new Date().toISOString() };
        const req1 = txStore.add(record);

        req1.onsuccess = (e) => {
          const localId = e.target.result;
          queueStore.add({
            action: 'CREATE_TRANSACTION',
            localId,
            data: txData,
            status: 'pending',
            timestamp: new Date().toISOString()
          });
        };

        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.warn('IndexedDB write error:', e);
      return false;
    }
  }

  async getUnsyncedCount() {
    try {
      const db = await this.openDB();
      if (!db) return 0;

      return new Promise((resolve) => {
        const tx = db.transaction(['syncQueue'], 'readonly');
        const store = tx.objectStore('syncQueue');
        const index = store.index('status');
        const req = index.count('pending');

        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    } catch (e) {
      return 0;
    }
  }

  async getPendingItems() {
    try {
      const db = await this.openDB();
      if (!db) return [];

      return new Promise((resolve) => {
        const tx = db.transaction(['syncQueue'], 'readonly');
        const store = tx.objectStore('syncQueue');
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  async clearQueueItem(id) {
    try {
      const db = await this.openDB();
      if (!db) return true;

      return new Promise((resolve) => {
        const tx = db.transaction(['syncQueue'], 'readwrite');
        const store = tx.objectStore('syncQueue');
        store.delete(id);
        tx.oncomplete = () => resolve(true);
      });
    } catch (e) {
      return true;
    }
  }
}

export const offlineStorage = new OfflineStorage();
