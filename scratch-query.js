const { PrismaClient } = require('./src/generated/client');
const p = new PrismaClient();

async function run() {
  const assignments = await p.assignment.findMany({
    where: { 
      title: {
        contains: 'Exploring Places in Town',
        mode: 'insensitive'
      }
    }
  });

  const lessons = await p.lesson.findMany({
    where: { 
      title: {
        contains: 'Exploring Places in Town',
        mode: 'insensitive'
      }
    }
  });

  console.log('--- ASSIGNMENTS ---');
  assignments.forEach(a => console.log(a.id, '|', a.title, '| slug:', a.slug));
  
  console.log('--- LESSONS ---');
  lessons.forEach(l => console.log(l.id, '|', l.title, '| slug:', l.slug, '| assignId:', l.assignmentId));
}

run().finally(() => p.$disconnect());
