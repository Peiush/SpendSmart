import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

function getWeekBounds(now: Date) {
  const day = now.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now);
  thisMonday.setHours(0, 0, 0, 0);
  thisMonday.setDate(now.getDate() + mondayOffset);
  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);
  thisSunday.setHours(23, 59, 59, 999);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);
  lastSunday.setHours(23, 59, 59, 999);
  return { thisMonday, thisSunday, lastMonday, lastSunday };
}

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

  const { thisMonday, thisSunday, lastMonday, lastSunday } = getWeekBounds(now);

  // Date ranges for streak (30 days) and upcoming bills (7 days)
  const thirtyDaysAgo = new Date(todayStart.getTime() - 29 * 86400000);
  const sevenDaysLater = new Date(todayStart.getTime() + 7 * 86400000);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyBudget: true, dailyLimit: true, createdAt: true },
  });

  const [
    [monthlyAgg, todayAgg, weekAgg],
    needsWantsAgg,
    thisWeekBycat,
    lastWeekBycat,
    streakDailyTotals,
    upcomingRules,
  ] = await Promise.all([
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
    prisma.expense.groupBy({
      by: ['date'],
      where: { userId, date: { gte: thirtyDaysAgo, lte: todayEnd } },
      _sum: { amount: true },
    }),
    prisma.recurringRule.findMany({
      where: { userId, isActive: true, nextDueDate: { gte: todayStart, lte: sevenDaysLater } },
      include: { category: { select: { name: true, icon: true, colorHex: true } } },
      orderBy: { nextDueDate: 'asc' },
      take: 5,
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

  // Streak: consecutive days under daily limit, bounded by account creation date
  let streak = 0;
  if (dailyLimit > 0 && user?.createdAt) {
    // Normalise createdAt to UTC midnight so date comparisons work cleanly
    const ca = user.createdAt;
    const accountStart = new Date(
      `${ca.getFullYear()}-${pad(ca.getMonth() + 1)}-${pad(ca.getDate())}`
    );

    const streakMap: Record<string, number> = {};
    for (const d of streakDailyTotals) {
      const key = new Date(d.date).toISOString().slice(0, 10);
      streakMap[key] = Number(d._sum.amount ?? 0);
    }

    for (let i = 0; i < 30; i++) {
      const dayDate = new Date(todayStart.getTime() - i * 86400000);
      // Stop counting before the account existed
      if (dayDate < accountStart) break;
      const dayKey = dayDate.toISOString().slice(0, 10);
      if ((streakMap[dayKey] ?? 0) <= dailyLimit) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Upcoming recurring expenses (next 7 days)
  const upcomingRecurring = upcomingRules.map(r => ({
    id: r.id,
    merchant: r.merchant,
    amount: Number(r.amount),
    nextDueDate: new Date(r.nextDueDate).toISOString().slice(0, 10),
    category: { name: r.category.name, icon: r.category.icon, colorHex: r.category.colorHex },
  }));

  // Build dynamic insight from this week vs last week by category
  const insight = await (async () => {
    if (thisWeekBycat.length === 0) {
      return { topCategory: null, biggestChange: null, suggestion: null };
    }

    const catIds = [...new Set([...thisWeekBycat.map(x => x.categoryId), ...lastWeekBycat.map(x => x.categoryId)])];
    const categories = await prisma.category.findMany({ where: { id: { in: catIds } } });
    const catById = Object.fromEntries(categories.map(c => [c.id, c]));

    const thisMap = Object.fromEntries(thisWeekBycat.map(x => [x.categoryId, Number(x._sum.amount ?? 0)]));
    const lastMap = Object.fromEntries(lastWeekBycat.map(x => [x.categoryId, Number(x._sum.amount ?? 0)]));

    // Top spending category this week
    const topEntry = thisWeekBycat.reduce((a, b) =>
      Number(b._sum.amount ?? 0) > Number(a._sum.amount ?? 0) ? b : a
    );
    const topCatId = topEntry.categoryId;
    const topCatName = catById[topCatId]?.name ?? 'Others';
    const topAmount = thisMap[topCatId] ?? 0;
    const topLastAmount = lastMap[topCatId] ?? 0;

    // Category with biggest increase vs last week (only among categories present this week)
    let biggestChangeCatId = topCatId;
    let biggestChangePct = topLastAmount === 0 ? 100 : Math.round(((topAmount - topLastAmount) / topLastAmount) * 100);

    for (const { categoryId } of thisWeekBycat) {
      const cur = thisMap[categoryId] ?? 0;
      const prev = lastMap[categoryId] ?? 0;
      const pctChange = prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
      if (pctChange > biggestChangePct) {
        biggestChangePct = pctChange;
        biggestChangeCatId = categoryId;
      }
    }

    const changeCatName = catById[biggestChangeCatId]?.name ?? 'Others';
    const changeSign = biggestChangePct >= 0 ? '+' : '';
    const biggestChangeStr = `${changeSign}${biggestChangePct}% on ${changeCatName} this week`;

    // Generate a suggestion
    let suggestion: string | null = null;
    if (biggestChangePct >= 20) {
      const potentialSaving = Math.round((thisMap[biggestChangeCatId] ?? 0) * 0.2);
      suggestion = `Your ${changeCatName} spend is up ${biggestChangePct}% this week. Cutting it by 20% could save you ₹${potentialSaving.toLocaleString('en-IN')} next week.`;
    } else if (biggestChangePct < 0) {
      suggestion = `Great job! You spent ${Math.abs(biggestChangePct)}% less on ${changeCatName} compared to last week. Keep it up!`;
    } else if (topAmount > 0) {
      suggestion = `${topCatName} is your top spend this week at ₹${topAmount.toLocaleString('en-IN')}. Review if any of it can be reduced.`;
    }

    return { topCategory: topCatName, biggestChange: biggestChangeStr, suggestion };
  })();

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
    insight,
    streak,
    upcomingRecurring,
  });
}
