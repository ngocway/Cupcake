const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const feeds = await prisma.$queryRawUnsafe(`SELECT * FROM "HomepageFeed" WHERE "contentType" = 'EXERCISE'`);
  
  for (const feed of feeds) {
    const assList = await prisma.$queryRawUnsafe(`SELECT id FROM "Assignment" WHERE id = $1`, feed.sourceId);
    if (assList.length > 0) {
      const qCountRes = await prisma.$queryRawUnsafe(`SELECT count(*) as count FROM "Question" WHERE "assignmentId" = $1`, feed.sourceId);
      const qCount = parseInt(qCountRes[0].count.toString(), 10) || 0;
      
      await prisma.$executeRawUnsafe(`UPDATE "HomepageFeed" SET "questionCount" = $1 WHERE id = $2`, qCount, feed.id);
      console.log(`Updated ${feed.sourceId} with ${qCount} questions`);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
