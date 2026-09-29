import React, { Suspense } from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { StudentAssignmentsView, StudentAssignmentGroup } from './_components/StudentAssignmentsView';
import { ClassHeroBento } from './_components/ClassHeroBento';

export default async function StudentClassDetailPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ groupId?: string; viewAll?: string }>;
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
  const userId = session.user.id;

  // Fetch enrollment + class + teacher, rawAssignments, submissions, and allGroups all in parallel (Zero Waterfall)
  const [enrollment, rawAssignments, submissions, allGroups] = await Promise.all([
    prisma.classEnrollment.findUnique({
      where: { studentId_classId: { studentId: userId, classId: id } },
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
      where: { classId: id },
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
    prisma.submission.findMany({
      where: {
        studentId: userId,
        assignment: {
          targetClasses: {
            some: { classId: id }
          }
        },
        submittedAt: { not: null }
      },
      select: { assignmentId: true, score: true }
    }),
    prisma.assignmentGroup.findMany({
      where: { classId: id },
      include: {
        prerequisiteGroup: {
          select: { id: true, title: true }
        }
      },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }]
    })
  ]);

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

  const submittedAssignmentIds = new Set(submissions.map(s => s.assignmentId));
  const submissionScoreMap = new Map(
    submissions.map(s => [
      s.assignmentId,
      s.score !== null && s.score !== undefined
        ? (typeof s.score === 'number' ? Number(s.score.toFixed(1)) : s.score)
        : null,
    ])
  );

  // Group assignments by Group (or ungrouped legacy)
  const groupsMap = new Map<string, StudentAssignmentGroup>();

  // 1. Pre-populate with all known groups in class to maintain progression metadata and order
  allGroups.forEach((g) => {
    groupsMap.set(g.id, {
      id: g.id,
      title: g.title,
      createdAt: g.createdAt ? g.createdAt.toISOString() : null,
      prerequisiteGroupId: g.prerequisiteGroupId || null,
      prerequisiteGroupTitle: g.prerequisiteGroup?.title || null,
      unlockThreshold: g.unlockThreshold ?? 60,
      forceUnlocked: g.forceUnlocked || false,
      items: [],
    });
  });

  // 2. Attach items to groups
  rawAssignments.forEach((ac) => {
    const gId = ac.groupId || `ungrouped_${ac.group?.title || 'general'}`;
    const gTitle = ac.group?.title || 'Bài tập / Hoạt động khác';
    if (!groupsMap.has(gId)) {
      groupsMap.set(gId, {
        id: gId,
        title: gTitle,
        createdAt: ac.group?.createdAt ? ac.group.createdAt.toISOString() : (ac.assignedAt ? ac.assignedAt.toISOString() : null),
        prerequisiteGroupId: null,
        prerequisiteGroupTitle: null,
        unlockThreshold: 60,
        forceUnlocked: false,
        items: [],
      });
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
        thumbnail: ac.assignment.thumbnail,
        tags: ac.assignment.tags,
        teacher: ac.assignment.teacher,
        questionsCount: (ac.assignment as any)._count?.questions || 0,
      },
      assignedAt: ac.assignedAt ? ac.assignedAt.toISOString() : new Date().toISOString(),
      dueDate: ac.dueDate ? ac.dueDate.toISOString() : null,
      isSubmitted,
      score: submissionScoreMap.get(ac.assignment.id) ?? null,
    });
  });

  const assignmentGroups = Array.from(groupsMap.values());

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

  // 5. Find next uncompleted task for quick resume CTA (Only from unlocked groups)
  let nextTask: { id: string; title: string; kind: string; targetUrl: string } | null = null;
  const uncompleted = rawAssignments.find((ac) => {
    if (submittedAssignmentIds.has(ac.assignment.id)) return false;
    const gId = ac.groupId || `ungrouped_${ac.group?.title || 'general'}`;
    const grp = groupsMap.get(gId);
    return !grp?.isLocked;
  });
  if (uncompleted) {
    let targetUrl = `/student/assignments/${uncompleted.assignment.id}/run`;
    let kind = 'Bài tập';
    if (uncompleted.assignment.instructions) {
      try {
        const meta = JSON.parse(uncompleted.assignment.instructions);
        if (meta.playUrl) targetUrl = meta.playUrl;
        if (meta.kind) {
          if (meta.kind === 'LESSON') kind = 'Lý thuyết';
          else if (meta.kind === 'EXERCISE' || meta.kind === 'GRAMMAR') kind = 'Bài tập';
          else if (meta.kind === 'GAME') kind = 'Trò chơi';
          else if (meta.kind === 'FLASHCARD') kind = 'Flashcard';
          else if (meta.kind === 'READING') kind = 'Bài đọc';
          else if (meta.kind === 'BOOK') kind = 'Shadowing';
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
      id: uncompleted.assignment.id,
      title: uncompleted.assignment.title.replace(/^(Lý thuyết|Bài tập|Grammar lesson|Grammar exercise):\s*/i, ''),
      kind,
      targetUrl,
    };
  }

  const totalAssignments = rawAssignments.length;
  const completedAssignments = submissions.length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 pt-2 sm:pt-4">
      {/* 1. HERO BENTO CARD */}
      <ClassHeroBento
        name={cls.name}
        teacher={cls.teacher}
        gradeLevel={cls.gradeLevel}
        joinCode={cls.joinCode}
        totalAssignments={totalAssignments}
        completedAssignments={completedAssignments}
        nextTask={nextTask}
        joinedAt={enrollment.joinedAt ? enrollment.joinedAt.toISOString() : null}
      />

      {/* 2. MAIN BENTO GRID (Full width) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Bài tập & Hoạt động lớp
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Danh sách bài học được giáo viên giao theo từng buổi
          </p>
        </div>

        {/* Bento Group Cards or Drill-Down View */}
        <Suspense fallback={<div className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl" />}>
          <StudentAssignmentsView 
            assignmentGroups={assignmentGroups} 
            initialGroupId={initialGroupId}
            initialViewAll={initialViewAll}
            classId={id}
          />
        </Suspense>
      </section>
    </div>
  );
}
