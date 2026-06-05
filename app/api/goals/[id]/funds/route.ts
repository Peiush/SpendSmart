import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const { amount } = await req.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: 'amount must be positive' }, { status: 400 });

  const goal = await prisma.goal.findFirst({ where: { id: params.id, userId } });
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const newAmount = Math.min(Number(goal.targetAmount), Number(goal.currentAmount) + amount);
  const updated = await prisma.goal.update({
    where: { id: params.id },
    data: { currentAmount: new Prisma.Decimal(newAmount) },
  });
  return NextResponse.json({ ...updated, targetAmount: Number(updated.targetAmount), currentAmount: Number(updated.currentAmount) });
}
