import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sub: userId } = await verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, currency: true,
        timezone: true, monthlyBudget: true, dailyLimit: true,
        totpEnabled: true, preferences: true, createdAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return NextResponse.json({
      ...user,
      initials,
      monthlyBudget: Number(user.monthlyBudget),
      dailyLimit: Number(user.dailyLimit),
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
