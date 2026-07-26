import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const SYNC_QUEUE_KEY = 'offline_sync_queue';

export interface SyncTask {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
}

export const syncManager = {
  // Add a task to the offline queue
  enqueueTask: async (task: Omit<SyncTask, 'id' | 'timestamp'>) => {
    try {
      const currentQueueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: SyncTask[] = currentQueueStr ? JSON.parse(currentQueueStr) : [];
      
      const newTask: SyncTask = {
        ...task,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now()
      };
      
      queue.push(newTask);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      console.log('Task queued for offline sync:', newTask);
    } catch (error) {
      console.error('Failed to enqueue sync task', error);
    }
  },

  // Process the queue when back online
  processQueue: async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    try {
      const currentQueueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (!currentQueueStr) return;
      
      const queue: SyncTask[] = JSON.parse(currentQueueStr);
      if (queue.length === 0) return;

      console.log(`Processing ${queue.length} offline tasks...`);
      const remainingQueue: SyncTask[] = [];

      for (const task of queue) {
        try {
          // Execute the saved request
          await api.request({
            url: task.url,
            method: task.method,
            data: task.data
          });
          console.log(`Successfully synced task: ${task.id}`);
        } catch (error) {
          console.error(`Failed to sync task ${task.id}, putting back in queue`, error);
          remainingQueue.push(task); // Keep in queue if it failed (e.g. 500 error)
        }
      }

      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
    } catch (error) {
      console.error('Error processing sync queue', error);
    }
  },

  // Setup background listener
  initNetworkListener: () => {
    return NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        syncManager.processQueue();
      }
    });
  }
};
