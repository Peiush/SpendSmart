import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { redis } from '@/lib/redis/client';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('refreshToken')?.value;
    if (token) {
      const { sub: userId, jti } = await verifyRefreshToken(token);
      await redis.del(`refresh:${userId}:${jti}`);
    }
  } catch { /* ignore */ }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete('refreshToken');
  return res;
}
