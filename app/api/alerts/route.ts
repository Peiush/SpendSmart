import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const alerts = await prisma.alert.findMany({
    where: { userId, dismissedAt: null },
    include: { budget: { include: { category: true } } },
    orderBy: { triggeredAt: 'desc' },
  });
  return NextResponse.json(alerts);
}
