import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const dateParam = req.nextUrl.searchParams.get('date'); // YYYY-MM-DD in user's local timezone

  // Anchor "today" to UTC midnight of the client's local date so comparisons
  // are consistent with how @db.Date values are stored (UTC midnight).
  const today = dateParam
    ? new Date(dateParam + 'T00:00:00.000Z')
    : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');

  // Fetch last 90 days of expenses to compute streak
  const since = new Date(today);
  since.setUTCDate(today.getUTCDate() - 90);

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
  const cursor = new Date(today);
  const todayStr = cursor.toISOString().slice(0, 10);
  if (!savingsDays.has(todayStr)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  for (let i = 0; i < 90; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (!savingsDays.has(key)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // Build current week (Mon–Sun) activity
  const dow = today.getUTCDay(); // 0 = Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + mondayOffset);

  const weekActivity: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    weekActivity.push(savingsDays.has(d.toISOString().slice(0, 10)));
  }

  // Best streak ever (last 90 days)
  let best = 0;
  let run = 0;
  const sortedDays = [...savingsDays].sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { run = 1; best = 1; continue; }
    const prev = new Date(sortedDays[i - 1] + 'T00:00:00.000Z');
    prev.setUTCDate(prev.getUTCDate() + 1);
    if (prev.toISOString().slice(0, 10) === sortedDays[i]) {
      run++;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
  }

  return NextResponse.json({ streak, weekActivity, best });
}
