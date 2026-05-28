const { PrismaClient } = require('./src/generated/client');
const p = new PrismaClient();

async function main() {
  const assignmentId = 'cmpcng1lm0028vt8sxq25zjc4';
  
  const assignment = await p.assignment.findFirst({
    where: { OR: [{ id: assignmentId }, { slug: assignmentId }] },
    select: { id: true, title: true, slug: true, status: true, maxAttempts: true }
  });
  
  console.log('Assignment:', JSON.stringify(assignment, null, 2));
  
  if (!assignment) {
    console.log('\n❌ Assignment không tồn tại trong DB!');
    
    // Check tổng số assignments
    const count = await p.assignment.count();
    console.log('Tổng số assignments trong DB:', count);
    
    // Lấy 3 cái mới nhất
    const latest = await p.assignment.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true, status: true }
    });
    console.log('3 assignments mới nhất:', JSON.stringify(latest, null, 2));
  } else {
    console.log('\n✅ Assignment tồn tại.');
    
    const subs = await p.submission.findMany({
      where: { assignmentId: assignment.id },
      select: { id: true, studentId: true, submittedAt: true, attemptNumber: true },
      take: 5
    });
    console.log('Submissions:', JSON.stringify(subs, null, 2));
  }
}

main().finally(() => p.$disconnect());
