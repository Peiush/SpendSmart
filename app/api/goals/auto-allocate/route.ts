import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { distributeSurplus } from '@/lib/goals/autoAllocate';

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyBudget: true, preferences: true },
  });

  const prefs = (user?.preferences as Record<string, unknown>) ?? {};

  if (prefs.lastAutoAllocateMonth === currentMonth) {
    return NextResponse.json({ skipped: true, reason: 'already_run_this_month' });
  }

  // Resolve global budget amount
  const globalBudget = await prisma.budget.findFirst({
    where: { userId, categoryId: null, isActive: true },
  });
  const budgetAmount = globalBudget ? Number(globalBudget.amount) : Number(user?.monthlyBudget ?? 0);
  if (!budgetAmount) {
    return NextResponse.json({ skipped: true, reason: 'no_budget' });
  }

  // Total spending this month
  const spentResult = await prisma.expense.aggregate({
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  });
  const totalSpent = Number(spentResult._sum.amount ?? 0);
  const surplus = budgetAmount - totalSpent;

  if (surplus <= 0) {
    return NextResponse.json({ skipped: true, reason: 'no_surplus', surplus });
  }

  const goals = await prisma.goal.findMany({ where: { userId, autoAllocate: true } });

  const distributions = distributeSurplus(
    surplus,
    goals.map(g => ({
      id: g.id,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      deadline: g.deadline,
    }))
  );

  if (!distributions.length) {
    return NextResponse.json({ skipped: true, reason: 'no_eligible_goals' });
  }

  await prisma.$transaction([
    ...distributions.map(d =>
      prisma.goal.update({
        where: { id: d.goalId },
        data: { currentAmount: { increment: new Prisma.Decimal(d.amount) } },
      })
    ),
    prisma.user.update({
      where: { id: userId },
      data: { preferences: { ...prefs, lastAutoAllocateMonth: currentMonth } },
    }),
  ]);

  return NextResponse.json({ allocated: true, surplus, distributions });
}
