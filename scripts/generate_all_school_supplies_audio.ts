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

async function generateTTS(text: string, exampleSentence: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY or GOOGLE_API_KEY in environment variables");
  }

  // Cấu trúc: Từ vựng. Từ vựng. Câu ví dụ. Từ vựng.
  const speechText = `${text}. ${text}. ${exampleSentence} ${text}.`;
  const ssmlText = `<speak><prosody rate="slow">${speechText}</prosody></speak>`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;

  const geminiReqBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: ssmlText }]
      }
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Aoede"
          }
        }
      }
    }
  };

  const response = await fetch(geminiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(geminiReqBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const inlineData = parts.find((p: any) => p.inlineData)?.inlineData;

  if (!inlineData || !inlineData.data) {
    throw new Error("No audio data returned from Gemini");
  }

  const pcmBuffer = Buffer.from(inlineData.data, "base64");
  const wavHeader = getWavHeader(pcmBuffer.length, 24000, 1, 16);
  return Buffer.concat([wavHeader, pcmBuffer]);
}

async function uploadToR2(buffer: Buffer, word: string) {
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL;

  if (!bucketName || !publicUrlBase) {
    throw new Error('R2_BUCKET_NAME or NEXT_PUBLIC_R2_URL is not set');
  }

  const s3Client = getR2Client();
  const fileName = `tts-gemini-admin-${word.toLowerCase()}-${Date.now()}.wav`;
  const filePath = `uploads/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filePath,
    Body: buffer,
    ContentType: "audio/wav",
  });

  await s3Client.send(command);
  return `${publicUrlBase.replace(/\/$/, '')}/${filePath}`;
}

async function main() {
  const cards = await prisma.globalFlashcard.findMany({
    where: {
      topic: {
        name: 'School supplies'
      }
    }
  });

  console.log(`Found ${cards.length} cards in "School supplies" topic.`);

  for (const card of cards) {
    if (!card.exampleSentence) {
      console.log(`Skipping "${card.word}" because it has no example sentence.`);
      continue;
    }

    console.log(`Generating audio for "${card.word}"...`);
    try {
      const audioBuffer = await generateTTS(card.word, card.exampleSentence);
      console.log(`Uploading audio for "${card.word}" to R2...`);
      const publicUrl = await uploadToR2(audioBuffer, card.word);
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
