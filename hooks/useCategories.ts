'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/utils/api';
import type { Category } from '@/types';
import { useMemo } from 'react';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiGet<Category[]>('/api/categories'),
    staleTime: 5 * 60_000,
  });
}

export function useCatBy() {
  const { data: categories = [] } = useCategories();
  return useMemo(
    () => Object.fromEntries(categories.map(c => [c.name, c])),
    [categories]
  );
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Category>) => apiPost<Category>('/api/categories', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}
