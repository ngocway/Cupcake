import { PrismaClient } from '../src/generated/client/index.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Load env
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    }
  }
}
loadEnv();

const prisma = new PrismaClient();

const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 environment variables are missing');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
};

async function uploadToR2(filePath: string, word: string) {
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL;

  if (!bucketName || !publicUrlBase) {
    throw new Error('R2_BUCKET_NAME or NEXT_PUBLIC_R2_URL is not set');
  }

  const s3Client = getR2Client();
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = `cartoon-${word.toLowerCase()}-${Date.now()}.png`;
  const keyPath = `uploads/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: keyPath,
    Body: fileBuffer,
    ContentType: "image/png",
  });

  await s3Client.send(command);
  return `${publicUrlBase.replace(/\/$/, '')}/${keyPath}`;
}

async function main() {
  const brainDir = "C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\34013dbd-cbdd-42f7-8e0d-44b9f4de5998";
  if (!fs.existsSync(brainDir)) {
    console.error(`Brain directory does not exist: ${brainDir}`);
    return;
  }

  // Find all cards in In house and Hobbies & Sports
  const cards = await prisma.globalFlashcard.findMany({
    where: {
      topic: {
        name: {
          in: ['In house', 'Hobbies & Sports']
        }
      }
    }
  });

  console.log(`Checking for images for ${cards.length} cards...`);

  const filesInBrain = fs.readdirSync(brainDir);

  for (const card of cards) {
    const prefix = `cartoon_${card.word.toLowerCase().replace(/\s+/g, '_')}_`;
    const exactName = `cartoon_${card.word.toLowerCase().replace(/\s+/g, '_')}.png`;

    // Look for files starting with prefix and ending with .png, or matching exactName
    const matchingFile = filesInBrain.find(f => 
      (f.toLowerCase().startsWith(prefix.toLowerCase()) && f.toLowerCase().endsWith('.png')) ||
      f.toLowerCase() === exactName.toLowerCase()
    );

    if (matchingFile) {
      const fullPath = path.join(brainDir, matchingFile);
      console.log(`Found image for "${card.word}" at "${fullPath}". Uploading...`);
      try {
        const publicUrl = await uploadToR2(fullPath, card.word);
        console.log(`Uploaded R2 URL: ${publicUrl}`);

        await prisma.globalFlashcard.update({
          where: {
            id: card.id
          },
          data: {
            imageUrl: publicUrl
          }
        });
        console.log(`Updated database for "${card.word}" successfully.`);
        
        // Rename file to mark it as processed (so we don't upload again)
        const processedPath = path.join(brainDir, `processed_${matchingFile}`);
        fs.renameSync(fullPath, processedPath);
        console.log(`Moved file to ${processedPath}`);
      } catch (err: any) {
        console.error(`Error processing "${card.word}":`, err.message);
      }
    } else {
      // console.log(`No image file found for "${card.word}" (prefix expected: ${prefix}*.png)`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
