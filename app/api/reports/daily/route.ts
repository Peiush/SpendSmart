import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const { searchParams } = req.nextUrl;
  const dateParam = searchParams.get('date'); // YYYY-MM-DD

  const dateStr = dateParam ?? new Date().toISOString().slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);

  const start = new Date(y, m - 1, d, 0, 0, 0);
  const end   = new Date(y, m - 1, d, 23, 59, 59, 999);

  const prevStart = new Date(y, m - 1, d - 1, 0, 0, 0);
  const prevEnd   = new Date(y, m - 1, d - 1, 23, 59, 59, 999);

  const [expenses, prevExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { amount: 'desc' },
      include: { category: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: prevStart, lte: prevEnd } },
      select: { amount: true },
    }),
  ]);

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const prevDayTotal = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);

  // Group by category
  const catMap = new Map<string, { icon: string; name: string; color: string; tintHex: string; amount: number; count: number }>();
  for (const e of expenses) {
    const key = e.category.name;
    const existing = catMap.get(key);
    if (existing) {
      existing.amount += Number(e.amount);
      existing.count += 1;
    } else {
      catMap.set(key, {
        icon: e.category.icon,
        name: e.category.name,
        color: e.category.colorHex,
        tintHex: e.category.tintHex,
        amount: Number(e.amount),
        count: 1,
      });
    }
  }

  const byCategory = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    date: dateStr,
    total,
    prevDayTotal,
    byCategory,
    expenses: expenses.map(e => ({
      ...e,
      amount: Number(e.amount),
      date: e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10),
    })),
  });
}
