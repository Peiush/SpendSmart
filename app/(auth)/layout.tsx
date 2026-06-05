'use client';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

// All floater positions are inline so they always work regardless of CSS cache
const FLOATERS = [
  // wavy SVGs
  {
    key: 'wave-tl', cls: 'auth-float',
    style: { position: 'absolute' as const, top: '11%', left: '6%', pointerEvents: 'none' as const },
    el: (
      <svg width="120" height="55" viewBox="0 0 120 55" fill="none">
        <path d="M4 28 Q20 8 38 28 Q56 48 74 28 Q92 8 116 28" stroke="#E8735A" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55"/>
      </svg>
    ),
  },
  {
    key: 'wave-br', cls: 'auth-float',
    style: { position: 'absolute' as const, bottom: '12%', right: '6%', pointerEvents: 'none' as const },
    el: (
      <svg width="100" height="48" viewBox="0 0 100 48" fill="none">
        <path d="M4 24 Q18 6 34 24 Q50 42 66 24 Q82 6 96 24" stroke="#E8735A" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4"/>
      </svg>
    ),
  },
  // mini transaction card — top right
  {
    key: 'card-tr', cls: 'auth-float',
    style: { position: 'absolute' as const, top: '10%', right: '7%', pointerEvents: 'none' as const },
    el: (
      <div style={{ background: '#fff', border: '1px solid #F4ECE5', borderRadius: 14, padding: '12px 14px', width: 130, boxShadow: '0 6px 24px rgba(0,0,0,0.07)' }}>
        <div style={{ height: 6, borderRadius: 999, background: '#F4ECE5', marginBottom: 6 }} />
        <div style={{ height: 6, borderRadius: 999, background: '#F4ECE5', width: '60%', marginBottom: 8 }} />
        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#E8735A' }}>+₹2,450</div>
      </div>
    ),
  },
  // mini savings card — bottom left
  {
    key: 'card-bl', cls: 'auth-float',
    style: { position: 'absolute' as const, bottom: '14%', left: '6%', pointerEvents: 'none' as const },
    el: (
      <div style={{ background: '#1C1C2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', width: 130, boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}>
        <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.12)', marginBottom: 6 }} />
        <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.12)', width: '60%', marginBottom: 8 }} />
        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#4CAF82' }}>Savings ↑</div>
      </div>
    ),
  },
  // polka block — left mid
  {
    key: 'polka-l', cls: 'auth-float',
    style: { position: 'absolute' as const, top: '50%', left: '4%', transform: 'translateY(-50%)', pointerEvents: 'none' as const },
    el: <PolkaBlock color="#E8735A" bg="#FFF0EC" />,
  },
  // polka block — right mid
  {
    key: 'polka-r', cls: 'auth-float',
    style: { position: 'absolute' as const, top: '42%', right: '4%', transform: 'translateY(-50%)', pointerEvents: 'none' as const },
    el: <PolkaBlock color="#1C1C2E" bg="#F0EEF8" />,
  },
  // dashed circle
  {
    key: 'circle', cls: 'auth-float',
    style: { position: 'absolute' as const, top: '13%', left: '28%', pointerEvents: 'none' as const },
    el: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" stroke="#E8735A" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.45"/>
      </svg>
    ),
  },
  // arc curve
  {
    key: 'arc', cls: 'auth-float',
    style: { position: 'absolute' as const, bottom: '22%', right: '26%', pointerEvents: 'none' as const },
    el: (
      <svg width="56" height="38" viewBox="0 0 56 38" fill="none">
        <path d="M4 34 Q28 4 52 34" stroke="#1C1C2E" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.25"/>
      </svg>
    ),
  },
  // upward arrow
  {
    key: 'arrow', cls: 'auth-float',
    style: { position: 'absolute' as const, top: '40%', right: '12%', pointerEvents: 'none' as const },
    el: (
      <svg width="26" height="34" viewBox="0 0 26 34" fill="none">
        <line x1="13" y1="32" x2="13" y2="4" stroke="#E8735A" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M5 12 L13 4 L21 12" stroke="#E8735A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  // scatter dots
  {
    key: 'd1', cls: 'auth-float',
    style: { position: 'absolute' as const, top: '19%', left: '18%', width: 8, height: 8, borderRadius: '50%', background: '#E8735A', opacity: 0.55, pointerEvents: 'none' as const },
    el: null,
  },
  {
    key: 'd2', cls: 'auth-float',
    style: { position: 'absolute' as const, top: '72%', left: '22%', width: 6, height: 6, borderRadius: '50%', background: '#4CAF82', opacity: 0.5, pointerEvents: 'none' as const },
    el: null,
  },
  {
    key: 'd3', cls: 'auth-float',
    style: { position: 'absolute' as const, top: '24%', right: '20%', width: 7, height: 7, borderRadius: '50%', background: '#F5A623', opacity: 0.55, pointerEvents: 'none' as const },
    el: null,
  },
  {
    key: 'd4', cls: 'auth-float',
    style: { position: 'absolute' as const, bottom: '28%', right: '16%', width: 5, height: 5, borderRadius: '50%', background: '#E8735A', opacity: 0.4, pointerEvents: 'none' as const },
    el: null,
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Stagger float animations on the decorative elements
    gsap.to('.auth-float-0, .auth-float-2, .auth-float-4, .auth-float-6, .auth-float-8', {
      y: -14, rotation: 5,
      duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut',
    });
    gsap.to('.auth-float-1, .auth-float-3, .auth-float-5, .auth-float-7, .auth-float-9', {
      y: 12, rotation: -4,
      duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.9,
    });
    // Card entrance
    gsap.from('.auth-card-wrap', {
      y: 32, opacity: 0, scale: 0.96,
      duration: 0.65, ease: 'back.out(1.5)',
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        overflow: 'hidden',
        padding: '24px 16px 60px',
      }}
    >
      {/* Decorative floaters — all positioned via inline style */}
      {FLOATERS.map((f, i) => (
        <div
          key={f.key}
          className={`auth-float-${i} auth-hide-mobile`}
          style={f.style}
        >
          {f.el}
        </div>
      ))}

      {/* Form card */}
      <div className="auth-card-wrap">
        {children}
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 18, left: 0, right: 0,
        textAlign: 'center', fontSize: 12, color: '#C0BAB3', zIndex: 2,
      }}>
        © 2025 SpendSmart &nbsp;·&nbsp; Privacy Policy
      </div>
    </div>
  );
}

function PolkaBlock({ color, bg }: { color: string; bg: string }) {
  const dots = Array.from({ length: 25 });
  return (
    <div style={{
      width: 68, height: 68, borderRadius: 14, background: bg,
      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)',
      placeItems: 'center', padding: 10, gap: 3,
    }}>
      {dots.map((_, i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: color, opacity: 0.65 }} />
      ))}
    </div>
  );
}
