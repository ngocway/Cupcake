const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  await prisma.sentenceBuilderGame.updateMany({
    where: { ageGroup: 'kids-2-5' },
    data: { ageGroup: '2-5' }
  });
  
  await prisma.sentenceBuilderGame.updateMany({
    where: { ageGroup: 'kid-6-12' },
    data: { ageGroup: '6-12' }
  });

  console.log('Fixed age groups for Sentence Builder.');
}

main().finally(() => prisma.$disconnect());
