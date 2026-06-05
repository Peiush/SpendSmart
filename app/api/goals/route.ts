import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(goals.map(g => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
  })));
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const body = await req.json();
  const { name, emoji, targetAmount, deadline, autoAllocate, color } = body;
  if (!name || !targetAmount) return NextResponse.json({ error: 'name and targetAmount required' }, { status: 400 });

  const goal = await prisma.goal.create({
    data: {
      userId, name,
      emoji: emoji ?? '🎯',
      targetAmount: new Prisma.Decimal(targetAmount),
      deadline: deadline ? new Date(deadline) : null,
      autoAllocate: autoAllocate ?? false,
      color: color ?? '#E8735A',
    },
  });
  return NextResponse.json({ ...goal, targetAmount: Number(goal.targetAmount), currentAmount: Number(goal.currentAmount) }, { status: 201 });
}
