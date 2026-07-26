import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

import { registerForPushNotificationsAsync } from '../services/notificationService';

type User = {
  id: number;
  email: string;
  currency?: string;
  push_token?: string;
};

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const setupNotifications = async (currentUser: User) => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token && token !== currentUser.push_token) {
        const response = await authService.updateMe({ push_token: token });
        setUser(response.data);
      }
    } catch (e) {
      console.log('Push setup failed', e);
    }
  };

  const checkAuth = async () => {
    try {
      const token = await authService.getToken();
      if (token) {
        const response = await authService.getMe();
        setUser(response.data);
        setupNotifications(response.data);
      }
    } catch (error) {
      console.error('Auth check failed', error);
      await authService.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    await authService.setToken(token);
    setUser(userData);
    setupNotifications(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
