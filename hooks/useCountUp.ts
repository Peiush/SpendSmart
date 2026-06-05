'use client';
import { useState, useEffect } from 'react';

export function useCountUp(target: number, { duration = 900, start = true } = {}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    let t0: number | undefined;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / duration);
      setVal(target * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    const safety = setTimeout(() => setVal(target), duration + 500);
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, [target, duration, start]);
  return val;
}
