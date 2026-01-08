'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken, removeToken, hasToken } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!hasToken()) {
        setIsLoading(false);
        return;
      }

      try {
        await api.verifyToken();
        setIsAuthenticated(true);
      } catch (err) {
        removeToken();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await api.login(password);
      setToken(response.token);
      setIsAuthenticated(true);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}