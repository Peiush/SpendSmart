import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis/client';
import { randomBytes } from 'crypto';

export async function GET() {
  const state = randomBytes(16).toString('hex');

  // Store state in Redis for 10 minutes (CSRF protection)
  await redis.set(`oauth:state:${state}`, '1', { ex: 600 });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
