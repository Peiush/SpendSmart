import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth/jwt';
import { redis } from '@/lib/redis/client';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('refreshToken')?.value;
    if (!token) return NextResponse.json({ error: 'No refresh token' }, { status: 401 });

    const { sub: userId, jti } = await verifyRefreshToken(token);

    const exists = await redis.get(`refresh:${userId}:${jti}`);
    if (!exists) return NextResponse.json({ error: 'Token revoked' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, currency: true, timezone: true, monthlyBudget: true, dailyLimit: true, totpEnabled: true, preferences: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

    const accessToken = await signAccessToken(userId);
    const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

    return NextResponse.json({
      accessToken,
      user: { ...user, initials, monthlyBudget: Number(user.monthlyBudget), dailyLimit: Number(user.dailyLimit) },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}
