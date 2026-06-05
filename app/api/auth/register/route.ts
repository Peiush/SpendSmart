import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { redis } from '@/lib/redis/client';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'email, password, and name are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    const user = await prisma.user.create({
      data: { email, passwordHash, name, currency: 'INR', monthlyBudget: 20000, dailyLimit: 700 },
      select: { id: true, email: true, name: true, currency: true, timezone: true, monthlyBudget: true, dailyLimit: true, totpEnabled: true, preferences: true, createdAt: true },
    });

    const jti = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      signRefreshToken(user.id, jti),
    ]);

    // Store refresh token jti in Redis (7 days)
    await redis.set(`refresh:${user.id}:${jti}`, '1', { ex: 7 * 24 * 3600 });

    const res = NextResponse.json({ accessToken, user: { ...user, initials } }, { status: 201 });
    res.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 3600,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
