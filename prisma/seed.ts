import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining',   short: 'Food',      icon: '🍔', colorHex: '#C2410C', tintHex: '#FFE0CC', sortOrder: 1 },
  { name: 'Transport',       short: 'Transport',  icon: '🚗', colorHex: '#1D4ED8', tintHex: '#CCE5FF', sortOrder: 2 },
  { name: 'Rent & Housing',  short: 'Rent',       icon: '🏠', colorHex: '#7C3AED', tintHex: '#E8CCF5', sortOrder: 3 },
  { name: 'Utilities',       short: 'Utilities',  icon: '⚡', colorHex: '#B45309', tintHex: '#FFF1C2', sortOrder: 4 },
  { name: 'Entertainment',   short: 'Fun',        icon: '🎬', colorHex: '#BE185D', tintHex: '#FBD5E8', sortOrder: 5 },
  { name: 'Shopping',        short: 'Shopping',   icon: '🛍️', colorHex: '#0F766E', tintHex: '#CCF5E8', sortOrder: 6 },
  { name: 'Health & Fitness',short: 'Health',     icon: '🏥', colorHex: '#DC2626', tintHex: '#FFD3D3', sortOrder: 7 },
  { name: 'Education',       short: 'Education',  icon: '📚', colorHex: '#4338CA', tintHex: '#D9DEFF', sortOrder: 8 },
  { name: 'Travel',          short: 'Travel',     icon: '✈️', colorHex: '#0369A1', tintHex: '#CCEEFF', sortOrder: 9 },
  { name: 'Personal Care',   short: 'Care',       icon: '✨', colorHex: '#7E22CE', tintHex: '#EDE3FF', sortOrder: 10 },
  { name: 'Savings',         short: 'Savings',    icon: '🐷', colorHex: '#15803D', tintHex: '#D6F5DC', sortOrder: 11 },
  { name: 'Others',          short: 'Other',      icon: '🏷️', colorHex: '#52525B', tintHex: '#E7E7EC', sortOrder: 12 },
];

async function main() {
  console.log('Seeding default categories...');

  // Delete existing default categories first to avoid duplicates
  await prisma.category.deleteMany({ where: { isDefault: true, userId: null } });

  // Insert all fresh
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map(c => ({ ...c, userId: null, isDefault: true })),
  });

  console.log(`✅ Seeded ${DEFAULT_CATEGORIES.length} default categories.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
