'use client';
import { useState, useEffect } from 'react';

export function useMounted(delay = 60) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setM(true), delay);
    return () => clearTimeout(t);
  }, []);
  return m;
}
