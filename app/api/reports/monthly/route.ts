import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const DONUT_COLORS = ['#E8735A','#4CAF82','#9B59B6','#3498DB','#F5A623','#E05252','#2ECC71','#1ABC9C'];
const CAT_ICONS: Record<string, string> = {
  'Food & Dining': '🍔', Transport: '🚗', Shopping: '🛍️', Entertainment: '🎬',
  Utilities: '⚡', 'Health & Fitness': '🏥', Education: '📚', Travel: '✈️',
  'Rent & Housing': '🏠', 'Personal Care': '✨', Savings: '🐷', Others: '🏷️',
};

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const monthParam = req.nextUrl.searchParams.get('month'); // "2026-06"
  const now = new Date();
  const [year, mon] = monthParam
    ? monthParam.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const monthStart = new Date(year, mon - 1, 1);
  const monthEnd = new Date(year, mon, 0);
  const lastStart = new Date(year, mon - 2, 1);
  const lastEnd = new Date(year, mon - 1, 0);
  const threeStart = new Date(year, mon - 4, 1);

  const [thisBycat, lastBycat, threeBycat] = await prisma.$transaction([
    prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: lastStart, lte: lastEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: threeStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  const catIds = [...new Set([...thisBycat.map(x => x.categoryId)])];
  const categories = await prisma.category.findMany({ where: { id: { in: catIds } } });
  const catById = Object.fromEntries(categories.map(c => [c.id, c]));

  const thisMap = Object.fromEntries(thisBycat.map(x => [x.categoryId, Number(x._sum.amount ?? 0)]));
  const lastMap = Object.fromEntries(lastBycat.map(x => [x.categoryId, Number(x._sum.amount ?? 0)]));
  const threeMap = Object.fromEntries(threeBycat.map(x => [x.categoryId, Number(x._sum.amount ?? 0)]));

  const donut = catIds.map((id, i) => ({
    name: catById[id]?.short ?? 'Other',
    value: thisMap[id] ?? 0,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  })).filter(d => d.value > 0);

  const table = catIds.map(id => {
    const catName = catById[id]?.name ?? 'Other';
    const thisMonth = thisMap[id] ?? 0;
    const lastMonth = lastMap[id] ?? 0;
    const threeAvg = Math.round((threeMap[id] ?? 0) / 3);
    const change = lastMonth === 0 ? 100 : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    return {
      category: catById[id]?.short ?? 'Other',
      icon: CAT_ICONS[catName] ?? '🏷️',
      thisMonth, lastMonth, threeAvg, change,
      dir: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    };
  });

  const totalSpent = donut.reduce((s, d) => s + d.value, 0);
  const daysElapsed = mon === now.getMonth() + 1 && year === now.getFullYear()
    ? Math.max(1, now.getDate()) : monthEnd.getDate();
  const daysInMonth = monthEnd.getDate();
  const forecast = totalSpent > 0 ? Math.round((totalSpent / daysElapsed) * daysInMonth) : 0;

  return NextResponse.json({ donut, table, forecast });
}
