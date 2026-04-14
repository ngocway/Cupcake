const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const publicAssignments = await prisma.assignment.findMany({
    where: { status: 'PUBLIC' },
    select: { id: true, title: true, tags: true, viewCount: true }
  });
  console.log(JSON.stringify(publicAssignments, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
