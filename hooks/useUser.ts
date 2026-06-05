'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { apiGet, apiPatch, apiDelete } from '@/lib/utils/api';
import type { User } from '@/types';

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => apiGet<User & { initials: string }>('/api/user'),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => apiPatch<User>('/api/user', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.user });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: () => apiDelete('/api/user'),
    onSuccess: () => { window.location.href = '/login'; },
  });
}
