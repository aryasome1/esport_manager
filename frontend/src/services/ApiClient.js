import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  } else {
    // Untuk iOS dan Web
    return 'http://localhost:8000';
  }
};

console.log('API Base URL:', getBaseUrl()); // [DEBUG] Cek URL

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // Naikkan timeout jadi 15 detik
});

apiClient.interceptors.request.use(
  async (config) => {
    console.log(`[REQUEST] ${config.method.toUpperCase()} ${config.url}`, config.data); // [DEBUG]
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token:', error);
    }
    return config;
  },
  (error) => {
    console.error('[REQUEST ERROR]', error); // [DEBUG]
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[RESPONSE] ${response.status} ${response.config.url}`, response.data); // [DEBUG]
    return response;
  },
  async (error) => {
    if (error.response) {
      console.error('[RESPONSE ERROR] Data:', error.response.data); // [DEBUG]
      console.error('[RESPONSE ERROR] Status:', error.response.status); // [DEBUG]
      
      if (error.response.status === 401) {
        await AsyncStorage.removeItem('auth_token');
      }
      return Promise.reject(error.response);
    } else if (error.request) {
      console.error('[NETWORK ERROR] No response received', error.request); // [DEBUG]
      return Promise.reject({ 
        message: 'Network Error. Backend not reachable.',
        isNetworkError: true 
      });
    } else {
      console.error('[API CONFIG ERROR]', error.message); // [DEBUG]
      return Promise.reject(error);
    }
  }
);