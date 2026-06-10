const { PrismaClient } = require('../src/generated/client')

const prisma = new PrismaClient()

async function main() {
  const games = await prisma.sentenceBuilderGame.findMany();
  
  for (const game of games) {
    let ageGroup = "kids-2-5"; // Default
    if (game.name.includes("Level 1")) {
      ageGroup = "kids-2-5";
    } else if (game.name.includes("Level 2")) {
      ageGroup = "kid-6-12";
    } else if (game.name.includes("Level 3")) {
      ageGroup = "teen";
    }
    
    await prisma.sentenceBuilderGame.update({
      where: { id: game.id },
      data: { ageGroup: ageGroup }
    });
    console.log(`Updated game: ${game.name} -> ageGroup: ${ageGroup}`);
  }

  console.log('Migration completed.');
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
