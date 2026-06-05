'use client';
import { useState } from 'react';
import { useUser, useUpdateUser, useDeleteUser } from '@/hooks/useUser';
import { useCategories } from '@/hooks/useCategories';
import { useUIStore } from '@/stores/uiStore';
import { Card, CategoryChip, Toggle } from '@/components/ui';

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const SlidersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
);
const TagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const DatabaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

function SectionHead({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc?: string; color: string }) {
  return (
    <div className="ss-section-head">
      <div className="ss-section-icon" style={{ background: color + '1a', color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
    </div>
  );
}

function SettingRow({ label, sub, children, last }: { label: string; sub?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="ss-setting-row" style={last ? { borderBottom: 'none', paddingBottom: 0 } : {}}>
      <div>
        <div className="ss-setting-row__label">{label}</div>
        {sub && <div className="ss-setting-row__sub">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { data: user } = useUser();
  const { data: categories = [] } = useCategories();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { darkMode, toggleDark } = useUIStore();

  const [notif, setNotif] = useState({ a: true, b: true, c: false, d: true });
  const [currency, setCurrency] = useState(user?.currency ?? 'INR');
  const [importStatus, setImportStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCurrencyChange = async (c: string) => {
    setCurrency(c);
    await updateUser.mutateAsync({ currency: c });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setImportStatus('error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = (ev.target?.result as string).split('\n').filter(Boolean);
      setImportStatus(`${lines.length - 1} expenses ready to import`);
    };
    reader.readAsText(file);
  };

  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Profile card — full width */}
      <Card style={{ padding: '26px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--coral)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-head)', boxShadow: '0 4px 14px rgba(232,115,90,.35)' }}>
              {initials}
            </div>
            <div style={{ position: 'absolute', bottom: 1, right: 1, width: 18, height: 18, borderRadius: '50%', background: '#4CAF82', border: '2px solid var(--card-bg)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>{user?.name ?? '…'}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 3 }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#4CAF82', background: '#EAF7F0', padding: '3px 10px', borderRadius: 999 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Active account
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg)', padding: '3px 10px', borderRadius: 999 }}>
                {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'} {currency}
              </span>
            </div>
          </div>
          <button className="ss-btn-outline ss-btn-sm" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit profile
          </button>
        </div>
      </Card>

      {/* 2-column grid */}
      <div className="ss-settings-grid">

        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Preferences */}
          <Card style={{ padding: '22px 24px' }}>
            <SectionHead icon={<SlidersIcon />} title="Preferences" desc="Currency and display settings" color="#2A6FDB" />
            <SettingRow label="Currency" sub="Used across all expense displays">
              <select className="ss-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 14, cursor: 'pointer' }}
                value={currency} onChange={e => handleCurrencyChange(e.target.value)}>
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
            </SettingRow>
            <SettingRow label="Dark mode" sub="Toggle dark theme" last>
              <Toggle on={darkMode} onChange={toggleDark} />
            </SettingRow>
          </Card>

          {/* Notifications */}
          <Card style={{ padding: '22px 24px' }}>
            <SectionHead icon={<BellIcon />} title="Notifications" desc="Control what alerts you receive" color="#E8735A" />
            {([
              ['Budget alerts', 'Get notified when approaching limits', 'a'],
              ['Weekly report ready', 'Summary of your weekly spending', 'b'],
              ['Goal milestones', 'When you reach savings targets', 'c'],
              ['Daily limit reminders', 'Daily spending limit warnings', 'd'],
            ] as const).map(([label, sub, key], i, arr) => (
              <SettingRow key={key} label={label} sub={sub} last={i === arr.length - 1}>
                <Toggle on={notif[key]} onChange={v => setNotif(n => ({ ...n, [key]: v }))} />
              </SettingRow>
            ))}
          </Card>

        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Categories */}
          <Card style={{ padding: '22px 24px' }}>
            <SectionHead icon={<TagIcon />} title="Categories" desc="Manage your expense categories" color="#4CAF82" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categories.slice(0, 10).map(c => <CategoryChip key={c.id} category={c} size="md" />)}
              <button className="ss-btn-outline ss-btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add category
              </button>
            </div>
          </Card>

          {/* Data management */}
          <Card style={{ padding: '22px 24px' }}>
            <SectionHead icon={<DatabaseIcon />} title="Data management" desc="Export or import your expense data" color="#8B5CF6" />

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 10 }}>Export</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="ss-btn-outline ss-btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => window.print()}>
                  <DownloadIcon /> Export as PDF
                </button>
                <a className="ss-btn-outline ss-btn-sm" href="/api/expenses/export" download style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                  <DownloadIcon /> Export as CSV
                </a>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Import</div>
              <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>CSV with columns: Date, Merchant, Category, Amount, Type, Note</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <label>
                  <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
                  <span className="ss-btn-outline ss-btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <UploadIcon /> Choose CSV file
                  </span>
                </label>
                {importStatus === 'error' && (
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#E05252', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Please upload a .csv file
                  </span>
                )}
                {importStatus && importStatus !== 'error' && (
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#15803D', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {importStatus}
                  </span>
                )}
              </div>
              {importStatus && importStatus !== 'error' && (
                <button className="ss-btn-coral ss-btn-sm" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setImportStatus('')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Confirm import
                </button>
              )}
            </div>
          </Card>

        </div>
      </div>

      {/* Danger zone */}
      <Card style={{ padding: '20px 24px', border: '1px solid #F3C0C0', background: '#FFFAFA' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#C0504D', fontFamily: 'var(--font-head)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0504D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Danger zone
            </div>
            <div style={{ fontSize: 13, color: '#946464', marginTop: 3 }}>Permanently delete your account and all data. This cannot be undone.</div>
          </div>
          {!confirmDelete ? (
            <button className="ss-btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }} onClick={() => setConfirmDelete(true)}>
              <TrashIcon /> Delete account
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="ss-btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => deleteUser.mutate()}>
                <TrashIcon /> Yes, delete my account
              </button>
              <button className="ss-btn-outline ss-btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}
