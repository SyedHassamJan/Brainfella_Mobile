// Removes the throwaway users (and their data) that the live contract test creates.
//   node test/live/cleanup.js
// Uses the BACKEND's Prisma client and .env (run it from anywhere).
const path = require('path');
const backend = path.resolve(__dirname, '../../../backend');
require(path.join(backend, 'node_modules/dotenv')).config({ path: path.join(backend, '.env') });
const { PrismaClient } = require(path.join(backend, 'node_modules/@prisma/client'));

(async () => {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({ where: { email: { startsWith: 'smoketest-mobile+' } }, select: { id: true } });
    const ids = users.map((u) => u.id);
    const sessions = await prisma.chatSession.findMany({ where: { userId: { in: ids } }, select: { id: true } });
    const r = {
      chatMessages: (await prisma.chatMessage.deleteMany({ where: { sessionId: { in: sessions.map((s) => s.id) } } })).count,
      chatSessions: (await prisma.chatSession.deleteMany({ where: { userId: { in: ids } } })).count,
      journals: (await prisma.journalEntry.deleteMany({ where: { userId: { in: ids } } })).count,
      moods: (await prisma.moodLog.deleteMany({ where: { userId: { in: ids } } })).count,
      notifications: (await prisma.notification.deleteMany({ where: { userId: { in: ids } } })).count,
      patientProfiles: (await prisma.patientProfile.deleteMany({ where: { userId: { in: ids } } })).count,
      users: (await prisma.user.deleteMany({ where: { id: { in: ids } } })).count,
    };
    console.log('cleanup:', JSON.stringify(r));
  } finally {
    await prisma.$disconnect();
  }
})();
