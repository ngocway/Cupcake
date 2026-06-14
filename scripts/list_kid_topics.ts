import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.globalFlashcard.findMany({
    include: {
      topic: true
    }
  });

  const topicsMap: Record<string, typeof cards> = {};
  for (const card of cards) {
    const topicName = card.topic?.name || 'No Topic';
    if (!topicsMap[topicName]) {
      topicsMap[topicName] = [];
    }
    topicsMap[topicName].push(card);
  }

  for (const [topicName, topicCards] of Object.entries(topicsMap)) {
    console.log(`Topic: "${topicName}" - Total: ${topicCards.length} cards`);
    for (const card of topicCards) {
      console.log(`  - ${card.word} (hasAudio: ${!!card.audioUrl}, hasImage: ${!!card.imageUrl})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
