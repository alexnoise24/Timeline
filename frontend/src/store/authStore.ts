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

// Helper function to log auth state changes
const logAuthState = (action: string, state: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Auth Store] ${action}`, {
      hasToken: !!state.token,
      isAuthenticated: state.isAuthenticated,
      user: state.user ? 'User exists' : 'No user',
      isLoading: state.isLoading
    });
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: false, // Start as false, will be updated after checkAuth

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      
      if (!data.token) {
        throw new Error('No authentication token received');
      }

      // Save token to localStorage
      localStorage.setItem('token', data.token);
      
      // Update auth state
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false
      });
      
      // Initialize socket connection
      initSocket(data.token);
      
      // Auto-accept invite if there's a pending invite token
      const inviteToken = localStorage.getItem('inviteToken');
      if (inviteToken) {
        try {
          const res = await api.post('/api/invitations/accept-invite-token', { token: inviteToken });
          localStorage.removeItem('inviteToken');
          return res.data?.timelineId || null;
        } catch (error) {
          console.error('Failed to accept invite:', error);
          // Continue with normal login flow even if invite acceptance fails
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('Login error:', error);
      const serverData = error.response?.data;
      const errorMessage = error.message || 
                         serverData?.message || 
                         (Array.isArray(serverData?.errors) ? serverData.errors[0]?.msg : undefined) || 
                         'Login failed. Please check your credentials and try again.';
      set({ isLoading: false });
      throw new Error(errorMessage);
    }
  },

  register: async (name, email, password, role = 'guest') => {
    set({ isLoading: true });
    console.log('Starting registration for:', email);
    
    try {
      // First, check if user exists
      try {
        console.log('Checking if email exists...');
        await api.post('/api/auth/check-email', { email });
      } catch (error: any) {
        console.error('Email check failed:', error);
        if (error.response?.status === 409) {
          throw new Error('This email is already registered. Please use a different email or log in.');
        }
        throw new Error('Failed to check email availability. Please try again.');
      }

      console.log('Email available, proceeding with registration...');
      
      // 1. Register the user
      await api.post('/api/auth/register', { name, email, password, role });
      
      console.log('Registration successful, logging in...');

      // 2. Log the user in automatically
      const { data } = await api.post('/api/auth/login', { email, password });
      console.log('Login response received:', { hasToken: !!data.token, user: data.user?.email });

      if (!data.token) {
        throw new Error('No authentication token received');
      }

      // 3. Save token and update state
      localStorage.setItem('token', data.token);
      
      const newState = {
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false
      };
      
      // 4. Update state in a single call
      set(newState);
      
      // 5. Initialize socket connection
      initSocket(data.token);
      
      console.log('Registration and login successful, state updated:', {
        isAuthenticated: true,
        userEmail: data.user?.email
      });
      
      return data;
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
        const errorMessage = error.message || 
                           serverData.message || 
                           (Array.isArray(serverData.errors) ? serverData.errors[0]?.msg : undefined) || 
                           'Registration failed. Please try again.';
        throw new Error(errorMessage);
      }
      
      throw error;
    } finally {
      set(prev => ({ ...prev, isLoading: false }));
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    console.log('checkAuth called, token exists:', !!token);
    
    if (!token) {
      console.log('No token found, setting isAuthenticated to false');
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
        
        // Verify the state was set correctly
        console.log('Auth state after successful check:', {
          hasToken: !!token,
          isAuthenticated: true,
          userEmail: data.user.email
        });
      } else {
        console.warn('No user data received from /api/auth/me');
        throw new Error('No user data received');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false 
      });
      
      // If we're not already on the login page, redirect
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/login';
      }
    } finally {
      // Ensure loading is always set to false
      set(prev => ({ ...prev, isLoading: false }));
    }
  },
}));
