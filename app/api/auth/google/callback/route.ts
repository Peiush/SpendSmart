import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { redis } from '@/lib/redis/client';
import { randomUUID } from 'crypto';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const loginUrl = new URL('/login', APP_URL);

  if (error || !code || !state) {
    loginUrl.searchParams.set('error', 'google_cancelled');
    return NextResponse.redirect(loginUrl);
  }

  // Verify CSRF state
  const stateKey = `oauth:state:${state}`;
  const valid = await redis.get(stateKey);
  if (!valid) {
    console.error('[OAuth] State invalid or expired:', state);
    loginUrl.searchParams.set('error', 'invalid_state');
    return NextResponse.redirect(loginUrl);
  }
  await redis.del(stateKey);

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${APP_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error('[OAuth] Token exchange failed:', tokenRes.status, body);
    loginUrl.searchParams.set('error', 'token_exchange_failed');
    return NextResponse.redirect(loginUrl);
  }

  const { access_token: googleAccessToken } = await tokenRes.json();

  // Fetch Google user profile
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${googleAccessToken}` },
  });

  if (!userRes.ok) {
    loginUrl.searchParams.set('error', 'userinfo_failed');
    return NextResponse.redirect(loginUrl);
  }

  const googleUser: GoogleUser = await userRes.json();

  if (!googleUser.verified_email) {
    loginUrl.searchParams.set('error', 'email_not_verified');
    return NextResponse.redirect(loginUrl);
  }

  // Upsert user: find by googleId OR email, then link/create
  let user;
  try {
    user = await prisma.user.findFirst({
      where: { OR: [{ googleId: googleUser.id }, { email: googleUser.email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleUser.id },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.id,
          name: googleUser.name,
          passwordHash: null,
          currency: 'INR',
          monthlyBudget: 20000,
          dailyLimit: 700,
        },
      });
    }
  } catch (err) {
    console.error('[OAuth] DB error during user upsert:', err);
    loginUrl.searchParams.set('error', 'db_error');
    return NextResponse.redirect(loginUrl);
  }

  // Issue app JWT tokens
  const jti = randomUUID();
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user.id),
    signRefreshToken(user.id, jti),
  ]);
  await redis.set(`refresh:${user.id}:${jti}`, '1', { ex: 7 * 24 * 3600 });

  // Pass access token via URL param — avoids cookie timing issues on redirect
  const callbackUrl = new URL('/callback', APP_URL);
  callbackUrl.searchParams.set('token', accessToken);

  const res = NextResponse.redirect(callbackUrl);

  res.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600,
    path: '/',
  });

  return res;
}
