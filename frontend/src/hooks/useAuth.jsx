import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/api';
import { setToken, getToken, removeToken, setUser, getUser, removeUser } from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getToken();
    const storedUser = getUser();
    if (token && storedUser) {
      setUserState(storedUser);
    }
    setLoading(false);
  }, []);

  const extractErrorMessage = (err, fallback) => {
    const detail = err.response?.data?.detail;
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map(d => d.msg || JSON.stringify(d)).join(', ');
    return fallback;
  };

  const signup = async (email, password) => {
    try {
      setError(null);
      const response = await authService.signup(email, password);
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      setUserState(userData);
      
      return userData;
    } catch (err) {
      const message = extractErrorMessage(err, 'Signup failed');
      setError(message);
      throw new Error(message);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.login(email, password);
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      setUserState(userData);
      
      return userData;
    } catch (err) {
      const message = extractErrorMessage(err, 'Login failed');
      setError(message);
      throw new Error(message);
    }
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      const response = await authService.updateProfile(data);
      const updatedUser = response.data;
      
      setUser(updatedUser);
      setUserState(updatedUser);
      return updatedUser;
    } catch (err) {
      const message = extractErrorMessage(err, 'Update failed');
      setError(message);
      throw new Error(message);
    }
  };

  const socialLogin = async (providerData) => {
    try {
      setError(null);
      const response = await authService.socialLogin(providerData);
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      setUserState(userData);
      
      return userData;
    } catch (err) {
      const message = extractErrorMessage(err, 'Social sign-in failed');
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    removeToken();
    removeUser();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signup, login, socialLogin, logout, updateProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
