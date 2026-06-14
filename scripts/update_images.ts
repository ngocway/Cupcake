import { PrismaClient } from '../src/generated/client/index.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const images = [
    { word: 'Map', file: 'map_cartoon_1781339694109.png' },
    { word: 'Notebook', file: 'notebook_cartoon_1781339705073.png' },
    { word: 'Scissors', file: 'scissors_cartoon_1781339715640.png' },
    { word: 'Classroom', file: 'classroom_cartoon_1781339727546.png' },
    { word: 'Computer', file: 'computer_cartoon_1781339738566.png' },
    { word: 'Blackboard', file: 'blackboard_cartoon_1781339760247.png' },
    { word: 'Backpack', file: 'backpack_cartoon_1781339769358.png' },
    { word: 'Student', file: 'student_cartoon_1781339781146.png' },
    { word: 'Teacher', file: 'teacher_cartoon_1781339791232.png' },
    { word: 'Chair', file: 'chair_cartoon_1781339800973.png' }
  ];

  const sourceDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\34013dbd-cbdd-42f7-8e0d-44b9f4de5998';
  const destDir = path.join(process.cwd(), 'public', 'images', 'flashcards', 'school');

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (const img of images) {
    const sourcePath = path.join(sourceDir, img.file);
    const destPath = path.join(destDir, img.file);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      const relativeUrl = `/images/flashcards/school/${img.file}`;
      
      const result = await prisma.globalFlashcard.updateMany({
        where: {
          word: img.word
        },
        data: {
          imageUrl: relativeUrl
        }
      });
      console.log(`Updated ${img.word}: ${result.count} records`);
    } else {
      console.log(`Source not found: ${sourcePath}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
