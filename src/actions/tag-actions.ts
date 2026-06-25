"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidateTag } from "next/cache";
import { syncToHomepageFeed } from "@/lib/feed-sync";
import { reindexAssignment, reindexLesson } from '@/lib/ai-embeddings';


// Verify admin authorization
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function createTag(name: string) {
  await requireAdmin();

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: "Tên thẻ không được bỏ trống." };
  }

  // Check if tag name already exists (case-insensitive check)
  const existingTag = await prisma.tag.findFirst({
    where: { name: { equals: trimmedName, mode: 'insensitive' } }
  });

  if (existingTag) {
    return { success: false, error: "Thẻ này đã tồn tại trong hệ thống." };
  }

  await prisma.tag.create({
    data: { name: trimmedName }
  });

  revalidateTag("tags", {});

  return { success: true };
}

export async function toggleTagPopularity(tagName: string) {
  await requireAdmin();

  const trimmedName = tagName.trim();
  if (!trimmedName) {
    return { success: false, error: "Tên thẻ không hợp lệ." };
  }

  const tag = await prisma.tag.findUnique({
    where: { name: trimmedName }
  });

  if (!tag) {
    return { success: false, error: "Không tìm thấy thẻ trong hệ thống." };
  }

  await prisma.tag.update({
    where: { id: tag.id },
    data: { isPopular: !tag.isPopular }
  });

  revalidateTag("tags", {});

  return { success: true };
}

export async function getAdminTags() {
  await requireAdmin();

  const [allAssignments, allQuestions, existingDbTags] = await Promise.all([
    prisma.assignment.findMany({
      select: { tags: true }
    }),
    prisma.questionBank.findMany({
      select: { tags: true }
    }),
    prisma.tag.findMany()
  ]);

  // Identify active tags from existing assignments and questions
  const activeTagsSet = new Set<string>();
  allAssignments.forEach(a => {
    if (a.tags) {
      a.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => activeTagsSet.add(t));
    }
  });
  allQuestions.forEach(q => {
    if (q.tags) {
      q.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => activeTagsSet.add(t));
    }
  });

  // Auto-seed active tags to the Tag table if they do not exist (case-insensitive)
  const dbTagsLower = new Set(existingDbTags.map(t => t.name.toLowerCase()));
  const tagsToCreate = Array.from(activeTagsSet).filter(t => !dbTagsLower.has(t.toLowerCase()));

  let updatedDbTags = existingDbTags;
  if (tagsToCreate.length > 0) {
    await prisma.tag.createMany({
      data: tagsToCreate.map(t => ({ name: t, isPopular: false })),
      skipDuplicates: true
    });
    updatedDbTags = await prisma.tag.findMany();
  }

  const tagStats: Record<string, { name: string; assignmentCount: number; questionCount: number; isPopular: boolean }> = {};

  // Initialize statistics for all db tags so 0 count tags are included along with their isPopular status
  updatedDbTags.forEach(t => {
    tagStats[t.name.toLowerCase()] = { name: t.name, assignmentCount: 0, questionCount: 0, isPopular: t.isPopular };
  });

  // Populate actual counts from assignments
  allAssignments.forEach(a => {
    if (a.tags) {
      a.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
        const key = t.toLowerCase();
        if (!tagStats[key]) {
          tagStats[key] = { name: t, assignmentCount: 0, questionCount: 0, isPopular: false };
        }
        tagStats[key].assignmentCount += 1;
      });
    }
  });

  // Populate actual counts from question bank
  allQuestions.forEach(q => {
    if (q.tags) {
      q.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
        const key = t.toLowerCase();
        if (!tagStats[key]) {
          tagStats[key] = { name: t, assignmentCount: 0, questionCount: 0, isPopular: false };
        }
        tagStats[key].questionCount += 1;
      });
    }
  });

  // Sort by popularity (total occurrences)
  return Object.values(tagStats).sort(
    (a, b) => b.assignmentCount + b.questionCount - (a.assignmentCount + a.questionCount)
  );
}

export async function renameTag(oldName: string, newName: string) {
  await requireAdmin();

  const trimmedOldName = oldName.trim();
  const trimmedNewName = newName.trim();

  if (!trimmedOldName || !trimmedNewName) {
    return { success: false, error: "Tên thẻ không được bỏ trống." };
  }

  // 1. Process Tag table
  const tagInDb = await prisma.tag.findUnique({
    where: { name: trimmedOldName }
  });
  if (tagInDb) {
    const newTagInDb = await prisma.tag.findUnique({
      where: { name: trimmedNewName }
    });
    if (newTagInDb && newTagInDb.id !== tagInDb.id) {
      return { success: false, error: "Tên thẻ mới đã tồn tại." };
    }
    await prisma.tag.update({
      where: { id: tagInDb.id },
      data: { name: trimmedNewName }
    });
  } else {
    // If somehow it wasn't in Tag model, let's create it
    await prisma.tag.upsert({
      where: { name: trimmedNewName },
      update: {},
      create: { name: trimmedNewName }
    });
  }

  // 2. Process Assignments
  const allAssignments = await prisma.assignment.findMany({
    where: { NOT: [{ tags: null }, { tags: "" }] },
    include: { lesson: true }
  });

  const affectedAssignments = allAssignments.filter(a => {
    const tagsList = (a.tags || "").split(',').map(t => t.trim());
    return tagsList.includes(trimmedOldName);
  });

  for (const a of affectedAssignments) {
    const tagsList = (a.tags || "").split(',').map(t => t.trim());
    const newTagsList = tagsList.map(t => t === trimmedOldName ? trimmedNewName : t);
    const uniqueTags = [...new Set(newTagsList)].join(', ');

    await prisma.assignment.update({
      where: { id: a.id },
      data: { tags: uniqueTags }
    });

    // Sync to Homepage Feed + AI reindex
    await syncToHomepageFeed(a.id, "EXERCISE").catch(() => {});
    if (a.lesson) {
      await syncToHomepageFeed(a.lesson.id, "LESSON").catch(() => {});
    }
    // Tags changed — re-embed so related content stays accurate
    reindexAssignment(a.id).catch(() => {});
    if (a.lesson) reindexLesson(a.lesson.id).catch(() => {});
  }

  // 3. Process Questions in Bank
  const allQuestions = await prisma.questionBank.findMany({
    where: { NOT: [{ tags: null }, { tags: "" }] }
  });

  const affectedQuestions = allQuestions.filter(q => {
    const tagsList = (q.tags || "").split(',').map(t => t.trim());
    return tagsList.includes(trimmedOldName);
  });

  for (const q of affectedQuestions) {
    const tagsList = (q.tags || "").split(',').map(t => t.trim());
    const newTagsList = tagsList.map(t => t === trimmedOldName ? trimmedNewName : t);
    const uniqueTags = [...new Set(newTagsList)].join(', ');

    await prisma.questionBank.update({
      where: { id: q.id },
      data: { tags: uniqueTags }
    });
  }

  // 4. Invalidate Cache
  revalidateTag("assignments", {});
  revalidateTag("lessons", {});
  revalidateTag("tags", {});

  return { success: true };
}

export async function deleteTag(tagName: string) {
  await requireAdmin();

  const trimmedTagName = tagName.trim();
  if (!trimmedTagName) {
    return { success: false, error: "Tên thẻ không hợp lệ." };
  }

  // 1. Delete from Tag table (case-insensitive to be safe)
  await prisma.tag.deleteMany({
    where: { name: { equals: trimmedTagName, mode: 'insensitive' } }
  });

  // 2. Process Assignments
  const allAssignments = await prisma.assignment.findMany({
    where: { NOT: [{ tags: null }, { tags: "" }] },
    include: { lesson: true }
  });

  const affectedAssignments = allAssignments.filter(a => {
    const tagsList = (a.tags || "").split(',').map(t => t.trim());
    return tagsList.includes(trimmedTagName);
  });

  for (const a of affectedAssignments) {
    const tagsList = (a.tags || "").split(',').map(t => t.trim());
    const newTagsList = tagsList.filter(t => t !== trimmedTagName);
    const uniqueTags = [...new Set(newTagsList)].join(', ');

    await prisma.assignment.update({
      where: { id: a.id },
      data: { tags: uniqueTags }
    });

    // Sync to Homepage Feed + AI reindex
    await syncToHomepageFeed(a.id, "EXERCISE").catch(() => {});
    if (a.lesson) {
      await syncToHomepageFeed(a.lesson.id, "LESSON").catch(() => {});
    }
    // Tags changed — re-embed so related content stays accurate
    reindexAssignment(a.id).catch(() => {});
    if (a.lesson) reindexLesson(a.lesson.id).catch(() => {});
  }

  // 3. Process Questions in Bank
  const allQuestions = await prisma.questionBank.findMany({
    where: { NOT: [{ tags: null }, { tags: "" }] }
  });

  const affectedQuestions = allQuestions.filter(q => {
    const tagsList = (q.tags || "").split(',').map(t => t.trim());
    return tagsList.includes(trimmedTagName);
  });

  for (const q of affectedQuestions) {
    const tagsList = (q.tags || "").split(',').map(t => t.trim());
    const newTagsList = tagsList.filter(t => t !== trimmedTagName);
    const uniqueTags = [...new Set(newTagsList)].join(', ');

    await prisma.questionBank.update({
      where: { id: q.id },
      data: { tags: uniqueTags }
    });
  }

  // 4. Invalidate Cache
  revalidateTag("assignments", {});
  revalidateTag("lessons", {});
  revalidateTag("tags", {});

  return { success: true };
}

export async function getPopularTags() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const popularTags = await prisma.tag.findMany({
    where: { isPopular: true },
    select: { name: true },
    orderBy: { name: "asc" }
  });
  return popularTags.map(t => t.name);
}

export async function deleteMultipleTags(tagNames: string[]) {
  await requireAdmin();

  if (!tagNames || tagNames.length === 0) {
    return { success: false, error: "Không có thẻ nào được chọn." };
  }

  const trimmedTags = tagNames.map(t => t.trim()).filter(Boolean);
  if (trimmedTags.length === 0) {
    return { success: false, error: "Danh sách thẻ không hợp lệ." };
  }

  // 1. Delete from Tag table
  await prisma.tag.deleteMany({
    where: {
      name: {
        in: trimmedTags,
        mode: 'insensitive'
      }
    }
  });

  // 2. Process Assignments
  const allAssignments = await prisma.assignment.findMany({
    where: { NOT: [{ tags: null }, { tags: "" }] },
    include: { lesson: true }
  });

  const affectedAssignments = allAssignments.filter(a => {
    const tagsList = (a.tags || "").split(',').map(t => t.trim());
    return tagsList.some(t => trimmedTags.includes(t));
  });

  for (const a of affectedAssignments) {
    const tagsList = (a.tags || "").split(',').map(t => t.trim());
    const newTagsList = tagsList.filter(t => !trimmedTags.includes(t));
    const uniqueTags = [...new Set(newTagsList)].join(', ');

    await prisma.assignment.update({
      where: { id: a.id },
      data: { tags: uniqueTags }
    });

    // Sync to Homepage Feed + AI reindex
    await syncToHomepageFeed(a.id, "EXERCISE").catch(() => {});
    if (a.lesson) {
      await syncToHomepageFeed(a.lesson.id, "LESSON").catch(() => {});
    }
    // Tags changed — re-embed so related content stays accurate
    reindexAssignment(a.id).catch(() => {});
    if (a.lesson) reindexLesson(a.lesson.id).catch(() => {});
  }

  // 3. Process Questions in Bank
  const allQuestions = await prisma.questionBank.findMany({
    where: { NOT: [{ tags: null }, { tags: "" }] }
  });

  const affectedQuestions = allQuestions.filter(q => {
    const tagsList = (q.tags || "").split(',').map(t => t.trim());
    return tagsList.some(t => trimmedTags.includes(t));
  });

  for (const q of affectedQuestions) {
    const tagsList = (q.tags || "").split(',').map(t => t.trim());
    const newTagsList = tagsList.filter(t => !trimmedTags.includes(t));
    const uniqueTags = [...new Set(newTagsList)].join(', ');

    await prisma.questionBank.update({
      where: { id: q.id },
      data: { tags: uniqueTags }
    });
  }

  // 4. Invalidate Cache
  revalidateTag("assignments", {});
  revalidateTag("lessons", {});
  revalidateTag("tags", {});

  return { success: true };
}

export async function searchTags(query: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!query || query.trim().length === 0) {
    return [];
  }

  const tags = await prisma.tag.findMany({
    where: {
      name: {
        contains: query.trim()
      }
    },
    take: 10,
    select: { name: true }
  });

  return tags.map(t => ({ name: t.name, usageCount: 0 }));
}
