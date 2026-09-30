import React, { Suspense } from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { StudentAssignmentsView, StudentAssignmentGroup } from './_components/StudentAssignmentsView';
import { sortGroupItems } from './_utils/assignmentOrder';
import { ClassHeroBento } from './_components/ClassHeroBento';

import { fetchWithRedis } from '@/lib/cached-queries';
import { prewarmAssignmentsData } from '@/app/student/assignments/[id]/run/data';

async function getStudentClassDetailData(userId: string, classId: string) {
  return fetchWithRedis(`student:class-detail:${userId}:${classId}`, 60, async () => {
    // 1. Fetch enrollment, rawAssignments, allGroups, allEnrolledClasses in parallel
    const [enrollment, rawAssignments, allGroups, allEnrolledClasses] = await Promise.all([
      prisma.classEnrollment.findUnique({
        where: { studentId_classId: { studentId: userId, classId } },
        include: {
          class: {
            include: {
              teacher: {
                select: { name: true, email: true, image: true }
              }
            }
          }
        }
      }),
      prisma.assignmentClass.findMany({
        where: { classId },
        include: {
          group: {
            select: { id: true, title: true, createdAt: true }
          },
          assignment: {
            select: {
              id: true,
              slug: true,
              title: true,
              materialType: true,
              level: true,
              instructions: true,
              thumbnail: true,
              tags: true,
              teacher: {
                select: { id: true, name: true, image: true }
              },
              _count: {
                select: { questions: true }
              }
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      }),
      prisma.assignmentGroup.findMany({
        where: { classId },
        include: {
          prerequisiteGroup: {
            select: { id: true, title: true }
          }
        },
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }]
      }),
      prisma.classEnrollment.findMany({
        where: { studentId: userId, status: 'ACTIVE' },
        select: {
          class: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      })
    ]);

    // 2. Fetch submissions directly with indexed assignmentId in list (Fast Index Scan)
    const assignmentIds = rawAssignments.map(a => a.assignmentId);
    const submissions = assignmentIds.length > 0
      ? await prisma.submission.findMany({
          where: {
            studentId: userId,
            assignmentId: { in: assignmentIds },
            submittedAt: { not: null }
          },
          select: { assignmentId: true, score: true }
        })
      : [];

    // 3. Pre-resolve accurate thumbnails matching HomepageFeed for reading / games / flashcards
    const lessonRawIds: string[] = [];
    const gameRawIds: string[] = [];
    const flashcardRawIds: string[] = [];

    rawAssignments.forEach((ac) => {
      const thumb = ac.assignment.thumbnail;
      const isUnsplash = !thumb || thumb.includes('unsplash.com');
      if (isUnsplash && ac.assignment.instructions) {
        try {
          const meta = JSON.parse(ac.assignment.instructions);
          const kind = (meta.kind || ac.assignment.materialType || '').toUpperCase();
          if (meta.rawId) {
            if (kind === 'READING' || kind === 'LESSON' || kind === 'BOOK') {
              lessonRawIds.push(meta.rawId);
            } else if (kind === 'GAME') {
              gameRawIds.push(meta.rawId);
            } else if (kind === 'FLASHCARD') {
              flashcardRawIds.push(meta.rawId);
            }
          }
        } catch {}
      }
    });

    const [resolvedLessons, resolvedGames, resolvedFlashcards] = await Promise.all([
      lessonRawIds.length > 0
        ? prisma.lesson.findMany({
            where: { id: { in: lessonRawIds } },
            select: { id: true, thumbnail: true }
          })
        : Promise.resolve([]),
      gameRawIds.length > 0
        ? prisma.matchWordTopic.findMany({
            where: { id: { in: gameRawIds } },
            select: { id: true, thumbnailUrl: true, gameMode: true }
          })
        : Promise.resolve([]),
      flashcardRawIds.length > 0
        ? prisma.flashcardTopic.findMany({
            where: { id: { in: flashcardRawIds } },
            select: { id: true, iconUrl: true }
          })
        : Promise.resolve([]),
    ]);

    return {
      enrollment,
      rawAssignments,
      submissions,
      allGroups,
      allEnrolledClasses,
      resolvedLessons,
      resolvedGames,
      resolvedFlashcards
    };
  });
}

export default async function StudentClassDetailPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ groupId?: string; viewAll?: string; assignmentId?: string; tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ? searchParams : Promise.resolve({})
  ]);
  const initialGroupId = (resolvedSearchParams as any)?.groupId || null;
  const initialViewAll = (resolvedSearchParams as any)?.viewAll === 'true';
  const initialAssignmentId = (resolvedSearchParams as any)?.assignmentId || null;
  const initialTab = (resolvedSearchParams as any)?.tab || null;
  const userId = session.user.id;

  // Cached fetch with Redis + optimized indexed submissions query
  const {
    enrollment,
    rawAssignments,
    submissions,
    allGroups,
    allEnrolledClasses,
    resolvedLessons,
    resolvedGames,
    resolvedFlashcards
  } = await getStudentClassDetailData(userId, id);

  // Pre-warm question & translation caches in Redis for assignments in the class (non-blocking)
  if (rawAssignments && rawAssignments.length > 0) {
    const exerciseIds = rawAssignments
      .filter((a: any) => a.assignment?.materialType === 'EXERCISE' || a.assignment?.materialType === 'GRAMMAR')
      .map((a: any) => a.assignment?.id)
      .filter(Boolean);
    if (exerciseIds.length > 0) {
      prewarmAssignmentsData(exerciseIds);
    }
  }

  const cls = enrollment?.class;

  if (!enrollment || enrollment.status !== 'ACTIVE' || !cls) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 text-center rounded-[2rem] shadow-xs my-8 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 stroke-[1.8px]" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">Chưa có quyền truy cập</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md leading-relaxed">
          Bạn chưa tham gia lớp học này hoặc yêu cầu tham gia của bạn đang chờ giáo viên phê duyệt.
        </p>
        <Link 
          href="/student/classes" 
          className="mt-6 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-colors shadow-sm"
        >
          Quay lại danh sách lớp học
        </Link>
      </div>
    );
  }

  const submittedAssignmentIds = new Set(submissions.map((s: any) => s.assignmentId));
  const submissionScoreMap = new Map(
    submissions.map((s: any) => [
      s.assignmentId,
      s.score !== null && s.score !== undefined
        ? (typeof s.score === 'number' ? Number(s.score.toFixed(1)) : s.score)
        : null,
    ])
  );

  // Group assignments by Group (or ungrouped legacy)
  const groupsMap = new Map<string, StudentAssignmentGroup>();

  // 1. Pre-populate with all known groups in class to maintain progression metadata and order
  // Filter out hidden groups: isHidden=true or visibleFrom in the future
  const now = new Date();
  const hiddenGroupIds = new Set<string>(
    allGroups
      .filter((g: any) => g.isHidden || (g.visibleFrom && new Date(g.visibleFrom) > now))
      .map((g: any) => g.id)
  );

  allGroups.forEach((g: any) => {
    // Skip groups that are hidden or not yet scheduled to be visible
    if (hiddenGroupIds.has(g.id)) {
      return;
    }

    groupsMap.set(g.id, {
      id: g.id,
      title: g.title,
      createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : null,
      // If prerequisite is hidden, treat as no prerequisite (group is effectively unlocked)
      prerequisiteGroupId: g.prerequisiteGroupId && !hiddenGroupIds.has(g.prerequisiteGroupId) ? g.prerequisiteGroupId : null,
      prerequisiteGroupTitle: g.prerequisiteGroupId && !hiddenGroupIds.has(g.prerequisiteGroupId) ? (g.prerequisiteGroup?.title || null) : null,
      unlockThreshold: g.unlockThreshold ?? 60,
      forceUnlocked: g.forceUnlocked || false,
      items: [],
    });
  });

  const lessonThumbMap = new Map(resolvedLessons.filter((l: any) => l.thumbnail).map((l: any) => [l.id, l.thumbnail!]));
  const gameThumbMap = new Map(resolvedGames.map((g: any) => [
    g.id, 
    g.thumbnailUrl || (g.gameMode === 'shooter-quiz' ? '/images/games/shooter-quiz.jpg' : '/images/games/candy-quiz.jpg')
  ]));
  const flashcardThumbMap = new Map(resolvedFlashcards.filter((f: any) => f.iconUrl).map((f: any) => [f.id, f.iconUrl!]));

  // 2. Attach items to groups (skip assignments belonging to hidden groups)
  rawAssignments.forEach((ac) => {
    const gId = ac.groupId || `ungrouped_${ac.group?.title || 'general'}`;
    // Skip assignments belonging to hidden groups
    if (ac.groupId && hiddenGroupIds.has(ac.groupId)) return;

    const gTitle = ac.group?.title || 'Bài tập / Hoạt động khác';
    if (!groupsMap.has(gId)) {
      groupsMap.set(gId, {
        id: gId,
        title: gTitle,
        createdAt: ac.group?.createdAt ? new Date(ac.group.createdAt).toISOString() : (ac.assignedAt ? new Date(ac.assignedAt).toISOString() : null),
        prerequisiteGroupId: null,
        prerequisiteGroupTitle: null,
        unlockThreshold: 60,
        forceUnlocked: false,
        items: [],
      });
    }

    let finalThumbnail = ac.assignment.thumbnail;
    if (!finalThumbnail || finalThumbnail.includes('unsplash.com')) {
      if (ac.assignment.instructions) {
        try {
          const meta = JSON.parse(ac.assignment.instructions);
          if (meta.rawId) {
            if (lessonThumbMap.has(meta.rawId)) {
              finalThumbnail = lessonThumbMap.get(meta.rawId)!;
            } else if (gameThumbMap.has(meta.rawId)) {
              finalThumbnail = gameThumbMap.get(meta.rawId)!;
            } else if (flashcardThumbMap.has(meta.rawId)) {
              finalThumbnail = flashcardThumbMap.get(meta.rawId)!;
            }
          }
          if ((!finalThumbnail || finalThumbnail.includes('unsplash.com')) && (meta.kind === 'GAME' || meta.playUrl?.includes('/candy-quiz'))) {
            finalThumbnail = '/images/games/candy-quiz.jpg';
          }
        } catch {}
      }
    }

    const isSubmitted = submittedAssignmentIds.has(ac.assignment.id);
    groupsMap.get(gId)!.items.push({
      assignment: {
        id: ac.assignment.id,
        slug: ac.assignment.slug,
        title: ac.assignment.title,
        materialType: ac.assignment.materialType,
        level: ac.assignment.level,
        instructions: ac.assignment.instructions,
        thumbnail: finalThumbnail,
        tags: ac.assignment.tags,
        teacher: ac.assignment.teacher,
        questionsCount: (ac.assignment as any)._count?.questions || 0,
      },
      assignedAt: ac.assignedAt ? new Date(ac.assignedAt).toISOString() : new Date().toISOString(),
      dueDate: ac.dueDate ? new Date(ac.dueDate).toISOString() : null,
      isSubmitted,
      score: submissionScoreMap.get(ac.assignment.id) ?? null,
    });
  });

  // Filter out empty groups so students never see empty 0-item groups
  const assignmentGroups = Array.from(groupsMap.values()).filter((g) => g.items.length > 0);

  // Sắp xếp các bài học trong từng nhóm theo Lộ trình học tập chuẩn (Phương án 1):
  // Lý thuyết ➔ Từ vựng ➔ Bài tập ➔ Đọc & Nói ➔ Trò chơi ➔ Ôn tập
  assignmentGroups.forEach((g) => {
    g.items = sortGroupItems(g.items);
  });

  // 3. Compute group completion stats
  const groupStatsMap = new Map<string, { total: number; completed: number; percent: number }>();
  assignmentGroups.forEach((g) => {
    const total = g.items.length;
    const completed = g.items.filter((i) => i.isSubmitted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
    groupStatsMap.set(g.id, { total, completed, percent });
  });

  // 4. Calculate locked / unlock progression status per group
  assignmentGroups.forEach((g) => {
    if (g.forceUnlocked || !g.prerequisiteGroupId) {
      g.isLocked = false;
      return;
    }

    const prereqStats = groupStatsMap.get(g.prerequisiteGroupId);
    const threshold = g.unlockThreshold ?? 60;

    if (!prereqStats || prereqStats.total === 0) {
      g.isLocked = false;
      return;
    }

    g.prerequisiteTotalCount = prereqStats.total;
    g.prerequisiteCompletedCount = prereqStats.completed;
    g.prerequisitePercent = prereqStats.percent;

    const neededCount = Math.ceil(prereqStats.total * (threshold / 100));
    const remainingCount = Math.max(0, neededCount - prereqStats.completed);

    if (prereqStats.percent < threshold) {
      g.isLocked = true;
      g.lockReason = `Cần hoàn thành tối thiểu ${threshold}% (${neededCount}/${prereqStats.total} bài) của "${g.prerequisiteGroupTitle || 'nhóm trước'}". Bạn đã hoàn thành ${prereqStats.completed}/${prereqStats.total} bài (${prereqStats.percent}%) — Còn thiếu ${remainingCount} bài để mở khóa.`;
    } else {
      g.isLocked = false;
    }
  });

  // 5. Find next uncompleted task for quick resume CTA (Only from unlocked groups in roadmap order)
  let nextTask: { id: string; title: string; kind: string; targetUrl: string } | null = null;
  let uncompletedItem: any = null;
  for (const grp of assignmentGroups) {
    if (grp.isLocked) continue;
    const found = grp.items.find((i) => !i.isSubmitted);
    if (found) {
      uncompletedItem = found;
      break;
    }
  }

  if (uncompletedItem) {
    let targetUrl = `/student/assignments/${uncompletedItem.assignment.id}/run`;
    let kind = 'Bài tập';
    if (uncompletedItem.assignment.instructions) {
      try {
        const meta = JSON.parse(uncompletedItem.assignment.instructions);
        if (meta.playUrl) targetUrl = meta.playUrl;
        const isLesson = 
          meta.kind === 'LESSON' || 
          targetUrl.includes('/grammar/') || 
          uncompletedItem.assignment.title.toLowerCase().startsWith('grammar lesson') ||
          uncompletedItem.assignment.title.toLowerCase().startsWith('lý thuyết:');

        if (isLesson) {
          kind = 'Lý thuyết';
        } else if (meta.kind === 'EXERCISE' || meta.kind === 'GRAMMAR') {
          kind = 'Bài tập';
        } else if (meta.kind === 'GAME') {
          kind = 'Trò chơi';
        } else if (meta.kind === 'FLASHCARD') {
          kind = 'Flashcard';
        } else if (meta.kind === 'READING') {
          kind = 'Bài đọc';
        } else if (meta.kind === 'BOOK') {
          kind = 'Shadowing';
        }
      } catch {}
    }
    if (kind === 'Bài tập' || kind === 'Bài đọc') {
      if (!targetUrl.includes('direct=true')) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}direct=true`;
      }
    }
    if (!targetUrl.includes('fromClass=true')) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}fromClass=true`;
    }

    nextTask = {
      id: uncompletedItem.assignment.id,
      title: uncompletedItem.assignment.title.replace(/^(Lý thuyết|Bài tập|Grammar lesson|Grammar exercise):\s*/i, ''),
      kind,
      targetUrl,
    };
  }

  const totalAssignments = rawAssignments.length;
  const completedAssignments = submissions.length;

  return (
    <div className="relative min-h-screen">
      {/* Nền trắng riêng biệt cho trang lớp học này (chống nhấp nháy SSR) */}
      <div className="fixed inset-0 -z-40 bg-white dark:bg-slate-950 pointer-events-none" />
      <div className="max-w-[1700px] w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-12 pt-3 sm:pt-4 relative z-0">
        <Suspense fallback={<div className="h-96 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl" />}>
          <StudentAssignmentsView 
            assignmentGroups={assignmentGroups} 
            initialGroupId={initialGroupId}
            initialViewAll={initialViewAll}
            initialAssignmentId={initialAssignmentId}
            initialTab={initialTab}
            classId={id}
            currentClass={{
              id: cls.id,
              name: cls.name,
              gradeLevel: cls.gradeLevel,
              joinCode: cls.joinCode,
              teacher: cls.teacher
            }}
            enrolledClasses={allEnrolledClasses.map(e => e.class)}
            heroBanner={
              <ClassHeroBento
                name={cls.name}
                teacher={cls.teacher}
                gradeLevel={cls.gradeLevel}
                joinCode={cls.joinCode}
                totalAssignments={totalAssignments}
                completedAssignments={completedAssignments}
                nextTask={nextTask}
                joinedAt={enrollment.joinedAt ? new Date(enrollment.joinedAt).toISOString() : null}
              />
            }
          />
        </Suspense>
      </div>
    </div>
  );
}
