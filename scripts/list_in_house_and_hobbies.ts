import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const topics = ['In house', 'Hobbies & Sports'];
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
        exampleSentence: true,
        imageUrl: true,
        audioUrl: true
      }
    });
    console.log(`Topic: "${topicName}" - Total: ${cards.length} cards`);
    for (const card of cards) {
      console.log(`  - Word: "${card.word}" | Sentence: "${card.exampleSentence}" | Image: "${card.imageUrl}" | Audio: "${card.audioUrl}"`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
