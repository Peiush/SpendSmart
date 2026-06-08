import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  // Build date strings from LOCAL time so comparisons against @db.Date columns
  // use the correct calendar date regardless of server timezone.
  const localYMD = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const todayStart = new Date(localYMD); // parses as UTC midnight → Prisma sends '2026-06-08'
  const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);

  const monthStart = new Date(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEnd = new Date(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDayOfMonth)}T23:59:59.999Z`);

  const weekAgoDate = new Date(now.getTime() - 6 * 86400000);
  const weekStart = new Date(
    `${weekAgoDate.getFullYear()}-${pad(weekAgoDate.getMonth() + 1)}-${pad(weekAgoDate.getDate())}`
  );

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyBudget: true, dailyLimit: true },
  });

  const [[monthlyAgg, todayAgg, weekAgg], needsWantsAgg] = await Promise.all([
    prisma.$transaction([
      prisma.expense.aggregate({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: weekStart } },
        _sum: { amount: true },
      }),
    ]),
    prisma.expense.groupBy({
      by: ['type'],
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  const monthlyBudget = Number(user?.monthlyBudget ?? 0);
  const dailyLimit = Number(user?.dailyLimit ?? 0);
  const spent = Number(monthlyAgg._sum.amount ?? 0);
  const remaining = monthlyBudget - spent;
  const todaySpend = Number(todayAgg._sum.amount ?? 0);
  const weekSpend = Number(weekAgg._sum.amount ?? 0);

  const daysElapsed = Math.max(1, now.getDate());
  const daysInMonth = monthEnd.getDate();
  const forecast = spent > 0 ? Math.round((spent / daysElapsed) * daysInMonth) : 0;

  // 50/30/20 split
  const nwMap = Object.fromEntries(needsWantsAgg.map(g => [g.type, Number(g._sum.amount ?? 0)]));
  const needs = nwMap['Needs'] ?? 0;
  const wants = nwMap['Wants'] ?? 0;
  const savings = nwMap['Savings'] ?? 0;
  const total = needs + wants + savings || 1;
  const pct = (v: number) => Math.round((v / total) * 100);

  return NextResponse.json({
    monthlyBudget,
    spent,
    remaining,
    todaySpend,
    dailyLimit,
    weekSpend,
    forecast,
    split: {
      needs:   { pct: pct(needs),   amount: needs,   target: 50 },
      wants:   { pct: pct(wants),   amount: wants,   target: 30 },
      savings: { pct: pct(savings), amount: savings, target: 20 },
    },
    insight: {
      topCategory: 'Food & Dining',
      biggestChange: '+40% on Food this week',
      suggestion: 'Try cooking at home 2 more days — you could save ₹800 next week.',
    },
  });
}
