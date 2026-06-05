export function budgetStatus(pct: number) {
  if (pct >= 90) return { key: 'red',   color: '#E05252', bg: '#FDECEC' };
  if (pct >= 70) return { key: 'amber', color: '#F5A623', bg: '#FFF6E5' };
  return         { key: 'green', color: '#4CAF82', bg: '#EAF7F0' };
}
