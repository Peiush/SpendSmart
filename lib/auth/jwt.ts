import { SignJWT, jwtVerify } from 'jose';

const ACCESS_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET!);

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(userId: string, jti: string): Promise<string> {
  return new SignJWT({ sub: userId, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as { sub: string };
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; jti: string }> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as { sub: string; jti: string };
}
