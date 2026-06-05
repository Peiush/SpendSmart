'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/utils/api';
import type { Budget, BudgetHistoryMonth } from '@/types';

export function useBudgets() {
  return useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: () => apiGet<Budget[]>('/api/budgets'),
  });
}

export function useBudgetHistory() {
  return useQuery({
    queryKey: queryKeys.budgets.history,
    queryFn: () => apiGet<BudgetHistoryMonth[]>('/api/budgets/history'),
    staleTime: 5 * 60_000,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Budget>) => apiPost<Budget>('/api/budgets', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Budget> & { id: string }) =>
      apiPatch<Budget>(`/api/budgets/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/budgets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budgets.all }),
  });
}
