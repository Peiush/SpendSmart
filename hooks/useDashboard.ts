'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { apiGet } from '@/lib/utils/api';
import type { DashboardSummary } from '@/types';

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: () => apiGet<DashboardSummary>('/api/dashboard/summary'),
    staleTime: 60_000,
  });
}
