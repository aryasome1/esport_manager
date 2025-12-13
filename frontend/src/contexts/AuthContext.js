/**
 * Auth Context
 * Provides authentication state and methods with Debugging Logs
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

  // Check auth on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        try {
          console.log('[AUTH] Verifying token...'); // [DEBUG]
          const response = await apiClient.get('/api/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
          console.log('[AUTH] Token verified, User loaded:', response.data.username); // [DEBUG]
        } catch (error) {
          console.log('[AUTH] Token invalid, clearing...'); // [DEBUG]
          await AsyncStorage.removeItem('auth_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('[AUTH] Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const register = async (userData) => {
    console.log('[AUTH] Registering user:', userData); // [DEBUG]
    try {
      setLoading(true);
      
      // Kirim Request ke Backend
      console.log('[AUTH] Sending API request to /api/auth/register...'); // [DEBUG]
      const response = await apiClient.post('/api/auth/register', userData);
      console.log('[AUTH] API Response received:', response.data); // [DEBUG]

      const { user: newUser, access_token } = response.data;
      
      // Simpan Token
      await AsyncStorage.setItem('auth_token', access_token);
      
      // Update State
      if (newUser) {
        console.log('[AUTH] Setting user state:', newUser); // [DEBUG]
        setUser(newUser);
      } else {
        // Fallback fetch /me jika user object kosong
        const me = await apiClient.get('/api/auth/me');
        setUser(me.data);
      }
      
      setIsAuthenticated(true);
      
      if (onLogin) onLogin(access_token);
      
      return { success: true };

    } catch (error) {
      console.error('[AUTH] Registration Exception:', error); // [DEBUG]
      
      let errorMessage = 'Registration failed';
      if (error?.data?.detail) {
        errorMessage = error.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      console.log('[AUTH] Error Message to user:', errorMessage); // [DEBUG]
      Alert.alert('Registration Error', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // LOGIN
  const login = async (email, password) => {
    console.log('[AUTH] Logging in:', email); // [DEBUG]
    try {
      setLoading(true);
      
      // Kirim Request
      const response = await apiClient.post('/api/auth/login', {
        email,
        password
      });
      console.log('[AUTH] Login Success'); // [DEBUG]

      const { access_token } = response.data;
      
      await AsyncStorage.setItem('auth_token', access_token);
      
      try {
        const me = await apiClient.get('/api/auth/me');
        setUser(me.data);
      } catch (e) {
        console.error('[AUTH] Failed to fetch profile after login', e);
        setUser(null);
      }
      
      setIsAuthenticated(true);
      if (onLogin) onLogin(access_token);
      
      return { success: true };
    } catch (error) {
      console.error('[AUTH] Login Failed:', error); // [DEBUG]
      
      let errorMessage = 'Login failed';
      if (error?.data?.detail) {
        errorMessage = error.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Error', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const logout = async () => {
    console.log('[AUTH] Logging out...'); // [DEBUG]
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('[AUTH] Logout API error (ignoring):', error);
    } finally {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      if (onLogout) onLogout();
    }
  };

  // UPDATE PROFILE
  const updateProfile = async (profileData) => {
    try {
      const response = await apiClient.put('/api/auth/me', profileData);
      setUser(prev => ({ ...prev, ...response.data }));
      return { success: true };
    } catch (error) {
      const errorMessage = error?.data?.detail || 'Profile update failed';
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