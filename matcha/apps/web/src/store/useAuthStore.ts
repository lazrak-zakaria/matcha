

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: any | null;
  token: string | null;
  age: number | null;
  bio: string | null;
  gender: 'male' | 'female' | 'other' | null;
  userCity: string | null;
  userLocation: { latitude: number; longitude: number } | null;
  locationPermissionAsked: boolean;
  setAuth: (user: any, token: string) => void;
  setProfileDetails: (payload: { age?: number | null; bio?: string | null; gender?: 'male' | 'female' | 'other' | null }) => void;
  logout: () => void;
  isHydrated: boolean;
  setHydrated: () => void;
  setCity: (city: string) => void;
  setLocation: (location: { latitude: number; longitude: number } | null) => void;
  setLocationPermissionAsked: (asked: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      age: null,
      bio: null,
      gender: null,
      userCity: null,
      userLocation: null,
      locationPermissionAsked: false,
      isHydrated: false,
      setAuth: (user, token) => set({
        user,
        token,
        age: user?.age ?? null,
        bio: user?.bio ?? null,
        gender: user?.gender ?? null,
      }),
      setProfileDetails: ({ age, bio, gender }) => set((state) => ({
        age: age ?? state.age,
        bio: bio ?? state.bio,
        gender: gender ?? state.gender,
        user: {
          ...state.user,
          age: age ?? state.user?.age,
          bio: bio ?? state.user?.bio,
          gender: gender ?? state.user?.gender,
        },
      })),
      logout: () => set({
        user: null,
        token: null,
        age: null,
        bio: null,
        gender: null,
        userCity: null,
        userLocation: null,
      }),
      setHydrated: () => set({ isHydrated: true }),
      setCity: (city) => set({ userCity: city }),
      setLocation: (location) => set({ userLocation: location }),
      setLocationPermissionAsked: (asked) => set({ locationPermissionAsked: asked }),
    }),
    { 
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(); // Runs after localStorage is loaded
      }
    }
  )
);