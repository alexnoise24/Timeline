import { create } from 'zustand';
import { User } from '@/types';
import api from '@/lib/api';
import { initSocket, disconnectSocket } from '@/lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>; // returns accepted timelineId if invite
  register: (name: string, email: string, password: string, role?: 'photographer' | 'guest') => Promise<string | null>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email, password) => {
  set({ isLoading: true });
  try {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true });
    initSocket(data.token);
    // Auto-accept invite if there's a pending invite token
    const inviteToken = localStorage.getItem('inviteToken');
    if (inviteToken) {
      try {
        const res = await api.post('/api/invitations/accept-invite-token', { token: inviteToken });
        localStorage.removeItem('inviteToken');
        return res.data?.timelineId || null;
      } catch (_) {
        // ignore and continue
      }
    }
    return null;
  } catch (error: any) {
    const serverData = error.response?.data;
    const firstValidation = Array.isArray(serverData?.errors) ? serverData.errors[0]?.msg : undefined;
    throw new Error(serverData?.message || firstValidation || 'Failed to sign in');
  } finally {
    set({ isLoading: false });
  }
},

  register: async (name, email, password, role = 'guest') => {
  try {
    const { data } = await api.post('/api/auth/register', {
      name,
      email,
      password,
      role
    });
    return data;
  } catch (error: any) {
    const serverData = error.response?.data;
    const firstValidation = Array.isArray(serverData?.errors) ? serverData.errors[0]?.msg : undefined;
    throw new Error(serverData?.message || firstValidation || 'Failed to register');
  }
},

  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    set({ isAuthenticated: false });
    return;
  }

  try {
    const { data } = await api.get('/api/auth/me');
    set({ user: data.user, isAuthenticated: true });
    initSocket(token);
  } catch (error) {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  }
},
}));
