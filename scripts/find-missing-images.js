const { PrismaClient } = require('../src/generated/client')
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient()

async function main() {
  const games = await prisma.sentenceBuilderGame.findMany({
    where: {
      name: { in: ['Level 2 (Medium)', 'Level 3 (Hard)'] }
    },
    include: { questions: true }
  })

  let missing = [];
  
  for (const game of games) {
    for (const q of game.questions) {
      const imgPath = path.join('d:\\Cupcakes\\public', q.image);
      if (!fs.existsSync(imgPath)) {
        missing.push({
          level: game.name,
          sentence: q.expected.join(' '),
          originalImage: q.image
        });
      }
    }
  }

  console.log(JSON.stringify(missing, null, 2));
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
