import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add user ID to headers for role-based authorization
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          config.headers['X-User-Id'] = user.id.toString();
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Handle forbidden access (role-based authorization failure)
      const errorMessage = error.response?.data?.message || 'You do not have permission to access this resource';
      console.error('Access denied:', errorMessage);
      // Optionally redirect to dashboard or show error
      if (window.location.pathname !== '/dashboard') {
        // Only redirect if not already on dashboard to avoid loops
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
