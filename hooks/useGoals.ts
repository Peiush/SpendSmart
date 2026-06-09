'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/utils/api';
import type { Goal, CreateGoalInput } from '@/types';

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals.all,
    queryFn: () => apiGet<Goal[]>('/api/goals'),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalInput) => apiPost<Goal>('/api/goals', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Goal> & { id: string }) =>
      apiPatch<Goal>(`/api/goals/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals.all }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/goals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals.all }),
  });
}

export function useAddFunds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiPost<Goal>(`/api/goals/${id}/funds`, { amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
}

export interface AutoAllocatePending {
  pending: boolean;
  surplus?: number;
  monthLabel?: string;
  distributions?: Array<{ goalId: string; amount: number }>;
}

export interface AutoAllocateResult {
  allocated?: boolean;
  skipped?: boolean;
  reason?: string;
  surplus?: number;
  distributions?: Array<{ goalId: string; amount: number }>;
}

export function useCheckAutoAllocate() {
  return useQuery({
    queryKey: [...queryKeys.goals.all, 'auto-allocate-check'],
    queryFn: () => apiGet<AutoAllocatePending>('/api/goals/auto-allocate'),
    staleTime: 60_000,
  });
}

export interface StreakData {
  streak: number;
  weekActivity: boolean[];
  best: number;
}

export function useStreak() {
  return useQuery({
    queryKey: [...queryKeys.goals.all, 'streak'],
    queryFn: () => apiGet<StreakData>('/api/goals/streak'),
    staleTime: 60_000,
  });
}

export function useConfirmAutoAllocate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<AutoAllocateResult>('/api/goals/auto-allocate', {}),
    onSuccess: (data) => {
      if (data.allocated) {
        qc.invalidateQueries({ queryKey: queryKeys.goals.all });
        qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      }
    },
  });
}
