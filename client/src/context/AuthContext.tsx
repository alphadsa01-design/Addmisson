import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { authClient } from '../auth';

export type Role = 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  designation?: string;
  lastLogin?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
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

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      let tokenFound = false;

      // 1. Direct local backend login
      try {
        const localRes = await api.post('/auth/login', { email, password });
        if (localRes.data?.data?.token && localRes.data?.data?.user) {
          localStorage.setItem('token', localRes.data.data.token);
          setUser(localRes.data.data.user);
          tokenFound = true;
        }
      } catch (localErr: any) {
        if (localErr.response?.status === 401 && localErr.response?.data?.message) {
          throw new Error(localErr.response.data.message);
        }
      }

      // 2. Neon Auth fallback if token not set directly
      if (!tokenFound) {
        try {
          const res = await authClient.signIn.email({ email, password });
          if (!res.error && res.data) {
            const neonToken =
              (res.data as any).token ||
              (res.data as any).session?.token ||
              (res.data as any).sessionToken;
            if (neonToken) {
              localStorage.setItem('token', neonToken);
              const currentUser = await refreshUser();
              if (currentUser) {
                tokenFound = true;
              }
            }
          }
        } catch (neonErr) {
          // Neon Auth unavailable
        }
      }

      if (!tokenFound) {
        throw new Error('Invalid email or password');
      }
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
      await authClient.signOut().catch(() => {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
