import "dotenv/config";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import {
  AVAILABLE_UNITS_BY_GRADE,
  hasGrammarQuestionAudio,
  loadGradeGrammarLessons,
} from "../src/data/global-success-grammar";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const DEEPGRAM_MODEL = "aura-2-thalia-en";
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "cupcake-media";

if (!DEEPGRAM_API_KEY) {
  console.error("Missing DEEPGRAM_API_KEY in .env");
  process.exit(1);
}
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2 credentials in .env");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function sanitizeForTts(raw: string): string {
  return raw
    .replace(/→/g, ". ")
    .replace(/—/g, ". ")
    .replace(/[^\p{L}\p{N}\s'.,?!-]/gu, " ")
    .replace(/\s+([.,?!])/g, "$1")
    .replace(/\.\s*\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCompletedSentence(prompt: string, correctOption: string): string {
  let filled = prompt;
  if (/_{2,}/.test(filled)) {
    filled = filled.replace(/_{2,}/, correctOption);
  } else {
    filled = `${filled} ${correctOption}`;
  }
  return sanitizeForTts(filled);
}

async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function synthesizeDeepgram(text: string): Promise<Buffer> {
  const res = await fetch(
    `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(DEEPGRAM_MODEL)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Deepgram HTTP ${res.status}: ${errText}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function uploadMp3(key: string, buffer: Buffer): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "audio/mpeg",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

interface AudioTask {
  key: string;
  text: string;
  label: string;
}

function parseTargetGrades(): number[] {
  const arg = process.argv.find((a) => a.startsWith("--grades="));
  if (arg) {
    return arg
      .replace("--grades=", "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
  }
  return Object.keys(AVAILABLE_UNITS_BY_GRADE)
    .map(Number)
    .sort((a, b) => a - b);
}

async function main() {
  const targetGrades = parseTargetGrades();
  const tasks: AudioTask[] = [];

  for (const grade of targetGrades) {
    const units = await loadGradeGrammarLessons(grade);
    if (!units) {
      console.warn(`Grade ${grade} grammar module not found, skipping.`);
      continue;
    }
    const includeQuestions = hasGrammarQuestionAudio(grade);
    for (const [unitStr, lesson] of Object.entries(units)) {
      const unit = Number(unitStr);
      lesson.summaryPoints.forEach((pt, pIdx) => {
        pt.examples.forEach((ex, eIdx) => {
          const text = sanitizeForTts(ex.en);
          if (text) {
            tasks.push({
              key: `global-success/grammar-audio/g${grade}/u${unit}/ex-${pIdx}-${eIdx}.mp3`,
              text,
              label: `G${grade} U${unit} ex-${pIdx}-${eIdx}`,
            });
          }
        });
      });

      if (includeQuestions) {
        lesson.questions.forEach((q) => {
          const correctOpt = q.options[q.correctIndex] || "";
          const text = buildCompletedSentence(q.prompt, correctOpt);
          if (text) {
            tasks.push({
              key: `global-success/grammar-audio/g${grade}/u${unit}/${q.id}.mp3`,
              text,
              label: `G${grade} U${unit} ${q.id}`,
            });
          }
        });
      }
    }
  }

  console.log(
    `Grades=[${targetGrades.join(",")}] | Found ${tasks.length} audio items (model=${DEEPGRAM_MODEL}, bucket=${R2_BUCKET_NAME}).`
  );

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let cursor = 0;
  const CONCURRENCY = 6;

  async function worker() {
    while (cursor < tasks.length) {
      const idx = cursor++;
      const task = tasks[idx];
      try {
        const exists = await objectExists(task.key);
        if (exists) {
          skipped++;
          if ((generated + skipped) % 50 === 0 || idx === tasks.length - 1) {
            console.log(
              `[${generated + skipped + failed}/${tasks.length}] generated=${generated} skipped=${skipped} failed=${failed}`
            );
          }
          continue;
        }
        const buf = await synthesizeDeepgram(task.text);
        await uploadMp3(task.key, buf);
        generated++;
        if ((generated + skipped) % 25 === 0 || idx === tasks.length - 1) {
          console.log(
            `[${generated + skipped + failed}/${tasks.length}] generated=${generated} skipped=${skipped} failed=${failed}`
          );
        }
      } catch (err: any) {
        failed++;
        console.error(`FAILED [${task.label}] "${task.text}":`, err?.message || err);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(
    `DONE! Total=${tasks.length} | Generated=${generated} | Skipped=${skipped} | Failed=${failed}`
  );
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
