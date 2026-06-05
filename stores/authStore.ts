'use client';
import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
}));

// Module-level getter for use in API fetch helpers (avoids hook rules)
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
