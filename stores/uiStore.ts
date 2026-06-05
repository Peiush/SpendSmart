'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TweakValues {
  accent: string;
  heroBg: string;
  fontPair: 'Outfit' | 'Jakarta' | 'Sora';
  radius: number;
}

interface UIStore {
  darkMode: boolean;
  tweaks: TweakValues;
  toggleDark: () => void;
  setTweak: (key: keyof TweakValues, value: TweakValues[keyof TweakValues]) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      darkMode: false,
      tweaks: { accent: '#E8735A', heroBg: '#1C1C2E', fontPair: 'Outfit', radius: 24 },
      toggleDark: () => set((s) => ({ darkMode: !s.darkMode })),
      setTweak: (key, value) =>
        set((s) => ({ tweaks: { ...s.tweaks, [key]: value } })),
    }),
    { name: 'ss-ui' }
  )
);
