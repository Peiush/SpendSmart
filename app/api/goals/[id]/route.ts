import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const body = await req.json();
  const goal = await prisma.goal.findFirst({ where: { id: params.id, userId } });
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data: Prisma.GoalUpdateInput = { ...body };
  if (body.targetAmount) data.targetAmount = new Prisma.Decimal(body.targetAmount);
  if (body.deadline) data.deadline = new Date(body.deadline);

  const updated = await prisma.goal.update({ where: { id: params.id }, data });
  return NextResponse.json({ ...updated, targetAmount: Number(updated.targetAmount), currentAmount: Number(updated.currentAmount) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const goal = await prisma.goal.findFirst({ where: { id: params.id, userId } });
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.goal.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
