const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.submission.findUnique({
  where: { id: 'cmppco6zk0001vtscmst3xs4c' },
  select: { id: true, studentId: true, assignmentId: true, submittedAt: true }
}).then(r => {
  console.log('Submission:', JSON.stringify(r, null, 2));
  return p.$disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  return p.$disconnect();
});
