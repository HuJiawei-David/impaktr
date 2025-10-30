import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node scripts/update-event-enddate.mjs <eventId>');
    process.exit(1);
  }
  const ev = await prisma.event.findUnique({ where: { id }, select: { id: true, title: true, startDate: true, endDate: true } });
  if (!ev) {
    console.error('Event not found');
    process.exit(1);
  }
  const start = new Date(ev.startDate);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  await prisma.event.update({ where: { id }, data: { endDate: end, status: 'COMPLETED' } });
  console.log(`Updated endDate for "${ev.title}" -> ${end.toISOString()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
