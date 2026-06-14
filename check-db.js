const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const assignments = await prisma.assignment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      subject: true,
      targetAudiences: true,
      learningGoals: true,
      thumbnail: true,
      createdAt: true,
      isAiGenerated: true
    }
  });
  console.log('--- LATEST ASSIGNMENTS ---');
  for (const a of assignments) {
    console.log(`ID: ${a.id} | Title: "${a.title}" | Subj: "${a.subject}" | Aud: [${a.targetAudiences.join(', ')}] | Goals: [${a.learningGoals.join(', ')}] | Thumb: ${a.thumbnail ? 'YES' : 'NO'} (${a.thumbnail?.substring(0, 40)}...) | Date: ${a.createdAt.toISOString()}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
