const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const publicImagesDir = path.join(__dirname, 'public', 'images');
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
  }

  const srcFile = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\91de253f-4890-4722-8459-ead2bb1ab468\\tobe_part2_16_9_1781081501466.png';
  const destFileName = 'tobe_part2_16_9.png';
  const destFile = path.join(publicImagesDir, destFileName);

  fs.copyFileSync(srcFile, destFile);
  console.log('Image copied to', destFile);

  const assignments = await prisma.assignment.findMany({
    where: {
      title: {
        contains: "Present Simple 'To Be' Forms (Part 2)"
      }
    }
  });

  if (assignments.length > 0) {
    for (const assignment of assignments) {
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { thumbnail: `/images/${destFileName}` }
      });
      console.log(`Updated thumbnail for assignment: ${assignment.title} (ID: ${assignment.id})`);
    }
  } else {
    console.log("Assignment not found");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
