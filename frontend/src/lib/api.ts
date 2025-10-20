import axios from 'axios';

// Base URL without trailing slash
const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${baseURL}/api`, // All API calls will be prefixed with /api
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

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('Response:', response.status, response.config.url, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', {
        url: error.config.url,
        status: error.response.status,
        data: error.response.data,
        headers: error.config.headers
      });

      // Only handle 401 for non-login/register routes
      const isAuthRoute = ['/auth/login', '/auth/register', '/auth/check-email'].some(route => 
        error.config.url?.includes(route)
      );

      if (error.response.status === 401 && !isAuthRoute) {
        // Only clear token and redirect if we're not already on the login page
        if (!window.location.pathname.includes('login')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } else {
      console.error('Network/Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;