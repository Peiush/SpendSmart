'use client';
import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit' | 'done'>('enter');

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem('splash_shown')) {
      setPhase('done');
      return;
    }
    sessionStorage.setItem('splash_shown', '1');

    const t1 = setTimeout(() => setPhase('visible'), 50);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => setPhase('done'), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === 'done') return null;

  return (
    <>
      <style>{`
        @keyframes ss-splash-icon-pop {
          0%   { transform: scale(0.55) rotate(-8deg); opacity: 0; }
          60%  { transform: scale(1.08) rotate(2deg);  opacity: 1; }
          80%  { transform: scale(0.96) rotate(-1deg); }
          100% { transform: scale(1)    rotate(0deg);  opacity: 1; }
        }
        @keyframes ss-splash-glow-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.55; transform: scale(1.15); }
        }
        @keyframes ss-splash-name-up {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ss-splash-tagline-up {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 0.5; transform: translateY(0); }
        }
        @keyframes ss-splash-bar1 {
          0%   { transform: scaleY(0); } 100% { transform: scaleY(1); }
        }
        @keyframes ss-splash-dot-trail {
          0%   { opacity: 0; transform: scaleX(0); transform-origin: left; }
          100% { opacity: 1; transform: scaleX(1); transform-origin: left; }
        }
        @keyframes ss-splash-overlay-out {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        .ss-splash-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: #0F0F1A;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 0;
          transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ss-splash-overlay.is-exit {
          animation: ss-splash-overlay-out 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .ss-splash-icon-wrap {
          position: relative;
          width: 112px; height: 112px;
          display: grid; place-items: center;
          animation: ss-splash-icon-pop 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
        }
        .ss-splash-glow {
          position: absolute; inset: -24px; border-radius: 50%;
          background: radial-gradient(circle, rgba(232,115,90,0.45) 0%, transparent 68%);
          animation: ss-splash-glow-pulse 1.8s ease-in-out 0.7s infinite;
        }
        .ss-splash-icon-img {
          width: 112px; height: 112px;
          border-radius: 28px;
          position: relative; z-index: 1;
          box-shadow: 0 20px 60px rgba(232,115,90,0.3), 0 8px 24px rgba(0,0,0,0.5);
        }
        .ss-splash-name {
          margin-top: 22px;
          font-size: 32px; font-weight: 800;
          font-family: 'Outfit', sans-serif;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #fff 30%, #E8735A 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: ss-splash-name-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.55s both;
        }
        .ss-splash-tagline {
          margin-top: 8px;
          font-size: 13px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.3px;
          animation: ss-splash-tagline-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.75s both;
        }
        .ss-splash-loader {
          margin-top: 48px;
          display: flex; gap: 7px; align-items: center;
          animation: ss-splash-tagline-up 0.4s ease 1s both;
        }
        .ss-splash-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(232,115,90,0.7);
          animation: ss-splash-glow-pulse 1s ease-in-out infinite;
        }
        .ss-splash-dot:nth-child(2) { animation-delay: 0.15s; }
        .ss-splash-dot:nth-child(3) { animation-delay: 0.3s; }
      `}</style>

      <div className={`ss-splash-overlay${phase === 'exit' ? ' is-exit' : ''}`}>
        <div className="ss-splash-icon-wrap">
          <div className="ss-splash-glow" />
          <img src="/icon.png" alt="Rupeefy" className="ss-splash-icon-img" />
        </div>
        <div className="ss-splash-name">Rupeefy</div>
        <div className="ss-splash-tagline">Smart money, smarter you</div>
        <div className="ss-splash-loader">
          <div className="ss-splash-dot" />
          <div className="ss-splash-dot" />
          <div className="ss-splash-dot" />
        </div>
      </div>
    </>
  );
}
