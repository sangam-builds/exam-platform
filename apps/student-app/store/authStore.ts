import { create } from 'zustand';
import { User } from '@exam-platform/shared-types';
import { api, setStoredAuth, clearStoredAuth, getStoredUser } from '../lib/apiClient';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = getStoredUser();
      if (token && user) {
        api.setToken(token);
        set({ user, token, isAuthenticated: true, isLoading: false });
        return;
      }
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  login: (token: string, user: User) => {
    setStoredAuth(token, user);
    api.setToken(token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    clearStoredAuth();
    api.setToken(null);
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));
