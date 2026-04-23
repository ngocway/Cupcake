
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const reviews = await prisma.assignmentReview.findMany({ take: 1 });
    console.log('AssignmentReview table exists:', reviews);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
