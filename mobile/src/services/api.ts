import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncManager } from './syncManager';

const API_URL = 'http://localhost:8000';
const TOKEN_KEY = 'auth_token';
const CACHE_PREFIX = 'api_cache_';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
});

const getTokenFromStorage = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const setTokenToStorage = async (token: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

const removeTokenFromStorage = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

// Request interceptor to attach token
api.interceptors.request.use(async (config) => {
  try {
    const token = await getTokenFromStorage();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token:', error);
  }
  return config;
});

// Response interceptor for caching and offline queuing
api.interceptors.response.use(
  async (response) => {
    // Cache successful GET requests
    if (response.config.method?.toUpperCase() === 'GET' && response.config.url) {
      try {
        const cacheKey = CACHE_PREFIX + response.config.url;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
      } catch (e) {
        console.error('Failed to cache response', e);
      }
    }
    return response;
  },
  async (error) => {
    // If it's a network error (no response)
    if (!error.response && error.config) {
      console.log('Network error detected. Fallback to offline mode for:', error.config.url);
      
      const method = error.config.method?.toUpperCase();
      
      // If GET, return cached data
      if (method === 'GET') {
        try {
          const cacheKey = CACHE_PREFIX + error.config.url;
          const cachedDataStr = await AsyncStorage.getItem(cacheKey);
          if (cachedDataStr) {
            return Promise.resolve({ data: JSON.parse(cachedDataStr), status: 200, offline: true });
          }
        } catch (e) {
          console.error('Failed to retrieve cache', e);
        }
      }
      
      // If POST/PUT/DELETE, queue for later (except Auth routes)
      if ((method === 'POST' || method === 'PUT' || method === 'DELETE') && !error.config.url.includes('/auth/')) {
        await syncManager.enqueueTask({
          url: error.config.url,
          method: method as any,
          data: error.config.data ? JSON.parse(error.config.data) : undefined,
        });
        
        // Return a fake success response to keep the UI flowing
        return Promise.resolve({ data: { id: 'offline_' + Date.now(), success: true, offline: true }, status: 200, offline: true });
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  signup: (email: string, password: string) => api.post('/auth/signup', { email, password }),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: { currency?: string; daily_budget?: number; monthly_budget?: number }) => api.put('/auth/me', data),
  logout: async () => {
    await removeTokenFromStorage();
  },
  setToken: async (token: string) => {
    await setTokenToStorage(token);
  },
  getToken: async () => {
    return await getTokenFromStorage();
  }
};

export const categoryService = {
  getAll: () => api.get('/categories/'),
  create: (data: any) => api.post('/categories/', data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
};

export const transactionService = {
  getAll: (params?: any) => api.get('/transactions/', { params }),
  create: (data: any) => api.post('/transactions/', data),
  getSummary: (month?: string) => api.get('/transactions/dashboard/summary', { params: { month } }),
  getTrends: () => api.get('/transactions/analytics/trends'),
  exportCSV: () => api.get('/transactions/export-csv', { responseType: 'blob' }),
  scanReceipt: (formData: FormData) => api.post('/transactions/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const recurringService = {
  getAll: () => api.get('/recurring/'),
  create: (data: any) => api.post('/recurring/', data),
  update: (id: number, data: any) => api.put(`/recurring/${id}`, data),
  delete: (id: number) => api.delete(`/recurring/${id}`)
};

export const chatService = {
  sendMessage: (data: { message: string }) => api.post('/chat/', data)
};

export default api;
