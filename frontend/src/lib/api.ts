import axios from 'axios';

// Ensure consistent base URL with /api prefix
const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_URL = baseURL; // Remove the automatic /api addition

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Log API requests in development
if (import.meta.env.DEV) {
  api.interceptors.request.use(request => {
    console.log('Request:', request.method?.toUpperCase(), request.url, request.data);
    return request;
  });
}

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;