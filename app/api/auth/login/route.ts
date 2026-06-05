import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { redis } from '@/lib/redis/client';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password, totpCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'This account uses Google sign-in. Please sign in with Google.' }, { status: 401 });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.totpEnabled) {
      if (!totpCode) {
        return NextResponse.json({ requiresTOTP: true }, { status: 200 });
      }
      const { TOTP } = await import('otpauth');
      const totp = new TOTP({ secret: user.totpSecret! });
      const delta = totp.validate({ token: totpCode, window: 1 });
      if (delta === null) {
        return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 401 });
      }
    }

    const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const jti = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      signRefreshToken(user.id, jti),
    ]);
    await redis.set(`refresh:${user.id}:${jti}`, '1', { ex: 7 * 24 * 3600 });

    const publicUser = {
      id: user.id, email: user.email, name: user.name, initials,
      currency: user.currency, timezone: user.timezone,
      monthlyBudget: Number(user.monthlyBudget), dailyLimit: Number(user.dailyLimit),
      totpEnabled: user.totpEnabled, preferences: user.preferences,
      createdAt: user.createdAt,
    };

    const res = NextResponse.json({ accessToken, user: publicUser });
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
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
