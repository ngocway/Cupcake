import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import openai from "@/lib/openai";
import { generateTTSHelper } from "@/actions/lesson-ai";

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
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return header;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { text, exampleSentence, voice, speed, mode } = await req.json();
    if (!text) {
      return NextResponse.json({ success: false, error: "Missing text input" }, { status: 400 });
    }

    let speechText = text;
    if (mode === "inline" || mode === "global") {
      speechText = text;
    } else if (exampleSentence && exampleSentence.trim()) {
      // Cấu trúc: Từ vựng. Từ vựng. Câu ví dụ. Từ vựng.
      // Dấu chấm giúp AI đọc có nhịp nghỉ (pause) tự nhiên giữa các phần
      speechText = `${text}. ${text}. ${exampleSentence} ${text}.`;
    }

    // Use unified TTS helper with fallback and retries
    const ttsRes = await generateTTSHelper(speechText, voice, speed, session.user.id, mode);

    return NextResponse.json({ 
      success: true, 
      url: ttsRes.url, 
      audioUrl: ttsRes.url,
      words: ttsRes.words
    });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
