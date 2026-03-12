

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: any | null;
  token: string | null;
  setAuth: (user: any, token: string) => void;
  logout: () => void;
  isHydrated: boolean;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    { 
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(); // Runs after localStorage is loaded
      }
    }
  )
);