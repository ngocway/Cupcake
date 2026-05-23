const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const feeds = await prisma.$queryRaw`SELECT id, title, "createdAt" FROM "HomepageFeed" WHERE "contentType" = 'LESSON' ORDER BY "createdAt" DESC LIMIT 15`;
  console.log("Top 15 lessons:", feeds.map(f => f.title));
}
main().finally(() => prisma.$disconnect());
