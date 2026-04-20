const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const latestAssignments = await prisma.assignment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        materialType: true,
        subject: true,
        isAiGenerated: true,
        createdAt: true,
        teacherId: true,
        status: true,
        readingText: true,
      }
    });

    console.log('Latest Assignments:');
    latestAssignments.forEach(a => {
      console.log(`- [${a.createdAt.toISOString()}] ${a.title} (${a.materialType}, ${a.subject}, ${a.status}, AI:${a.isAiGenerated})`);
      if (a.readingText) {
          console.log(`  ReadText Length: ${a.readingText.length}`);
          console.log(`  ReadText Start: ${a.readingText.substring(0, 50)}...`);
      }
    });

  } catch (error) {
    console.error('DB Check Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
