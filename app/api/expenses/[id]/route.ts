import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const expense = await prisma.expense.findFirst({
    where: { id: params.id, userId },
    include: { category: true },
  });
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...expense, amount: Number(expense.amount), date: expense.date instanceof Date ? expense.date.toISOString().slice(0, 10) : String(expense.date).slice(0, 10) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const body = await req.json();
  const expense = await prisma.expense.findFirst({ where: { id: params.id, userId } });
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data: Prisma.ExpenseUpdateInput = { ...body };
  if (body.amount) data.amount = new Prisma.Decimal(body.amount);
  if (body.date) data.date = new Date(body.date);

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data,
    include: { category: true },
  });
  return NextResponse.json({ ...updated, amount: Number(updated.amount), date: updated.date instanceof Date ? updated.date.toISOString().slice(0, 10) : String(updated.date).slice(0, 10) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const expense = await prisma.expense.findFirst({ where: { id: params.id, userId } });
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.expense.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
