const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function run() {
  const all = await prisma.assignment.findMany({ select: { tags: true } });
  const tags = new Set();
  
  all.forEach(a => {
    if (a.tags) {
      a.tags.split(',').forEach(t => {
        const cleaned = t.trim().toLowerCase();
        if (cleaned) tags.add(cleaned);
      });
    }
  });
  
  const dbTags = await prisma.tag.findMany();
  const dbSet = new Set(dbTags.map(t => t.name.toLowerCase()));
  
  const toCreate = Array.from(tags).filter(t => !dbSet.has(t));
  
  if (toCreate.length > 0) {
    await prisma.tag.createMany({
      data: toCreate.map(t => ({ name: t, isPopular: false })),
      skipDuplicates: true
    });
    console.log('Created ' + toCreate.length + ' tags');
  } else {
    console.log('No new tags to create.');
  }
}

run()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
