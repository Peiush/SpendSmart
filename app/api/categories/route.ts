import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const body = await req.json();
  const { name, short, icon, colorHex, tintHex } = body;
  if (!name || !icon || !colorHex || !tintHex) {
    return NextResponse.json({ error: 'name, icon, colorHex, tintHex required' }, { status: 400 });
  }
  const category = await prisma.category.create({
    data: { userId, name, short: short || name.slice(0, 8), icon, colorHex, tintHex, isDefault: false },
  });
  return NextResponse.json(category, { status: 201 });
}
