import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const alert = await prisma.alert.findFirst({ where: { id: params.id, userId } });
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const updated = await prisma.alert.update({
    where: { id: params.id },
    data: { dismissedAt: new Date() },
  });
  return NextResponse.json(updated);
}
