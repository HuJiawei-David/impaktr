import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = process.argv[2];
  const eventId = process.argv[3];
  if (!userId || !eventId) {
    console.error('Usage: node scripts/normalize-participation-hours.mjs <userId> <eventId>');
    process.exit(1);
  }

  const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true, startDate: true, endDate: true } });
  if (!ev || !ev.endDate) {
    console.error('Event not found or missing endDate');
    process.exit(1);
  }

  const hours = Math.max(0, Math.round(((new Date(ev.endDate).getTime() - new Date(ev.startDate).getTime()) / (1000 * 60 * 60)) * 10) / 10);
  const res = await prisma.participation.updateMany({ where: { userId, eventId }, data: { hours } });
  console.log(`Updated ${res.count} participation(s) to ${hours} hours for user ${userId} on event "${ev.title}"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
