import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CAT_ICONS: Record<string, string> = {
  'Food & Dining': '🍔', Transport: '🚗', Shopping: '🛍️', Entertainment: '🎬',
  Utilities: '⚡', 'Health & Fitness': '🏥', Education: '📚', Travel: '✈️',
  'Rent & Housing': '🏠', 'Personal Care': '✨', Savings: '🐷', Others: '🏷️',
};

function getWeekBounds(weekParam: string | null) {
  const base = weekParam ? new Date(weekParam) : new Date();
  const day = base.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(base);
  thisMonday.setDate(base.getDate() + mondayOffset);
  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisSunday);
  lastSunday.setDate(thisSunday.getDate() - 7);
  return { thisMonday, thisSunday, lastMonday, lastSunday };
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const weekParam = req.nextUrl.searchParams.get('week');
  const { thisMonday, thisSunday, lastMonday, lastSunday } = getWeekBounds(weekParam);

  const [thisWeekBycat, lastWeekBycat, thisWeekByDay] = await prisma.$transaction([
    prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: thisMonday, lte: thisSunday } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: lastMonday, lte: lastSunday } },
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: thisMonday, lte: thisSunday } },
      select: { date: true, amount: true },
    }),
  ]);

  const catIds = [...new Set([...thisWeekBycat.map(x => x.categoryId), ...lastWeekBycat.map(x => x.categoryId)])];
  const categories = await prisma.category.findMany({ where: { id: { in: catIds } } });
  const catById = Object.fromEntries(categories.map(c => [c.id, c]));

  const thisMap = Object.fromEntries(thisWeekBycat.map(x => [x.categoryId, Number(x._sum.amount ?? 0)]));
  const lastMap = Object.fromEntries(lastWeekBycat.map(x => [x.categoryId, Number(x._sum.amount ?? 0)]));

  const bars = catIds.map(id => ({
    name: catById[id]?.short ?? 'Other',
    thisWeek: thisMap[id] ?? 0,
    lastWeek: lastMap[id] ?? 0,
  })).sort((a, b) => b.thisWeek - a.thisWeek).slice(0, 6);

  const dayMap: Record<string, number> = {};
  thisWeekByDay.forEach(e => {
    const d = new Date(e.date);
    const dayIdx = (d.getDay() + 6) % 7; // 0=Mon
    const key = DAY_NAMES[dayIdx];
    dayMap[key] = (dayMap[key] ?? 0) + Number(e.amount);
  });
  const days = DAY_NAMES.map(d => ({ day: d, spend: dayMap[d] ?? 0 }));

  const changes = bars
    .filter(b => b.thisWeek > 0 || b.lastWeek > 0)
    .map(b => {
      const catId = catIds.find(id => catById[id]?.short === b.name) ?? '';
      const catName = catById[catId]?.name ?? b.name;
      const change = b.lastWeek === 0 ? 100 : Math.round(((b.thisWeek - b.lastWeek) / b.lastWeek) * 100);
      return {
        icon: CAT_ICONS[catName] ?? '🏷️',
        name: b.name,
        thisWeek: b.thisWeek,
        lastWeek: b.lastWeek,
        change,
        dir: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      };
    });

  return NextResponse.json({ bars, days, changes });
}
