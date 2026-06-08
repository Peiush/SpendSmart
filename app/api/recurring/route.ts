import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

function nextDueDate(startDate: Date, frequency: string): Date {
  const d = new Date(startDate);
  switch (frequency) {
    case 'DAILY':   d.setDate(d.getDate() + 1); break;
    case 'WEEKLY':  d.setDate(d.getDate() + 7); break;
    case 'MONTHLY': d.setMonth(d.getMonth() + 1); break;
    case 'YEARLY':  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const rules = await prisma.recurringRule.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(rules.map(r => ({
    ...r,
    amount: Number(r.amount),
    startDate: r.startDate instanceof Date ? r.startDate.toISOString().slice(0, 10) : String(r.startDate).slice(0, 10),
    nextDueDate: r.nextDueDate instanceof Date ? r.nextDueDate.toISOString().slice(0, 10) : String(r.nextDueDate).slice(0, 10),
  })));
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const body = await req.json();
  const { categoryId, amount, merchant, note, type, tags, frequency, startDate } = body;

  if (!categoryId || !amount || !merchant || !type || !frequency || !startDate) {
    return NextResponse.json({ error: 'categoryId, amount, merchant, type, frequency, startDate are required' }, { status: 400 });
  }

  const start = new Date(startDate);
  const nextDue = nextDueDate(start, frequency);

  const [rule, expense] = await prisma.$transaction(async (tx) => {
    const rule = await tx.recurringRule.create({
      data: {
        userId, categoryId,
        amount: new Prisma.Decimal(amount),
        merchant, note, type,
        tags: tags ?? [],
        frequency,
        startDate: start,
        nextDueDate: nextDue,
        isActive: true,
      },
      include: { category: true },
    });

    const expense = await tx.expense.create({
      data: {
        userId, categoryId,
        amount: new Prisma.Decimal(amount),
        date: start,
        merchant, note, type,
        tags: tags ?? [],
        isRecurring: true,
        recurringRule: frequency,
        recurringRuleId: rule.id,
      },
      include: { category: true },
    });

    return [rule, expense];
  });

  return NextResponse.json({
    rule: { ...rule, amount: Number(rule.amount), startDate: rule.startDate.toISOString().slice(0, 10), nextDueDate: rule.nextDueDate.toISOString().slice(0, 10) },
    expense: { ...expense, amount: Number(expense.amount), date: expense.date.toISOString().slice(0, 10) },
  }, { status: 201 });
}
