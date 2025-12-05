/**
 * Auth Service
 * Handles authentication operations
 */
import { apiClient } from './ApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  constructor() {
    this.baseUrl = '/api/auth';
  }

  // Login user
  async login(email, password) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/login`, {
        email,
        password
      });
      
      const { user, access_token } = response.data;
      
      // Store token
      await this.storeToken(access_token);
      
      return { success: true, user, token: access_token };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/register`, userData);
      
      const { user, access_token } = response.data;
      
      // Store token
      await this.storeToken(access_token);
      
      return { success: true, user, token: access_token };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      await apiClient.post(`${this.baseUrl}/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearToken();
    }
  }

  // Verify token
  async verifyToken(token) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.valid;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/me`);
      return response.data.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/profile`, profileData);
      return response.data;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/password-reset`, {
        email
      });
      return response.data;
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/password-reset/confirm`, {
        token,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  // Store token
  async storeToken(token) {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  // Get stored token
  async getStoredToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }

  // Clear stored token
  async clearToken() {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await this.getStoredToken();
      if (!token) return false;
      
      return await this.verifyToken(token);
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await apiClient.post(`${this.baseUrl}/refresh`);
      const { access_token } = response.data;
      
      await this.storeToken(access_token);
      return access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearToken();
      throw error;
    }
  }
}