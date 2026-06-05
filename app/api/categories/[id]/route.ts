import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const body = await req.json();
  const category = await prisma.category.findFirst({ where: { id: params.id, userId } });
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const updated = await prisma.category.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')!;
  const category = await prisma.category.findFirst({ where: { id: params.id, userId } });
  if (!category) return NextResponse.json({ error: 'Not found or not deletable' }, { status: 404 });
  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
