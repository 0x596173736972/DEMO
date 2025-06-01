import { create } from "zustand";
import { authApi } from "./api";
import type { AuthResponse } from "@shared/schema";

interface AuthState {
  user: AuthResponse["user"] | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, type?: "freemium" | "premium") => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    set({ user: response.user, isLoading: false });
  },

  register: async (email: string, password: string, name: string, type = "freemium") => {
    const response = await authApi.register(email, password, name, type);
    set({ user: response.user, isLoading: false });
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isLoading: false });
  },

  checkAuth: () => {
    const isAuthenticated = authApi.isAuthenticated();
    if (!isAuthenticated) {
      set({ user: null, isLoading: false });
      return;
    }

    // If we have a token but no user data, we could fetch it here
    // For now, we'll assume the user is authenticated if token exists
    set({ isLoading: false });
  },
}));

// Initialize auth check
useAuth.getState().checkAuth();
