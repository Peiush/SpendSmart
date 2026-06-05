import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const { searchParams: p } = req.nextUrl;

  const month = p.get('month');   // e.g. "2026-06"
  const category = p.get('category');
  const type = p.get('type');
  const q = p.get('q');
  const tag = p.get('tag');
  const minAmount = p.get('minAmount');
  const maxAmount = p.get('maxAmount');
  const sort = p.get('sort') ?? 'date-desc';
  const page = Number(p.get('page') ?? 1);
  const limit = Math.min(Number(p.get('limit') ?? 50), 200);

  const where: Prisma.ExpenseWhereInput = { userId };

  if (month) {
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0);
    where.date = { gte: start, lte: end };
  }
  if (category) where.category = { name: category };
  if (type && type !== 'All') where.type = type as 'Needs' | 'Wants' | 'Savings';
  if (q) where.OR = [
    { merchant: { contains: q, mode: 'insensitive' } },
    { note: { contains: q, mode: 'insensitive' } },
    { tags: { has: q } },
  ];
  if (tag) where.tags = { has: tag };
  if (minAmount) where.amount = { ...(where.amount as object), gte: Number(minAmount) };
  if (maxAmount) where.amount = { ...(where.amount as object), lte: Number(maxAmount) };

  const orderBy: Prisma.ExpenseOrderByWithRelationInput =
    sort === 'amount-desc' ? { amount: 'desc' } :
    sort === 'amount-asc'  ? { amount: 'asc' } :
    sort === 'date-asc'    ? { date: 'asc' } :
    { date: 'desc' };

  const [expenses, total] = await prisma.$transaction([
    prisma.expense.findMany({
      where,
      orderBy,
      include: { category: true },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return NextResponse.json({
    expenses: expenses.map(e => ({ ...e, amount: Number(e.amount) })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const body = await req.json();
  const { categoryId, amount, date, merchant, note, type, tags, isRecurring, recurringRule, receiptUrl } = body;

  if (!categoryId || !amount || !date || !merchant || !type) {
    return NextResponse.json({ error: 'categoryId, amount, date, merchant, type are required' }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      userId, categoryId,
      amount: new Prisma.Decimal(amount),
      date: new Date(date),
      merchant, note, type,
      tags: tags ?? [],
      isRecurring: isRecurring ?? false,
      recurringRule, receiptUrl,
    },
    include: { category: true },
  });

  return NextResponse.json({ ...expense, amount: Number(expense.amount) }, { status: 201 });
}
