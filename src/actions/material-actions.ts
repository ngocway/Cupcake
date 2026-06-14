"use server"

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from "next/cache";
import { syncToHomepageFeed, removeFromHomepageFeed } from "@/lib/feed-sync";
import crypto from 'crypto';
import { MaterialStatus } from '@/generated/client';
import { after } from 'next/server';
import { generateUniqueSlug } from '@/lib/slugify';

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
  categoryIds?: string[];
  targetAudiences?: string[];
  level?: string;
  learningGoals?: string[];
  thumbnail?: string | null;
  ttsVoice?: string;
  ttsSpeed?: number;
  audioMetadata?: any;
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
  const isAutoGenerated = !thumbnail || (typeof thumbnail === 'string' && thumbnail.includes('api.dicebear.com'));
  if (isAutoGenerated && !payload.thumbnail) {
    thumbnail = await generateMaterialThumbnail(
      { title: payload.title, subject: payload.subject || existing?.subject || 'English' },
      payload.questions || []
    );
  }

  console.log(`[AutoSave] Starting update for assignment: ${payload.id}`);

  const updatePayload: any = { 
    updatedAt: new Date(),
    ...(payload.targetAudiences !== undefined && { targetAudiences: { set: payload.targetAudiences } }),
    ...(payload.learningGoals !== undefined && { learningGoals: { set: payload.learningGoals } }),
    ...(payload.categoryIds !== undefined && { categories: { set: payload.categoryIds.map((id: string) => ({ id })) } })
  };

  if (existing) {
    const fields = ['title', 'readingText', 'videoUrl', 'audioUrl', 'ttsVoice', 'ttsSpeed', 'subject', 'gradeLevel', 'level', 'shortDescription', 'tags', 'instructions', 'audioMetadata'];
    for (const field of fields) {
      if (payload[field as keyof typeof payload] !== undefined && payload[field as keyof typeof payload] !== existing[field as keyof typeof existing]) {
        updatePayload[field] = payload[field as keyof typeof payload] || null;
      }
    }
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
    updatePayload.shortDescription = payload.shortDescription || null;
    updatePayload.tags = payload.tags || "";
    updatePayload.instructions = payload.instructions || null;
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
        shortDescription: payload.shortDescription || null,
        tags: payload.tags || "",
        instructions: payload.instructions || null,
        teacherId: session.user.id,
        materialType: 'READING', 
        status: 'DRAFT',
        targetAudiences: payload.targetAudiences !== undefined ? payload.targetAudiences : [],
        learningGoals: payload.learningGoals !== undefined ? payload.learningGoals : [],
        categories: {
          connect: payload.categoryIds ? payload.categoryIds.map(id => ({ id })) : []
        }
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
    if (payload.learningGoals !== undefined) lessonUpdateData.learningGoals = { set: payload.learningGoals };
    if (payload.categoryIds !== undefined) lessonUpdateData.categories = { set: payload.categoryIds.map(id => ({ id })) };

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

      const questionData = {
        assignmentId: payload.id,
        type: q.type,
        orderIndex: idx,
        points: Number(q.points) || 1.0,
        explanation: q.explanation || null,
        content: typeof q.content === 'object' ? JSON.stringify(q.content) : q.content || "{}",
        mediaType: q.mediaType || 'NONE',
        mediaUrl: q.mediaUrl || null,
        imageUrl: q.imageUrl || null,
        audioUrl: q.audioUrl || null,
        videoUrl: q.videoUrl || null,
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

  // Sync to Homepage Feed and Tags
  after(() => {
    syncToHomepageFeed(payload.id, "EXERCISE").catch(err => {
      console.error("[AutoSave] Background sync feed failed:", err);
    });
    
    if (existing && existing.lesson) {
      syncToHomepageFeed(existing.lesson.id, "LESSON").catch(err => {
        console.error("[AutoSave] Background sync feed failed for lesson:", err);
      });
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
  });

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

  // Update assignment thumbnail
  const updatedAssignment = await prisma.assignment.update({
    where: { id },
    data: { thumbnail },
    include: { lesson: true }
  });

  // Sync to Lesson if exists
  if (updatedAssignment.lesson) {
    await prisma.lesson.update({
      where: { id: updatedAssignment.lesson.id },
      data: { thumbnail }
    });
  }

  // Sync to Homepage Feed (Background execution, non-blocking)
  after(() => {
    syncToHomepageFeed(id, "EXERCISE").catch(err => {
      console.error("[SaveThumbnail] Background sync feed failed:", err);
    });
    
    if (updatedAssignment.lesson) {
      syncToHomepageFeed(updatedAssignment.lesson.id, "LESSON").catch(err => {
        console.error("[SaveThumbnail] Background sync feed failed for lesson:", err);
      });
    }
  });

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
  syncToHomepageFeed(id, "EXERCISE").catch(err => {
    console.error("[UpdateStatus] Background sync feed failed:", err);
  });
  
  const updatedAss = await prisma.assignment.findUnique({ where: { id }, include: { lesson: true } });
  if (updatedAss?.lesson) {
    syncToHomepageFeed(updatedAss.lesson.id, "LESSON").catch(err => {
      console.error("[UpdateStatus] Background sync feed failed for lesson:", err);
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
  const [assignments, categories, dbTags] = await Promise.all([
    prisma.assignment.findMany({
      select: { tags: true, gradeLevel: true, targetAudiences: true }
    }),
    prisma.category.findMany({ select: { nameVi: true, nameEn: true } }),
    prisma.tag.findMany({ select: { name: true } })
  ]);

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
    categories: categories.flatMap(c => [c.nameVi, c.nameEn]).filter(Boolean)
  };
}
