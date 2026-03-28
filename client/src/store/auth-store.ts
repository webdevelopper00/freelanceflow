import { create } from 'zustand';
import type { User } from 'shared';
import { axiosInstance } from '../lib/axios';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    businessName?: string;
    currency: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

/** Coalesces concurrent checkAuth calls into a single request (e.g. React Strict Mode double-mount). */
let authCheckPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  login: async (email: string, password: string) => {
    const { data } = await axiosInstance.post<{ user: User }>('/api/auth/login', {
      email,
      password,
    });
    set({ user: data.user, isAuthenticated: true });
  },

  register: async (payload) => {
    const { data } = await axiosInstance.post<{ user: User }>('/api/auth/register', payload);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    await axiosInstance.post('/api/auth/logout');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    if (get().isInitialized) return;
    if (authCheckPromise) return authCheckPromise;

    authCheckPromise = (async () => {
      set({ isLoading: true });
      try {
        const { data } = await axiosInstance.get<{ user: User }>('/api/auth/me');
        set({ user: data.user, isAuthenticated: true });
      } catch {
        set({ user: null, isAuthenticated: false });
      } finally {
        set({ isLoading: false, isInitialized: true }); // Only set after auth check completes (success or failure)
        authCheckPromise = null;
      }
    })();

    return authCheckPromise;
  },
}));
