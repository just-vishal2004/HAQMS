'use client';

import React, { createContext, useCallback, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const storedUser = localStorage.getItem('haqms_user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      console.error('Failed to parse user details from localStorage', e);
      localStorage.removeItem('haqms_user');
      localStorage.removeItem('haqms_token');
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('haqms_token');
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const logout = useCallback(() => {
    localStorage.removeItem('haqms_token');
    localStorage.removeItem('haqms_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const receivedToken = data.data.token;
      const receivedUser = data.data.user;

      localStorage.setItem('haqms_token', receivedToken);
      localStorage.setItem('haqms_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      router.push('/dashboard');
      return { success: true };
    } catch (err) {
      console.error('[AUTH-ERROR] Login request failed:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role = 'RECEPTIONIST') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return login(email, password);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, API_BASE_URL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
