'use client';
import { create } from 'zustand';
import type { User } from '@/types';

const TOKEN_KEY = 'ss_at';

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    if (exp * 1000 < Date.now()) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  accessToken: readStoredToken(),
  setAuth: (user, accessToken) => {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    set({ user, accessToken });
  },
  clearAuth: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    set({ user: null, accessToken: null });
  },
}));

// Module-level getter for use in API fetch helpers (avoids hook rules)
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
