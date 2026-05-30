// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const feeds = await prisma.homepageFeed.findMany({
    where: { contentType: "EXERCISE" },
  });
  
  for (const feed of feeds) {
    const ass = await prisma.assignment.findUnique({
      where: { id: feed.sourceId },
      include: { _count: { select: { questions: true } } }
    });
    
    if (ass) {
      await prisma.homepageFeed.update({
        where: { id: feed.id },
        data: { questionCount: ass._count.questions }
      });
      console.log(`Updated ${feed.sourceId} with ${ass._count.questions} questions`);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
