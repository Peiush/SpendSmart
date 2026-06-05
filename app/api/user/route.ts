import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const PUBLIC_SELECT = {
  id: true, email: true, name: true, currency: true, timezone: true,
  monthlyBudget: true, dailyLimit: true, totpEnabled: true, preferences: true, createdAt: true,
};

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: PUBLIC_SELECT });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return NextResponse.json({ ...user, initials, monthlyBudget: Number(user.monthlyBudget), dailyLimit: Number(user.dailyLimit) });
}

export async function PATCH(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  const body = await req.json();
  const { name, currency, timezone, monthlyBudget, dailyLimit, preferences } = body;

  const data: Prisma.UserUpdateInput = {};
  if (name) data.name = name;
  if (currency) data.currency = currency;
  if (timezone) data.timezone = timezone;
  if (monthlyBudget != null) data.monthlyBudget = new Prisma.Decimal(monthlyBudget);
  if (dailyLimit != null) data.dailyLimit = new Prisma.Decimal(dailyLimit);
  if (preferences) data.preferences = preferences;

  const user = await prisma.user.update({ where: { id: userId }, data, select: PUBLIC_SELECT });
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return NextResponse.json({ ...user, initials, monthlyBudget: Number(user.monthlyBudget), dailyLimit: Number(user.dailyLimit) });
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;
  await prisma.user.delete({ where: { id: userId } });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('refreshToken');
  return res;
}
