/**
 * Backfill Script: AI Embedding for All Existing Content
 *
 * Run once to index all existing PUBLIC lessons and assignments:
 *   npx tsx scripts/backfill-embeddings.ts
 *
 * Options:
 *   --dry-run    Show what would be indexed, but don't write to DB
 *   --type=lesson|assignment  Only index one type
 *   --limit=N    Limit to N items (for testing)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const EMBEDDING_MODEL = 'gemini-embedding-001';
const TOP_K = 10;
const RATE_LIMIT_MS = 250; // ms between Gemini API calls to stay under quota

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const typeFilter = args.find(a => a.startsWith('--type='))?.split('=')[1];
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
const limit = limitArg ? parseInt(limitArg) : undefined;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function buildAssignmentText(a: any): string {
  const parts: string[] = [`Title: ${a.title}`];
  if (a.subject) parts.push(`Subject: ${a.subject}`);
  if (a.level) parts.push(`Level: ${a.level}`);
  if (a.targetAudiences?.length) parts.push(`Target Audiences: ${a.targetAudiences.join(', ')}`);
  if (a.tags) parts.push(`Tags: ${a.tags}`);
  if (a.shortDescription) parts.push(`Summary: ${a.shortDescription}`);
  if (a.instructions) parts.push(`Instructions: ${a.instructions}`);
  if (a.readingText) parts.push(`Reading Text: ${a.readingText.slice(0, 1000)}`);
  if (a.questions?.length) {
    const qTexts = a.questions.map((q: any, i: number) => {
      try {
        const p = JSON.parse(q.content);
        return `Q${i+1}: ${typeof p === 'string' ? p : p.question || p.text || p.stem || JSON.stringify(p)}`;
      } catch { return `Q${i+1}: ${q.content}`; }
    }).join(' | ');
    parts.push(`Questions: ${qTexts}`);
  }
  return parts.join('\n').slice(0, 8000);
}

function buildLessonText(l: any): string {
  const parts: string[] = [`Title: ${l.title}`];
  if (l.description) parts.push(`Description: ${l.description}`);
  if (l.level) parts.push(`Level: ${l.level}`);
  if (l.targetAudiences?.length) parts.push(`Target Audiences: ${l.targetAudiences.join(', ')}`);
  const a = l.assignment;
  if (a) {
    if (a.subject) parts.push(`Subject: ${a.subject}`);
    if (a.tags) parts.push(`Tags: ${a.tags}`);
    if (a.shortDescription) parts.push(`Summary: ${a.shortDescription}`);
    if (a.instructions) parts.push(`Instructions: ${a.instructions}`);
    if (a.questions?.length) {
      const qTexts = a.questions.map((q: any, i: number) => {
        try {
          const p = JSON.parse(q.content);
          return `Q${i+1}: ${typeof p === 'string' ? p : p.question || p.text || p.stem || JSON.stringify(p)}`;
        } catch { return `Q${i+1}: ${q.content}`; }
      }).join(' | ');
      parts.push(`Questions: ${qTexts}`);
    }
  }
  return parts.join('\n').slice(0, 8000);
}

async function backfillAssignments() {
  console.log('\n📦 Fetching PUBLIC assignments (exercises without linked lesson)...');
  const assignments = await prisma.assignment.findMany({
    where: { status: 'PUBLIC', deletedAt: null, lesson: null },
    select: {
      id: true, slug: true, title: true, subject: true, level: true,
      targetAudiences: true, tags: true, shortDescription: true,
      instructions: true, readingText: true,
      questions: { select: { content: true } }
    },
    take: limit
  });

  console.log(`Found ${assignments.length} assignments to index.`);
  if (isDryRun) {
    assignments.forEach((a, i) => console.log(`  [${i+1}] ${a.id} — ${a.title}`));
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    process.stdout.write(`  [${i+1}/${assignments.length}] ${a.title.slice(0, 50)}... `);
    try {
      const text = buildAssignmentText(a);
      const embedding = await generateEmbedding(text);

      await prisma.contentEmbedding.upsert({
        where: { contentId_contentType: { contentId: a.id, contentType: 'ASSIGNMENT' } },
        create: { contentId: a.id, contentType: 'ASSIGNMENT', embedding },
        update: { embedding }
      });

      process.stdout.write('✓ embedded\n');
      successCount++;
      await sleep(RATE_LIMIT_MS);
    } catch (err: any) {
      process.stdout.write(`✗ ${err.message}\n`);
      errorCount++;
      await sleep(RATE_LIMIT_MS * 2); // extra back-off on error
    }
  }

  // Phase 2: compute similarities and update relatedAssignmentIds
  console.log('\n🔗 Computing assignment similarities...');
  const allEmbeddings = await prisma.contentEmbedding.findMany({
    where: { contentType: 'ASSIGNMENT' },
    select: { contentId: true, embedding: true }
  });

  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    const myEmb = allEmbeddings.find(e => e.contentId === a.id);
    if (!myEmb) continue;

    const scored = allEmbeddings
      .filter(e => e.contentId !== a.id)
      .map(e => ({ id: e.contentId, score: cosineSimilarity(myEmb.embedding, e.embedding) }));
    scored.sort((x, y) => y.score - x.score);
    const topIds = scored.slice(0, TOP_K).map(s => s.id);

    await prisma.assignment.update({
      where: { id: a.id },
      data: { relatedAssignmentIds: topIds }
    });
    process.stdout.write(`  [${i+1}/${assignments.length}] Updated related IDs for ${a.id}\n`);
  }

  console.log(`\n✅ Assignments done: ${successCount} indexed, ${errorCount} errors.`);
}

async function backfillLessons() {
  console.log('\n📖 Fetching PUBLIC lessons...');
  const lessons = await prisma.lesson.findMany({
    where: { deletedAt: null, isBlocked: false, assignment: { status: 'PUBLIC' } },
    select: {
      id: true, slug: true, title: true, description: true,
      targetAudiences: true, level: true,
      assignment: {
        select: {
          tags: true, subject: true, shortDescription: true, instructions: true,
          questions: { select: { content: true } }
        }
      }
    },
    take: limit
  });

  console.log(`Found ${lessons.length} lessons to index.`);
  if (isDryRun) {
    lessons.forEach((l, i) => console.log(`  [${i+1}] ${l.id} — ${l.title}`));
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    process.stdout.write(`  [${i+1}/${lessons.length}] ${l.title.slice(0, 50)}... `);
    try {
      const text = buildLessonText(l);
      const embedding = await generateEmbedding(text);

      await prisma.contentEmbedding.upsert({
        where: { contentId_contentType: { contentId: l.id, contentType: 'LESSON' } },
        create: { contentId: l.id, contentType: 'LESSON', embedding },
        update: { embedding }
      });

      process.stdout.write('✓ embedded\n');
      successCount++;
      await sleep(RATE_LIMIT_MS);
    } catch (err: any) {
      process.stdout.write(`✗ ${err.message}\n`);
      errorCount++;
      await sleep(RATE_LIMIT_MS * 2);
    }
  }

  // Phase 2: compute similarities and update relatedLessonIds
  console.log('\n🔗 Computing lesson similarities...');
  const allEmbeddings = await prisma.contentEmbedding.findMany({
    where: { contentType: 'LESSON' },
    select: { contentId: true, embedding: true }
  });

  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    const myEmb = allEmbeddings.find(e => e.contentId === l.id);
    if (!myEmb) continue;

    const scored = allEmbeddings
      .filter(e => e.contentId !== l.id)
      .map(e => ({ id: e.contentId, score: cosineSimilarity(myEmb.embedding, e.embedding) }));
    scored.sort((x, y) => y.score - x.score);
    const topIds = scored.slice(0, TOP_K).map(s => s.id);

    await prisma.lesson.update({
      where: { id: l.id },
      data: { relatedLessonIds: topIds }
    });
    process.stdout.write(`  [${i+1}/${lessons.length}] Updated related IDs for ${l.id}\n`);
  }

  console.log(`\n✅ Lessons done: ${successCount} indexed, ${errorCount} errors.`);
}

async function main() {
  console.log('🚀 AI Embedding Backfill Script');
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`   Type filter: ${typeFilter ?? 'all'}`);
  console.log(`   Limit: ${limit ?? 'none'}`);
  console.log(`   API: Gemini ${EMBEDDING_MODEL}`);
  console.log('');

  try {
    if (!typeFilter || typeFilter === 'assignment') {
      await backfillAssignments();
    }
    if (!typeFilter || typeFilter === 'lesson') {
      await backfillLessons();
    }
    console.log('\n🎉 Backfill complete!');
  } catch (err) {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
