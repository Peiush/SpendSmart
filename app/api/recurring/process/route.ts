import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

function advanceDate(date: Date, frequency: string): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'DAILY':   d.setDate(d.getDate() + 1); break;
    case 'WEEKLY':  d.setDate(d.getDate() + 7); break;
    case 'MONTHLY': d.setMonth(d.getMonth() + 1); break;
    case 'YEARLY':  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueRules = await prisma.recurringRule.findMany({
    where: {
      userId,
      isActive: true,
      nextDueDate: { lte: today },
    },
  });

  const created: string[] = [];

  for (const rule of dueRules) {
    let current = new Date(rule.nextDueDate);
    current.setHours(0, 0, 0, 0);

    // Create one expense per missed period (catch up if app was offline)
    while (current <= today) {
      await prisma.expense.create({
        data: {
          userId: rule.userId,
          categoryId: rule.categoryId,
          amount: rule.amount,
          date: current,
          merchant: rule.merchant,
          note: rule.note,
          type: rule.type,
          tags: rule.tags,
          isRecurring: true,
          recurringRule: rule.frequency,
          recurringRuleId: rule.id,
        },
      });

      created.push(rule.id);
      current = advanceDate(current, rule.frequency);
    }

    await prisma.recurringRule.update({
      where: { id: rule.id },
      data: { nextDueDate: current },
    });
  }

  return NextResponse.json({ processed: dueRules.length, created: created.length });
}
