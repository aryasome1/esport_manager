/**
 * Auth Context
 * Provides authentication state and methods
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/ApiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, onLogin, onLogout }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        try {
          // Verify token with server and load profile
          const response = await apiClient.get('/api/auth/me');
          // Backend returns the user object directly
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalid, clear it
          await AsyncStorage.removeItem('auth_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/api/auth/login', {
        email,
        password
      });

      const { access_token } = response.data;
      
      // Store token
      await AsyncStorage.setItem('auth_token', access_token);
      
      // Load current user profile using the new token
      try {
        const me = await apiClient.get('/api/auth/me');
        setUser(me.data);
      } catch (e) {
        // If fetching profile fails, keep user null but remain authenticated
        setUser(null);
      }
      setIsAuthenticated(true);
      
      // Call onLogin callback if provided
      if (onLogin) {
        onLogin(access_token);
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.data?.error ||
        (Array.isArray(error?.data) && error.data[0]?.msg) ||
        error.message ||
        'Login failed';
      Alert.alert('Login Error', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/api/auth/register', userData);

      const { user: newUser, access_token } = response.data;
      
      // Store token
      await AsyncStorage.setItem('auth_token', access_token);
      
      // Prefer using server-returned user if present; otherwise fetch /me
      if (newUser) {
        setUser(newUser);
      } else {
        try {
          const me = await apiClient.get('/api/auth/me');
          setUser(me.data);
        } catch (e) {
          setUser(null);
        }
      }
      setIsAuthenticated(true);
      
      // Call onLogin callback if provided
      if (onLogin) {
        onLogin(access_token);
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.data?.error ||
        (Array.isArray(error?.data) && error.data[0]?.msg) ||
        error.message ||
        'Registration failed';
      Alert.alert('Registration Error', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Call logout endpoint if needed
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      
      // Call onLogout callback if provided
      if (onLogout) {
        onLogout();
      }
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await apiClient.put('/api/auth/me', profileData);
      setUser(prev => ({ ...prev, ...response.data }));
      return { success: true };
    } catch (error) {
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.data?.error ||
        (Array.isArray(error?.data) && error.data[0]?.msg) ||
        error.message ||
        'Profile update failed';
      Alert.alert('Update Error', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};