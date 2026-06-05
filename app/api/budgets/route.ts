import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const budgets = await prisma.budget.findMany({
    where: { userId, isActive: true },
    include: { category: true },
  });

  // Compute spent for each budget's current period
  const spent = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  });
  const spentMap = Object.fromEntries(spent.map(s => [s.categoryId, Number(s._sum.amount ?? 0)]));

  // Global budget: sum of all expenses this month
  const totalSpent = await prisma.expense.aggregate({
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  });

  return NextResponse.json(budgets.map(b => ({
    ...b,
    amount: Number(b.amount),
    spent: b.categoryId ? (spentMap[b.categoryId] ?? 0) : Number(totalSpent._sum.amount ?? 0),
  })));
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const body = await req.json();
  const { categoryId, amount, periodType, startDate } = body;

  if (!amount) return NextResponse.json({ error: 'amount required' }, { status: 400 });

  const budget = await prisma.budget.create({
    data: {
      userId,
      categoryId: categoryId ?? null,
      amount: new Prisma.Decimal(amount),
      periodType: periodType ?? 'MONTHLY',
      startDate: startDate ? new Date(startDate) : new Date(),
    },
    include: { category: true },
  });
  return NextResponse.json({ ...budget, amount: Number(budget.amount), spent: 0 }, { status: 201 });
}
