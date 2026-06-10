const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const publicImagesDir = path.join(__dirname, 'public', 'images');
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
  }

  // Paths of generated images
  const p1Src = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\91de253f-4890-4722-8459-ead2bb1ab468\\adjectives_prepositions_p1_1781077776184.png';
  const p2Src = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\91de253f-4890-4722-8459-ead2bb1ab468\\adjectives_prepositions_p2_1781077787297.png';

  const p1Dest = path.join(publicImagesDir, 'p1_thumb.png');
  const p2Dest = path.join(publicImagesDir, 'p2_thumb.png');

  // Copy files
  fs.copyFileSync(p1Src, p1Dest);
  fs.copyFileSync(p2Src, p2Dest);

  // Update DB for P1
  const assignmentsP1 = await prisma.assignment.findMany({
    where: { title: { contains: 'Understanding Adjectives and Prepositions (P1)' } }
  });
  if (assignmentsP1.length > 0) {
    await prisma.assignment.update({
      where: { id: assignmentsP1[0].id },
      data: { thumbnail: '/images/p1_thumb.png' }
    });
    console.log('Updated P1:', assignmentsP1[0].id);
  } else {
      console.log('P1 not found in DB');
  }

  // Update DB for P2
  const assignmentsP2 = await prisma.assignment.findMany({
    where: { title: { contains: 'Understanding Adjectives and Prepositions (P2)' } }
  });
  if (assignmentsP2.length > 0) {
    await prisma.assignment.update({
      where: { id: assignmentsP2[0].id },
      data: { thumbnail: '/images/p2_thumb.png' }
    });
    console.log('Updated P2:', assignmentsP2[0].id);
  } else {
      console.log('P2 not found in DB');
  }

  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
