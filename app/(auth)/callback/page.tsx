'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore(s => s.setAuth);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setTimeout(() => router.replace('/login?error=oauth_failed'), 1500);
      return;
    }

    // Remove token from URL immediately (security hygiene)
    window.history.replaceState({}, '', '/callback');

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(user => {
        setAuth(user, token);
        router.replace('/dashboard');
      })
      .catch(() => {
        setStatus('error');
        setTimeout(() => router.replace('/login?error=oauth_failed'), 1500);
      });
  }, [searchParams, router, setAuth]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, minHeight: '60vh',
    }}>
      {status === 'loading' ? (
        <>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid #F4ECE5', borderTopColor: '#E8735A',
            animation: 'authSpin 0.7s linear infinite',
          }} />
          <p style={{ fontSize: 15, color: '#8A8A9A', fontFamily: 'var(--font-body)' }}>
            Signing you in with Google…
          </p>
        </>
      ) : (
        <p style={{ fontSize: 15, color: '#C0504D', fontFamily: 'var(--font-body)' }}>
          Something went wrong. Redirecting…
        </p>
      )}
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackContent />
    </Suspense>
  );
}
