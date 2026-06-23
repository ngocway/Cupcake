import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { word: 'Stone', sentence: 'This is a little stone.' },
    { word: 'Leaf', sentence: 'I see a green leaf.' },
    { word: 'Forest', sentence: 'The forest has green trees.' },
    { word: 'Wind', sentence: 'The wind blows.' },
    { word: 'Sea', sentence: 'The sea is big and blue.' },
    { word: 'Star', sentence: 'The star shines bright.' },
    { word: 'Rainbow', sentence: 'See the colorful rainbow!' },
    { word: 'Mountain', sentence: 'The mountain is very big.' },
    { word: 'River', sentence: 'Fish swim in the river.' },
    { word: 'Rain', sentence: 'The rain is falling.' },
    { word: 'Cloud', sentence: 'Look at the white cloud.' },
    { word: 'Moon', sentence: 'The moon is round.' },
    { word: 'Sun', sentence: 'The sun is hot.' },
    { word: 'Flower', sentence: 'I like this pretty flower.' },
    { word: 'Tree', sentence: 'This is a tall tree.' }
  ];

  for (const item of updates) {
    const result = await prisma.globalFlashcard.updateMany({
      where: {
        word: item.word,
        topic: {
          name: 'Nature'
        }
      },
      data: {
        exampleSentence: item.sentence
      }
    });
    console.log(`Updated example for "${item.word}" to "${item.sentence}". Records updated: ${result.count}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
