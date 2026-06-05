'use client';
import { useMounted } from '@/hooks/useMounted';
import type { Category } from '@/types';

/* ---- Card ---- */
export function Card({ children, style, className = '', hover = false, ...rest }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={'ss-card ' + (hover ? 'ss-card--hover ' : '') + className} style={style} {...rest}>
      {children}
    </div>
  );
}

/* ---- CategoryChip ---- */
export function CategoryChip({ category, size = 'sm' }: { category: Category; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? '3px 10px' : '5px 12px';
  const fs = size === 'sm' ? 12 : 13;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: category.tintHex, color: category.colorHex, padding: pad, borderRadius: 999, fontSize: fs, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
      <span style={{ fontSize: fs + 1 }}>{category.icon}</span>
      {category.short}
    </span>
  );
}

/* ---- IconDisc ---- */
export function IconDisc({ category, size = 48 }: { category: Category; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.34, background: category.tintHex, display: 'grid', placeItems: 'center', fontSize: size * 0.46, flexShrink: 0 }}>
      {category.icon}
    </div>
  );
}

/* ---- ProgressBar ---- */
export function ProgressBar({ pct, color, track = '#EFE7E0', height = 10, gradient }: { pct: number; color?: string; track?: string; height?: number; gradient?: string }) {
  const mounted = useMounted();
  return (
    <div style={{ width: '100%', height, background: track, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: mounted ? Math.min(100, pct) + '%' : '0%', background: gradient ?? color, borderRadius: 999, transition: 'width 1.1s cubic-bezier(.22,1,.36,1)' }} />
    </div>
  );
}

/* ---- Ring ---- */
export function Ring({ pct, size = 88, stroke = 9, color = 'var(--coral)', track = 'rgba(255,255,255,.18)', children }: { pct: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const mounted = useMounted();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - (mounted ? Math.min(100, pct) : 0) / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</div>
    </div>
  );
}

/* ---- Toggle ---- */
export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!on)} aria-pressed={on}
      style={{ width: 46, height: 27, borderRadius: 999, border: 'none', cursor: disabled ? 'default' : 'pointer', background: on ? 'var(--coral)' : '#D8D2CB', padding: 3, transition: 'background .25s', opacity: disabled ? 0.5 : 1, flexShrink: 0 }}>
      <span style={{ display: 'block', width: 21, height: 21, borderRadius: '50%', background: '#fff', transform: on ? 'translateX(19px)' : 'translateX(0)', transition: 'transform .25s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </button>
  );
}

/* ---- ChangeBadge ---- */
export function ChangeBadge({ change, dir }: { change: number; dir: 'up' | 'down' | 'flat' }) {
  const map = { up: { color: '#E05252', bg: '#FDECEC', arrow: '↑' }, down: { color: '#2E9E6B', bg: '#EAF7F0', arrow: '↓' }, flat: { color: '#8A8A9A', bg: '#EEEAE5', arrow: '→' } };
  const s = map[dir];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: s.color, background: s.bg, padding: '3px 9px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
      {change > 0 ? '+' : ''}{change}% {s.arrow}
    </span>
  );
}

/* ---- SectionTitle ---- */
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap' }}>{children}</h2>
      {action}
    </div>
  );
}
