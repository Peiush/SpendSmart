'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { apiGet } from '@/lib/utils/api';
import type { WeeklyReport, MonthlyReport } from '@/types';

export function useWeeklyReport(week: string) {
  return useQuery({
    queryKey: queryKeys.reports.weekly(week),
    queryFn: () => apiGet<WeeklyReport>(`/api/reports/weekly?week=${week}`),
    staleTime: 5 * 60_000,
  });
}

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: queryKeys.reports.monthly(month),
    queryFn: () => apiGet<MonthlyReport>(`/api/reports/monthly?month=${month}`),
    staleTime: 5 * 60_000,
  });
}
