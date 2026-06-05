import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.ACCESS_TOKEN_SECRET ?? 'dev-secret-change-me'
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_TOKEN_SECRET ?? 'dev-refresh-secret'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/callback') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // ── API routes: require Bearer access token ──────────────────────────────
  if (pathname.startsWith('/api/')) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const { payload } = await jwtVerify(token, ACCESS_SECRET);
      const res = NextResponse.next();
      res.headers.set('x-user-id', payload.sub as string);
      return res;
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ── Page routes: check refreshToken cookie (persists across page loads) ──
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await jwtVerify(refreshToken, REFRESH_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
