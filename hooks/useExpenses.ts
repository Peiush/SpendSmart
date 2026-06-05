'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/utils/api';
import type { Expense, ExpenseFilters, CreateExpenseInput } from '@/types';

interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  page: number;
  pages: number;
}

function buildQS(filters: ExpenseFilters) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== '' && v !== 'All') p.set(k, String(v));
  });
  return p.toString();
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
  qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
  qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
  qc.invalidateQueries({ queryKey: ['reports'] });
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: queryKeys.expenses.list(filters),
    queryFn: () => apiGet<ExpenseListResponse>(`/api/expenses?${buildQS(filters)}`),
    placeholderData: (prev) => prev,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseInput) => apiPost<Expense>('/api/expenses', data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Expense> & { id: string }) =>
      apiPatch<Expense>(`/api/expenses/${id}`, data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/expenses/${id}`),
    onSuccess: () => invalidateAll(qc),
  });
}
