import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;

  // Fetch last 90 days of expenses to compute streak
  const since = new Date();
  since.setDate(since.getDate() - 90);
  since.setHours(0, 0, 0, 0);

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: since } },
    select: { date: true, type: true },
    orderBy: { date: 'desc' },
  });

  // Build a Set of ISO date strings where savings activity occurred
  const savingsDays = new Set<string>();
  for (const e of expenses) {
    if (e.type === 'Savings') {
      savingsDays.add(e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10));
    }
  }

  // Compute current streak — consecutive days ending today (or yesterday)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from today; if today has no activity start from yesterday
  let cursor = new Date(today);
  const todayStr = cursor.toISOString().slice(0, 10);
  if (!savingsDays.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 90; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (!savingsDays.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Build current week (Mon–Sun) activity
  const dow = today.getDay(); // 0 = Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekActivity: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekActivity.push(savingsDays.has(d.toISOString().slice(0, 10)));
  }

  // Best streak ever (last 90 days)
  let best = 0;
  let run = 0;
  const sortedDays = [...savingsDays].sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { run = 1; best = 1; continue; }
    const prev = new Date(sortedDays[i - 1]);
    prev.setDate(prev.getDate() + 1);
    if (prev.toISOString().slice(0, 10) === sortedDays[i]) {
      run++;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
  }

  return NextResponse.json({ streak, weekActivity, best });
}
