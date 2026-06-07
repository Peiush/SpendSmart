'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NavIcon } from '@/components/layout/NavIcon';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@/hooks/useUser';
import { AddExpenseModal } from '@/components/modals/AddExpenseModal';
import { EditExpenseModal } from '@/components/modals/EditExpenseModal';

const NAV = [
  { key: 'dashboard', label: 'Home',     icon: 'home',   href: '/dashboard' },
  { key: 'expenses',  label: 'Expenses', icon: 'list',   href: '/expenses' },
  { key: 'reports',   label: 'Reports',  icon: 'chart',  href: '/reports' },
  { key: 'budgets',   label: 'Budgets',  icon: 'wallet', href: '/budgets' },
  { key: 'goals',     label: 'Goals',    icon: 'target', href: '/goals' },
  { key: 'settings',  label: 'Settings', icon: 'gear',   href: '/settings' },
];

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard', '/expenses': 'Expenses', '/reports': 'Reports',
  '/budgets': 'Budgets', '/goals': 'Savings Goals', '/settings': 'Settings',
};

const SunIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { darkMode, toggleDark, editingExpense, closeEditExpense } = useUIStore();
  const clearAuth = useAuthStore(s => s.clearAuth);
  const { data: user } = useUser();
  const [modal, setModal] = useState(false);

  const showFab = pathname === '/dashboard' || pathname === '/expenses';
  const title = TITLES[pathname] ?? 'SpendSmart';
  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="ss-app">
      {/* Sidebar — desktop */}
      <aside className="ss-sidebar">
        <div className="ss-brand">
          <div className="ss-logo">₹</div>
          <span className="ss-brand__name">SpendSmart</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 12 }}>
          {NAV.map(n => (
            <Link key={n.key} href={n.href} className={'ss-navitem ' + (pathname === n.href ? 'is-active' : '')}>
              <NavIcon name={n.icon} active={pathname === n.href} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="ss-side-foot">
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--coral)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontFamily: 'var(--font-head)', flexShrink: 0, fontSize: 13, boxShadow: '0 2px 8px rgba(232,115,90,.35)' }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? '…'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{user?.email ?? ''}</div>
          </div>
          <button className="ss-icon-btn" title="Sign out" onClick={handleLogout} style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0 }}>
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ss-main">
        <header className="ss-topbar">
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{title}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="ss-icon-btn" title={darkMode ? 'Light mode' : 'Dark mode'} onClick={toggleDark} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="ss-btn-coral ss-add-top" onClick={() => setModal(true)}>+ Add expense</button>
          </div>
        </header>
        <div className="ss-screen" key={pathname}>
          {children}
        </div>
      </main>

      {/* FAB — mobile */}
      {showFab && (
        <button className="ss-fab" onClick={() => setModal(true)} aria-label="Add expense">+</button>
      )}

      {/* Bottom nav — mobile */}
      <nav className="ss-bottomnav">
        {NAV.slice(0, 5).map(n => (
          <Link key={n.key} href={n.href} className={'ss-bn__item ' + (pathname === n.href ? 'is-active' : '')}>
            <NavIcon name={n.icon} active={pathname === n.href} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>

      <AddExpenseModal open={modal} onClose={() => setModal(false)} />
      <EditExpenseModal expense={editingExpense} onClose={closeEditExpense} />
    </div>
  );
}
