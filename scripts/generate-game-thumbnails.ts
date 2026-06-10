import { PrismaClient } from "../src/generated/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const API_KEY = process.env.GEMINI_API_KEY;

async function generateImage(prompt: string): Promise<Buffer | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`;
  
  const payload = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "16:9",
      personGeneration: "DONT_ALLOW"
    }
  };

  try {
    console.log(`Generating image for prompt: "${prompt}"...`);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json() as any;
    if (data.error) {
      console.error("Gemini API Error:", data.error.message);
      return null;
    }

    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      return Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
    }
    
    console.log("No predictions returned:", data);
    return null;
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

async function run() {
  if (!API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), "public", "games", "thumbnails");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Process Match Word Games
  const matchWords = await prisma.matchWordGame.findMany();
  for (const game of matchWords) {
    // @ts-ignore - ignoring typescript errors due to failed prisma generate
    if (!game.thumbnailUrl) {
      const prompt = `A simple, cute, vibrant 2D cartoon illustration for an English learning game about ${game.name}, flat vector style, no text, clean background`;
      const buffer = await generateImage(prompt);
      
      if (buffer) {
        const filename = `match-words-${game.id}.png`;
        fs.writeFileSync(path.join(outDir, filename), buffer);
        
        // @ts-ignore
        await prisma.matchWordGame.update({
          where: { id: game.id },
          data: { thumbnailUrl: `/games/thumbnails/${filename}` }
        });
        console.log(`Updated Match Word Game: ${game.name}`);
      }
    } else {
      console.log(`Skipping ${game.name}, already has thumbnail.`);
    }
  }

  // 2. Process Sentence Builder Games
  // @ts-ignore
  const sentenceBuilders = await prisma.sentenceBuilderGame.findMany();
  for (const game of sentenceBuilders) {
    // @ts-ignore
    if (!game.thumbnailUrl) {
      const prompt = `A simple, cute, vibrant 2D cartoon illustration for an English learning sentence building game about ${game.name}, flat vector style, no text, clean background`;
      const buffer = await generateImage(prompt);
      
      if (buffer) {
        const filename = `sentence-builder-${game.id}.png`;
        fs.writeFileSync(path.join(outDir, filename), buffer);
        
        // @ts-ignore
        await prisma.sentenceBuilderGame.update({
          where: { id: game.id },
          data: { thumbnailUrl: `/games/thumbnails/${filename}` }
        });
        console.log(`Updated Sentence Builder Game: ${game.name}`);
      }
    } else {
      console.log(`Skipping ${game.name}, already has thumbnail.`);
    }
  }

  console.log("Finished generating thumbnails!");
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
