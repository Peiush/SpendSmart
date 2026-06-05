'use client';

const paths: Record<string, React.ReactNode> = {
  home:   <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
  list:   <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="3.5" cy="6" r="1.2" /><circle cx="3.5" cy="12" r="1.2" /><circle cx="3.5" cy="18" r="1.2" /></>,
  chart:  <><path d="M4 20V4" /><path d="M4 20h16" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12.5" y="7" width="3" height="10" rx="1" /><rect x="18" y="13" width="3" height="4" rx="1" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18" /><circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  gear:   <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18 6l-2 2M8 16l-2 2M18 18l-2-2M8 8 6 6" /></>,
};

export function NavIcon({ name, active }: { name: string; active: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
