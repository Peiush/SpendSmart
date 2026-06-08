'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/utils/api';
import type { RecurringRule, CreateRecurringRuleInput } from '@/types';

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.recurring.all });
  qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
  qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
}

export function useRecurringRules() {
  return useQuery({
    queryKey: queryKeys.recurring.all,
    queryFn: () => apiGet<RecurringRule[]>('/api/recurring'),
  });
}

export function useCreateRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringRuleInput) =>
      apiPost<{ rule: RecurringRule }>('/api/recurring', data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useToggleRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPatch<RecurringRule>(`/api/recurring/${id}`, { isActive }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/recurring/${id}`),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useProcessRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ processed: number; created: number }>('/api/recurring/process', {}),
    onSuccess: () => invalidateAll(qc),
  });
}
