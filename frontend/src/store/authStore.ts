import { create } from 'zustand';
import { User } from '@/types';
import api from '@/lib/api';
import { initSocket, disconnectSocket } from '@/lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: 'photographer' | 'guest') => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      
      if (!data.token) {
        throw new Error('No authentication token received');
      }

      localStorage.setItem('token', data.token);
      
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false
      });

      initSocket(data.token);
    } catch (error: any) {
      localStorage.removeItem('token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (name, email, password, role = 'guest') => {
    set({ isLoading: true });
    console.log('Starting registration for:', email);
    
    try {
      // Register the user
      await api.post('/api/auth/register', { 
        name, 
        email, 
        password, 
        role 
      });
      
      console.log('Registration successful, logging in...');

      // Log the user in
      const { data } = await api.post('/api/auth/login', { email, password });
      
      if (!data.token) {
        throw new Error('No authentication token received');
      }

      // Save token and update state
      localStorage.setItem('token', data.token);
      
      // Update state with user data
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false
      });

      // Initialize socket connection
      initSocket(data.token);
      
      console.log('Registration and login successful');
      
      // Return the user data for the component to handle navigation
      return data.user;
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Clear any partial state on error
      localStorage.removeItem('token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false 
      });
      
      // Handle specific error cases
      if (error.response) {
        const serverData = error.response.data || {};
        const errorMessage = serverData.message || 
                           (Array.isArray(serverData.errors) ? serverData.errors[0]?.msg : undefined) || 
                           error.message ||
                           'Registration failed. Please try again.';
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      isLoading: false 
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    console.log('checkAuth called, token exists:', !!token);
    
    if (!token) {
      set({ 
        user: null,
        token: null,
        isAuthenticated: false, 
        isLoading: false 
      });
      return;
    }

    // Set loading state while checking auth
    set(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('Verifying token with server...');
      const { data } = await api.get('/api/auth/me');
      
      if (data?.user) {
        console.log('User authenticated successfully:', data.user.email);
        const newState = { 
          user: data.user, 
          token: token,
          isAuthenticated: true,
          isLoading: false 
        };
        
        // Update state in a single call
        set(newState);
        
        // Initialize socket with the token
        initSocket(token);
      } else {
        throw new Error('No user data received');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      localStorage.removeItem('token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  }
}));