import type { ExpenseFilters } from '@/types';

export const queryKeys = {
  expenses: {
    all: ['expenses'] as const,
    list: (filters: ExpenseFilters) => ['expenses', filters] as const,
    detail: (id: string) => ['expenses', id] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    history: ['budgets', 'history'] as const,
  },
  goals: {
    all: ['goals'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
  },
  reports: {
    weekly: (week: string) => ['reports', 'weekly', week] as const,
    monthly: (month: string) => ['reports', 'monthly', month] as const,
  },
  categories: ['categories'] as const,
  user: ['user'] as const,
  alerts: ['alerts'] as const,
};
