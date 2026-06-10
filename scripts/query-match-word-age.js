const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const games = await prisma.matchWordGame.findMany();
  console.log('MatchWordGames age groups:', games.map(g => g.ageGroup));
}
main().finally(() => prisma.$disconnect());
