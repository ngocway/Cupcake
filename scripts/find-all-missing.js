const { PrismaClient } = require('../src/generated/client')
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient()

async function main() {
  const games = await prisma.sentenceBuilderGame.findMany({
    include: { questions: true }
  })

  let missing = [];
  
  for (const game of games) {
    for (const q of game.questions) {
      // Remove leading slash for path joining
      const relPath = q.image.startsWith('/') ? q.image.substring(1) : q.image;
      const imgPath = path.join('d:\\Cupcakes\\public', relPath);
      
      if (!fs.existsSync(imgPath)) {
        missing.push({
          id: q.id,
          level: game.name,
          sentence: q.expected.join(' '),
          originalImage: q.image,
          gameId: game.id,
          orderIndex: q.orderIndex
        });
      }
    }
  }

  // Group by level
  const byLevel = {};
  missing.forEach(m => {
    if (!byLevel[m.level]) byLevel[m.level] = [];
    byLevel[m.level].push(m);
  });

  for (const level in byLevel) {
    console.log(`--- ${level} has ${byLevel[level].length} missing images ---`);
    byLevel[level].forEach(m => {
      console.log(`- [${m.originalImage}] ${m.sentence}`);
    });
  }
  
  fs.writeFileSync('missing-images.json', JSON.stringify(missing, null, 2));
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
