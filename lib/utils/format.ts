/* Ported verbatim from data.jsx */

export function formatINR(n: number, { decimals = false } = {}): string {
  const v = Math.round(decimals ? n * 100 : n) / (decimals ? 100 : 1);
  return '₹' + v.toLocaleString('en-IN', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
}

/** Returns YYYY-MM-DD in the browser's local timezone (not UTC). */
export function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function relDate(iso: string): string {
  const now = new Date();
  const today = localDateStr(now);
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const yesterday = localDateStr(yest);
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}
