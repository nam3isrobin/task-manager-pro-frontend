import axios from 'axios';
import { getAccessToken, clearAccessToken } from '../utils/tokenStorage.js';

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || 'https://task-manager-pro-backend-0oog.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject Bearer token from in-memory store
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearAccessToken();
      try {
        sessionStorage.removeItem('taskmanager_auth_user_v1');
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
