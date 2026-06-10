import { generateThumbnailFromTitle } from './src/actions/ai-image-generator';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const title = "Mastering the Present Simple Forms of 'To Be'";
  console.log("Generating thumbnail for:", title);
  
  const result = await generateThumbnailFromTitle(title);
  if (result.success && result.url) {
    console.log("Thumbnail generated successfully:", result.url);
    
    const assignments = await prisma.assignment.findMany({
      where: {
        title: {
          contains: "Present Simple Forms of 'To Be'"
        }
      }
    });

    if (assignments.length > 0) {
      for (const assignment of assignments) {
        await prisma.assignment.update({
          where: { id: assignment.id },
          data: { thumbnail: result.url }
        });
        console.log(`Updated thumbnail for assignment: ${assignment.title} (ID: ${assignment.id})`);
      }
    } else {
      console.log("Assignment not found");
    }
  } else {
    console.error("Failed to generate thumbnail:", result.error);
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
