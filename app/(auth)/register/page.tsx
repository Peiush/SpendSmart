'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useAuthStore } from '@/stores/authStore';

gsap.registerPlugin(useGSAP);

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.auth-field', {
      y: 16, opacity: 0, duration: 0.5, ease: 'power2.out',
      stagger: 0.08, delay: 0.25,
    });
    gsap.from('.auth-logo-mark', {
      scale: 0, rotation: -15, opacity: 0,
      duration: 0.6, ease: 'back.out(1.7)', delay: 0.1,
    });
    gsap.from('.auth-heading', {
      y: 12, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.2,
    });
  }, { scope: cardRef });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Registration failed'); return; }
      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div ref={cardRef} className="auth-card">
      {/* Logo */}
      <div className="auth-logo-wrap">
        <div className="auth-logo-mark">₹</div>
        <span className="auth-brand-name">SpendSmart</span>
      </div>

      {/* Heading */}
      <div className="auth-heading">
        <h1>Create account</h1>
        <p>Start managing your money smarter today</p>
      </div>

      {/* Error */}
      {error && (
        <div className="auth-field auth-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={submit} className="auth-form">
        <div className="auth-field auth-input-wrap">
          <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <input
            className="auth-input"
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div className="auth-field auth-input-wrap">
          <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <input
            className="auth-input"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>

        <div className="auth-field auth-input-wrap">
          <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <input
            className="auth-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (min 8 chars)"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            minLength={8}
            required
          />
          <button type="button" className="auth-input-action" onClick={() => setShowPassword(v => !v)}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button className="auth-field auth-submit" type="submit" disabled={loading}>
          {loading ? (
            <span className="auth-spinner" />
          ) : 'Create account'}
        </button>
      </form>

      {/* Divider */}
      <div className="auth-field auth-divider">
        <span>— Or Sign up with —</span>
      </div>

      {/* Social */}
      <div className="auth-field auth-socials auth-socials--single">
        <button
          type="button"
          className="auth-social-btn"
          onClick={() => { window.location.href = '/api/auth/google'; }}
        >
          <GoogleIcon /> Sign up with Google
        </button>
      </div>

      {/* Footer link */}
      <div className="auth-field auth-switch">
        Already have an account?{' '}
        <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

