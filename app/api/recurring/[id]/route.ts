import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const body = await req.json();
  const { isActive, amount, merchant, note, frequency, categoryId, type, tags } = body;

  const existing = await prisma.recurringRule.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.recurringRule.update({
    where: { id: params.id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(amount !== undefined && { amount: new Prisma.Decimal(amount) }),
      ...(merchant !== undefined && { merchant }),
      ...(note !== undefined && { note }),
      ...(frequency !== undefined && { frequency }),
      ...(categoryId !== undefined && { categoryId }),
      ...(type !== undefined && { type }),
      ...(tags !== undefined && { tags }),
    },
    include: { category: true },
  });

  return NextResponse.json({
    ...updated,
    amount: Number(updated.amount),
    startDate: updated.startDate.toISOString().slice(0, 10),
    nextDueDate: updated.nextDueDate.toISOString().slice(0, 10),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const existing = await prisma.recurringRule.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.recurringRule.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
