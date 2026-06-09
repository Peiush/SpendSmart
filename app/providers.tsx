'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { SplashScreen } from '@/components/ui/SplashScreen';

const FONT_PAIRS: Record<string, { head: string; body: string }> = {
  Outfit:  { head: "'Outfit', sans-serif",           body: "'DM Sans', sans-serif" },
  Jakarta: { head: "'Plus Jakarta Sans', sans-serif", body: "'DM Sans', sans-serif" },
  Sora:    { head: "'Sora', sans-serif",              body: "'DM Sans', sans-serif" },
};

function hexToRgb(h: string) { const n = parseInt(h.replace('#',''),16); return [n>>16&255, n>>8&255, n&255]; }
function shade(h: string, amt: number) {
  const [r,g,b] = hexToRgb(h);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amt/100)*255)));
  return '#' + [f(r),f(g),f(b)].map(c => c.toString(16).padStart(2,'0')).join('');
}
function tintBg(h: string) {
  const [r,g,b] = hexToRgb(h);
  const mix = (c: number) => Math.round(c + (255-c)*0.9);
  return '#' + [mix(r),mix(g),mix(b)].map(c => c.toString(16).padStart(2,'0')).join('');
}

function ThemeSync() {
  const { darkMode, tweaks } = useUIStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--coral', tweaks.accent);
    root.style.setProperty('--coral-dark', shade(tweaks.accent, -16));
    root.style.setProperty('--coral-light', tintBg(tweaks.accent));
    root.style.setProperty('--dark-card', tweaks.heroBg);
    root.style.setProperty('--radius', tweaks.radius + 'px');
    const fp = FONT_PAIRS[tweaks.fontPair] ?? FONT_PAIRS.Outfit;
    root.style.setProperty('--font-head', fp.head);
    root.style.setProperty('--font-body', fp.body);
  }, [tweaks]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<QueryClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          gcTime: 5 * 60_000,
          retry: (count, err: unknown) => {
            if ((err as { status?: number })?.status === 401) return false;
            return count < 2;
          },
        },
      },
    });
  }

  return (
    <QueryClientProvider client={clientRef.current}>
      <ThemeSync />
      <SplashScreen />
      {children}
    </QueryClientProvider>
  );
}
