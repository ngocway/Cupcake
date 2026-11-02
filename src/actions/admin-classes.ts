"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from '@/auth'
import { invalidateStudentClassDetailCache } from '@/lib/cached-queries'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required')
  }
  return session.user
}

export async function adminToggleBlockClass(id: string, isBlocked: boolean) {
  await requireAdmin()

  try {
    await prisma.class.update({
      where: { id },
      data: { isBlocked }
    })
    revalidatePath("/admin/classes")
    return { success: true }
  } catch (error) {
    console.error("Toggle Block Class Error:", error)
    return { success: false, error: "Lỗi Server" }
  }
}

/**
 * Get available classes to clone curriculum from (classes that have at least 1 group or assignment)
 */
export async function adminGetClassesForCloneAction(currentClassId: string) {
  await requireAdmin()

  const classes = await prisma.class.findMany({
    where: {
      id: { not: currentClassId },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      classCode: true,
      teacher: { select: { name: true, email: true } },
      _count: {
        select: {
          assignmentGroups: true,
          assignments: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return classes.filter(c => c._count.assignmentGroups > 0 || c._count.assignments > 0)
}

/**
 * Clone full curriculum (groups, assignments, order, prerequisites) from source class to target class
 */
export async function adminCloneCurriculumAction(sourceClassId: string, targetClassId: string) {
  await requireAdmin()

  if (sourceClassId === targetClassId) {
    throw new Error('Lớp nguồn và lớp đích không được trùng nhau')
  }

  const [sourceClass, targetClass] = await Promise.all([
    prisma.class.findUnique({
      where: { id: sourceClassId },
      include: {
        assignmentGroups: {
          orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
        },
        assignments: {
          select: {
            assignmentId: true,
            groupId: true,
            startDate: true,
            dueDate: true,
            timeLimit: true,
            maxAttempts: true,
            focusMode: true,
            allowLateSubmission: true,
          }
        }
      }
    }),
    prisma.class.findUnique({
      where: { id: targetClassId }
    })
  ])

  if (!sourceClass) throw new Error('Không tìm thấy lớp nguồn')
  if (!targetClass) throw new Error('Không tìm thấy lớp đích')

  // Find max orderIndex in target class to append cloned groups nicely
  const targetMaxOrder = await prisma.assignmentGroup.aggregate({
    where: { classId: targetClassId },
    _max: { orderIndex: true }
  })
  const baseOrder = (targetMaxOrder._max.orderIndex ?? -1) + 1

  await prisma.$transaction(async (tx) => {
    // 1. Create new groups in target class and build oldGroupId -> newGroupId mapping
    const groupMapping = new Map<string, string>()

    for (let i = 0; i < sourceClass.assignmentGroups.length; i++) {
      const g = sourceClass.assignmentGroups[i]
      const newGroup = await tx.assignmentGroup.create({
        data: {
          classId: targetClassId,
          title: g.title,
          orderIndex: baseOrder + i,
          unlockThreshold: g.unlockThreshold,
          forceUnlocked: g.forceUnlocked,
          isHidden: g.isHidden,
          visibleFrom: g.visibleFrom,
        }
      })
      groupMapping.set(g.id, newGroup.id)
    }

    // 2. Link prerequisites using mapped group IDs
    for (const g of sourceClass.assignmentGroups) {
      if (g.prerequisiteGroupId && groupMapping.has(g.prerequisiteGroupId)) {
        const newGroupId = groupMapping.get(g.id)
        const newPrerequisiteId = groupMapping.get(g.prerequisiteGroupId)
        if (newGroupId && newPrerequisiteId) {
          await tx.assignmentGroup.update({
            where: { id: newGroupId },
            data: { prerequisiteGroupId: newPrerequisiteId }
          })
        }
      }
    }

    // 3. Clone assignment connections to target class
    for (const a of sourceClass.assignments) {
      const mappedGroupId = a.groupId ? (groupMapping.get(a.groupId) || null) : null

      // Check if already assigned to avoid unique constraint error
      const existing = await tx.assignmentClass.findUnique({
        where: {
          assignmentId_classId: {
            assignmentId: a.assignmentId,
            classId: targetClassId,
          }
        }
      })

      if (!existing) {
        await tx.assignmentClass.create({
          data: {
            assignmentId: a.assignmentId,
            classId: targetClassId,
            groupId: mappedGroupId,
            startDate: a.startDate,
            dueDate: a.dueDate,
            timeLimit: a.timeLimit,
            maxAttempts: a.maxAttempts,
            focusMode: a.focusMode,
            allowLateSubmission: a.allowLateSubmission,
          }
        })
      } else if (mappedGroupId && !existing.groupId) {
        await tx.assignmentClass.update({
          where: {
            assignmentId_classId: {
              assignmentId: a.assignmentId,
              classId: targetClassId,
            }
          },
          data: { groupId: mappedGroupId }
        })
      }
    }
  })

  await invalidateStudentClassDetailCache(targetClassId)
  revalidatePath(`/admin/classes/${targetClassId}`)
  revalidatePath(`/teacher/classes/${targetClassId}`)
  revalidatePath(`/student/classes/${targetClassId}`)

  return { 
    success: true, 
    clonedGroups: sourceClass.assignmentGroups.length,
    clonedAssignments: sourceClass.assignments.length 
  }
}

/**
 * Batch move assignments to a different group (or set to null / ungrouped)
 */
export async function adminBatchMoveAssignmentsAction(
  classId: string, 
  assignmentIds: string[], 
  targetGroupId: string | null
) {
  await requireAdmin()

  if (!assignmentIds || assignmentIds.length === 0) {
    return { success: true, count: 0 }
  }

  await prisma.assignmentClass.updateMany({
    where: {
      classId,
      assignmentId: { in: assignmentIds },
    },
    data: {
      groupId: targetGroupId || null,
    }
  })

  await invalidateStudentClassDetailCache(classId)
  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath(`/teacher/classes/${classId}`)
  revalidatePath(`/student/classes/${classId}`)

  return { success: true, count: assignmentIds.length }
}

/**
 * Batch remove assignments from class
 */
export async function adminBatchRemoveAssignmentsAction(
  classId: string, 
  assignmentIds: string[]
) {
  await requireAdmin()

  if (!assignmentIds || assignmentIds.length === 0) {
    return { success: true, count: 0 }
  }

  const result = await prisma.assignmentClass.deleteMany({
    where: {
      classId,
      assignmentId: { in: assignmentIds },
    }
  })

  await invalidateStudentClassDetailCache(classId)
  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath(`/teacher/classes/${classId}`)
  revalidatePath(`/student/classes/${classId}`)

  return { success: true, count: result.count }
}

/**
 * Create a new assignment group for a class
 */
export async function adminCreateAssignmentGroupAction(classId: string, title: string) {
  await requireAdmin()

  const cleanTitle = title.trim()
  if (!cleanTitle) throw new Error('Tên chặng / nhóm bài không được để trống')

  const maxOrder = await prisma.assignmentGroup.aggregate({
    where: { classId },
    _max: { orderIndex: true }
  })
  const nextOrder = (maxOrder._max.orderIndex ?? -1) + 1

  const group = await prisma.assignmentGroup.create({
    data: {
      classId,
      title: cleanTitle,
      orderIndex: nextOrder,
    }
  })

  await invalidateStudentClassDetailCache(classId)
  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath(`/teacher/classes/${classId}`)
  revalidatePath(`/student/classes/${classId}`)

  return { success: true, group }
}

/**
 * Update class settings (name, dailyDripUnlock, isJoinable, autoApprove)
 */
export async function adminUpdateClassSettingsAction(
  classId: string, 
  data: {
    name?: string;
    dailyDripUnlock?: boolean;
    isJoinable?: boolean;
    autoApprove?: boolean;
  }
) {
  await requireAdmin()

  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.dailyDripUnlock !== undefined) updateData.dailyDripUnlock = data.dailyDripUnlock
  if (data.isJoinable !== undefined) updateData.isJoinable = data.isJoinable
  if (data.autoApprove !== undefined) updateData.autoApprove = data.autoApprove

  await prisma.class.update({
    where: { id: classId },
    data: updateData
  })

  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath("/admin/classes")
  revalidatePath(`/teacher/classes/${classId}`)
  revalidatePath(`/student/classes/${classId}`)

  return { success: true }
}

/**
 * Manage student enrollment in class (Approve, Reject, Block, Unblock, Remove)
 */
export async function adminUpdateStudentEnrollmentAction(
  classId: string,
  studentId: string,
  action: 'APPROVE' | 'REJECT' | 'BLOCK' | 'UNBLOCK' | 'REMOVE'
) {
  await requireAdmin()

  if (action === 'APPROVE') {
    await prisma.classEnrollment.update({
      where: { studentId_classId: { studentId, classId } },
      data: { status: 'ACTIVE' }
    })
  } else if (action === 'BLOCK') {
    await prisma.classEnrollment.update({
      where: { studentId_classId: { studentId, classId } },
      data: { status: 'BLOCKED' }
    })
  } else if (action === 'UNBLOCK') {
    await prisma.classEnrollment.update({
      where: { studentId_classId: { studentId, classId } },
      data: { status: 'ACTIVE' }
    })
  } else if (action === 'REJECT' || action === 'REMOVE') {
    await prisma.classEnrollment.delete({
      where: { studentId_classId: { studentId, classId } }
    })
  }

  const { invalidateStudentClassesCache } = await import('@/lib/cached-queries')
  await invalidateStudentClassesCache(studentId)
  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath(`/teacher/classes/${classId}`)
  revalidatePath(`/student/classes/${classId}`)

  return { success: true }
}


export interface ClassBehaviorEventItem {
  id: string;
  eventName: string;
  createdAt: string;
  userId: string | null;
  studentName: string;
  studentEmail: string;
  device: "mobile" | "tablet" | "desktop";
  dayNumber: number | null;
  stageNumber: number | null;
  label: string;
  subLabel?: string;
  category: "island" | "station" | "game" | "locked" | "submission";
  props: Record<string, string>;
}

export async function adminGetClassBehaviorAnalyticsAction(
  classId: string,
  rangeDays: number = 30
) {
  await requireAdmin();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - rangeDays);

  const [cls, eventLogs, submissions, enrollments] = await Promise.all([
    prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, joinCode: true },
    }),
    prisma.pageViewLog.findMany({
      where: {
        path: { startsWith: `/__event__/class/${encodeURIComponent(classId)}/` },
        createdAt: { gte: sinceDate },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    prisma.submission.findMany({
      where: {
        classId,
        submittedAt: { gte: sinceDate },
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            materialType: true,
            instructions: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 500,
    }),
    prisma.classEnrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  // Build user lookup map
  const userMap = new Map<string, { name: string; email: string }>();
  enrollments.forEach((en) => {
    if (en.student) {
      userMap.set(en.student.id, {
        name: en.student.name || "Học sinh",
        email: en.student.email || "",
      });
    }
  });

  // Also fetch any userId in eventLogs not in enrollments
  const missingUserIds = Array.from(
    new Set(
      eventLogs
        .map((l) => l.userId)
        .filter((uid): uid is string => Boolean(uid) && !userMap.has(uid!))
    )
  );
  if (missingUserIds.length > 0) {
    const extraUsers = await prisma.user.findMany({
      where: { id: { in: missingUserIds } },
      select: { id: true, name: true, email: true },
    });
    extraUsers.forEach((u) => {
      userMap.set(u.id, { name: u.name || "Người dùng", email: u.email || "" });
    });
  }

  // Counters
  let totalIslandOpens = 0;
  let totalIslandPreviews = 0;
  let totalLockedClicks = 0;
  let totalStationClicks = 0;
  let totalGameSelects = 0;

  const activeUserSet = new Set<string>();

  const stationStats: Record<
    "vocab" | "game" | "reading",
    {
      id: string;
      name: string;
      clicks: number;
      completions: number;
      uniqueUsers: Set<string>;
    }
  > = {
    vocab: {
      id: "vocab",
      name: "🚩 Trạm 1: Thẻ Từ Vựng",
      clicks: 0,
      completions: 0,
      uniqueUsers: new Set(),
    },
    game: {
      id: "game",
      name: "🎮 Trạm 2: Trò Chơi Phản Xạ",
      clicks: 0,
      completions: 0,
      uniqueUsers: new Set(),
    },
    reading: {
      id: "reading",
      name: "📖 Trạm 3: Bài Đọc Hiểu",
      clicks: 0,
      completions: 0,
      uniqueUsers: new Set(),
    },
  };

  const gameStats: Record<
    "word_puzzle" | "typing" | "match" | "sentence",
    {
      id: string;
      name: string;
      badge: string;
      clicks: number;
      completions: number;
      totalScore: number;
      scoreCount: number;
    }
  > = {
    word_puzzle: {
      id: "word_puzzle",
      name: "Ghép chữ (Word Puzzle)",
      badge: "⚡ Phản Xạ",
      clicks: 0,
      completions: 0,
      totalScore: 0,
      scoreCount: 0,
    },
    typing: {
      id: "typing",
      name: "Gõ từ (Type)",
      badge: "⌨️ Gõ Từ",
      clicks: 0,
      completions: 0,
      totalScore: 0,
      scoreCount: 0,
    },
    match: {
      id: "match",
      name: "Nối thẻ (Match Words)",
      badge: "🃏 Nối Thẻ",
      clicks: 0,
      completions: 0,
      totalScore: 0,
      scoreCount: 0,
    },
    sentence: {
      id: "sentence",
      name: "Ghép câu (Sentence Builder)",
      badge: "✏️ Xếp Câu",
      clicks: 0,
      completions: 0,
      totalScore: 0,
      scoreCount: 0,
    },
  };

  const dayMap = new Map<
    number,
    {
      dayNumber: number;
      title: string;
      opens: number;
      previews: number;
      lockedClicks: number;
      stationClicks: number;
      gameClicks: number;
      completions: number;
    }
  >();

  const getOrCreateDay = (dayNum: number, title?: string) => {
    const existing = dayMap.get(dayNum);
    if (existing) {
      if (title && (!existing.title || existing.title.startsWith("Ngày "))) {
        existing.title = title;
      }
      return existing;
    }
    const created = {
      dayNumber: dayNum,
      title: title || `Ngày ${dayNum}`,
      opens: 0,
      previews: 0,
      lockedClicks: 0,
      stationClicks: 0,
      gameClicks: 0,
      completions: 0,
    };
    dayMap.set(dayNum, created);
    return created;
  };

  const classifyGameKey = (
    titleOrMode: string
  ): "word_puzzle" | "typing" | "match" | "sentence" => {
    const lower = titleOrMode.toLowerCase();
    if (lower.includes("gõ từ") || lower.includes("type") || lower.includes("typing")) {
      return "typing";
    }
    if (
      lower.includes("nối thẻ") ||
      lower.includes("match") ||
      lower.includes("flip")
    ) {
      return "match";
    }
    if (lower.includes("ghép câu") || lower.includes("xếp câu") || lower.includes("sentence")) {
      return "sentence";
    }
    return "word_puzzle";
  };

  const extractDayNum = (str?: string | null): number | null => {
    if (!str) return null;
    const m = str.match(/(?:day|ngày|bài)[-_\s]*0*(\d+)/i);
    if (m && m[1]) return parseInt(m[1], 10);
    return null;
  };

  const timelineEvents: ClassBehaviorEventItem[] = [];

  // Process custom interaction events
  for (const log of eventLogs) {
    const prefix = `/__event__/class/${encodeURIComponent(classId)}/`;
    const rest = log.path.slice(prefix.length);
    const [rawEventName, rawQuery] = rest.split("?");
    const eventName = decodeURIComponent(rawEventName || "");
    const params = new URLSearchParams(rawQuery || "");
    const props: Record<string, string> = {};
    params.forEach((v, k) => {
      props[k] = v;
    });

    const userKey = log.userId || log.ipHash;
    activeUserSet.add(userKey);

    const userInfo = log.userId ? userMap.get(log.userId) : undefined;
    const studentName = userInfo?.name || "Học sinh (Khách)";
    const studentEmail = userInfo?.email || "";

    const ua = log.userAgent || "";
    const device: "mobile" | "tablet" | "desktop" =
      ua.includes("iPad") || ua.includes("Tablet")
        ? "tablet"
        : ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")
        ? "mobile"
        : "desktop";

    const dayNumber = props.dayNumber ? parseInt(props.dayNumber, 10) : null;
    const stageNumber = props.stageNumber ? parseInt(props.stageNumber, 10) : null;

    let label = eventName;
    let subLabel = "";
    let category: ClassBehaviorEventItem["category"] = "island";

    if (eventName === "island_open_modal") {
      totalIslandOpens++;
      if (dayNumber) {
        const d = getOrCreateDay(dayNumber, props.title);
        d.opens++;
      }
      category = "island";
      label = `🚀 Mở Đảo Ngày ${dayNumber || "?"}: ${props.title || ""}`;
      subLabel = `Tiến độ lúc mở: ${props.percent || 0}%`;
    } else if (eventName === "island_preview_slide") {
      totalIslandPreviews++;
      if (dayNumber) {
        const d = getOrCreateDay(dayNumber, props.title);
        d.previews++;
      }
      category = "island";
      label = `🏝️ Bấm xem trước Đảo Ngày ${dayNumber || "?"}: ${props.title || ""}`;
      subLabel = `Trượt từ Ngày ${props.fromDay || "?"} sang Ngày ${dayNumber || "?"}${
        props.isLocked === "true" ? " (Đang khóa 🔒)" : ""
      }`;
    } else if (eventName === "island_locked_click") {
      totalLockedClicks++;
      if (dayNumber) {
        const d = getOrCreateDay(dayNumber, props.title);
        d.lockedClicks++;
      }
      category = "locked";
      label = `🔒 Bấm vào Đảo đang khóa (Ngày ${dayNumber || "?"}: ${props.title || ""})`;
      subLabel = "Học sinh muốn mở sớm ngày học này";
    } else if (eventName === "station_card_clicked") {
      totalStationClicks++;
      if (dayNumber) {
        const d = getOrCreateDay(dayNumber);
        d.stationClicks++;
      }
      const stId = props.stationId || "vocab";
      const mappedKey: "vocab" | "game" | "reading" =
        stId === "vocab"
          ? "vocab"
          : stId === "game"
          ? "game"
          : "reading";
      stationStats[mappedKey].clicks++;
      stationStats[mappedKey].uniqueUsers.add(userKey);

      category = "station";
      label = `🎯 Chọn ${stationStats[mappedKey].name}`;
      subLabel = `Ngày ${dayNumber || "?"} • ${
        props.isDone === "true" ? "Luyện tập lại" : "Học lần đầu"
      }`;
    } else if (eventName === "game_picker_opened") {
      category = "game";
      label = `🎮 Mở danh sách Chọn Game Yêu Thích (Ngày ${dayNumber || "?"})`;
      subLabel = `${props.gamesCount || 4} trò chơi phản xạ`;
    } else if (eventName === "game_picker_selected") {
      totalGameSelects++;
      if (dayNumber) {
        const d = getOrCreateDay(dayNumber);
        d.gameClicks++;
      }
      const gKey = classifyGameKey(`${props.gameTitle || ""} ${props.gameMode || ""}`);
      gameStats[gKey].clicks++;

      category = "game";
      label = `🕹️ Chọn chơi Game: ${props.gameTitle || gameStats[gKey].name}`;
      subLabel = `Ngày ${dayNumber || "?"} • ${
        props.isDone === "true" ? "Chơi lại" : "Chơi mới"
      }`;
    }

    timelineEvents.push({
      id: log.id,
      eventName,
      createdAt: log.createdAt.toISOString(),
      userId: log.userId,
      studentName,
      studentEmail,
      device,
      dayNumber,
      stageNumber,
      label,
      subLabel,
      category,
      props,
    });
  }

  // Process submissions for completion counts & enrich timeline if needed
  for (const sub of submissions) {
    activeUserSet.add(sub.studentId);
    const title = sub.assignment.title || "";
    const lowerTitle = title.toLowerCase();
    const matType = String(sub.assignment.materialType || "");
    let kind: string = matType;
    let gameMode = "";
    if (sub.assignment.instructions) {
      try {
        const meta = JSON.parse(sub.assignment.instructions);
        if (meta.kind) kind = meta.kind;
        if (meta.gameMode) gameMode = meta.gameMode;
      } catch {}
    }

    const dayNum =
      extractDayNum(sub.assignment.id) || extractDayNum(title) || null;
    if (dayNum) {
      const d = getOrCreateDay(dayNum);
      d.completions++;
    }

    if (kind === "FLASHCARD" || lowerTitle.includes("flashcard") || lowerTitle.includes("từ vựng")) {
      stationStats.vocab.completions++;
      stationStats.vocab.uniqueUsers.add(sub.studentId);
    } else if (kind === "GAME" || matType === "GAME" || lowerTitle.includes("game") || lowerTitle.includes("trò chơi")) {
      stationStats.game.completions++;
      stationStats.game.uniqueUsers.add(sub.studentId);
      const gKey = classifyGameKey(`${title} ${gameMode}`);
      gameStats[gKey].completions++;
      if (typeof sub.score === "number") {
        gameStats[gKey].totalScore += sub.score;
        gameStats[gKey].scoreCount++;
      }
    } else {
      stationStats.reading.completions++;
      stationStats.reading.uniqueUsers.add(sub.studentId);
    }

    timelineEvents.push({
      id: `sub-${sub.id}`,
      eventName: "student_assignment_submitted",
      createdAt: (sub.submittedAt || new Date()).toISOString(),
      userId: sub.studentId,
      studentName: sub.student?.name || "Học sinh",
      studentEmail: sub.student?.email || "",
      device: "desktop",
      dayNumber: dayNum,
      stageNumber: dayNum ? Math.ceil(dayNum / 15) : 1,
      label: `✅ Hoàn thành: ${title}`,
      subLabel:
        typeof sub.score === "number" ? `Điểm số: ${Math.round(sub.score)}/100` : "Đã hoàn thành",
      category: "submission",
      props: {
        dayNumber: dayNum ? String(dayNum) : "",
        score: typeof sub.score === "number" ? String(sub.score) : "",
      },
    });
  }

  // Sort combined timeline by createdAt desc
  timelineEvents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Format stations & games for client
  const stationsSummary = (["vocab", "game", "reading"] as const).map((k) => ({
    id: stationStats[k].id,
    name: stationStats[k].name,
    clicks: stationStats[k].clicks,
    completions: stationStats[k].completions,
    uniqueStudents: stationStats[k].uniqueUsers.size,
  }));

  const gamesSummary = (
    ["word_puzzle", "typing", "match", "sentence"] as const
  ).map((k) => ({
    id: gameStats[k].id,
    name: gameStats[k].name,
    badge: gameStats[k].badge,
    clicks: gameStats[k].clicks,
    completions: gameStats[k].completions,
    avgScore:
      gameStats[k].scoreCount > 0
        ? Math.round(gameStats[k].totalScore / gameStats[k].scoreCount)
        : null,
  }));

  // Ensure at least Day 1..15 are present for Stage 1 overview
  for (let d = 1; d <= 15; d++) {
    getOrCreateDay(d);
  }

  const daysSummary = Array.from(dayMap.values()).sort(
    (a, b) => a.dayNumber - b.dayNumber
  );

  return {
    className: cls?.name || classId,
    rangeDays,
    kpis: {
      totalIslandOpens,
      totalIslandPreviews,
      totalLockedClicks,
      totalStationClicks,
      totalGameSelects,
      totalSubmissions: submissions.length,
      activeStudentsCount: activeUserSet.size,
    },
    stationsSummary,
    gamesSummary,
    daysSummary,
    recentEvents: timelineEvents.slice(0, 150),
  };
}
