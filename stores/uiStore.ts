'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense } from '@/types';

interface TweakValues {
  accent: string;
  heroBg: string;
  fontPair: 'Outfit' | 'Jakarta' | 'Sora';
  radius: number;
}

interface UIStore {
  darkMode: boolean;
  tweaks: TweakValues;
  editingExpense: Expense | null;
  toggleDark: () => void;
  setTweak: (key: keyof TweakValues, value: TweakValues[keyof TweakValues]) => void;
  openEditExpense: (expense: Expense) => void;
  closeEditExpense: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      darkMode: false,
      tweaks: { accent: '#E8735A', heroBg: '#1C1C2E', fontPair: 'Outfit', radius: 24 },
      editingExpense: null,
      toggleDark: () => set((s) => ({ darkMode: !s.darkMode })),
      setTweak: (key, value) =>
        set((s) => ({ tweaks: { ...s.tweaks, [key]: value } })),
      openEditExpense: (expense) => set({ editingExpense: expense }),
      closeEditExpense: () => set({ editingExpense: null }),
    }),
    { name: 'ss-ui', partialize: (s) => ({ darkMode: s.darkMode, tweaks: s.tweaks }) }
  )
);
