import axios from 'axios';

// Base URL with /api prefix
const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '') + '/api';

// Always log the resolved base URL so we can verify it in production builds
console.log('[api] baseURL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Log all outgoing requests (dev and prod)
api.interceptors.request.use(request => {
  const fullUrl = (request.baseURL || '').replace(/\/+$/, '') + '/' + (request.url || '').replace(/^\/+/, '');
  console.log('[api] -->', request.method?.toUpperCase(), fullUrl);
  return request;
});

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
      const fullUrl = (error.config?.baseURL || '').replace(/\/+$/, '') + '/' + (error.config?.url || '').replace(/^\/+/, '');
      console.error('[api] <-- ERROR', {
        fullUrl,
        method: error.config?.method?.toUpperCase(),
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        message: error.message,
      });

      // Don't force-logout on 401 for routes where a 401 means "wrong password
      // for this specific action" rather than "session expired". The account
      // deletion endpoint returns 401 when the confirmation password is wrong —
      // that must surface in the modal, not bounce the user to /login.
      const skip401Redirect = ['/auth/login', '/auth/register', '/auth/check-email', '/users/account'].some(route =>
        error.config.url?.includes(route)
      );

      if (error.response.status === 401 && !skip401Redirect) {
        // Only clear token and redirect if we're not already on the login page
        if (!window.location.pathname.includes('login')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } else {
      // No response — network failure, CORS block, or wrong URL
      const fullUrl = (error.config?.baseURL || '').replace(/\/+$/, '') + '/' + (error.config?.url || '').replace(/^\/+/, '');
      console.error('[api] <-- NETWORK ERROR', {
        fullUrl,
        method: error.config?.method?.toUpperCase(),
        message: error.message,
        code: error.code,
      });
    }
    
    return Promise.reject(error);
  }
);

// Admin
export const getAdminUsers = () => api.get('/admin/users');
export const upgradeUserToPro = (userId: string) => api.post(`/admin/users/${userId}/upgrade-pro`);
export const getActivityLog = (params?: { eventType?: string; userId?: string; from?: string; to?: string }) =>
  api.get('/admin/activity', { params });

// Wedding mode analytics (fire-and-forget from frontend)
export const logWeddingMode = (timelineId: string, active: boolean) =>
  api.post(`/timelines/${timelineId}/wedding-mode`, { active }).catch(() => {});

export default api;