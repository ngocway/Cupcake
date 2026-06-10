import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: ['query'] });

async function main() {
  console.log("Testing DB speed...");
  
  console.time('findUnique');
  const existing = await prisma.assignment.findUnique({ where: { id: 'cmq7rx9lj0005vtfg7nybuyvw' }});
  console.timeEnd('findUnique');
  
  if (!existing) {
      console.log('not found');
      return;
  }
  
  console.time('upsert');
  await prisma.assignment.upsert({
    where: { id: 'cmq7rx9lj0005vtfg7nybuyvw' },
    update: { updatedAt: new Date() },
    create: { id: 'cmq7rx9lj0005vtfg7nybuyvw', title: 'test', status: 'DRAFT', materialType: 'READING', teacherId: existing.teacherId }
  });
  console.timeEnd('upsert');
  
  console.time('findMany');
  await prisma.question.findMany({ where: { assignmentId: 'cmq7rx9lj0005vtfg7nybuyvw' } });
  console.timeEnd('findMany');

  console.time('deleteMany');
  await prisma.question.deleteMany({ where: { id: { in: ['non-existent'] } } });
  console.timeEnd('deleteMany');
  
  console.time('createMany');
  await prisma.question.createMany({
    data: [{
      id: 'test-q-1',
      assignmentId: 'cmq7rx9lj0005vtfg7nybuyvw',
      type: 'MULTIPLE_CHOICE',
      orderIndex: 0,
      points: 1,
      content: '{}',
      mediaType: 'NONE'
    }],
    skipDuplicates: true
  });
  console.timeEnd('createMany');
  
  console.time('cleanup');
  await prisma.question.delete({ where: { id: 'test-q-1' }});
  console.timeEnd('cleanup');
}
main().finally(() => prisma.$disconnect());
