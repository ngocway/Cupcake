import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Load env
import { generateTTSHelper } from "../src/actions/lesson-ai";

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

function getWavHeader(dataSize: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const fileSize = 36 + dataSize;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return header;
}

async function generateTTS(word: string, exampleSentence: string) {
  // Construct speech text following the required structure
  const speechText = `${word}. ${word}. ${exampleSentence} ${word}.`;
  // Use unified TTS helper with fallback logic. Use placeholder user ID for scripts.
  const ttsRes = await generateTTSHelper(speechText, "Aoede", 1.0, "script", "inline");
  return ttsRes.url;
}

async function main() {
  const cards = await prisma.globalFlashcard.findMany({
    where: {
      topic: {
        name: 'School'
      }
    }
  });

  console.log(`Found ${cards.length} cards in "School" topic.`);

  for (const card of cards) {
    if (!card.exampleSentence) {
      console.log(`Skipping "${card.word}" because it has no example sentence.`);
      continue;
    }

    console.log(`Generating audio for "${card.word}"...`);
    try {
      const publicUrl = await generateTTS(card.word, card.exampleSentence);
      console.log(`Audio URL: ${publicUrl}`);

      await prisma.globalFlashcard.update({
        where: {
          id: card.id
        },
        data: {
          audioUrl: publicUrl
        }
      });
      console.log(`Updated database for "${card.word}" successfully.`);
    } catch (err: any) {
      console.error(`Error for "${card.word}":`, err.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
