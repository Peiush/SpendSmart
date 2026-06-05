/* Ported verbatim from data.jsx */

export function formatINR(n: number, { decimals = false } = {}): string {
  const v = Math.round(decimals ? n * 100 : n) / (decimals ? 100 : 1);
  return '₹' + v.toLocaleString('en-IN', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
}

export function relDate(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}
