const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const updates = [
  { sentence: 'She likes to read', img: 'l1_q23.png' },
  { sentence: 'The ball is round', img: 'l1_q24.png' },
  { sentence: 'My dog barks loudly', img: 'l1_q25.png' },
  { sentence: 'He has a red car', img: 'l1_q26.png' },
  { sentence: 'I drink milk everyday', img: 'l1_q27.png' },
  { sentence: 'The sky is blue', img: 'l1_q28.png' },
  { sentence: 'We play in the park', img: 'l1_q29.png' },
  { sentence: 'She wears a hat', img: 'l1_q30.png' },
  { sentence: 'The book is thick', img: 'l1_q31.png' },
  { sentence: 'I love my family', img: 'l1_q32.png' },
  { sentence: 'He runs very fast', img: 'l1_q33.png' },
  { sentence: 'A mouse is small', img: 'l1_q34.png' },
  { sentence: 'The star shines bright', img: 'l1_q35.png' },
  { sentence: 'I eat an apple', img: 'l1_q36.png' },
  { sentence: 'She is my sister', img: 'l1_q37.png' },
  { sentence: 'The bear is brown', img: 'l1_q38.png' },
  { sentence: 'I wash my hands', img: 'l1_q39.png' },
  { sentence: 'The duck says quack', img: 'l1_q40.png' }
];

async function main() {
  const games = await prisma.sentenceBuilderGame.findMany({
    where: { name: 'Level 1 (Easy)' },
    include: { questions: true }
  })

  let updatedCount = 0;
  for (const game of games) {
    for (const q of game.questions) {
      const sentence = q.expected.join(' ');
      const match = updates.find(u => u.sentence === sentence);
      if (match) {
        await prisma.sentenceBuilderQuestion.update({
          where: { id: q.id },
          data: { image: `/games/sentence-builder/images/${match.img}` }
        })
        console.log(`Updated image for: ${sentence}`)
        updatedCount++;
      }
    }
  }

  console.log(`Updated ${updatedCount} questions in DB.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
