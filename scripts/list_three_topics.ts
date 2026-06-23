import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const topics = ['Literature & Art', 'Hobbies & Sports', 'Space Exploration'];
  
  for (const topicName of topics) {
    const cards = await prisma.globalFlashcard.findMany({
      where: {
        topic: {
          name: topicName
        }
      },
      select: {
        id: true,
        word: true,
        exampleSentence: true
      }
    });
    console.log(`Topic: "${topicName}" - Total: ${cards.length} cards`);
    for (const card of cards) {
      console.log(`  - ${card.word}: "${card.exampleSentence}"`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
