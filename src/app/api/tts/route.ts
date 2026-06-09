import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import openai from "@/lib/openai";

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

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Missing GEMINI_API_KEY in environment variables" }, { status: 500 });
    }

    // Call Gemini TTS API to generate speech
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;
    
    let rateStr = "100%";
    if (speed !== undefined && speed !== null) {
      rateStr = `${Math.round(speed * 100)}%`;
    } else if (mode !== "inline" && mode !== "global") {
      rateStr = "slow";
    }

    const ssmlText = `<speak><prosody rate="${rateStr}">${speechText}</prosody></speak>`;

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
              voiceName: voice || "Aoede" // Có thể thay bằng: Puck, Charon, Kore, Fenrir
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
      console.error("Gemini TTS Error:", errText);
      throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    
    // Extract base64 audio data from Gemini response
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const inlineData = parts.find((p: any) => p.inlineData)?.inlineData;
    
    if (!inlineData || !inlineData.data) {
      console.error("No inline data in response:", JSON.stringify(data, null, 2));
      throw new Error("No audio data returned from Gemini");
    }

    // Gemini returns base64 string containing raw PCM audio (audio/l16; rate=24000; channels=1)
    const pcmBuffer = Buffer.from(inlineData.data, "base64");
    
    // Trình duyệt không thể phát trực tiếp raw PCM (l16), ta phải bọc nó vào định dạng WAV
    const wavHeader = getWavHeader(pcmBuffer.length, 24000, 1, 16);
    const buffer = Buffer.concat([wavHeader, pcmBuffer]);
    
    const mimeType = "audio/wav";

    // Upload lên Cloudflare R2
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.NEXT_PUBLIC_R2_URL;

    if (!bucketName || !publicUrlBase) {
      throw new Error('R2_BUCKET_NAME or NEXT_PUBLIC_R2_URL is not set');
    }

    const s3Client = getR2Client();
    const fileExtension = mimeType.includes("mp3") ? "mp3" : mimeType.includes("pcm") ? "pcm" : "wav";
    const fileName = `tts-gemini-${session.user.id}-${Date.now()}.${fileExtension}`;
    const filePath = `uploads/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    const publicUrl = `${publicUrlBase.replace(/\/$/, '')}/${filePath}`;

    let words = null;
    if (mode === "global") {
      try {
        const { toFile } = await import("openai");
        const file = await toFile(buffer, "speech.wav", { type: "audio/wav" });
        const transcription = await openai.audio.transcriptions.create({
          file,
          model: "whisper-1",
          response_format: "verbose_json",
          timestamp_granularities: ["word"],
        });
        words = transcription.words;
      } catch (err) {
        console.error("OpenAI Whisper alignment failed:", err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl, 
      audioUrl: publicUrl,
      words
    });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
