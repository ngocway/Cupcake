/**
 * AI Embedding Library for Related Content Recommendations
 *
 * Uses Gemini text-embedding-004 to generate 768-dim vectors for lessons
 * and assignments, then computes cosine similarity to find related content.
 * Results are stored directly in the Lesson/Assignment DB records so the
 * student-facing pages just do a simple DB read — no AI call at request time.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EMBEDDING_MODEL = 'gemini-embedding-001';
const TOP_K = 10; // Number of related items to store per content

// ---------------------------------------------------------------------------
// Text builders
// ---------------------------------------------------------------------------

function buildLessonText(lesson: {
  title: string;
  description?: string | null;
  targetAudiences?: string[];
  level?: string | null;
  assignment?: {
    tags?: string | null;
    subject?: string | null;
    shortDescription?: string | null;
    instructions?: string | null;
    questions?: Array<{ content: string }>;
  } | null;
}): string {
  const parts: string[] = [];

  parts.push(`Title: ${lesson.title}`);

  if (lesson.description) parts.push(`Description: ${lesson.description}`);
  if (lesson.level) parts.push(`Level: ${lesson.level}`);
  if (lesson.targetAudiences?.length) {
    parts.push(`Target Audiences: ${lesson.targetAudiences.join(', ')}`);
  }

  const a = lesson.assignment;
  if (a) {
    if (a.subject) parts.push(`Subject: ${a.subject}`);
    if (a.tags) parts.push(`Tags: ${a.tags}`);
    if (a.shortDescription) parts.push(`Summary: ${a.shortDescription}`);
    if (a.instructions) parts.push(`Instructions: ${a.instructions}`);

    if (a.questions?.length) {
      const questionTexts = a.questions
        .map((q, i) => {
          try {
            const parsed = JSON.parse(q.content);
            const text =
              typeof parsed === 'string'
                ? parsed
                : parsed.question || parsed.text || parsed.stem || JSON.stringify(parsed);
            return `Q${i + 1}: ${text}`;
          } catch {
            return `Q${i + 1}: ${q.content}`;
          }
        })
        .join(' | ');
      parts.push(`Questions: ${questionTexts}`);
    }
  }

  return parts.join('\n').slice(0, 8000); // Gemini embedding input limit safeguard
}

function buildAssignmentText(assignment: {
  title: string;
  shortDescription?: string | null;
  instructions?: string | null;
  tags?: string | null;
  subject?: string | null;
  level?: string | null;
  targetAudiences?: string[];
  readingText?: string | null;
  questions?: Array<{ content: string }>;
}): string {
  const parts: string[] = [];

  parts.push(`Title: ${assignment.title}`);

  if (assignment.subject) parts.push(`Subject: ${assignment.subject}`);
  if (assignment.level) parts.push(`Level: ${assignment.level}`);
  if (assignment.targetAudiences?.length) {
    parts.push(`Target Audiences: ${assignment.targetAudiences.join(', ')}`);
  }
  if (assignment.tags) parts.push(`Tags: ${assignment.tags}`);
  if (assignment.shortDescription) parts.push(`Summary: ${assignment.shortDescription}`);
  if (assignment.instructions) parts.push(`Instructions: ${assignment.instructions}`);
  if (assignment.readingText) parts.push(`Reading Text: ${assignment.readingText.slice(0, 1000)}`);

  if (assignment.questions?.length) {
    const questionTexts = assignment.questions
      .map((q, i) => {
        try {
          const parsed = JSON.parse(q.content);
          const text =
            typeof parsed === 'string'
              ? parsed
              : parsed.question || parsed.text || parsed.stem || JSON.stringify(parsed);
          return `Q${i + 1}: ${text}`;
        } catch {
          return `Q${i + 1}: ${q.content}`;
        }
      })
      .join(' | ');
    parts.push(`Questions: ${questionTexts}`);
  }

  return parts.join('\n').slice(0, 8000);
}

// ---------------------------------------------------------------------------
// Embedding generation
// ---------------------------------------------------------------------------

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel(
    { model: EMBEDDING_MODEL },
    process.env.GEMINI_API_ENDPOINT ? { baseUrl: process.env.GEMINI_API_ENDPOINT } : undefined
  );
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// ---------------------------------------------------------------------------
// Cosine similarity
// ---------------------------------------------------------------------------

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// Reindex: Lesson
// ---------------------------------------------------------------------------

export async function reindexLesson(lessonId: string): Promise<void> {
  try {
    // 1. Fetch lesson with full content
    const lesson = await prisma.lesson.findFirst({
      where: { OR: [{ id: lessonId }, { slug: lessonId }], deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        targetAudiences: true,
        level: true,
        assignment: {
          select: {
            tags: true,
            subject: true,
            shortDescription: true,
            instructions: true,
            questions: { select: { content: true } }
          }
        }
      }
    });

    if (!lesson) {
      console.warn(`[AI Reindex] Lesson not found: ${lessonId}`);
      return;
    }

    const actualId = lesson.id;

    // 2. Build text and generate embedding
    const text = buildLessonText(lesson);
    const embedding = await generateEmbedding(text);

    // 3. Upsert embedding into DB
    await prisma.contentEmbedding.upsert({
      where: { contentId_contentType: { contentId: actualId, contentType: 'LESSON' } },
      create: { contentId: actualId, contentType: 'LESSON', embedding },
      update: { embedding }
    });

    // 4. Fetch all LESSON embeddings (exclude self)
    const allEmbeddings = await prisma.contentEmbedding.findMany({
      where: { contentType: 'LESSON', contentId: { not: actualId } },
      select: { contentId: true, embedding: true }
    });

    // 5. Compute cosine similarity and take top K
    const scored = allEmbeddings.map(e => ({
      id: e.contentId,
      score: cosineSimilarity(embedding, e.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);
    const topIds = scored.slice(0, TOP_K).map(s => s.id);

    // 6. Save related IDs back to Lesson record
    await prisma.lesson.update({
      where: { id: actualId },
      data: { relatedLessonIds: topIds }
    });

    // 7. Invalidate Redis cache for both id and slug variants
    try {
      await redis.del(`lesson:related:${actualId}`);
      if (lesson.slug) await redis.del(`lesson:related:${lesson.slug}`);
    } catch {
      // Redis unavailable — not critical
    }

    console.log(`[AI Reindex] Lesson ${actualId} indexed. Top ${topIds.length} related found.`);
  } catch (err) {
    console.error(`[AI Reindex] Error reindexing lesson ${lessonId}:`, err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Reindex: Assignment (Exercise / Flashcard — NOT linked to a Lesson)
// ---------------------------------------------------------------------------

export async function reindexAssignment(assignmentId: string): Promise<void> {
  try {
    // 1. Fetch assignment with full content
    const assignment = await prisma.assignment.findFirst({
      where: { OR: [{ id: assignmentId }, { slug: assignmentId }], deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        instructions: true,
        tags: true,
        subject: true,
        level: true,
        targetAudiences: true,
        readingText: true,
        questions: { select: { content: true } }
      }
    });

    if (!assignment) {
      console.warn(`[AI Reindex] Assignment not found: ${assignmentId}`);
      return;
    }

    const actualId = assignment.id;

    // 2. Build text and generate embedding
    const text = buildAssignmentText(assignment);
    const embedding = await generateEmbedding(text);

    // 3. Upsert embedding into DB
    await prisma.contentEmbedding.upsert({
      where: { contentId_contentType: { contentId: actualId, contentType: 'ASSIGNMENT' } },
      create: { contentId: actualId, contentType: 'ASSIGNMENT', embedding },
      update: { embedding }
    });

    // 4. Fetch all ASSIGNMENT embeddings (exclude self)
    const allEmbeddings = await prisma.contentEmbedding.findMany({
      where: { contentType: 'ASSIGNMENT', contentId: { not: actualId } },
      select: { contentId: true, embedding: true }
    });

    // 5. Compute cosine similarity and take top K
    const scored = allEmbeddings.map(e => ({
      id: e.contentId,
      score: cosineSimilarity(embedding, e.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);
    const topIds = scored.slice(0, TOP_K).map(s => s.id);

    // 6. Save related IDs back to Assignment record
    await prisma.assignment.update({
      where: { id: actualId },
      data: { relatedAssignmentIds: topIds }
    });

    // 7. Invalidate Redis cache
    try {
      await redis.del(`assignment:related:${actualId}`);
      if (assignment.slug) await redis.del(`assignment:related:${assignment.slug}`);
    } catch {
      // Redis unavailable — not critical
    }

    console.log(`[AI Reindex] Assignment ${actualId} indexed. Top ${topIds.length} related found.`);
  } catch (err) {
    console.error(`[AI Reindex] Error reindexing assignment ${assignmentId}:`, err);
    throw err;
  }
}
