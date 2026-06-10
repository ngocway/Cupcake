import prisma from "../src/lib/prisma"

async function main() {
  const result1 = await prisma.sentenceBuilderGame.updateMany({
    where: { ageGroup: 'kids-2-5' },
    data: { ageGroup: '2-5' }
  });
  
  const result2 = await prisma.sentenceBuilderGame.updateMany({
    where: { ageGroup: 'kid-6-12' },
    data: { ageGroup: '6-12' }
  });

  console.log('Fixed kids-2-5:', result1.count);
  console.log('Fixed kid-6-12:', result2.count);
}

main().finally(() => prisma.$disconnect());
