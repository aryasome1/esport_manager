/**
 * API Client
 * Centralized HTTP client for API requests
 * Configured for PostgreSQL backend
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiClient {
  constructor() {
    // Backend configuration - use environment variable or default to localhost
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  // Get auth token from storage
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  // Handle unauthorized responses
  handleUnauthorized() {
    // In a real app, this would clear auth and redirect to login
    console.log('Unauthorized access detected');
  }

  // GET request
  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST request
  async post(url, data = {}, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT request
  async put(url, data = {}, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PATCH request
  async patch(url, data = {}, config = {}) {
    try {
      const response = await this.client.patch(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE request
  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'Server error',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - no response from server',
        status: 0,
        data: null
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'Unknown error',
        status: 0,
        data: null
      };
    }
  }
}

export const apiClient = new ApiClient();