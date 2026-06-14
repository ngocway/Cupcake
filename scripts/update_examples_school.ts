import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { word: 'Map', sentence: 'Look at the colorful map.' },
    { word: 'Notebook', sentence: 'I write in my notebook.' },
    { word: 'Scissors', sentence: 'I use small scissors to cut.' },
    { word: 'Classroom', sentence: 'My classroom is big and fun.' },
    { word: 'Computer', sentence: 'I learn on the computer.' },
    { word: 'Blackboard', sentence: 'The teacher writes on the blackboard.' },
    { word: 'Backpack', sentence: 'I put books in my backpack.' },
    { word: 'Student', sentence: 'I am a happy student.' },
    { word: 'Teacher', sentence: 'My teacher is very nice.' },
    { word: 'Chair', sentence: 'I sit on the chair.' }
  ];

  for (const item of updates) {
    const result = await prisma.globalFlashcard.updateMany({
      where: {
        word: item.word,
        topic: {
          name: 'School'
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
