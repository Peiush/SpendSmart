import type { Expense } from '@/types';

export function buildCSV(expenses: Expense[]): string {
  const header = 'Date,Merchant,Category,Amount,Type,Note,Tags';
  const rows = expenses.map((e) =>
    [
      e.date,
      `"${e.merchant.replace(/"/g, '""')}"`,
      e.category?.name ?? '',
      e.amount,
      e.type,
      `"${(e.note ?? '').replace(/"/g, '""')}"`,
      (e.tags ?? []).join('|'),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}
