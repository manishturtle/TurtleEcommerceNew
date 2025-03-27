'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { apiEndpoints, setAuthToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Initialize token from localStorage if available
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
    }
    checkAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await api.post(apiEndpoints.auth.login, credentials);
      
      // If token is returned from the API, store it
      if (response.data.token) {
        setToken(response.data.token);
        localStorage.setItem('auth_token', response.data.token);
        setAuthToken(response.data.token);
      }
      
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.post(apiEndpoints.auth.logout);
      
      // Clear token
      setToken(null);
      localStorage.removeItem('auth_token');
      setAuthToken(null);
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(apiEndpoints.auth.me);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      // Clear token on authentication failure
      setToken(null);
      localStorage.removeItem('auth_token');
      setAuthToken(null);
      
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        token,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
