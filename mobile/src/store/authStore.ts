import { create } from "zustand";
import { authService } from "../services/authService";
import { apiClient } from "../lib/api/client";
import { User } from "../types";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user: User | null) => {
    set({ user });
  },

  initializeAuth: async () => {
    try {
      await apiClient.loadAuthToken();
      const user = await authService.loadStoredUser();
      if (user) {
        set({ user });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(email, password);

      if (!response.requiresTwoFactor) {
        set({
          user: response.user,
          isLoading: false,
        });
      }

      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  signup: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.signup({
        email,
        password,
        name,
      });

      set({
        user: response.user,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));
