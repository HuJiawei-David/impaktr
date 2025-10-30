import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany({
    where: { sessions: { none: {} } },
    select: { id: true, title: true, startDate: true, endDate: true }
  });

  let updated = 0;
  for (const ev of events) {
    if (!ev.startDate || !ev.endDate) continue;
    const ms = new Date(ev.endDate).getTime() - new Date(ev.startDate).getTime();
    const hours = Math.max(0, ms / 36e5);
    await prisma.$transaction([
      prisma.eventSession.create({
        data: { eventId: ev.id, startAt: ev.startDate, endAt: ev.endDate, breakMin: 0, label: 'Day 1' }
      }),
      prisma.event.update({ where: { id: ev.id }, data: { totalHours: hours } })
    ]);
    updated++;
    console.log(`Backfilled ${ev.title} -> ${hours.toFixed(1)}h`);
  }
  console.log(`Done. Backfilled ${updated} event(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
