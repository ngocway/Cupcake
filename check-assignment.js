const { PrismaClient } = require('./src/generated/client');
const p = new PrismaClient();

async function main() {
  const slug = 'my-wonderful-friends';
  
  const assignment = await p.assignment.findFirst({
    where: { OR: [{ id: slug }, { slug: slug }] },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' }
      }
    }
  });
  
  if (!assignment) {
    console.log(`\n❌ Assignment with slug/id "${slug}" not found!`);
  } else {
    console.log('\n✅ Assignment found:', assignment.title);
    console.log('Target Audiences:', assignment.targetAudiences);
    console.log('Number of questions:', assignment.questions.length);
    assignment.questions.forEach((q, i) => {
      console.log(`\n--- Question ${i + 1} ---`);
      console.log(`ID: ${q.id}`);
      console.log(`Type: ${q.type}`);
      console.log(`Content:`, q.content);
    });
  }
}

main().finally(() => p.$disconnect());

