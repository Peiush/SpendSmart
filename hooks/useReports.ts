'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { apiGet } from '@/lib/utils/api';
import type { WeeklyReport, MonthlyReport, DailyReport } from '@/types';

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

export function useDailyReport(date: string) {
  return useQuery({
    queryKey: queryKeys.reports.daily(date),
    queryFn: () => apiGet<DailyReport>(`/api/reports/daily?date=${date}`),
    staleTime: 2 * 60_000,
  });
}
