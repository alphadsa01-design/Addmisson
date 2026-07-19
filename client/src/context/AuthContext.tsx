import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

export interface User {
  id: string;
  email: string;
  name: string;
  designation?: string;
  isVerified?: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async (): Promise<User | null> => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.status === 'success' && response.data.data?.user) {
        const currentUser = response.data.data.user;
        setUser(currentUser);
        return currentUser;
      } else {
        setUser(null);
        localStorage.removeItem('token');
        return null;
      }
    } catch (error) {
      setUser(null);
      localStorage.removeItem('token');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const verifyOtp = async (email: string, otp: string): Promise<User> => {
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      if (response.data?.status === 'success' && response.data?.data?.user) {
        const token = response.data.data.token;
        const loggedUser = response.data.data.user;
        if (token) {
          localStorage.setItem('token', token);
        }
        setUser(loggedUser);
        setLoading(false);
        return loggedUser;
      } else {
        throw new Error(response.data?.message || 'OTP verification failed');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'OTP verification failed';
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const localRes = await api.post('/auth/login', { email, password });
      if (localRes.data?.data?.token && localRes.data?.data?.user) {
        const token = localRes.data.data.token;
        const loggedUser = localRes.data.data.user;
        localStorage.setItem('token', token);
        setUser(loggedUser);
        setLoading(false);
        return;
      }
      throw new Error('Invalid email or password');
    } catch (error: any) {
      setUser(null);
      localStorage.removeItem('token');
      const errorMsg =
        typeof error === 'string'
          ? error
          : error.response?.data?.message || error.message || 'Login failed';
      throw errorMsg;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('token');
      await api.post('/auth/logout').catch(() => {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, logout, refreshUser }}>
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
