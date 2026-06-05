import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
    });
  }

  const budgets = await prisma.budget.findMany({
    where: { userId, isActive: true, categoryId: { not: null } },
    include: { category: true },
  });

  const history = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const spent = await prisma.expense.groupBy({
        by: ['categoryId'],
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      });
      const spentMap = Object.fromEntries(spent.map(s => [s.categoryId, Number(s._sum.amount ?? 0)]));
      return {
        month: label,
        budgets: budgets.map(b => ({
          category: b.category!.name,
          spent: spentMap[b.categoryId!] ?? 0,
          limit: Number(b.amount),
        })),
      };
    })
  );

  return NextResponse.json(history);
}
