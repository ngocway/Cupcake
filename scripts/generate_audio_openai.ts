import { PrismaClient } from '../src/generated/client/index.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import OpenAI from 'openai';
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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

async function main() {
  const cards = [
    { word: 'sticker', sentence: 'The sticker is on the wall.' },
    { word: 'chalk', sentence: 'The chalk is white.' }
  ];

  for (const card of cards) {
    try {
      console.log(`Generating OpenAI TTS for "${card.word}"...`);
      // Formula: sticker. sticker. The sticker is on the wall. sticker.
      const text = `${card.word}. ${card.word}. ${card.sentence} ${card.word}.`;
      
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());

      console.log(`Uploading to R2...`);
      const s3Client = getR2Client();
      const fileName = `tts-openai-admin-${card.word.toLowerCase()}-${Date.now()}.mp3`;
      const filePath = `uploads/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: filePath,
        Body: buffer,
        ContentType: "audio/mp3",
      });

      await s3Client.send(command);
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_URL!.replace(/\/$/, '')}/${filePath}`;
      console.log(`Uploaded: ${publicUrl}`);

      const result = await prisma.globalFlashcard.updateMany({
        where: {
          word: card.word,
          topic: {
            name: 'School supplies'
          }
        },
        data: {
          audioUrl: publicUrl
        }
      });
      console.log(`Updated DB for "${card.word}": ${result.count} records`);
    } catch (err: any) {
      console.error(`Error for ${card.word}:`, err.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
