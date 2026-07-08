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
      const message = err.response?.data?.detail || 'Signup failed';
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
      const message = err.response?.data?.detail || 'Login failed';
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
    <AuthContext.Provider value={{ user, loading, error, signup, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
