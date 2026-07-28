// IndexedDB Storage Abstraction for Offline Storage
const DB_NAME = 'ExpenseTrackerOfflineDB';
const DB_VERSION = 1;

class OfflineStorage {
  constructor() {
    self.indexedDB = self.indexedDB || self.mozIndexedDB || self.webkitIndexedDB || self.msIndexedDB;
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

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
    const db = await this.openDB();
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
  }

  async getUnsyncedCount() {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(['syncQueue'], 'readonly');
      const store = tx.objectStore('syncQueue');
      const index = store.index('status');
      const req = index.count('pending');

      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  }

  async getPendingItems() {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(['syncQueue'], 'readonly');
      const store = tx.objectStore('syncQueue');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async clearQueueItem(id) {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(['syncQueue'], 'readwrite');
      const store = tx.objectStore('syncQueue');
      store.delete(id);
      tx.oncomplete = () => resolve(true);
    });
  }
}

export const offlineStorage = new OfflineStorage();
