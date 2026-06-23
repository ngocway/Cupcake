const { PrismaClient } = require('@prisma/client')
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

  let updatedCount = 0;
  
  for (const game of games) {
    for (const q of game.questions) {
      if (q.image.endsWith('.jpg')) {
        // e.g. /games/sentence-builder/images/l2_q21.jpg -> l2_q21.png
        const baseName = path.basename(q.image, '.jpg');
        const newPath = `/games/sentence-builder/images/${baseName}.png`;
        
        await prisma.sentenceBuilderQuestion.update({
          where: { id: q.id },
          data: { image: newPath }
        });
        
        console.log(`Updated image for: ${q.expected.join(' ')} to ${newPath}`);
        updatedCount++;
      }
    }
  }

  console.log(`Updated ${updatedCount} questions in DB.`);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
