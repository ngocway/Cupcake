"use server"

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from "next/cache";
import { syncToHomepageFeed, removeFromHomepageFeed } from "@/lib/feed-sync";
import { invalidateMaterialCache } from '@/lib/cached-queries';
import crypto from 'crypto';
import { MaterialStatus, MaterialType, BookStatus } from '@prisma/client';
import { after } from 'next/server';
import { generateUniqueSlug } from '@/lib/slugify';
import openai from "@/lib/openai";
import { reindexAssignment, reindexLesson } from '@/lib/ai-embeddings';
import { getTopicById, GRAMMAR_TOPICS } from '@/lib/grammar-taxonomy';


export async function generateMaterialThumbnail(assignment: { title: string; subject: string | null }, questions: any[]) {
  // Analyze content to create a stable seed
  let contentText = assignment.title;
  questions.forEach(q => {
    // Basic extraction from common question structures
    const c = typeof q.content === 'object' ? q.content : (typeof q.content === 'string' ? JSON.parse(q.content) : q);
    
    // Extract text based on question structure
    const textElements = [
      c?.questionText, 
      c?.statement, 
      c?.instruction, 
      c?.textWithBlanks,
      q?.explanation
    ];
    
    contentText += textElements.filter(Boolean).join('');
    
    // Add options/items for more uniqueness with safety checks
    if (Array.isArray(c?.options)) c.options.forEach((o: any) => contentText += (o?.text || ''));
    if (Array.isArray(c?.pairs)) c.pairs.forEach((p: any) => contentText += (p?.rightText || ''));
    if (Array.isArray(c?.items)) c.items.forEach((i: any) => contentText += (i?.text || ''));
  });

  const hash = crypto.createHash('sha256').update(contentText || 'default-seed').digest('hex');
  
  // Reasonable coloring based on subject
  let rowColor = '2563eb'; // Default Blue
  const subject = assignment.subject || '';
  if (subject.includes('Toán')) rowColor = '3b82f6';
  else if (subject.includes('Anh')) rowColor = '6366f1';
  else if (subject.includes('Văn')) rowColor = 'f97316';
  else if (subject.includes('Khoa học')) rowColor = '14b8a6';
  else if (subject.includes('Lịch sử')) rowColor = 'ef4444';
  
  // Return DiceBear Identicon URL
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${hash}&backgroundColor=f0f2f4&rowColor=${rowColor}`;
}

export async function createDraftMaterial(type: any = 'READING') {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const slug = await generateUniqueSlug('Bài học mới', 'assignment');
  const newAss = await prisma.assignment.create({
    data: {
      title: 'Bài học mới',
      slug,
      materialType: type,
      teacherId: session.user.id,
      status: 'DRAFT'
    }
  });

  return newAss.id;
}

export async function createMaterialWithQuestions(payload: {
  title: string;
  materialType: any;
  questions: any[];
  subject?: string;
  gradeLevel?: string;
  shortDescription?: string;
  instructions?: string;
  instructionsTranslations?: any;
  instructionsImageUrl?: string | null;
  targetAudiences?: string[];
  thumbnailImagePrompt?: string;
  level?: string;
  audienceLevels?: any;
  learningGoals?: string[];
  grammarTopic?: string | null;
  grammarLesson?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const slug = await generateUniqueSlug(payload.title, 'assignment');
  
  // Generate a placeholder thumbnail using our helper
  const thumbnail = await generateMaterialThumbnail(
    { title: payload.title, subject: payload.subject || 'English' },
    payload.questions
  );

  const newAss = await prisma.assignment.create({
    data: {
      title: payload.title,
      slug,
      materialType: payload.materialType || 'EXERCISE',
      teacherId: session.user.id,
      status: 'DRAFT',
      subject: payload.subject || null,
      gradeLevel: payload.gradeLevel || null,
      shortDescription: payload.shortDescription || null,
      instructions: payload.instructions || null,
      instructionsTranslations: payload.instructionsTranslations || null,
      instructionsImageUrl: payload.instructionsImageUrl || null,
      targetAudiences: payload.targetAudiences || [],
      level: payload.level || null,
      audienceLevels: payload.audienceLevels || null,
      learningGoals: payload.learningGoals || [],
      grammarTopic: payload.grammarTopic || null,
      grammarLesson: payload.grammarLesson || null,
      thumbnail,
      questions: {
        create: payload.questions.map((q, idx) => ({
          type: q.type,
          orderIndex: idx,
          points: Number(q.points) || 1.0,
          explanation: q.explanation || null,
          explanationTranslations: q.explanationTranslations || null,
          content: typeof q.content === 'object' ? JSON.stringify(q.content) : q.content || "{}",
          mediaType: q.mediaType || 'NONE',
          mediaUrl: q.mediaUrl || null,
          imageUrl: q.imageUrl || null,
          audioUrl: q.audioUrl || null,
          videoUrl: q.videoUrl || null,
          isBanked: q.isBanked !== undefined ? q.isBanked : (q.isAiGenerated ? false : true),
          isAiGenerated: q.isAiGenerated || false,
          originalId: q.originalId || null
        }))
      }
    }
  });

  // Run background task for DALL-E image generation & update DB
  if (payload.thumbnailImagePrompt && newAss.id) {
    const assignmentId = newAss.id;
    after(async () => {
      try {
        const { generateDalleImage } = await import('@/actions/ai-actions');
        const { uploadBase64Image } = await import('@/actions/upload-actions');
        console.log(`[Background] Starting DALL-E image generation for assignment ${assignmentId}`);
        const imageResult = await generateDalleImage(payload.thumbnailImagePrompt!);
        if (imageResult.base64) {
          const uploadResult = await uploadBase64Image(imageResult.base64, assignmentId);
          if (uploadResult.success && uploadResult.url) {
            await prisma.assignment.update({
              where: { id: assignmentId },
              data: { thumbnail: uploadResult.url }
            });
            console.log(`[Background] Successfully updated thumbnail for assignment ${assignmentId} to: ${uploadResult.url}`);
          }
        }
      } catch (err) {
        console.error(`[Background] Error in DALL-E generation task:`, err);
      }
    });
  }

  // Trigger background instructions translation if instructions are provided
  if (payload.instructions && newAss.id) {
    import('@/actions/ai-quiz-generator').then(({ saveInstructionsTranslationAction }) => {
      saveInstructionsTranslationAction(newAss.id, payload.instructions!).catch((err) => {
        console.error(`[Background] Failed to trigger instructions translation for ${newAss.id}:`, err);
      });
    }).catch(err => {
      console.error(`[Background] Failed to import translation action for ${newAss.id}:`, err);
    });
  }

  // Sync to homepage feed
  after(() => {
    syncToHomepageFeed(newAss.id, "EXERCISE").catch(err => {
      console.error("[createMaterialWithQuestions] Background sync feed failed:", err);
    });
    // AI embedding: index this new assignment for related content
    reindexAssignment(newAss.id).catch(err => {
      console.error("[createMaterialWithQuestions] AI reindex failed:", err);
    });
  });

  return newAss.id;
}

export async function createDraftLesson() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Create Assignment first because Lesson depends on it
  const assignmentSlug = await generateUniqueSlug('Bài học mới', 'assignment');
  const newAssignment = await prisma.assignment.create({
    data: {
      title: 'Bài học mới',
      slug: assignmentSlug,
      materialType: 'READING',
      status: 'DRAFT',
      teacherId: session.user.id,
    }
  });

  const lessonSlug = await generateUniqueSlug('Bài học mới', 'lesson');
  await prisma.lesson.create({
    data: {
      title: 'Bài học mới',
      slug: lessonSlug,
      teacherId: session.user.id,
      assignmentId: newAssignment.id,
      thumbnail: newAssignment.thumbnail,
      materialType: newAssignment.materialType,
      videoUrl: newAssignment.videoUrl,
      audioUrl: newAssignment.audioUrl
    }
  });

  return newAssignment.id; // Return assignment ID for the editor
}

function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
  }
  return true;
}

export async function autoSaveMaterial(payload: { 
  id: string; 
  title: string; 
  questions?: any[]; 
  readingText?: string;
  videoUrl?: string;
  audioUrl?: string;
  subject?: string;
  gradeLevel?: string;
  shortDescription?: string;
  tags?: string;
  instructions?: string;
  instructionsTranslations?: any;
  instructionsImageUrl?: string | null;
  categoryIds?: string[];
  targetAudiences?: string[];
  level?: string;
  audienceLevels?: any;
  learningGoals?: string[];
  thumbnail?: string | null;
  ttsVoice?: string;
  ttsSpeed?: number;
  audioMetadata?: any;
  isAutoSave?: boolean;
  grammarTopic?: string | null;
  grammarLesson?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  if (!payload.id) throw new Error('Missing ID');

  const isDemoId = payload.id === 'clp_reading_001';

  // 1. Parallelize Initial Reads
  const [existing, currentQuestions] = await Promise.all([
    prisma.assignment.findUnique({ where: { id: payload.id }, include: { lesson: true } }),
    payload.questions && Array.isArray(payload.questions) 
      ? prisma.question.findMany({ where: { assignmentId: payload.id } }) 
      : Promise.resolve([])
  ]);
  
  if (!isDemoId && (!existing || existing.teacherId !== session.user.id)) {
    throw new Error('Forbidden: You do not have permission to edit this material.');
  }

  // Handle thumbnail
  let thumbnail = payload.thumbnail !== undefined ? payload.thumbnail : existing?.thumbnail;
  
  // If the database already has a custom thumbnail (DALL-E or user-uploaded),
  // do not let a stale/empty/auto-generated thumbnail from the frontend overwrite it.
  const isExistingCustom = existing?.thumbnail && !existing.thumbnail.includes('api.dicebear.com');
  const isPayloadAuto = !payload.thumbnail || (typeof payload.thumbnail === 'string' && payload.thumbnail.includes('api.dicebear.com'));
  if (isExistingCustom && isPayloadAuto) {
    thumbnail = existing.thumbnail;
  }

  const isAutoGenerated = !thumbnail || (typeof thumbnail === 'string' && thumbnail.includes('api.dicebear.com'));
  if (isAutoGenerated && !payload.thumbnail) {
    thumbnail = await generateMaterialThumbnail(
      { title: payload.title, subject: payload.subject || existing?.subject || 'English' },
      payload.questions || []
    );
  }

  // Intercept Base64 Thumbnail
  if (thumbnail && thumbnail.startsWith('data:image')) {
    const { uploadBase64Image } = await import('@/actions/upload-actions');
    const uploadResult = await uploadBase64Image(thumbnail, payload.id);
    if (uploadResult.success && uploadResult.url) {
      thumbnail = uploadResult.url;
    }
  }

  console.log(`[AutoSave] Starting update for assignment: ${payload.id} | instructionsImageUrl=${JSON.stringify(payload.instructionsImageUrl)}`);

  const updatePayload: any = { 
    updatedAt: new Date(),
    ...(payload.targetAudiences !== undefined && { targetAudiences: { set: payload.targetAudiences } }),
    ...(payload.learningGoals !== undefined && { learningGoals: { set: payload.learningGoals } })
  };

  const isExercise = (payload as any).materialType === 'EXERCISE' || (existing && (existing as any).materialType === 'EXERCISE');
  if (payload.audienceLevels !== undefined && !isExercise) {
    const levelsObj = payload.audienceLevels || {};
    const rawLevel = (Object.values(levelsObj)[0] as string) || '';
    // Normalize to a single canonical CEFR level — never join multiple values
    const normalizeLevel = (v: string): string => {
      const s = v.toLowerCase().trim();
      if (s.includes('pre-a1') || s === 'a1' || s.includes('beginner')) return 'pre-a1-a1';
      if (s.includes('a2') || s.includes('elementary')) return 'a2';
      if ((s.includes('b1') || s.includes('intermediate')) && !s.includes('upper')) return 'b1';
      if (s.includes('b2') || s.includes('upper')) return 'b2';
      if (s.includes('c1') || s.includes('advanced')) return 'c1';
      return s;
    };
    payload.level = rawLevel ? normalizeLevel(rawLevel) : undefined;
  }

  if (existing) {
    const fields = ['title', 'readingText', 'videoUrl', 'audioUrl', 'ttsVoice', 'ttsSpeed', 'subject', 'gradeLevel', 'level', 'audienceLevels', 'shortDescription', 'tags', 'instructions', 'instructionsTranslations', 'audioMetadata', 'grammarTopic', 'grammarLesson'];
    for (const field of fields) {
      if (payload[field as keyof typeof payload] !== undefined && payload[field as keyof typeof payload] !== existing[field as keyof typeof existing]) {
        updatePayload[field] = payload[field as keyof typeof payload] || null;
      }
    }
    // If readingText changed, invalidate readingTextProcessed so it gets re-generated on next TTS alignment
    if (updatePayload.readingText !== undefined) {
      updatePayload.readingTextProcessed = null;
    }
    // Always force-save instructionsImageUrl if provided — bypass comparison to avoid any edge case
    if (payload.instructionsImageUrl !== undefined) {
      updatePayload.instructionsImageUrl = payload.instructionsImageUrl || null;
    }
    // [DEBUG] Log instructionsImageUrl save path
    console.log(`[AutoSave DEBUG] payload.instructionsImageUrl=${JSON.stringify(payload.instructionsImageUrl)}, existing.instructionsImageUrl=${JSON.stringify((existing as any).instructionsImageUrl)}, in updatePayload=${JSON.stringify(updatePayload.instructionsImageUrl)}`);

    if (thumbnail !== undefined && thumbnail !== existing.thumbnail) updatePayload.thumbnail = thumbnail;

  } else {
    updatePayload.title = payload.title;
    updatePayload.thumbnail = thumbnail;
    updatePayload.readingText = payload.readingText || null;
    updatePayload.videoUrl = payload.videoUrl || null;
    updatePayload.audioUrl = payload.audioUrl || null;
    updatePayload.ttsVoice = payload.ttsVoice || null;
    updatePayload.ttsSpeed = payload.ttsSpeed || null;
    updatePayload.subject = payload.subject || null;
    updatePayload.gradeLevel = payload.gradeLevel || null;
    updatePayload.level = payload.level || null;
    updatePayload.audienceLevels = payload.audienceLevels || null;
    updatePayload.shortDescription = payload.shortDescription || null;
    updatePayload.tags = payload.tags || "";
    updatePayload.instructions = payload.instructions || null;
    updatePayload.instructionsTranslations = payload.instructionsTranslations || null;
    updatePayload.instructionsImageUrl = payload.instructionsImageUrl || null;
    updatePayload.audioMetadata = payload.audioMetadata || null;
  }

  const newSlug = !existing ? await generateUniqueSlug(payload.title, 'assignment') : undefined;

  const transactions: any[] = [];

  // Assignment upsert
  transactions.push(
    prisma.assignment.upsert({
      where: { id: payload.id },
      update: updatePayload,
      create: {
        id: payload.id,
        title: payload.title,
        slug: newSlug,
        thumbnail,
        readingText: payload.readingText || null,
        videoUrl: payload.videoUrl || null,
        audioUrl: payload.audioUrl || null,
        ttsVoice: payload.ttsVoice || null,
        ttsSpeed: payload.ttsSpeed || null,
        audioMetadata: payload.audioMetadata || null,
        subject: payload.subject || null,
        gradeLevel: payload.gradeLevel || null,
        level: payload.level || null,
        audienceLevels: payload.audienceLevels || null,
        shortDescription: payload.shortDescription || null,
        tags: payload.tags || "",
        instructions: payload.instructions || null,
        instructionsTranslations: payload.instructionsTranslations || null,
        instructionsImageUrl: payload.instructionsImageUrl || null,
        teacherId: session.user.id,
        materialType: 'READING', 
        status: 'DRAFT',
        targetAudiences: payload.targetAudiences !== undefined ? payload.targetAudiences : [],
        learningGoals: payload.learningGoals !== undefined ? payload.learningGoals : []
      }
    })
  );

  // Sync to Lesson if exists
  if (existing && existing.lesson) {
    const lessonUpdateData: any = {
      title: payload.title,
    };
    if (payload.shortDescription !== undefined) lessonUpdateData.description = payload.shortDescription || null;
    if (payload.videoUrl !== undefined) lessonUpdateData.videoUrl = payload.videoUrl || null;
    if (payload.audioUrl !== undefined) lessonUpdateData.audioUrl = payload.audioUrl || null;
    if (payload.audioMetadata !== undefined) lessonUpdateData.audioMetadata = payload.audioMetadata || null;
    if (thumbnail !== undefined) lessonUpdateData.thumbnail = thumbnail || null;
    if (payload.targetAudiences !== undefined) lessonUpdateData.targetAudiences = { set: payload.targetAudiences };
    if (payload.level !== undefined) lessonUpdateData.level = payload.level || null;
    if (payload.audienceLevels !== undefined) lessonUpdateData.audienceLevels = payload.audienceLevels || null;
    if (payload.learningGoals !== undefined) lessonUpdateData.learningGoals = { set: payload.learningGoals };

    transactions.push(
      prisma.lesson.update({
        where: { id: existing.lesson.id },
        data: lessonUpdateData
      })
    );
  }

  let toCreateCount = 0;
  let toUpdateCount = 0;

  // Differential update for questions
  if (payload.questions && Array.isArray(payload.questions)) {
    const currentIds = currentQuestions.map((q: any) => q.id);
    const payloadIds = payload.questions.map(q => q.id).filter(Boolean);

    const idsToDelete = currentIds.filter(id => !payloadIds.includes(id));
    if (idsToDelete.length > 0) {
      transactions.push(
        prisma.question.deleteMany({
          where: { id: { in: idsToDelete } }
        })
      );
    }

    const toCreate: any[] = [];
    
    for (let idx = 0; idx < payload.questions.length; idx++) {
      const q = payload.questions[idx];
      const isExisting = q.id && currentIds.includes(q.id);

      // Intercept Base64 in Questions
      let safeImageUrl = q.imageUrl;
      let safeMediaUrl = q.mediaUrl;
      let safeAudioUrl = q.audioUrl;
      let safeVideoUrl = q.videoUrl;

      const { uploadBase64Image } = await import('@/actions/upload-actions');
      
      if (safeImageUrl?.startsWith('data:')) {
        const res = await uploadBase64Image(safeImageUrl, payload.id);
        if (res.success && res.url) safeImageUrl = res.url;
      }
      if (safeMediaUrl?.startsWith('data:')) {
        const res = await uploadBase64Image(safeMediaUrl, payload.id);
        if (res.success && res.url) safeMediaUrl = res.url;
      }
      if (safeAudioUrl?.startsWith('data:')) {
        const res = await uploadBase64Image(safeAudioUrl, payload.id);
        if (res.success && res.url) safeAudioUrl = res.url;
      }
      if (safeVideoUrl?.startsWith('data:')) {
        const res = await uploadBase64Image(safeVideoUrl, payload.id);
        if (res.success && res.url) safeVideoUrl = res.url;
      }

      const questionData = {
        assignmentId: payload.id,
        type: q.type,
        orderIndex: idx,
        points: Number(q.points) || 1.0,
        explanation: q.explanation || null,
        explanationTranslations: q.explanationTranslations || null,
        content: typeof q.content === 'object' ? JSON.stringify(q.content) : q.content || "{}",
        mediaType: q.mediaType || 'NONE',
        mediaUrl: safeMediaUrl || null,
        imageUrl: safeImageUrl || null,
        audioUrl: safeAudioUrl || null,
        videoUrl: safeVideoUrl || null,
        isBanked: q.isBanked !== undefined ? q.isBanked : (q.isAiGenerated ? false : true),
        isAiGenerated: q.isAiGenerated || false,
        originalId: q.originalId || null
      };

      if (isExisting) {
        const currentQ = currentQuestions.find((cq: any) => cq.id === q.id);
        let changed = false;
        const uData: any = {};
        
        if (currentQ) {
          for (const key of Object.keys(questionData)) {
            let isDifferent = false;
            if (key === 'content') {
              try {
                const currentContentObj = typeof currentQ.content === 'string' ? JSON.parse(currentQ.content || "{}") : currentQ.content;
                const newContentObj = typeof questionData.content === 'string' ? JSON.parse(questionData.content || "{}") : questionData.content;
                isDifferent = !deepEqual(currentContentObj, newContentObj);
              } catch(e) {
                isDifferent = currentQ.content !== questionData.content;
              }
            } else {
              isDifferent = (currentQ as any)[key] !== (questionData as any)[key];
            }
            
            if (isDifferent) {
              uData[key] = (questionData as any)[key];
              changed = true;
            }
          }
        }
        
        if (changed) {
          toUpdateCount++;
          transactions.push(
            prisma.question.update({
              where: { id: q.id },
              data: uData
            })
          );
        }
      } else {
        toCreate.push({ ...questionData, id: q.id });
      }
    }
    
    if (toCreate.length > 0) {
      const uniqueToCreate = Array.from(new Map(toCreate.map(item => [item.id, item])).values());
      toCreateCount = uniqueToCreate.length;
      transactions.push(
        prisma.question.createMany({
          data: uniqueToCreate,
          skipDuplicates: true
        })
      );
    }
  }

  // 4. Execute all transactions in one round trip!
  await prisma.$transaction(transactions);

  console.log(`[AutoSave] Upserted questions: ${toCreateCount} created, ${toUpdateCount} updated for ${payload.id}`);

  // Sync to Homepage Feed and Tags synchronously to ensure reliability
  try {
    await invalidateMaterialCache(payload.id);
  } catch (err) {
    console.error("[AutoSave] Cache invalidation failed:", err);
  }

  try {
    await syncToHomepageFeed(payload.id, "EXERCISE");
  } catch (err) {
    console.error("[AutoSave] Sync feed failed:", err);
  }
  
  if (existing && existing.lesson) {
    try {
      await syncToHomepageFeed(existing.lesson.id, "LESSON");
    } catch (err) {
      console.error("[AutoSave] Sync feed failed for lesson:", err);
    }
  }

  // Sync new tags to the Tag model so they appear in autocomplete
  if (payload.tags) {
    const tagArray = payload.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArray.length > 0) {
      prisma.tag.findMany({
        where: { name: { in: tagArray, mode: 'insensitive' } },
        select: { name: true }
      }).then(existingTags => {
        const existingLower = new Set(existingTags.map(t => t.name.toLowerCase()));
        const toCreate = tagArray.filter(t => !existingLower.has(t.toLowerCase()));
        if (toCreate.length > 0) {
          prisma.tag.createMany({
            data: toCreate.map(t => ({ name: t, isPopular: false })),
            skipDuplicates: true
          }).catch(e => console.error("[AutoSave] Failed to create tags:", e));
        }
      }).catch(e => console.error("[AutoSave] Failed to fetch tags:", e));
    }
  }

    // AI embedding: re-index when content is PUBLIC, it is NOT an autosave, and core content actually changed
    if (existing?.status === 'PUBLIC' && !payload.isAutoSave) {
      const titleChanged = payload.title !== undefined && payload.title !== existing.title;
      const readingTextChanged = payload.readingText !== undefined && payload.readingText !== existing.readingText;
      const subjectChanged = payload.subject !== undefined && payload.subject !== existing.subject;
      const tagsChanged = payload.tags !== undefined && payload.tags !== existing.tags;
      const descChanged = payload.shortDescription !== undefined && payload.shortDescription !== existing.shortDescription;
      const instChanged = payload.instructions !== undefined && payload.instructions !== existing.instructions;
      const audienceChanged = payload.targetAudiences !== undefined && JSON.stringify(payload.targetAudiences) !== JSON.stringify(existing.targetAudiences);
      const levelChanged = payload.level !== undefined && payload.level !== existing.level;
      
      let questionsChanged = false;
      if (payload.questions && Array.isArray(payload.questions)) {
        if (payload.questions.length !== currentQuestions.length) {
          questionsChanged = true;
        } else {
          for (let i = 0; i < payload.questions.length; i++) {
            const pq = payload.questions[i];
            const eq = currentQuestions.find(cq => cq.id === pq.id);
            if (!eq) {
              questionsChanged = true;
              break;
            }
            const pqContentStr = typeof pq.content === 'object' ? JSON.stringify(pq.content) : pq.content || "{}";
            const eqContentStr = typeof eq.content === 'object' ? JSON.stringify(eq.content) : eq.content || "{}";
            if (pqContentStr !== eqContentStr || pq.explanation !== eq.explanation) {
              questionsChanged = true;
              break;
            }
          }
        }
      }

      const hasCoreContentChanged = titleChanged || readingTextChanged || subjectChanged || tagsChanged || descChanged || instChanged || audienceChanged || levelChanged || questionsChanged;

      if (hasCoreContentChanged) {
        reindexAssignment(payload.id).catch(err => {
          console.error("[AutoSave] AI reindex assignment failed:", err);
        });
        if (existing?.lesson) {
          reindexLesson(existing.lesson.id).catch(err => {
            console.error("[AutoSave] AI reindex lesson failed:", err);
          });
        }
      }
    }

  return { success: true, savedAt: new Date() };
}

export async function saveMaterialThumbnail(id: string, thumbnail: string | null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!id) throw new Error('Missing ID');

  // Verify ownership to prevent IDOR
  const existing = await prisma.assignment.findUnique({ 
    where: { id },
    include: { lesson: true }
  });
  
  const isDemoId = id === 'clp_reading_001';
  if (!isDemoId && (!existing || existing.teacherId !== session.user.id)) {
    throw new Error('Forbidden: You do not have permission to edit this material.');
  }

  // Intercept Base64
  let finalThumbnail = thumbnail;
  if (finalThumbnail && finalThumbnail.startsWith('data:image')) {
    const { uploadBase64Image } = await import('@/actions/upload-actions');
    const uploadResult = await uploadBase64Image(finalThumbnail, id);
    if (uploadResult.success && uploadResult.url) {
      finalThumbnail = uploadResult.url;
    }
  }

  // Update assignment thumbnail
  const updatedAssignment = await prisma.assignment.update({
    where: { id },
    data: { thumbnail: finalThumbnail },
    include: { lesson: true }
  });

  // Sync to Lesson if exists
  if (updatedAssignment.lesson) {
    await prisma.lesson.update({
      where: { id: updatedAssignment.lesson.id },
      data: { thumbnail: finalThumbnail }
    });
  }

  // Sync to Homepage Feed synchronously to ensure reliability
  try {
    await invalidateMaterialCache(id);
  } catch (err) {
    console.error("[SaveThumbnail] Cache invalidation failed:", err);
  }

  try {
    await syncToHomepageFeed(id, "EXERCISE");
  } catch (err) {
    console.error("[SaveThumbnail] Sync feed failed:", err);
  }
  
  if (updatedAssignment.lesson) {
    try {
      await syncToHomepageFeed(updatedAssignment.lesson.id, "LESSON");
    } catch (err) {
      console.error("[SaveThumbnail] Sync feed failed for lesson:", err);
    }
  }

  revalidatePath('/teacher/lessons');
  revalidatePath('/teacher/materials');

  return { success: true };
}

export async function getMyAssignments() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: session.user.id, deletedAt: null },
    include: {
      _count: {
        select: { questions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return assignments;
}

export async function syncAssignmentClasses(assignmentId: string, payload: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const { classIds, startDate, deadline, timeLimit, maxAttempts, focusMode, allowLateSubmission } = payload;

  // Verify ownership of assignment
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }});
  if (!assignment || assignment.teacherId !== session.user.id) {
    throw new Error('Forbidden: You do not own this assignment.');
  }

  // Verify status: Draft cannot be assigned
  if (assignment.status === 'DRAFT' && classIds.length > 0) {
    throw new Error('Không thể giao bài tập đang ở trạng thái Bản nháp. Vui lòng chuyển bài tập sang trạng thái Riêng tư hoặc Công khai để giao bài.');
  }

  await prisma.$transaction(async (tx) => {
    // 1. Remove classes no longer in the list
    await tx.assignmentClass.deleteMany({
      where: {
        assignmentId,
        classId: { notIn: classIds }
      }
    });

    // 2. Add or update classes in the list
    if (classIds.length > 0) {
      for (const cid of classIds) {
        const isNewAssignment = await tx.assignmentClass.findUnique({
          where: { assignmentId_classId: { assignmentId, classId: cid } }
        }) === null;

        await tx.assignmentClass.upsert({
          where: {
            assignmentId_classId: { assignmentId, classId: cid }
          },
          update: { 
            assignedAt: new Date(),
            startDate: startDate ? new Date(startDate) : null,
            dueDate: deadline ? new Date(deadline) : null,
            timeLimit: timeLimit ? Number(timeLimit) : null,
            maxAttempts: maxAttempts ? Number(maxAttempts) : 1,
            focusMode: !!focusMode,
            allowLateSubmission: !!allowLateSubmission
          },
          create: { 
            assignmentId, 
            classId: cid,
            startDate: startDate ? new Date(startDate) : null,
            dueDate: deadline ? new Date(deadline) : null,
            timeLimit: timeLimit ? Number(timeLimit) : null,
            maxAttempts: maxAttempts ? Number(maxAttempts) : 1,
            focusMode: !!focusMode,
            allowLateSubmission: !!allowLateSubmission
          }
        });

        if (isNewAssignment) {
          // Notify students
          const students = await tx.classEnrollment.findMany({
            where: { classId: cid, status: 'ACTIVE' },
            select: { studentId: true }
          });

          const { createNotification } = await import('@/actions/notification-actions');
          for (const student of students) {
            await createNotification(
              student.studentId,
              'NEW_ASSIGNMENT',
              'Bài tập mới được giao',
              `${session.user.name || 'Giáo viên'} vừa giao bài tập mới: "${assignment.title}"`,
              `/student/assignments/${assignmentId}/run`
            );
          }
        }
      }
    }
  });

  revalidatePath('/teacher/materials');
  revalidatePath('/teacher/dashboard');
  return { success: true };
}

export async function unassignMaterialFromClass(assignmentId: string, classId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Verify ownership
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }});
  if (!assignment || assignment.teacherId !== session.user.id) {
    throw new Error('Forbidden');
  }

  await prisma.assignmentClass.delete({
    where: {
      assignmentId_classId: { assignmentId, classId }
    }
  });

  revalidatePath('/teacher/materials');
  revalidatePath('/teacher/dashboard');
  return { success: true };
}

export async function getTeacherClasses() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const classes = await prisma.class.findMany({
    where: { teacherId: session.user.id, deletedAt: null },
    include: {
      _count: {
        select: { enrollments: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return classes.map(c => ({
    id: c.id,
    name: c.name,
    studentCount: c._count.enrollments
  }));
}

export async function deleteMaterial(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Try finding as assignment
  const assignment = await prisma.assignment.findUnique({ 
    where: { id },
    include: { lesson: true, _count: { select: { targetClasses: true } } }
  });

  if (assignment) {
    if (assignment.teacherId !== session.user.id) throw new Error('Forbidden');
    
    await prisma.$transaction([
      prisma.assignment.update({
        where: { id },
        data: { deletedAt: new Date() }
      }),
      ...(assignment.lesson ? [
        prisma.lesson.update({
          where: { id: assignment.lesson.id },
          data: { deletedAt: new Date() }
        })
      ] : [])
    ]);
  } else {
    // Try finding as lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { assignment: true }
    });

    if (!lesson || lesson.teacherId !== session.user.id) {
      throw new Error('Forbidden: You do not have permission to delete this material.');
    }

    await prisma.$transaction([
      prisma.lesson.update({
        where: { id },
        data: { deletedAt: new Date() }
      }),
      ...(lesson.assignment ? [
        prisma.assignment.update({
          where: { id: lesson.assignment.id },
          data: { deletedAt: new Date() }
        })
      ] : [])
    ]);
  }

  revalidatePath('/teacher/materials');
  revalidatePath('/teacher/materials/trash');
  revalidatePath('/teacher/lessons');
  revalidatePath('/teacher/dashboard');

  // Sync removal from feed
  await removeFromHomepageFeed(id);
  if (assignment?.lesson) await removeFromHomepageFeed(assignment.lesson.id);

  await invalidateMaterialCache(id);

  return { success: true };
}

export async function duplicateMaterial(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const source = await prisma.assignment.findUnique({
    where: { id, deletedAt: null },
    include: { 
      questions: true,
      flashcardDeck: { include: { cards: true } }
    }
  });

  if (!source || source.teacherId !== session.user.id) {
    throw new Error('Forbidden');
  }

  const copyTitle = `${source.title} (Bản sao)`;
  const slug = await generateUniqueSlug(copyTitle, 'assignment');
  const newAss = await prisma.assignment.create({
    data: {
      title: copyTitle,
      slug,
      status: 'DRAFT',
      materialType: source.materialType,
      teacherId: session.user.id,
      defaultPoints: source.defaultPoints,
      coefficient: source.coefficient,
      allowLateSubmission: source.allowLateSubmission,
      timeLimit: source.timeLimit,
      themeColor: source.themeColor,
      subject: source.subject,
      gradeLevel: source.gradeLevel,
      level: source.level,
      audienceLevels: source.audienceLevels as any,
      shortDescription: source.shortDescription,
      tags: source.tags,
      instructions: source.instructions,
      readingText: source.readingText,
      videoUrl: (source as any).videoUrl || null,
      audioUrl: (source as any).audioUrl || null,
      thumbnail: await generateMaterialThumbnail(
        { title: `${source.title} (Bản sao)`, subject: source.subject },
        source.questions
      ),
      questions: {
        create: source.questions.map(q => ({
          type: q.type,
          orderIndex: q.orderIndex,
          points: q.points,
          explanation: q.explanation,
          content: q.content,
          mediaType: q.mediaType,
          mediaUrl: q.mediaUrl,
          imageUrl: q.imageUrl,
          audioUrl: q.audioUrl,
        }))
      },
      flashcardDeck: source.flashcardDeck ? {
        create: {
          cards: {
            create: source.flashcardDeck.cards.map(c => ({
              frontText: c.frontText,
              backText: c.backText,
              imageUrl: c.imageUrl,
              orderIndex: c.orderIndex
            }))
          }
        }
      } : undefined
    }
  });

  revalidatePath('/teacher/materials');
  return newAss.id;
}

export async function restoreMaterial(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const assignment = await prisma.assignment.findUnique({ 
    where: { id },
    include: { lesson: true }
  });

  if (assignment) {
    if (assignment.teacherId !== session.user.id) throw new Error('Forbidden');
    await prisma.$transaction([
      prisma.assignment.update({ where: { id }, data: { deletedAt: null } }),
      ...(assignment.lesson ? [prisma.lesson.update({ where: { id: assignment.lesson.id }, data: { deletedAt: null } })] : [])
    ]);
  } else {
    const lesson = await prisma.lesson.findUnique({ 
      where: { id },
      include: { assignment: true }
    });
    if (!lesson || lesson.teacherId !== session.user.id) throw new Error('Forbidden');
    await prisma.$transaction([
      prisma.lesson.update({ where: { id }, data: { deletedAt: null } }),
      ...(lesson.assignment ? [prisma.assignment.update({ where: { id: lesson.assignment.id }, data: { deletedAt: null } })] : [])
    ]);
  }

  revalidatePath('/teacher/materials/trash');
  revalidatePath('/teacher/materials');
  revalidatePath('/teacher/lessons');
  await invalidateMaterialCache(id);

  // AI embedding: re-index restored content
  after(() => {
    if (assignment) {
      reindexAssignment(id).catch(err =>
        console.error('[Restore] AI reindex assignment failed:', err)
      );
      if (assignment.lesson) {
        reindexLesson(assignment.lesson.id).catch(err =>
          console.error('[Restore] AI reindex lesson failed:', err)
        );
      }
    }
  });

  return { success: true };
}

export async function permanentlyDeleteMaterial(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const assignment = await prisma.assignment.findUnique({ 
    where: { id },
    include: { lesson: true, _count: { select: { targetClasses: true } } }
  });

  if (assignment) {
    if (assignment.teacherId !== session.user.id) throw new Error('Forbidden');
    if (assignment._count.targetClasses > 0) {
      throw new Error('Không thể xóa vĩnh viễn bài tập đã được giao.');
    }
    
    await prisma.$transaction([
      ...(assignment.lesson ? [prisma.lesson.delete({ where: { id: assignment.lesson.id } })] : []),
      prisma.assignment.delete({ where: { id } })
    ]);
  } else {
    const lesson = await prisma.lesson.findUnique({ 
      where: { id },
      include: { assignment: true }
    });
    if (!lesson || lesson.teacherId !== session.user.id) throw new Error('Forbidden');
    
    // If lesson has assignment, check if that assignment is assigned
    if (lesson.assignment) {
      const assCount = await prisma.assignmentClass.count({ where: { assignmentId: lesson.assignment.id } });
      if (assCount > 0) throw new Error('Không thể xóa vĩnh viễn bài học có bài tập đã được giao.');
    }

    await prisma.$transaction([
      ...(lesson.assignment ? [prisma.assignment.delete({ where: { id: lesson.assignment.id } })] : []),
      prisma.lesson.delete({ where: { id } })
    ]);
  }

  revalidatePath('/teacher/materials/trash');
  revalidatePath('/teacher/lessons');
  return { success: true };
}

export async function bulkDeleteMaterials(ids: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await Promise.all(ids.map(id => deleteMaterial(id)));
  return { success: true };
}

export async function bulkRestoreMaterials(ids: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await Promise.all(ids.map(id => restoreMaterial(id)));
  return { success: true };
}

export async function bulkPermanentlyDeleteMaterials(ids: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await Promise.all(ids.map(id => permanentlyDeleteMaterial(id)));
  return { success: true };
}

export async function bulkPublishMaterials(ids: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await Promise.all(ids.map(id => updateMaterialStatus(id, 'PUBLIC')));
  return { success: true };
}

/**
 * USE CASE: Update Material Status
 * Transitions the material between DRAFT, PRIVATE, and PUBLIC.
 * Includes business rule validation for each state.
 */
export async function updateMaterialStatus(id: string, newStatus: MaterialStatus) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const existing = await prisma.assignment.findUnique({ 
    where: { id },
    include: { _count: { select: { targetClasses: true } } }
  });

  if (!existing || existing.teacherId !== session.user.id) {
    throw new Error('Forbidden: You do not have permission to update this material.');
  }

  // 1. Validation for transitioning OUT of DRAFT
  // Materials must meet quality standards before being Private or Public
  if (existing.status === 'DRAFT' && newStatus !== 'DRAFT') {
    if (!existing.title || existing.title.trim() === '') {
      throw new Error('Bài tập phải có Tiêu đề trước khi đổi trạng thái.');
    }

    // Check content sufficiency (Reading materials)
    if (existing.materialType === 'READING') {
      const cleanContent = (existing.readingText || '').replace('Bôi đen từ mới để thiết lập vocabulary chi tiết.', '').trim();
      if (!cleanContent || (cleanContent.length < 50 && !(existing.readingText || '').includes('<img'))) {
        throw new Error('Nội dung bài đọc chưa đạt yêu cầu (tối thiểu 50 ký tự hoặc có hình ảnh minh họa).');
      }
    }
    
    // Check question count (Exercises)
    if (existing.materialType === 'EXERCISE') {
      const questionCount = await prisma.question.count({ where: { assignmentId: id } });
      if (questionCount === 0) {
        throw new Error('Bài tập trắc nghiệm phải có ít nhất một câu hỏi.');
      }
    }

    // Check flashcard count (Flashcards)
    if (existing.materialType === 'FLASHCARD') {
      const deck = await prisma.flashcardDeck.findUnique({ 
        where: { assignmentId: id },
        include: { _count: { select: { cards: true } } }
      });
      if (!deck || deck._count.cards === 0) {
        throw new Error('Bộ thẻ ghi nhớ phải có ít nhất một thẻ bài.');
      }
    }
  }

  // 2. Validation for transitioning TO DRAFT
  // Prevents breaking existing class assignments
  if (newStatus === 'DRAFT') {
    if (existing._count.targetClasses > 0) {
      throw new Error('Bài tập đã được giao cho lớp học không thể chuyển lại thành Bản nháp. Hãy hủy giao bài trước.');
    }
  }

  // 3. Validation for PUBLIC status (Optional: stricter rules for community sharing)
  if (newStatus === 'PUBLIC') {
    // We could add more checks here, e.g., requiring at least 5 questions or a thumbnail
    if (!existing.thumbnail) {
      // Auto-generate if missing for public view
      const questions = await prisma.question.findMany({ where: { assignmentId: id } });
      const thumbnail = await generateMaterialThumbnail(
        { title: existing.title, subject: existing.subject },
        questions
      );
      await prisma.assignment.update({ where: { id }, data: { thumbnail } });
    }
  }

  await prisma.assignment.update({
    where: { id },
    data: { status: newStatus }
  });

  revalidatePath('/teacher/materials');
  revalidatePath('/teacher/dashboard');
  revalidatePath(`/teacher/materials/${id}`);

  // Sync feed so visibility changes reflect immediately
  invalidateMaterialCache(id).catch(err => {
    console.error("[UpdateStatus] Background cache invalidation failed:", err);
  });

  syncToHomepageFeed(id, "EXERCISE").catch(err => {
    console.error("[UpdateStatus] Background sync feed failed:", err);
  });
  
  const updatedAss = await prisma.assignment.findUnique({ where: { id }, include: { lesson: true } });
  if (updatedAss?.lesson) {
    syncToHomepageFeed(updatedAss.lesson.id, "LESSON").catch(err => {
      console.error("[UpdateStatus] Background sync feed failed for lesson:", err);
    });
  }

  // AI embedding: re-index when becoming PUBLIC
  if (newStatus === 'PUBLIC') {
    after(() => {
      reindexAssignment(id).catch(err => {
        console.error("[UpdateStatus] AI reindex assignment failed:", err);
      });
      if (updatedAss?.lesson) {
        reindexLesson(updatedAss.lesson.id).catch(err => {
          console.error("[UpdateStatus] AI reindex lesson failed:", err);
        });
      }
    });
  }
  
  return { success: true };
}

export async function assignToClass(assignmentId: string, classId: string, payload?: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }});
  if (!assignment || assignment.teacherId !== session.user.id) {
    throw new Error('Forbidden');
  }

  if (assignment.status === 'DRAFT') {
    throw new Error('Không thể giao bài tập đang ở trạng thái Bản nháp.');
  }

  // Update properties if passing payload
  const updateData: any = { assignedAt: new Date() };
  const createData: any = { assignmentId, classId, maxAttempts: 1 };

  if (payload) {
    if (payload.startDate) {
      updateData.startDate = new Date(payload.startDate);
      createData.startDate = new Date(payload.startDate);
    }
    if (payload.dueDate) {
      updateData.dueDate = new Date(payload.dueDate);
      createData.dueDate = new Date(payload.dueDate);
    }
    if (payload.timeLimit !== undefined) {
      updateData.timeLimit = payload.timeLimit;
      createData.timeLimit = payload.timeLimit;
    }
    if (payload.maxAttempts !== undefined) {
      updateData.maxAttempts = payload.maxAttempts;
      createData.maxAttempts = payload.maxAttempts;
    }
  }

  await prisma.assignmentClass.upsert({
    where: { assignmentId_classId: { assignmentId, classId } },
    update: updateData,
    create: createData
  });

  revalidatePath('/teacher/materials');
  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true };
}
export async function saveToQuestionBank(question: any, meta: { subject?: string; gradeLevel?: string; tags?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.questionBank.create({
    data: {
      teacherId: session.user.id,
      type: question.type,
      points: question.points,
      explanation: question.explanation,
      content: typeof question.content === 'object' ? JSON.stringify(question.content) : question.content,
      mediaType: question.mediaType,
      mediaUrl: question.mediaUrl,
      imageUrl: question.imageUrl || null,
      audioUrl: question.audioUrl || null,
      videoUrl: question.videoUrl || null,
      subject: meta.subject,
      gradeLevel: meta.gradeLevel,
      tags: meta.tags
    }
  });

  return { success: true };
}

export async function saveManyToQuestionBank(questions: any[], meta: { subject?: string; gradeLevel?: string; tags?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  if (questions.length === 0) return { success: true };

  await prisma.questionBank.createMany({
    data: questions.map(question => ({
      teacherId: session.user.id!,
      type: question.type,
      points: question.points,
      explanation: question.explanation,
      content: typeof question.content === 'object' ? JSON.stringify(question.content) : question.content,
      mediaType: question.mediaType,
      mediaUrl: question.mediaUrl,
      imageUrl: question.imageUrl || null,
      audioUrl: question.audioUrl || null,
      videoUrl: question.videoUrl || null,
      subject: meta.subject,
      gradeLevel: meta.gradeLevel,
      tags: meta.tags
    }))
  });

  return { success: true };
}

export async function getMaterialAnalytics(assignmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const submissions = await prisma.submission.findMany({
    where: { assignmentId, submittedAt: { not: null } },
    include: { answers: true }
  });

  const questions = await prisma.question.findMany({
    where: { assignmentId },
    orderBy: { orderIndex: 'asc' }
  });

  const stats = questions.map(q => {
    const qAnswers = submissions.flatMap(s => s.answers.filter(a => a.questionId === q.id));
    const correctCount = qAnswers.filter(a => a.isCorrect).length;
    const totalCount = qAnswers.length;
    
    return {
      questionId: q.id,
      type: q.type,
      correctRate: totalCount > 0 ? (correctCount / totalCount) * 100 : 0,
      totalResponses: totalCount,
      isHard: totalCount > 5 && (correctCount / totalCount) < 0.3
    };
  });

  return {
    totalSubmissions: submissions.length,
    averageScore: submissions.length > 0 ? submissions.reduce((acc, s) => acc + (s.score || 0), 0) / submissions.length : 0,
    questionStats: stats
  };
}

export async function bulkAssignMaterial(assignmentId: string, payload: { classIds: string[]; startDate?: Date; deadline?: Date; timeLimit?: number }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const { classIds, ...settings } = payload;
  
  for (const classId of classIds) {
    await assignToClass(assignmentId, classId, settings);
  }
  return { success: true };
}

export async function trackMaterialView(id: string) {
  await prisma.assignment.update({
    where: { id },
    data: { viewCount: { increment: 1 } }
  });
  return { success: true };
}

export async function getQuestionBank(searchTerm?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const questions = await prisma.questionBank.findMany({
    where: {
      teacherId: session.user.id,
      OR: searchTerm ? [
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { subject: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { contains: searchTerm, mode: 'insensitive' } }
      ] : undefined
    },
    orderBy: { createdAt: 'desc' }
  });

  // Parse JSON content for usage in frontend
  return questions.map(q => ({
    ...q,
    content: typeof q.content === 'string' ? JSON.parse(q.content) : q.content
  }));
}

export async function deleteFromQuestionBank(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  
  await prisma.questionBank.deleteMany({
    where: {
      id,
      teacherId: session.user.id
    }
  });
  
  return { success: true };
}

export async function updateQuestionBankTags(id: string, tags: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  
  await prisma.questionBank.updateMany({
    where: {
      id,
      teacherId: session.user.id
    },
    data: {
      tags
    }
  });
  
  return { success: true };
}

// Lấy danh sách metadata hệ thống để làm dữ liệu động cho AI Prompt
export async function getSystemMetadata() {
  const [assignments, dbTags] = await Promise.all([
    prisma.assignment.findMany({
      select: { tags: true, gradeLevel: true, targetAudiences: true }
    }),
    prisma.tag.findMany({ select: { name: true } })
  ]);

  const { getOnboardingConfig } = await import('@/actions/user-preferences-actions');
  const config = (await getOnboardingConfig()) as any;
  const categoryNames: string[] = [];
  if (config && config.subjects) {
    config.subjects.forEach((s: any) => {
      categoryNames.push(s.label);
      s.ageGroups?.forEach((a: any) => {
        a.goals?.forEach((g: any) => {
          categoryNames.push(g.label);
        });
      });
    });
  }

  const tagsSet = new Set<string>();

  // Populate tagsSet from the Tag table in database!
  dbTags.forEach(t => tagsSet.add(t.name.trim()));

  // In case there are tags in assignments that are not yet seeded,
  // let's still add them as a fallback
  assignments.forEach(a => {
    if (a.tags) {
      a.tags.split(',').forEach(t => tagsSet.add(t.trim()));
    }
  });

  // Default tags if the DB is completely empty (though getAdminTags seeds or we have tags created)
  if (tagsSet.size === 0) {
    ['Tiếng Anh', 'Toán học', 'Ngữ pháp', 'Từ vựng', 'TOEIC', 'IELTS', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Ôn thi'].forEach(t => tagsSet.add(t));
  }

  const gradesSet = new Set<string>(['Mầm non', 'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học', 'Khác']);
  const audienceSet = new Set<string>(['kindergarten', 'kid', 'teen', 'learner']);

  assignments.forEach(a => {
    if (a.gradeLevel) gradesSet.add(a.gradeLevel.trim());
    if (a.targetAudiences && Array.isArray(a.targetAudiences)) {
      a.targetAudiences.forEach((aud: string) => {
        const cleaned = aud.trim().toLowerCase();
        if (cleaned === 'kids') audienceSet.add('kid');
        else if (cleaned === 'teens') audienceSet.add('teen');
        else if (cleaned === 'adults' || cleaned === 'business') audienceSet.add('learner');
        else if (cleaned === 'kindergarten' || cleaned === 'kid' || cleaned === 'teen' || cleaned === 'learner') {
          audienceSet.add(cleaned);
        }
      });
    }
  });

  return {
    tags: Array.from(tagsSet).filter(Boolean),
    gradeLevels: Array.from(gradesSet).filter(Boolean),
    targetAudiences: Array.from(audienceSet).filter(Boolean),
    categories: categoryNames
  };
}

export async function alignMaterialWhisper(assignmentId: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user?.role !== 'TEACHER' && session.user?.role !== 'ADMIN')) {
    throw new Error('Unauthorized');
  }

  const existing = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { lesson: true }
  });

  if (!existing) {
    throw new Error('Bài tập không tồn tại');
  }

  const audioUrl = existing.audioUrl;
  if (!audioUrl) {
    throw new Error('Bài học chưa có file âm thanh/giọng đọc. Vui lòng tạo giọng đọc trước trong phần chỉnh sửa bài học.');
  }

  const readingText = existing.readingText || '';
  if (!readingText.trim()) {
    throw new Error('Bài tập không có văn bản bài đọc để căn khớp');
  }

  // 1. Download audio file from S3 URL
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error('Không thể tải file âm thanh từ hệ thống lưu trữ');
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. Call OpenAI Whisper to get word timestamps
  let words = null;
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
  } catch (err: any) {
    console.error("OpenAI Whisper alignment failed:", err);
    throw new Error(`OpenAI Whisper thất bại: ${err.message || err}`);
  }

  if (!words || words.length === 0) {
    throw new Error('Không thể trích xuất mốc thời gian từ từ âm thanh');
  }

  // 3. Align and wrap HTML text nodes with .reading-word spans
  const finalHtml = await alignAndWrapHtmlServer(readingText, words);

  // 4. Save back to Assignment — both readingText and readingTextProcessed (pre-computed for fast page render)
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      readingText: finalHtml,
      readingTextProcessed: finalHtml, // Pre-computed: eliminates runtime wrap on page load
      audioMetadata: words as any
    }
  });

  // 5. Sync to linked Lesson if exists
  if (existing.lesson) {
    await prisma.lesson.update({
      where: { id: existing.lesson.id },
      data: {
        audioMetadata: words as any
      }
    });
  }

  revalidatePath('/teacher/materials');
  after(() => {
    invalidateMaterialCache(assignmentId).catch(err => {
      console.error("[AlignWhisper] Background cache invalidation failed:", err);
    });
  });
  return { success: true };
}

export async function alignAndWrapHtmlServer(htmlContent: string, whisperWords: Array<{word: string, start: number, end: number}>) {
  if (!whisperWords || whisperWords.length === 0) return htmlContent;

  const parts = htmlContent.split(/(<[^>]+>)/g);
  let whisperIdx = 0;

  for (let idx = 0; idx < parts.length; idx++) {
    const part = parts[idx];
    if (!part) continue;

    if (part.startsWith('<') && part.endsWith('>')) {
      continue;
    }

    // Split text into sentences using lookbehind for sentence-ending punctuation followed by whitespace
    const sentences = part.split(/(?<=[.!?])\s+/g);
    
    const newSentences = sentences.map(sentence => {
      if (!sentence.trim()) return sentence;

      const tokens = sentence.split(/(\s+|[.,!?;:"()\[\]{}–—\-#\/*+]+)/);
      let firstMatchedWord: any = null;
      let lastMatchedWord: any = null;

      tokens.forEach(token => {
        if (!token || !/\w+/.test(token)) return;
        const cleanToken = token.replace(/[^\w]/g, '').toLowerCase();

        for (let i = 0; i < 10; i++) {
          const wWord = whisperWords[whisperIdx + i];
          if (!wWord) break;
          const cleanWWord = wWord.word.replace(/[^\w]/g, '').toLowerCase();

          if (cleanToken === cleanWWord || cleanToken.includes(cleanWWord) || cleanWWord.includes(cleanToken)) {
            if (!firstMatchedWord) {
              firstMatchedWord = wWord;
            }
            lastMatchedWord = wWord;
            whisperIdx += i + 1;
            break;
          }
        }
      });

      if (firstMatchedWord && lastMatchedWord) {
        const start = firstMatchedWord.start;
        const end = lastMatchedWord.end;
        return `<span class="reading-sentence" data-start="${start}" data-end="${end}">${sentence}</span>`;
      } else {
        return sentence;
      }
    });

    parts[idx] = newSentences.join(' ');
  }

  return parts.join('');
}

function mapAgeGroupToLevel(raw?: string | null): string {
  if (!raw) return 'a1';
  const l = raw.toLowerCase().trim();
  if (l === '2-5' || l.includes('kindergarten') || l.includes('pre-a1') || l.includes('pre_a1')) return 'pre-a1';
  if (l === '6-12' || l.includes('elementary') || l === 'a1') return 'a1';
  if (l === 'teen' || l === 'a2') return 'a2';
  if (l === 'readers' || l.includes('intermediate') || l === 'b1') return 'b1';
  if (l === 'b2' || l.includes('upper_intermediate')) return 'b2';
  if (l === 'c1' || l.includes('advanced')) return 'c1';
  return l;
}

function getGamePlayUrl(topic: { id: string; gameMode?: string | null }) {
  const mode = topic.gameMode;
  if (mode === "train") return `/student/game/train?topicId=${topic.id}`;
  if (mode === "cut-rope") return `/student/game/cut-rope?topicId=${topic.id}`;
  if (mode === "conveyor-drop") return `/student/game/conveyor-drop?topicId=${topic.id}`;
  if (mode === "match-text-text" || mode === "line") return `/student/game/match-text-text?topicId=${topic.id}`;
  if (mode === "choice" || mode === "choice-egg") return `/student/game/egg-smash-quiz?topicId=${topic.id}`;
  if (mode === "choice-shooter" || mode === "shooter-quiz" || mode === "shooter") return `/game/shooter-quiz?topicId=${topic.id}`;
  if (mode === "flip") return `/game/memory-flip?topicId=${topic.id}`;
  if (mode === "candy-quiz") return `/student/game/candy-quiz?topicId=${topic.id}`;
  if (mode === "treasure-hunt" || mode === "treasure") return `/student/game/treasure-hunt?topicId=${topic.id}`;
  return `/student/game/match-words?topicId=${topic.id}`;
}

function mapCefrToAgeParam(cefr?: string | null): string {
  const c = (cefr || '').toLowerCase();
  if (c === 'pre-a1' || c === '2-5' || c === 'kindergarten') return '2-5';
  if (c === 'a1' || c === '6-12' || c === 'kid') return '6-12';
  if (c === 'a2' || c === 'teen') return 'teen';
  return 'readers';
}

export interface AssignableLibraryItem {
  id: string;
  rawId: string;
  title: string;
  type: 'GAME' | 'FLASHCARD' | 'READING' | 'GRAMMAR' | 'BOOK' | 'LESSON';
  source: 'mine' | 'library';
  level: string;
  itemCount: number;
  itemUnit: string;
  thumbnail?: string | null;
  createdAt: string;
  isAssignment: boolean;
  previewUrl: string;
  playUrl: string;
  section?: 'NEW' | 'REVIEW';
  authorName?: string | null;
  badgeLabel?: string | null;
}

export async function getAssignableLibraryContentAction(): Promise<{
  mine: AssignableLibraryItem[];
  library: AssignableLibraryItem[];
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const teacherId = session.user.id;

  const [
    myAssignments,
    myGames,
    libAssignments,
    libGames,
    libFlashcards,
    libBooks
  ] = await Promise.all([
    prisma.assignment.findMany({
      where: { teacherId, deletedAt: null },
      include: {
        _count: { select: { questions: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.matchWordTopic.findMany({
      where: { teacherId },
      include: {
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.assignment.findMany({
      where: { status: 'PUBLIC', deletedAt: null, teacherId: { not: teacherId } },
      include: {
        _count: { select: { questions: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.matchWordTopic.findMany({
      where: { teacherId: null },
      include: {
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 60
    }),
    prisma.flashcardTopic.findMany({
      include: {
        _count: { select: { flashcards: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 60
    }),
    prisma.readAlongBook.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        _count: { select: { slides: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 60
    })
  ]);

  const mapAssignmentToItem = (a: any, source: 'mine' | 'library'): AssignableLibraryItem => {
    let type: 'GAME' | 'FLASHCARD' | 'READING' | 'GRAMMAR' | 'BOOK' = 'GRAMMAR';
    let playUrl = `/student/assignments/${a.id}/run`;
    let previewUrl = `/teacher/materials/${a.id}/edit`;
    let itemUnit = 'câu hỏi';
    let itemCount = a._count?.questions || 0;

    if (a.instructions) {
      try {
        const meta = JSON.parse(a.instructions);
        if (meta.kind === 'GAME') {
          type = 'GAME';
          if (meta.playUrl) {
            playUrl = meta.playUrl;
            previewUrl = meta.playUrl;
          }
          itemUnit = 'mục';
        } else if (meta.kind === 'BOOK') {
          type = 'BOOK';
          if (meta.playUrl) {
            playUrl = meta.playUrl;
            previewUrl = meta.playUrl;
          }
          itemUnit = 'trang';
        } else if (meta.kind === 'FLASHCARD') {
          type = 'FLASHCARD';
          if (meta.playUrl) {
            playUrl = meta.playUrl;
            previewUrl = meta.playUrl;
          }
          itemUnit = 'thẻ từ';
        }
      } catch {}
    }

    if (type === 'GRAMMAR' && a.materialType === 'READING') {
      type = 'READING';
      itemUnit = 'câu hỏi';
    } else if (type === 'GRAMMAR' && a.materialType === 'FLASHCARD') {
      type = 'FLASHCARD';
      itemUnit = 'thẻ từ';
    }

    return {
      id: a.id,
      rawId: a.id,
      title: a.title,
      type,
      source,
      level: mapAgeGroupToLevel(a.level),
      itemCount,
      itemUnit,
      thumbnail: a.thumbnail || null,
      createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
      isAssignment: true,
      previewUrl,
      playUrl
    };
  };

  const mineItems: AssignableLibraryItem[] = [
    ...myAssignments.map(a => mapAssignmentToItem(a, 'mine')),
    ...myGames.map(g => ({
      id: `game_${g.id}`,
      rawId: g.id,
      title: g.name,
      type: 'GAME' as const,
      source: 'mine' as const,
      level: mapAgeGroupToLevel(g.ageGroup),
      itemCount: g._count?.items || 0,
      itemUnit: 'từ/câu',
      thumbnail: g.thumbnailUrl || (g.gameMode === 'shooter-quiz' ? '/images/games/shooter-quiz.jpg' : '/images/games/candy-quiz.jpg'),
      createdAt: g.createdAt ? g.createdAt.toISOString() : new Date().toISOString(),
      isAssignment: false,
      previewUrl: getGamePlayUrl(g),
      playUrl: getGamePlayUrl(g),
    }))
  ];

  const libraryItems: AssignableLibraryItem[] = [
    ...libAssignments.map(a => mapAssignmentToItem(a, 'library')),
    ...libGames.map(g => ({
      id: `game_${g.id}`,
      rawId: g.id,
      title: g.name,
      type: 'GAME' as const,
      source: 'library' as const,
      level: mapAgeGroupToLevel(g.ageGroup),
      itemCount: g._count?.items || 0,
      itemUnit: 'từ/câu',
      thumbnail: g.thumbnailUrl || (g.gameMode === 'shooter-quiz' ? '/images/games/shooter-quiz.jpg' : '/images/games/candy-quiz.jpg'),
      createdAt: g.createdAt ? g.createdAt.toISOString() : new Date().toISOString(),
      isAssignment: false,
      previewUrl: getGamePlayUrl(g),
      playUrl: getGamePlayUrl(g),
    })),
    ...libFlashcards.map(f => ({
      id: `flashcard_${f.id}`,
      rawId: f.id,
      title: f.name,
      type: 'FLASHCARD' as const,
      source: 'library' as const,
      level: mapAgeGroupToLevel(f.cefrLevel),
      itemCount: f._count?.flashcards || 0,
      itemUnit: 'thẻ từ',
      thumbnail: f.iconUrl || null,
      createdAt: f.createdAt ? f.createdAt.toISOString() : new Date().toISOString(),
      isAssignment: false,
      previewUrl: `/student/game/flashcard-match?topicId=${f.id}`,
      playUrl: `/student/game/flashcard-match?topicId=${f.id}`,
    })),
    ...libBooks.map(b => ({
      id: `book_${b.id}`,
      rawId: b.id,
      title: b.title,
      type: 'BOOK' as const,
      source: 'library' as const,
      level: mapAgeGroupToLevel(b.level),
      itemCount: b._count?.slides || 0,
      itemUnit: 'trang',
      thumbnail: b.thumbnailUrl || null,
      createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
      isAssignment: false,
      previewUrl: `/student/books/${b.bookId || b.id}`,
      playUrl: `/student/books/${b.bookId || b.id}`,
    }))
  ];

  return {
    mine: mineItems,
    library: libraryItems
  };
}

async function resolveItemThumbnail(item: { type: string; rawId: string; thumbnail?: string | null }): Promise<string | null> {
  if (item.thumbnail && !item.thumbnail.includes('unsplash.com')) {
    return item.thumbnail;
  }
  const typeUpper = (item.type || '').toUpperCase();
  if (typeUpper === 'READING' || typeUpper === 'LESSON' || typeUpper === 'BOOK') {
    const l = await prisma.lesson.findUnique({
      where: { id: item.rawId },
      select: { thumbnail: true }
    });
    if (l?.thumbnail) return l.thumbnail;
  } else if (typeUpper === 'GAME') {
    const t = await prisma.matchWordTopic.findUnique({
      where: { id: item.rawId },
      select: { thumbnailUrl: true, gameMode: true }
    });
    if (t?.thumbnailUrl) return t.thumbnailUrl;
    if (t?.gameMode === 'shooter-quiz') return '/images/games/shooter-quiz.jpg';
    return '/images/games/candy-quiz.jpg';
  } else if (typeUpper === 'FLASHCARD') {
    const f = await prisma.flashcardTopic.findUnique({
      where: { id: item.rawId },
      select: { iconUrl: true }
    });
    if (f?.iconUrl) return f.iconUrl;
  } else if (typeUpper === 'EXERCISE' || typeUpper === 'GRAMMAR') {
    const a = await prisma.assignment.findUnique({
      where: { id: item.rawId },
      select: { thumbnail: true }
    });
    if (a?.thumbnail) return a.thumbnail;
  }
  return item.thumbnail || null;
}

export async function assignLibraryItemToClassAction(
  classId: string,
  item: {
    id: string;
    rawId: string;
    title: string;
    type: string;
    level?: string;
    playUrl?: string;
    thumbnail?: string | null;
    isAssignment: boolean;
  },
  payload: any
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const teacherId = session.user.id;

  let assignmentId = item.id;
  const resolvedThumbnail = await resolveItemThumbnail(item);

  if (!item.isAssignment) {
    const existing = await prisma.assignment.findFirst({
      where: {
        teacherId,
        deletedAt: null,
        instructions: { contains: `"rawId":"${item.rawId}"` }
      }
    });

    if (existing) {
      assignmentId = existing.id;
      if (!existing.thumbnail || existing.thumbnail.includes('unsplash.com')) {
        await prisma.assignment.update({
          where: { id: existing.id },
          data: { thumbnail: resolvedThumbnail }
        });
      }
    } else {
      const slug = await generateUniqueSlug(item.title || 'Assignment', 'assignment');
      const matType: MaterialType = 
        item.type === 'BOOK' || item.type === 'READING' || item.type === 'LESSON' ? 'READING' :
        item.type === 'FLASHCARD' ? 'FLASHCARD' : 'EXERCISE';

      const newAssignment = await prisma.assignment.create({
        data: {
          title: item.title,
          slug,
          materialType: matType,
          status: 'PUBLIC',
          teacherId,
          level: item.level || 'a1',
          subject: 'english',
          thumbnail: resolvedThumbnail,
          instructions: JSON.stringify({
            kind: item.type,
            rawId: item.rawId,
            playUrl: item.playUrl,
          }),
        }
      });
      assignmentId = newAssignment.id;
    }
  } else {
    if (resolvedThumbnail) {
      const existing = await prisma.assignment.findUnique({ where: { id: item.id } });
      if (existing && (!existing.thumbnail || existing.thumbnail.includes('unsplash.com'))) {
        await prisma.assignment.update({
          where: { id: item.id },
          data: { thumbnail: resolvedThumbnail }
        });
      }
    }
  }

  const updateData: any = { assignedAt: new Date() };
  const createData: any = { assignmentId, classId, maxAttempts: 1 };

  if (payload) {
    if (payload.startDate) {
      updateData.startDate = new Date(payload.startDate);
      createData.startDate = new Date(payload.startDate);
    }
    if (payload.dueDate) {
      updateData.dueDate = new Date(payload.dueDate);
      createData.dueDate = new Date(payload.dueDate);
    }
    if (payload.timeLimit !== undefined) {
      updateData.timeLimit = payload.timeLimit;
      createData.timeLimit = payload.timeLimit;
    }
    if (payload.maxAttempts !== undefined) {
      updateData.maxAttempts = payload.maxAttempts;
      createData.maxAttempts = payload.maxAttempts;
    }
  }

  await prisma.assignmentClass.upsert({
    where: { assignmentId_classId: { assignmentId, classId } },
    update: updateData,
    create: createData
  });

  revalidatePath('/teacher/materials');
  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true, assignmentId };
}

export async function assignBundleToClassAction(
  classId: string,
  groupTitle: string,
  items: Array<{
    id: string;
    rawId: string;
    title: string;
    type: string;
    level?: string;
    playUrl?: string;
    thumbnail?: string | null;
    isAssignment: boolean;
    section?: 'NEW' | 'REVIEW';
  }>,
  existingGroupId?: string,
  progressionOptions?: {
    prerequisiteGroupId?: string | null;
    unlockThreshold?: number | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const teacherId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { id: true, role: true }
  });
  const isAdmin = user?.role === 'ADMIN';

  const cls = await prisma.class.findFirst({
    where: { 
      id: classId,
      ...(isAdmin ? {} : { teacherId })
    }
  });
  if (!cls) throw new Error('Lớp học không tồn tại hoặc bạn không có quyền truy cập');

  if (!items || items.length === 0) {
    throw new Error('Vui lòng chọn ít nhất 1 bài tập để giao');
  }

  const title = (groupTitle || '').trim() || `Bài tập ngày ${new Date().toLocaleDateString('vi-VN')}`;

  // 1. Get or Create AssignmentGroup
  let group;
  if (existingGroupId) {
    group = await prisma.assignmentGroup.findUnique({ where: { id: existingGroupId } });
    if (group) {
      const updateData: any = {};
      if (groupTitle && groupTitle.trim()) updateData.title = groupTitle.trim();
      if (progressionOptions?.prerequisiteGroupId !== undefined) {
        updateData.prerequisiteGroupId = progressionOptions.prerequisiteGroupId || null;
      }
      if (progressionOptions?.unlockThreshold !== undefined) {
        updateData.unlockThreshold = progressionOptions.unlockThreshold ?? 60;
      }
      if (Object.keys(updateData).length > 0) {
        group = await prisma.assignmentGroup.update({
          where: { id: existingGroupId },
          data: updateData
        });
      }
    }
  }
  if (!group) {
    // Find existing groups in chronological order
    const existingGroups = await prisma.assignmentGroup.findMany({
      where: { classId },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, orderIndex: true, title: true }
    });

    // If existing groups have duplicate or unaligned orderIndex, normalize them
    const hasDuplicateOrder = existingGroups.some((g, idx) => g.orderIndex !== idx);
    if (hasDuplicateOrder && existingGroups.length > 0) {
      await prisma.$transaction(
        existingGroups.map((g, idx) =>
          prisma.assignmentGroup.update({
            where: { id: g.id },
            data: { orderIndex: idx },
          })
        )
      );
    }

    const nextOrderIndex = existingGroups.length;
    const lastGroup = existingGroups.length > 0 ? existingGroups[existingGroups.length - 1] : null;

    // Auto-chain: if not explicitly specified, new group requires completion of the preceding group
    const prerequisiteGroupId =
      progressionOptions?.prerequisiteGroupId !== undefined
        ? (progressionOptions.prerequisiteGroupId || null)
        : (lastGroup ? lastGroup.id : null);

    group = await prisma.assignmentGroup.create({
      data: {
        classId,
        title,
        orderIndex: nextOrderIndex,
        prerequisiteGroupId,
        unlockThreshold: progressionOptions?.unlockThreshold ?? 60,
        isHidden: true,
      }
    });
  }

  // 2. Process all items and attach to this group
  for (const item of items) {
    let assignmentId = item.id;
    const targetSection = item.section === 'REVIEW' ? 'REVIEW' : 'NEW';
    const resolvedThumbnail = await resolveItemThumbnail(item);

    if (!item.isAssignment) {
      const existing = await prisma.assignment.findFirst({
        where: {
          teacherId,
          deletedAt: null,
          instructions: { contains: `"rawId":"${item.rawId}"` }
        }
      });

      if (existing) {
        assignmentId = existing.id;
        let meta: any = {};
        try { meta = JSON.parse(existing.instructions || '{}'); } catch {}
        meta.section = targetSection;
        const updateData: any = { instructions: JSON.stringify(meta) };
        if (!existing.thumbnail || existing.thumbnail.includes('unsplash.com')) {
          updateData.thumbnail = resolvedThumbnail;
        }
        await prisma.assignment.update({
          where: { id: existing.id },
          data: updateData
        });
      } else {
        const slug = await generateUniqueSlug(item.title || 'Assignment', 'assignment');
        const matType: MaterialType = 
          item.type === 'BOOK' || item.type === 'READING' || item.type === 'LESSON' ? 'READING' :
          item.type === 'FLASHCARD' ? 'FLASHCARD' : 'EXERCISE';

        const newAssignment = await prisma.assignment.create({
          data: {
            title: item.title,
            slug,
            materialType: matType,
            status: 'PUBLIC',
            teacherId,
            level: item.level || 'a1',
            subject: 'english',
            thumbnail: resolvedThumbnail,
            instructions: JSON.stringify({
              kind: item.type,
              rawId: item.rawId,
              playUrl: item.playUrl,
              section: targetSection,
            }),
          }
        });
        assignmentId = newAssignment.id;
      }
    } else {
      // It is an existing assignment in database, update its section metadata and thumbnail if needed
      const a = await prisma.assignment.findUnique({ where: { id: item.id } });
      if (a) {
        let meta: any = {};
        try { meta = JSON.parse(a.instructions || '{}'); } catch {}
        meta.section = targetSection;
        const updateData: any = { instructions: JSON.stringify(meta) };
        if ((!a.thumbnail || a.thumbnail.includes('unsplash.com')) && resolvedThumbnail) {
          updateData.thumbnail = resolvedThumbnail;
        }
        await prisma.assignment.update({
          where: { id: item.id },
          data: updateData
        });
      }
    }

    // Upsert into AssignmentClass with groupId and no deadlines
    await prisma.assignmentClass.upsert({
      where: { assignmentId_classId: { assignmentId, classId } },
      update: {
        assignedAt: new Date(),
        groupId: group.id,
        startDate: null,
        dueDate: null,
        timeLimit: null,
        maxAttempts: null,
      },
      create: {
        assignmentId,
        classId,
        assignedAt: new Date(),
        groupId: group.id,
        startDate: null,
        dueDate: null,
        timeLimit: null,
        maxAttempts: null,
      }
    });
  }

  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath(`/student/classes/${classId}`);
  return { success: true, groupId: group.id, count: items.length, title };
}

export async function markLessonViewedAction(assignmentId: string, classId?: string, groupId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const studentId = session.user.id;

  const existing = await prisma.submission.findFirst({
    where: { 
      assignmentId, 
      studentId, 
      classId: classId || undefined,
      groupId: groupId || undefined,
      submittedAt: { not: null } 
    }
  });

  if (!existing) {
    await prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        classId: classId || null,
        groupId: groupId || null,
        startedAt: new Date(),
        submittedAt: new Date(),
        score: null,
        attemptNumber: 1,
      }
    });
  }

  return { success: true };
}

export async function renameAssignmentGroupAction(groupId: string, newTitle: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const group = await prisma.assignmentGroup.findUnique({
    where: { id: groupId },
    include: { class: true }
  });
  if (!group) throw new Error('Nhóm không tồn tại');

  const isOwner = group.class.teacherId === session.user.id;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw new Error('Unauthorized');

  const updated = await prisma.assignmentGroup.update({
    where: { id: groupId },
    data: { title: newTitle.trim() }
  });

  revalidatePath(`/teacher/classes/${group.classId}`);
  revalidatePath(`/student/classes/${group.classId}`);
  return { success: true, title: updated.title };
}

export async function deleteAssignmentGroupAction(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const group = await prisma.assignmentGroup.findUnique({
    where: { id: groupId },
    include: { class: true }
  });
  if (!group) throw new Error('Nhóm không tồn tại');

  const isOwner = group.class.teacherId === session.user.id;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw new Error('Unauthorized');

  const bridgePrerequisiteGroupId = group.prerequisiteGroupId || null;

  await prisma.$transaction(async (tx) => {
    // 1. Auto-Heal (Bridge the Gap): Any groups that required this group now require this group's prerequisite
    await tx.assignmentGroup.updateMany({
      where: { prerequisiteGroupId: groupId },
      data: { prerequisiteGroupId: bridgePrerequisiteGroupId }
    });

    // 2. Delete all class assignment connections for this group
    await tx.assignmentClass.deleteMany({
      where: { groupId }
    });

    // 3. Delete the group itself
    await tx.assignmentGroup.delete({
      where: { id: groupId }
    });

    // 4. Re-index remaining groups sequentially (0, 1, 2...)
    const remainingGroups = await tx.assignmentGroup.findMany({
      where: { classId: group.classId },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
      select: { id: true }
    });

    for (let i = 0; i < remainingGroups.length; i++) {
      await tx.assignmentGroup.update({
        where: { id: remainingGroups[i].id },
        data: { orderIndex: i }
      });
    }
  });

  revalidatePath(`/teacher/classes/${group.classId}`);
  revalidatePath(`/student/classes/${group.classId}`);
  return { success: true };
}

export async function updateAssignmentGroupProgressionAction(
  groupId: string,
  data: {
    prerequisiteGroupId?: string | null;
    unlockThreshold?: number | null;
    forceUnlocked?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const group = await prisma.assignmentGroup.findUnique({
    where: { id: groupId },
    include: { class: true }
  });
  if (!group) throw new Error('Nhóm không tồn tại');

  const isOwner = group.class.teacherId === session.user.id;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw new Error('Unauthorized');

  // Prevent circular dependency: prerequisiteGroupId cannot be the group itself
  if (data.prerequisiteGroupId === groupId) {
    throw new Error('Nhóm tiên quyết không thể là chính nhóm này');
  }

  const updated = await prisma.assignmentGroup.update({
    where: { id: groupId },
    data: {
      prerequisiteGroupId: data.prerequisiteGroupId !== undefined ? (data.prerequisiteGroupId || null) : group.prerequisiteGroupId,
      unlockThreshold: data.unlockThreshold !== undefined ? (data.unlockThreshold ?? 60) : group.unlockThreshold,
      forceUnlocked: data.forceUnlocked !== undefined ? data.forceUnlocked : group.forceUnlocked,
    }
  });

  revalidatePath(`/teacher/classes/${group.classId}`);
  revalidatePath(`/student/classes/${group.classId}`);
  return { success: true, group: updated };
}

export async function toggleForceUnlockAssignmentGroupAction(
  groupId: string,
  forceUnlocked: boolean
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const group = await prisma.assignmentGroup.findUnique({
    where: { id: groupId },
    include: { class: true }
  });
  if (!group) throw new Error('Nhóm không tồn tại');

  const isOwner = group.class.teacherId === session.user.id;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw new Error('Unauthorized');

  const updated = await prisma.assignmentGroup.update({
    where: { id: groupId },
    data: { forceUnlocked }
  });

  revalidatePath(`/teacher/classes/${group.classId}`);
  revalidatePath(`/student/classes/${group.classId}`);
  return { success: true, forceUnlocked: updated.forceUnlocked };
}

export async function reorderAssignmentGroupsAction(
  classId: string,
  orderedGroupIds: string[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { teacherId: true },
  });
  if (!cls) throw new Error('Lớp học không tồn tại');

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isOwner = cls.teacherId === session.user.id;
  const isAdmin = user?.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw new Error('Unauthorized');

  // Filter out any ungrouped or invalid ids
  const validIds = orderedGroupIds.filter((id) => id && !id.startsWith('ungrouped_'));
  if (validIds.length === 0) return { success: true };

  // Verify that these groups actually belong to this class
  const existingGroups = await prisma.assignmentGroup.findMany({
    where: {
      classId,
      id: { in: validIds },
    },
    select: { id: true },
  });
  const existingIdSet = new Set(existingGroups.map((g) => g.id));
  const sanitizedGroupIds = validIds.filter((id) => existingIdSet.has(id));

  // Auto-chain progression:
  // Item 0: prerequisiteGroupId = null, orderIndex = 0
  // Item i: prerequisiteGroupId = sanitizedGroupIds[i - 1], orderIndex = i
  await prisma.$transaction(
    sanitizedGroupIds.map((groupId, index) => {
      const prerequisiteGroupId = index === 0 ? null : sanitizedGroupIds[index - 1];
      return prisma.assignmentGroup.update({
        where: { id: groupId },
        data: {
          orderIndex: index,
          prerequisiteGroupId,
        },
      });
    })
  );

  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath(`/student/classes/${classId}`);
  return { success: true };
}

export async function toggleGroupVisibilityAction(
  groupId: string,
  isHidden: boolean,
  forceUnlockDependents?: boolean
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const group = await prisma.assignmentGroup.findUnique({
    where: { id: groupId },
    include: { class: true }
  });
  if (!group) throw new Error('Nhóm không tồn tại');

  const isOwner = group.class.teacherId === session.user.id;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw new Error('Unauthorized');

  // When hiding: check R1/R11 — are there visible groups that depend on this one?
  if (isHidden) {
    const dependentVisible = await prisma.assignmentGroup.findMany({
      where: {
        prerequisiteGroupId: groupId,
        isHidden: false,
      },
      select: { id: true, title: true, forceUnlocked: true }
    });

    const affectedGroups = dependentVisible.filter(g => !g.forceUnlocked);

    if (affectedGroups.length > 0 && !forceUnlockDependents) {
      // Return warning — UI should show confirmation dialog
      return {
        success: false,
        warning: true,
        affectedGroups: affectedGroups.map(g => ({ id: g.id, title: g.title })),
        message: `Nhóm "${group.title}" đang là tiên quyết của ${affectedGroups.map(g => `"${g.title}"`).join(', ')}. Bạn muốn tự động mở khóa các nhóm đó không?`
      };
    }

    // If forceUnlockDependents is true, auto-unlock affected groups
    if (affectedGroups.length > 0 && forceUnlockDependents) {
      await prisma.assignmentGroup.updateMany({
        where: { id: { in: affectedGroups.map(g => g.id) } },
        data: { forceUnlocked: true }
      });
    }
  }

  await prisma.assignmentGroup.update({
    where: { id: groupId },
    data: {
      isHidden,
      // When showing immediately, clear scheduled visibleFrom
      ...(isHidden === false ? { visibleFrom: null } : {})
    }
  });

  revalidatePath(`/teacher/classes/${group.classId}`);
  revalidatePath(`/student/classes/${group.classId}`);
  return { success: true };
}

export async function scheduleGroupVisibilityAction(
  groupId: string,
  visibleFrom: string | null
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const group = await prisma.assignmentGroup.findUnique({
    where: { id: groupId },
    include: { class: true }
  });
  if (!group) throw new Error('Nhóm không tồn tại');

  const isOwner = group.class.teacherId === session.user.id;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN';
  if (!isOwner && !isAdmin) throw new Error('Unauthorized');

  const parsedDate = visibleFrom ? new Date(visibleFrom) : null;

  // R5: If this group has a prerequisite, ensure visibleFrom >= prerequisite's visibleFrom
  if (parsedDate && group.prerequisiteGroupId) {
    const prereq = await prisma.assignmentGroup.findUnique({
      where: { id: group.prerequisiteGroupId },
      select: { visibleFrom: true, title: true, isHidden: true }
    });
    if (prereq?.visibleFrom && parsedDate < prereq.visibleFrom) {
      throw new Error(
        `Lịch hiển thị phải sau hoặc bằng nhóm tiên quyết "${prereq.title}" (${prereq.visibleFrom.toLocaleDateString('vi-VN')} ${prereq.visibleFrom.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`
      );
    }
  }

  // R7: If visibleFrom is in the past, treat as show immediately
  const now = new Date();
  const isInPast = parsedDate && parsedDate <= now;

  await prisma.assignmentGroup.update({
    where: { id: groupId },
    data: {
      // R6: Setting schedule auto-clears isHidden
      isHidden: false,
      visibleFrom: isInPast ? null : parsedDate,
    }
  });

  revalidatePath(`/teacher/classes/${group.classId}`);
  revalidatePath(`/student/classes/${group.classId}`);
  return { success: true };
}

export async function resolveInternalLinkForAssignmentAction(
  rawInput: string
): Promise<AssignableLibraryItem | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });
  const isAdmin = user?.role === 'ADMIN';

  if (!rawInput || typeof rawInput !== 'string') return null;
  const input = rawInput.trim();
  if (!input) return null;

  const mapAssignment = (a: any, source: 'mine' | 'library'): AssignableLibraryItem => {
    let type: 'GAME' | 'FLASHCARD' | 'READING' | 'GRAMMAR' | 'BOOK' = 'GRAMMAR';
    let playUrl = `/student/assignments/${a.id}/run`;
    let previewUrl = `/teacher/materials/${a.id}/edit`;
    let itemUnit = 'câu hỏi';
    let itemCount = a._count?.questions || 0;

    if (a.instructions) {
      try {
        const meta = JSON.parse(a.instructions);
        if (meta.kind === 'GAME') {
          type = 'GAME';
          if (meta.playUrl) {
            playUrl = meta.playUrl;
            previewUrl = meta.playUrl;
          }
          itemUnit = 'mục';
        } else if (meta.kind === 'BOOK') {
          type = 'BOOK';
          if (meta.playUrl) {
            playUrl = meta.playUrl;
            previewUrl = meta.playUrl;
          }
          itemUnit = 'trang';
        } else if (meta.kind === 'FLASHCARD') {
          type = 'FLASHCARD';
          if (meta.playUrl) {
            playUrl = meta.playUrl;
            previewUrl = meta.playUrl;
          }
          itemUnit = 'thẻ từ';
        }
      } catch {}
    }

    if (type === 'GRAMMAR' && a.materialType === 'READING') {
      type = 'READING';
      itemUnit = 'câu hỏi';
    } else if (type === 'GRAMMAR' && a.materialType === 'FLASHCARD') {
      type = 'FLASHCARD';
      itemUnit = 'thẻ từ';
    }

    return {
      id: a.id,
      rawId: a.id,
      title: a.title,
      type,
      source,
      level: mapAgeGroupToLevel(a.level),
      itemCount,
      itemUnit,
      thumbnail: a.thumbnail || null,
      createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
      isAssignment: true,
      previewUrl,
      playUrl
    };
  };

  // 1. Try URL parsing
  let pathname = '';
  let searchParams = new URLSearchParams();
  try {
    let urlStr = input;
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      if (urlStr.startsWith('/')) {
        urlStr = `http://dummy.local${urlStr}`;
      } else {
        urlStr = `http://dummy.local/${urlStr}`;
      }
    }
    const parsed = new URL(urlStr);
    pathname = parsed.pathname.replace(/\/+$/, '');
    searchParams = parsed.searchParams;
  } catch {
    pathname = input;
  }

  // Extract possible candidate keys from search params
  const candidates: string[] = [];
  const paramKeys = ['topicId', 'bookId', 'assignmentId', 'id', 'deckId', 'topic', 'slug'];
  for (const k of paramKeys) {
    const val = searchParams.get(k);
    if (val && !candidates.includes(val)) candidates.push(val);
  }

  // Specific Route 1: Book / Read-along
  // e.g. /student/books/:bookId, /admin/materials/read-along/:id, /read-along/:id
  const bookMatch = pathname.match(/\/(?:student\/books|admin\/materials\/read-along|read-along)\/([^/]+)/i);
  if (bookMatch && bookMatch[1]) {
    const key = bookMatch[1];
    const book = await prisma.readAlongBook.findFirst({
      where: {
        AND: [
          { OR: [{ id: key }, { bookId: key }] },
          ...(!isAdmin ? [{ status: BookStatus.PUBLISHED }] : [])
        ]
      },
      include: { slides: { select: { id: true } } }
    });
    if (book) {
      return {
        id: `book_${book.id}`,
        rawId: book.id,
        title: book.title,
        type: 'BOOK',
        source: 'library',
        level: mapAgeGroupToLevel(book.level),
        itemCount: book.slides?.length || 0,
        itemUnit: 'trang',
        thumbnail: book.thumbnailUrl || null,
        createdAt: book.createdAt ? book.createdAt.toISOString() : new Date().toISOString(),
        isAssignment: false,
        previewUrl: `/student/books/${book.bookId || book.id}`,
        playUrl: `/student/books/${book.bookId || book.id}`,
      };
    }
  }

  // Specific Route 2: Assignment / Material / Exercise
  // e.g. /student/assignments/:id(/run)?, /teacher/materials/:id(/edit)?, /admin/materials/:id(/edit)?
  const assignMatch = pathname.match(/\/(?:student\/assignments|teacher\/materials|admin\/materials)\/([^/]+)/i);
  if (assignMatch && assignMatch[1]) {
    const key = assignMatch[1];
    const assignment = await prisma.assignment.findFirst({
      where: {
        deletedAt: null,
        AND: [
          { OR: [{ id: key }, { slug: key }] },
          ...(!isAdmin ? [{ OR: [{ teacherId: userId }, { status: MaterialStatus.PUBLIC }] }] : [])
        ]
      },
      include: { _count: { select: { questions: true } } }
    });
    if (assignment) {
      return mapAssignment(assignment, assignment.teacherId === userId ? 'mine' : 'library');
    }
  }

  // Specific Route: Grammar Theory Lesson (/grammar/:topic/:lesson)
  // e.g. /grammar/tenses/past-perfect-continuous
  const grammarLessonMatch = pathname.match(/\/grammar\/([^/]+)\/([^/]+)/i);
  if (grammarLessonMatch && grammarLessonMatch[1] && grammarLessonMatch[2]) {
    const topicId = grammarLessonMatch[1];
    const lessonId = grammarLessonMatch[2];
    const topicCfg = getTopicById(topicId);
    const lessonCfg = topicCfg?.lessons.find((l: any) => l.id === lessonId);
    let label = lessonCfg?.label;
    if (!label) {
      label = lessonId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    const lvl = lessonCfg?.level || 'ALL';

    return {
      id: `lesson_grammar_${topicId}_${lessonId}`,
      rawId: `grammar:${topicId}:${lessonId}`,
      title: `Grammar lesson: ${label}`,
      type: 'LESSON',
      source: 'library',
      level: mapAgeGroupToLevel(lvl),
      itemCount: 1,
      itemUnit: 'bài học',
      thumbnail: null,
      createdAt: new Date().toISOString(),
      isAssignment: false,
      previewUrl: `/grammar/${topicId}/${lessonId}`,
      playUrl: `/grammar/${topicId}/${lessonId}`,
    };
  }

  // Specific Route: Standard Lesson / Video / Reading Lesson
  // e.g. /student/lessons/:id, /public/lessons/:id, /teacher/lessons/:id, /lessons/:id
  const standardLessonMatch = pathname.match(/\/(?:student\/lessons|public\/lessons|teacher\/lessons|lessons)\/([^/]+)/i);
  if (standardLessonMatch && standardLessonMatch[1]) {
    const key = standardLessonMatch[1];
    const lesson = await prisma.lesson.findFirst({
      where: {
        deletedAt: null,
        AND: [
          { OR: [{ id: key }, { slug: key }] },
          ...(!isAdmin ? [{ OR: [{ teacherId: userId }, { isPremium: false }] }] : [])
        ]
      }
    });
    if (lesson) {
      const isReading = lesson.materialType === 'READING' || !lesson.materialType;
      const type: 'READING' | 'LESSON' = isReading ? 'READING' : 'LESSON';
      const defaultPrefix = isReading ? 'Reading:' : 'Grammar lesson:';
      const displayTitle = lesson.title.startsWith('Grammar lesson:') || lesson.title.startsWith('Lesson:') || lesson.title.startsWith('Bài học:') || lesson.title.startsWith('Reading:') || lesson.title.startsWith('Bài đọc:')
        ? lesson.title
        : `${defaultPrefix} ${lesson.title}`;
      return {
        id: `${isReading ? 'reading' : 'lesson'}_${lesson.id}`,
        rawId: lesson.id,
        title: displayTitle,
        type,
        source: lesson.teacherId === userId ? 'mine' : 'library',
        level: mapAgeGroupToLevel(lesson.level || 'a1'),
        itemCount: 1,
        itemUnit: isReading ? 'bài đọc' : 'bài học',
        thumbnail: lesson.thumbnail || null,
        createdAt: lesson.createdAt ? lesson.createdAt.toISOString() : new Date().toISOString(),
        isAssignment: false,
        previewUrl: `/public/lessons/${lesson.slug || lesson.id}`,
        playUrl: `/student/lessons/${lesson.id}`,
      };
    }
  }

  // Specific Route 3: Exercise by level/topic/slug or grammar
  // e.g. /exercises/:level/:topic/:slug
  const exerciseMatch = pathname.match(/\/exercises\/[^/]+\/[^/]+\/([^/]+)/i);
  if (exerciseMatch && exerciseMatch[1]) {
    const key = exerciseMatch[1];
    const assignment = await prisma.assignment.findFirst({
      where: {
        deletedAt: null,
        AND: [
          { OR: [{ slug: key }, { id: key }] },
          ...(!isAdmin ? [{ OR: [{ teacherId: userId }, { status: MaterialStatus.PUBLIC }] }] : [])
        ]
      },
      include: { _count: { select: { questions: true } } }
    });
    if (assignment) {
      return mapAssignment(assignment, assignment.teacherId === userId ? 'mine' : 'library');
    }
  }

  // Specific Route 4: Flashcard game or topic
  // e.g. /student/game/flashcard-(?:match|quiz|sentence-builder) or /flashcards/:id
  const flashcardGameMatch = pathname.match(/\/(?:student\/game\/flashcard-(?:match|quiz|sentence-builder)|flashcards|admin\/flashcards)(?:\/([^/]+))?/i);
  if (flashcardGameMatch) {
    const directId = flashcardGameMatch[1];
    const fcKey = directId || searchParams.get('topicId') || searchParams.get('id') || searchParams.get('deckId');
    if (fcKey) {
      const fcTopic = await prisma.flashcardTopic.findFirst({
        where: { id: fcKey },
        include: { _count: { select: { flashcards: true } } }
      });
      if (fcTopic) {
        return {
          id: `flashcard_${fcTopic.id}`,
          rawId: fcTopic.id,
          title: fcTopic.name,
          type: 'FLASHCARD',
          source: 'library',
          level: mapAgeGroupToLevel(fcTopic.cefrLevel),
          itemCount: fcTopic._count?.flashcards || 0,
          itemUnit: 'thẻ từ',
          thumbnail: fcTopic.iconUrl || null,
          createdAt: fcTopic.createdAt ? fcTopic.createdAt.toISOString() : new Date().toISOString(),
          isAssignment: false,
          previewUrl: `/student/game/flashcard-match?topicId=${fcTopic.id}`,
          playUrl: `/student/game/flashcard-match?topicId=${fcTopic.id}`,
        };
      }
      const fcDeck = await prisma.flashcardDeck.findFirst({
        where: { id: fcKey },
        include: { assignment: { include: { _count: { select: { questions: true } } } } }
      });
      if (fcDeck && fcDeck.assignment) {
        return mapAssignment(fcDeck.assignment, fcDeck.assignment.teacherId === userId ? 'mine' : 'library');
      }
    }
  }

  // Specific Route 5: Match Word & Minigames
  const gameMatch = pathname.match(/\/(?:student\/game|game)\/([^/]+)/i);
  if (gameMatch) {
    const gKey = searchParams.get('topicId') || searchParams.get('id') || gameMatch[1];
    if (gKey) {
      const gTopic = await prisma.matchWordTopic.findFirst({
        where: {
          id: gKey,
          AND: [
            ...(!isAdmin ? [{ OR: [{ teacherId: userId }, { teacherId: null }] }] : [])
          ]
        },
        include: { _count: { select: { items: true } } }
      });
      if (gTopic) {
        return {
          id: `game_${gTopic.id}`,
          rawId: gTopic.id,
          title: gTopic.name,
          type: 'GAME',
          source: gTopic.teacherId === userId ? 'mine' : 'library',
          level: mapAgeGroupToLevel(gTopic.ageGroup),
          itemCount: gTopic._count?.items || 0,
          itemUnit: 'từ/câu',
          thumbnail: gTopic.thumbnailUrl || (gTopic.gameMode === 'shooter-quiz' ? '/images/games/shooter-quiz.jpg' : '/images/games/candy-quiz.jpg'),
          createdAt: gTopic.createdAt ? gTopic.createdAt.toISOString() : new Date().toISOString(),
          isAssignment: false,
          previewUrl: getGamePlayUrl(gTopic),
          playUrl: getGamePlayUrl(gTopic),
        };
      }
    }
  }

  // Generic Fallback by candidates
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const lastSeg = segments[segments.length - 1];
    if (!candidates.includes(lastSeg)) candidates.push(lastSeg);
  }
  if (!candidates.includes(input)) candidates.push(input);

  for (const cand of candidates) {
    if (!cand || cand.length < 3) continue;

    // Check assignment
    const a = await prisma.assignment.findFirst({
      where: {
        deletedAt: null,
        AND: [
          { OR: [{ id: cand }, { slug: cand }] },
          ...(!isAdmin ? [{ OR: [{ teacherId: userId }, { status: MaterialStatus.PUBLIC }] }] : [])
        ]
      },
      include: { _count: { select: { questions: true } } }
    });
    if (a) return mapAssignment(a, a.teacherId === userId ? 'mine' : 'library');

    // Check readAlongBook
    const b = await prisma.readAlongBook.findFirst({
      where: {
        AND: [
          { OR: [{ id: cand }, { bookId: cand }] },
          ...(!isAdmin ? [{ status: BookStatus.PUBLISHED }] : [])
        ]
      },
      include: { slides: { select: { id: true } } }
    });
    if (b) {
      return {
        id: `book_${b.id}`,
        rawId: b.id,
        title: b.title,
        type: 'BOOK',
        source: 'library',
        level: mapAgeGroupToLevel(b.level),
        itemCount: b.slides?.length || 0,
        itemUnit: 'trang',
        thumbnail: b.thumbnailUrl || null,
        createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
        isAssignment: false,
        previewUrl: `/student/books/${b.bookId || b.id}`,
        playUrl: `/student/books/${b.bookId || b.id}`,
      };
    }

    // Check matchWordTopic
    const g = await prisma.matchWordTopic.findFirst({
      where: {
        id: cand,
        AND: [
          ...(!isAdmin ? [{ OR: [{ teacherId: userId }, { teacherId: null }] }] : [])
        ]
      },
      include: { _count: { select: { items: true } } }
    });
    if (g) {
      return {
        id: `game_${g.id}`,
        rawId: g.id,
        title: g.name,
        type: 'GAME',
        source: g.teacherId === userId ? 'mine' : 'library',
        level: mapAgeGroupToLevel(g.ageGroup),
        itemCount: g._count?.items || 0,
        itemUnit: 'từ/câu',
        thumbnail: g.thumbnailUrl || (g.gameMode === 'shooter-quiz' ? '/images/games/shooter-quiz.jpg' : '/images/games/candy-quiz.jpg'),
        createdAt: g.createdAt ? g.createdAt.toISOString() : new Date().toISOString(),
        isAssignment: false,
        previewUrl: getGamePlayUrl(g),
        playUrl: getGamePlayUrl(g),
      };
    }

    // Check flashcardTopic
    const fc = await prisma.flashcardTopic.findFirst({
      where: { id: cand },
      include: { _count: { select: { flashcards: true } } }
    });
    if (fc) {
      return {
        id: `flashcard_${fc.id}`,
        rawId: fc.id,
        title: fc.name,
        type: 'FLASHCARD',
        source: 'library',
        level: mapAgeGroupToLevel(fc.cefrLevel),
        itemCount: fc._count?.flashcards || 0,
        itemUnit: 'thẻ từ',
        thumbnail: fc.iconUrl || null,
        createdAt: fc.createdAt ? fc.createdAt.toISOString() : new Date().toISOString(),
        isAssignment: false,
        previewUrl: `/student/game/flashcard-match?topicId=${fc.id}`,
        playUrl: `/student/game/flashcard-match?topicId=${fc.id}`,
      };
    }
  }

  return null;
}

function isLikelyLinkOrIdString(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  if (trimmed.startsWith('/')) return true;
  if (/^localhost(:\d+)?\//i.test(trimmed)) return true;
  if (/^(student|teacher|admin|game|exercises|flashcards|read-along|grammar|lesson|lessons)\//i.test(trimmed)) return true;
  if (/^c[a-z0-9]{24,32}$/i.test(trimmed)) return true;
  return false;
}

export interface SearchAssignableParams {
  query?: string;
  contentType?: string;
  level?: string;
  source: 'mine' | 'library' | 'recent';
  classId?: string;
  limit?: number;
}

export interface SearchAssignableResult {
  items: AssignableLibraryItem[];
  isFromLink?: boolean;
  linkError?: string | null;
}

export async function searchAssignableContentAction(
  params: SearchAssignableParams
): Promise<SearchAssignableResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });
  const isAdmin = user?.role === 'ADMIN';

  const q = (params.query || '').trim();
  const contentType = params.contentType || 'ALL';
  const level = params.level || 'ALL';
  const source = params.source || 'mine';
  const limit = Math.min(params.limit || 30, 60);

  // Helper to map DB Assignment to AssignableLibraryItem
  const mapAssignment = (a: any, src: 'mine' | 'library'): AssignableLibraryItem => {
    let type: 'GAME' | 'FLASHCARD' | 'READING' | 'GRAMMAR' | 'BOOK' = 'GRAMMAR';
    let playUrl = `/student/assignments/${a.id}/run`;
    let previewUrl = `/teacher/materials/${a.id}/edit`;
    let itemUnit = 'câu hỏi';
    let itemCount = a._count?.questions || 0;
    let section: 'NEW' | 'REVIEW' = 'NEW';

    if (a.instructions) {
      try {
        const meta = JSON.parse(a.instructions);
        if (meta.kind === 'GAME') {
          type = 'GAME';
          if (meta.playUrl) {
            playUrl = meta.playUrl;
            previewUrl = meta.playUrl;
          }
          itemUnit = 'mục';
        } else if (meta.kind === 'BOOK') {
          type = 'BOOK';
          if (meta.playUrl) {
            playUrl = meta.playUrl;
            previewUrl = meta.playUrl;
          }
          itemUnit = 'trang';
        } else if (meta.kind === 'FLASHCARD') {
          type = 'FLASHCARD';
          if (meta.playUrl) {
            playUrl = meta.playUrl;
            previewUrl = meta.playUrl;
          }
          itemUnit = 'thẻ từ';
        } else if (meta.kind === 'LESSON') {
          type = 'LESSON';
          if (meta.playUrl) {
            playUrl = meta.playUrl;
            previewUrl = meta.playUrl;
          }
          itemUnit = 'bài học';
        }
        if (meta.section) {
          section = meta.section;
        }
      } catch {}
    }

    if (type === 'GRAMMAR' && a.materialType === 'READING') {
      type = 'READING';
      itemUnit = 'câu hỏi';
    } else if (type === 'GRAMMAR' && a.materialType === 'FLASHCARD') {
      type = 'FLASHCARD';
      itemUnit = 'thẻ từ';
    } else if (type === 'GRAMMAR' && (a.materialType === 'LESSON' || (a.title && (a.title.toLowerCase().startsWith('grammar lesson:') || a.title.toLowerCase().startsWith('lý thuyết:'))))) {
      type = 'LESSON';
      itemUnit = 'bài học';
    }

    return {
      id: a.id,
      rawId: a.id,
      title: a.title,
      type,
      source: src,
      level: mapAgeGroupToLevel(a.level),
      itemCount,
      itemUnit,
      thumbnail: a.thumbnail || null,
      createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
      isAssignment: true,
      previewUrl,
      playUrl,
      section,
    };
  };

  const getLevelMatchConditions = (targetLevel: string) => {
    if (targetLevel === 'ALL') return undefined;
    const l = targetLevel.toLowerCase();
    if (l === 'pre-a1') return ['pre-a1', 'pre_a1', 'pre-a1-a1', '2-5', 'kids-2-5', 'kindergarten'];
    if (l === 'a1') return ['a1', '6-12', 'elementary', 'pre-a1-a1'];
    if (l === 'a2') return ['a2', 'teen'];
    if (l === 'b1') return ['b1', 'readers', 'intermediate'];
    if (l === 'b2') return ['b2', 'upper_intermediate'];
    if (l === 'c1') return ['c1', 'advanced'];
    return [l];
  };

  const levelValues = getLevelMatchConditions(level);

  // Case 0: Source 'recent' - Fetch assignments previously assigned to this class or by this teacher
  if (source === 'recent') {
    const recentAssigned = await prisma.assignmentClass.findMany({
      where: {
        ...(params.classId ? { classId: params.classId } : { class: { teacherId: userId } }),
        assignment: {
          deletedAt: null,
          ...(q ? { title: { contains: q, mode: 'insensitive' } } : {})
        }
      },
      include: {
        assignment: {
          include: { _count: { select: { questions: true } } }
        }
      },
      orderBy: { assignedAt: 'desc' },
      take: limit * 2,
    });

    const seenIds = new Set<string>();
    const recentItems: AssignableLibraryItem[] = [];
    for (const ac of recentAssigned) {
      if (!seenIds.has(ac.assignment.id)) {
        seenIds.add(ac.assignment.id);
        const mapped = mapAssignment(ac.assignment, ac.assignment.teacherId === userId ? 'mine' : 'library');
        if (contentType !== 'ALL' && mapped.type !== contentType) continue;
        if (levelValues && mapped.level && !levelValues.some(v => (mapped.level || '').toLowerCase().includes(v))) continue;
        mapped.section = 'REVIEW';
        recentItems.push(mapped);
      }
      if (recentItems.length >= limit) break;
    }
    return { items: recentItems };
  }

  // Case 1: Fast-path for Link or Direct ID
  if (q && isLikelyLinkOrIdString(q)) {
    const item = await resolveInternalLinkForAssignmentAction(q);
    if (item) {
      return { items: [item], isFromLink: true };
    }
    return {
      items: [],
      isFromLink: true,
      linkError: 'Không tìm thấy bài tập, bài học hoặc trò chơi nào từ liên kết này. Vui lòng kiểm tra lại đường dẫn nội bộ hệ thống.'
    };
  }

  const results: AssignableLibraryItem[] = [];

  const buildLevelFilter = (field: string = 'level') => {
    if (!levelValues || levelValues.length === 0) return undefined;
    return {
      OR: [
        { [field]: { in: levelValues } },
        ...levelValues.map(v => ({ [field]: { contains: v, mode: 'insensitive' as const } }))
      ]
    };
  };

  const shouldSearchAssignments = ['ALL', 'GRAMMAR', 'READING', 'FLASHCARD', 'LESSON', 'BOOK', 'GAME'].includes(contentType);
  const shouldSearchGames = ['ALL', 'GAME'].includes(contentType);
  const shouldSearchFlashcards = ['ALL', 'FLASHCARD'].includes(contentType) && source === 'library';
  const shouldSearchBooks = ['ALL', 'BOOK'].includes(contentType) && source === 'library';
  const shouldSearchLessons = ['ALL', 'LESSON'].includes(contentType);

  const queries: Promise<void>[] = [];

  // 1. Query Assignments
  if (shouldSearchAssignments) {
    const isLessonSearch = contentType === 'LESSON';
    const isBookSearch = contentType === 'BOOK';
    const isGameSearch = contentType === 'GAME';
    const isFlashcardSearch = contentType === 'FLASHCARD';
    const isReadingSearch = contentType === 'READING';
    const isGrammarSearch = contentType === 'GRAMMAR';

    const assignWhere: any = {
      deletedAt: null,
      AND: []
    };

    if (source === 'mine') {
      assignWhere.AND.push({ teacherId: userId });
    } else {
      assignWhere.AND.push(
        isAdmin ? { status: 'PUBLIC' } : { status: 'PUBLIC', teacherId: { not: userId } }
      );
    }

    if (isLessonSearch) {
      assignWhere.AND.push({
        OR: [
          { instructions: { contains: '"kind":"LESSON"' } },
          { title: { startsWith: 'Grammar lesson', mode: 'insensitive' } },
          { title: { startsWith: 'Lý thuyết:', mode: 'insensitive' } }
        ]
      });
    } else if (isBookSearch) {
      assignWhere.AND.push({
        instructions: { contains: '"kind":"BOOK"' }
      });
    } else if (isGameSearch) {
      assignWhere.AND.push({
        instructions: { contains: '"kind":"GAME"' }
      });
    } else if (isFlashcardSearch) {
      assignWhere.AND.push({
        OR: [
          { materialType: 'FLASHCARD' },
          { instructions: { contains: '"kind":"FLASHCARD"' } }
        ]
      });
    } else if (isReadingSearch) {
      assignWhere.AND.push({
        materialType: 'READING',
        NOT: [
          { instructions: { contains: '"kind":"BOOK"' } },
          { instructions: { contains: '"kind":"LESSON"' } },
          { instructions: { contains: '"kind":"GAME"' } },
          { instructions: { contains: '"kind":"FLASHCARD"' } },
          { title: { startsWith: 'Grammar lesson', mode: 'insensitive' } },
          { title: { startsWith: 'Lý thuyết:', mode: 'insensitive' } }
        ]
      });
    } else if (isGrammarSearch) {
      assignWhere.AND.push({
        materialType: 'EXERCISE',
        NOT: [
          { instructions: { contains: '"kind":"GAME"' } },
          { instructions: { contains: '"kind":"LESSON"' } },
          { instructions: { contains: '"kind":"BOOK"' } },
          { instructions: { contains: '"kind":"FLASHCARD"' } },
          { title: { startsWith: 'Grammar lesson', mode: 'insensitive' } },
          { title: { startsWith: 'Lý thuyết:', mode: 'insensitive' } }
        ]
      });
    }

    if (q) {
      assignWhere.AND.push({ title: { contains: q, mode: 'insensitive' } });
    }

    const lvlFilter = buildLevelFilter('level');
    if (lvlFilter) {
      assignWhere.AND.push(lvlFilter);
    }

    queries.push(
      prisma.assignment.findMany({
        where: assignWhere,
        select: {
          id: true,
          title: true,
          level: true,
          materialType: true,
          thumbnail: true,
          createdAt: true,
          instructions: true,
          teacherId: true,
          _count: { select: { questions: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }).then(list => {
        list.forEach(a => {
          results.push(mapAssignment(a, a.teacherId === userId ? 'mine' : 'library'));
        });
      })
    );
  }

  // 2. Query MatchWord Topics (Games)
  if (shouldSearchGames) {
    const gameWhere: any = {
      AND: []
    };

    if (source === 'mine') {
      gameWhere.AND.push({ teacherId: userId });
    } else {
      let publishedIds: string[] = [];
      try {
        const setting = await prisma.systemSetting.findUnique({
          where: { key: "published_teacher_games" },
        });
        if (setting?.value && typeof setting.value === 'object' && Array.isArray((setting.value as any).publishedIds)) {
          publishedIds = (setting.value as any).publishedIds;
        }
      } catch (err) {
        console.error('Error fetching published teacher games:', err);
      }

      if (publishedIds.length > 0) {
        gameWhere.AND.push({
          OR: [
            { teacherId: null },
            { id: { in: publishedIds } }
          ]
        });
      } else {
        gameWhere.AND.push({ teacherId: null });
      }
    }

    if (q) {
      gameWhere.AND.push({ name: { contains: q, mode: 'insensitive' } });
    }

    const gameLvlFilter = buildLevelFilter('ageGroup');
    if (gameLvlFilter) {
      gameWhere.AND.push(gameLvlFilter);
    }

    queries.push(
      prisma.matchWordTopic.findMany({
        where: gameWhere,
        select: {
          id: true,
          name: true,
          ageGroup: true,
          gameMode: true,
          thumbnailUrl: true,
          createdAt: true,
          teacherId: true,
          teacher: {
            select: {
              name: true,
            }
          },
          _count: { select: { items: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }).then(list => {
        list.forEach(g => {
          const isTeacherGame = !!g.teacherId;
          const authorName = isTeacherGame ? (g.teacher?.name || 'Giáo viên') : null;
          const badgeLabel = isTeacherGame ? 'Giáo viên tạo' : null;

          results.push({
            id: `game_${g.id}`,
            rawId: g.id,
            title: g.name,
            type: 'GAME',
            source: g.teacherId === userId ? 'mine' : 'library',
            level: mapAgeGroupToLevel(g.ageGroup),
            itemCount: g._count?.items || 0,
            itemUnit: 'từ/câu',
            thumbnail: g.thumbnailUrl || (g.gameMode === 'shooter-quiz' || g.gameMode === 'choice-shooter' ? '/images/games/shooter-quiz.jpg' : g.gameMode === 'train' ? '/images/games/train-vocab.png' : '/images/games/candy-quiz.jpg'),
            createdAt: g.createdAt ? g.createdAt.toISOString() : new Date().toISOString(),
            isAssignment: false,
            previewUrl: getGamePlayUrl(g),
            playUrl: getGamePlayUrl(g),
            authorName,
            badgeLabel,
          });
        });
      })
    );
  }

  // 3. Query Flashcard Topics (Library) - Groups 1, 2, 3: Flashcard Match, Sentence Builder, Flashcard Quiz
  if (shouldSearchFlashcards) {
    const fcWhere: any = { AND: [] };
    if (q) fcWhere.AND.push({ name: { contains: q, mode: 'insensitive' } });
    const fcLvlFilter = buildLevelFilter('cefrLevel');
    if (fcLvlFilter) fcWhere.AND.push(fcLvlFilter);

    queries.push(
      prisma.flashcardTopic.findMany({
        where: fcWhere.AND.length > 0 ? fcWhere : undefined,
        select: {
          id: true,
          name: true,
          cefrLevel: true,
          iconUrl: true,
          createdAt: true,
          _count: { select: { flashcards: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }).then(list => {
        list.forEach(f => {
          const ageParam = mapCefrToAgeParam(f.cefrLevel);
          const lvl = mapAgeGroupToLevel(f.cefrLevel);
          const count = f._count?.flashcards || 0;
          const created = f.createdAt ? f.createdAt.toISOString() : new Date().toISOString();

          // Group 1: Flashcard Match (Lật thẻ)
          results.push({
            id: `flashcard_match_${f.id}`,
            rawId: `flashcard_match:${f.id}`,
            title: `Lật thẻ: ${f.name}`,
            type: 'FLASHCARD',
            source: 'library',
            level: lvl,
            itemCount: count,
            itemUnit: 'thẻ từ',
            thumbnail: f.iconUrl || '/images/games/flashcard-match.png',
            createdAt: created,
            isAssignment: false,
            previewUrl: `/student/game/flashcard-match?topicId=${f.id}`,
            playUrl: `/student/game/flashcard-match?topicId=${f.id}`,
            badgeLabel: 'Lật thẻ',
          });

          // Group 2: Sentence Builder (Flashcards - Ghép câu)
          results.push({
            id: `flashcard_sb_${f.id}`,
            rawId: `flashcard_sb:${f.id}`,
            title: `Ghép câu: ${f.name}`,
            type: 'FLASHCARD',
            source: 'library',
            level: lvl,
            itemCount: count,
            itemUnit: 'câu',
            thumbnail: '/images/games/flashcard-sentence-builder.png',
            createdAt: created,
            isAssignment: false,
            previewUrl: `/student/game/flashcard-sentence-builder?topicId=${f.id}&age=${ageParam}`,
            playUrl: `/student/game/flashcard-sentence-builder?topicId=${f.id}&age=${ageParam}`,
            badgeLabel: 'Ghép câu',
          });

          // Group 3: Flashcard Quiz (Đố vui)
          results.push({
            id: `flashcard_quiz_${f.id}`,
            rawId: `flashcard_quiz:${f.id}`,
            title: `Đố vui: ${f.name}`,
            type: 'FLASHCARD',
            source: 'library',
            level: lvl,
            itemCount: count,
            itemUnit: 'câu hỏi',
            thumbnail: '/images/games/flashcard-quiz.png',
            createdAt: created,
            isAssignment: false,
            previewUrl: `/student/game/flashcard-quiz?age=${ageParam}&topicId=${f.id}`,
            playUrl: `/student/game/flashcard-quiz?age=${ageParam}&topicId=${f.id}`,
            badgeLabel: 'Đố vui',
          });
        });
      })
    );

    // Also include SentenceBuilderGame (26 games)
    const sbWhere: any = { AND: [] };
    if (q) sbWhere.AND.push({ name: { contains: q, mode: 'insensitive' } });
    const sbLvlFilter = buildLevelFilter('ageGroup');
    if (sbLvlFilter) sbWhere.AND.push(sbLvlFilter);

    queries.push(
      prisma.sentenceBuilderGame.findMany({
        where: sbWhere.AND.length > 0 ? sbWhere : undefined,
        select: {
          id: true,
          name: true,
          ageGroup: true,
          thumbnailUrl: true,
          createdAt: true,
          _count: { select: { questions: true } }
        },
        orderBy: { order: 'asc' },
        take: limit
      }).then(sbList => {
        sbList.forEach(sb => {
          results.push({
            id: `sb_game_${sb.id}`,
            rawId: `sb_game:${sb.id}`,
            title: `Ghép câu: ${sb.name}`,
            type: 'FLASHCARD',
            source: 'library',
            level: mapAgeGroupToLevel(sb.ageGroup),
            itemCount: sb._count?.questions || 0,
            itemUnit: 'câu',
            thumbnail: sb.thumbnailUrl || '/images/games/sentence-builder.png',
            createdAt: sb.createdAt ? sb.createdAt.toISOString() : new Date().toISOString(),
            isAssignment: false,
            previewUrl: `/student/game/sentence-builder/${sb.id}?age=${sb.ageGroup || '6-12'}`,
            playUrl: `/student/game/sentence-builder/${sb.id}?age=${sb.ageGroup || '6-12'}`,
            badgeLabel: 'Ghép câu',
          });
        });
      })
    );
  }

  // 4. Query ReadAlong Books (Library)
  if (shouldSearchBooks) {
    const bookWhere: any = {
      status: 'PUBLISHED',
      AND: []
    };
    if (q) bookWhere.AND.push({ title: { contains: q, mode: 'insensitive' } });
    const bookLvlFilter = buildLevelFilter('level');
    if (bookLvlFilter) bookWhere.AND.push(bookLvlFilter);

    queries.push(
      prisma.readAlongBook.findMany({
        where: bookWhere.AND.length > 0 ? bookWhere : { status: 'PUBLISHED' },
        select: {
          id: true,
          bookId: true,
          title: true,
          level: true,
          thumbnailUrl: true,
          createdAt: true,
          _count: { select: { slides: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }).then(list => {
        list.forEach(b => {
          results.push({
            id: `book_${b.id}`,
            rawId: b.id,
            title: b.title,
            type: 'BOOK',
            source: 'library',
            level: mapAgeGroupToLevel(b.level),
            itemCount: b._count?.slides || 0,
            itemUnit: 'trang',
            thumbnail: b.thumbnailUrl || null,
            createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
            isAssignment: false,
            previewUrl: `/student/books/${b.bookId || b.id}`,
            playUrl: `/student/books/${b.bookId || b.id}`
          });
        });
      })
    );
  }

  // 5. Query Grammar Lessons (Library from Taxonomy + DB Lessons)
  if (shouldSearchLessons) {
    if (source === 'library') {
      // Search built-in Grammar Taxonomy lessons
      let addedTaxonomyCount = 0;
      const maxTaxonomy = contentType === 'LESSON' ? limit : (q ? 15 : 6);

      for (const topic of GRAMMAR_TOPICS) {
        for (const lesson of topic.lessons) {
          if (addedTaxonomyCount >= maxTaxonomy) break;

          // Check CEFR level
          if (levelValues) {
            const matchesLevel = levelValues.some(v => lesson.level.toLowerCase().includes(v));
            if (!matchesLevel) continue;
          }

          // Check search query
          if (q) {
            const qLower = q.toLowerCase();
            const matches =
              lesson.label.toLowerCase().includes(qLower) ||
              lesson.id.toLowerCase().includes(qLower) ||
              topic.label.toLowerCase().includes(qLower) ||
              topic.labelVi.toLowerCase().includes(qLower);
            if (!matches) continue;
          }

          addedTaxonomyCount++;
          results.push({
            id: `lesson_grammar_${topic.id}_${lesson.id}`,
            rawId: `grammar:${topic.id}:${lesson.id}`,
            title: `Grammar lesson: ${lesson.label}`,
            type: 'LESSON',
            source: 'library',
            level: mapAgeGroupToLevel(lesson.level),
            itemCount: 1,
            itemUnit: 'bài học',
            thumbnail: null,
            createdAt: new Date().toISOString(),
            isAssignment: false,
            previewUrl: `/grammar/${topic.id}/${lesson.id}`,
            playUrl: `/grammar/${topic.id}/${lesson.id}`,
          });
        }
      }
    }

    // Also query database Lessons (created by teachers or admin)
    const lessonWhere: any = {
      deletedAt: null,
      AND: []
    };

    if (source === 'mine') {
      lessonWhere.AND.push({ teacherId: userId });
    } else {
      lessonWhere.AND.push(
        isAdmin ? {} : { OR: [{ teacherId: null }, { isPremium: false }] }
      );
    }

    if (contentType === 'LESSON') {
      lessonWhere.AND.push({
        OR: [
          { materialType: 'LESSON' },
          { title: { startsWith: 'Grammar lesson', mode: 'insensitive' } },
          { title: { startsWith: 'Lesson:', mode: 'insensitive' } },
          { title: { startsWith: 'Lý thuyết:', mode: 'insensitive' } }
        ]
      });
    }

    if (q) {
      lessonWhere.AND.push({ title: { contains: q, mode: 'insensitive' } });
    }

    const dbLessonLvlFilter = buildLevelFilter('level');
    if (dbLessonLvlFilter) {
      lessonWhere.AND.push(dbLessonLvlFilter);
    }

    queries.push(
      prisma.lesson.findMany({
        where: lessonWhere.AND.length > 0 ? lessonWhere : { deletedAt: null },
        select: {
          id: true,
          slug: true,
          title: true,
          level: true,
          thumbnail: true,
          createdAt: true,
          teacherId: true,
          materialType: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }).then(list => {
        list.forEach(l => {
          const displayTitle = l.title.startsWith('Grammar lesson:') || l.title.startsWith('Lesson:') || l.title.startsWith('Bài học:') || l.title.startsWith('Lý thuyết:')
            ? l.title
            : `Grammar lesson: ${l.title}`;
          results.push({
            id: `lesson_${l.id}`,
            rawId: l.id,
            title: displayTitle,
            type: 'LESSON',
            source: l.teacherId === userId ? 'mine' : 'library',
            level: mapAgeGroupToLevel(l.level || 'a1'),
            itemCount: 1,
            itemUnit: 'bài học',
            thumbnail: l.thumbnail || null,
            createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
            isAssignment: false,
            previewUrl: `/student/lessons/${l.id}`,
            playUrl: `/student/lessons/${l.id}`,
          });
        });
      })
    );
  }

  await Promise.all(queries);

  // Strict type filter (exclude mismatched types)
  const filteredResults = contentType === 'ALL'
    ? results
    : results.filter(item => item.type === contentType);

  // Deduplicate items by type + (rawId or id)
  const seenKeys = new Set<string>();
  const uniqueResults: AssignableLibraryItem[] = [];
  for (const item of filteredResults) {
    const key = `${item.type}_${item.rawId || item.id}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueResults.push(item);
    }
  }

  // Sort by createdAt desc
  uniqueResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    items: uniqueResults.slice(0, limit),
    isFromLink: false
  };
}

