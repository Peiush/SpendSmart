import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { buildCSV } from '@/lib/utils/csv';
import type { Expense } from '@/types';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const { searchParams } = req.nextUrl;
  const month = searchParams.get('month');

  const where: Record<string, unknown> = { userId };
  if (month) {
    const [year, mon] = month.split('-').map(Number);
    where.date = { gte: new Date(year, mon - 1, 1), lte: new Date(year, mon, 0) };
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  const formatted = expenses.map(e => ({ ...e, amount: Number(e.amount) })) as unknown as Expense[];
  const csv = buildCSV(formatted);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="spendsmart-${month ?? 'all'}.csv"`,
    },
  });
}
