/* =========================================================================
   SpendSmart — shared TypeScript types
   ========================================================================= */

export type ExpenseType = 'Needs' | 'Wants' | 'Savings';
export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface User {
  id: string;
  email: string;
  name: string;
  currency: string;
  timezone: string;
  monthlyBudget: number;
  dailyLimit: number;
  totpEnabled: boolean;
  preferences: Record<string, unknown>;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  short: string;
  icon: string;
  colorHex: string;
  tintHex: string;
  isDefault: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  category: Category;
  amount: number;
  date: string;
  merchant: string;
  note: string | null;
  type: ExpenseType;
  tags: string[];
  isRecurring: boolean;
  recurringRule: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string | null;
  category: Category | null;
  amount: number;
  periodType: PeriodType;
  startDate: string;
  isActive: boolean;
  spent: number;          // computed: SUM of expenses for current period
}

export interface BudgetHistoryMonth {
  month: string;
  budgets: Array<{
    category: string;
    spent: number;
    limit: number;
  }>;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  autoAllocate: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  userId: string;
  budgetId: string;
  budget: Budget;
  thresholdPct: number;
  triggeredAt: string;
  dismissedAt: string | null;
}

export interface DashboardSummary {
  monthlyBudget: number;
  spent: number;
  remaining: number;
  todaySpend: number;
  dailyLimit: number;
  weekSpend: number;
  forecast: number;
  split: {
    needs: { pct: number; amount: number; target: number };
    wants: { pct: number; amount: number; target: number };
    savings: { pct: number; amount: number; target: number };
  };
  insight: {
    topCategory: string;
    biggestChange: string;
    suggestion: string;
  };
}

export interface WeeklyReport {
  bars: Array<{ name: string; thisWeek: number; lastWeek: number }>;
  days: Array<{ day: string; spend: number }>;
  changes: Array<{ icon: string; name: string; thisWeek: number; lastWeek: number; change: number; dir: 'up' | 'down' | 'flat' }>;
}

export interface MonthlyReport {
  donut: Array<{ name: string; value: number; color: string }>;
  table: Array<{ category: string; icon: string; thisMonth: number; lastMonth: number; threeAvg: number; change: number; dir: 'up' | 'down' | 'flat' }>;
  forecast: number;
}

export interface ExpenseFilters {
  q?: string;
  month?: string;
  category?: string;
  type?: ExpenseType | 'All';
  tag?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
  page?: number;
  limit?: number;
}

export interface ApiError {
  error: string;
  status?: number;
}

export interface AuthTokens {
  accessToken: string;
  user: User;
}

export interface CreateExpenseInput {
  categoryId: string;
  amount: number;
  date: string;
  merchant: string;
  note?: string;
  type: ExpenseType;
  tags?: string[];
  isRecurring?: boolean;
  recurringRule?: string;
  receiptUrl?: string;
}

export interface CreateGoalInput {
  name: string;
  emoji: string;
  targetAmount: number;
  deadline?: string;
  autoAllocate?: boolean;
  color?: string;
}
