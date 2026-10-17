import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { AdminClassDetailClient, type AdminClassDetails } from "./AdminClassDetailClient"
import type { AdminGroupItem, AdminAssignmentItem } from "./_components/AdminCurriculumTab"
import type { AdminStudentItem } from "./_components/AdminStudentsTab"

export default async function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login")
  }

  const { id: classId } = await params

  // Fetch Class, Groups, Assignments, and Students in parallel
  const [cls, groupsData, assignmentClasses, enrollments] = await Promise.all([
    prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: { name: true, email: true },
        },
      },
    }),

    prisma.assignmentGroup.findMany({
      where: { classId },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      include: {
        prerequisiteGroup: {
          select: { title: true },
        },
      },
    }),

    prisma.assignmentClass.findMany({
      where: { classId },
      include: {
        assignment: {
          select: {
            id: true,
            slug: true,
            title: true,
            materialType: true,
            level: true,
            instructions: true,
            deadline: true,
            thumbnail: true,
            audioUrl: true,
            readingText: true,
            deletedAt: true,
            _count: {
              select: { questions: true },
            },
            lesson: {
              select: { id: true, slug: true },
            },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    }),

    prisma.classEnrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            isManagedAccount: true,
            password: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
  ])

  if (!cls) {
    notFound()
  }

  // Format assignments
  const activeAssignments = assignmentClasses.filter(
    (ac) => ac.assignment.deletedAt === null
  )

  const formattedAssignments: AdminAssignmentItem[] = activeAssignments.map((ac) => {
    const a = ac.assignment
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      materialType: a.materialType,
      level: a.level,
      instructions: a.instructions,
      deadline: ac.dueDate ? ac.dueDate.toISOString() : (a.deadline ? a.deadline.toISOString() : null),
      thumbnail: a.thumbnail,
      audioUrl: a.audioUrl,
      readingText: a.readingText,
      lessonSlug: a.lesson?.slug,
      lessonId: a.lesson?.id,
      questionsCount: a._count?.questions ?? 0,
      submittedCount: 0,
      totalStudents: enrollments.length,
      assignedAt: ac.assignedAt ? ac.assignedAt.toISOString() : null,
      groupId: ac.groupId,
    }
  })

  // Map assignments to groups
  const assignmentMapByGroup = new Map<string, AdminAssignmentItem[]>()
  const ungrouped: AdminAssignmentItem[] = []

  for (const item of formattedAssignments) {
    if (item.groupId) {
      const arr = assignmentMapByGroup.get(item.groupId) || []
      arr.push(item)
      assignmentMapByGroup.set(item.groupId, arr)
    } else {
      ungrouped.push(item)
    }
  }

  const formattedGroups: AdminGroupItem[] = groupsData.map((g) => ({
    id: g.id,
    title: g.title,
    orderIndex: g.orderIndex,
    prerequisiteGroupId: g.prerequisiteGroupId,
    prerequisiteGroupTitle: g.prerequisiteGroup?.title || null,
    unlockThreshold: g.unlockThreshold,
    forceUnlocked: g.forceUnlocked,
    isHidden: g.isHidden,
    visibleFrom: g.visibleFrom ? g.visibleFrom.toISOString() : null,
    items: assignmentMapByGroup.get(g.id) || [],
  }))

  const formattedStudents: AdminStudentItem[] = enrollments.map((e) => ({
    id: e.student.id,
    name: e.student.name || "",
    email: e.student.email || "",
    status: e.status as any,
    isManagedAccount: e.student.isManagedAccount,
    pin: e.student.isManagedAccount ? e.student.password : null,
    notes: e.notes,
    joinedAt: e.joinedAt.toISOString(),
  }))

  const initialData: AdminClassDetails = {
    id: cls.id,
    name: cls.name,
    classCode: cls.classCode,
    joinCode: cls.joinCode,
    isJoinable: cls.isJoinable,
    autoApprove: cls.autoApprove ?? true,
    dailyDripUnlock: cls.dailyDripUnlock ?? false,
    isBlocked: cls.isBlocked || false,
    teacher: {
      name: cls.teacher.name,
      email: cls.teacher.email,
    },
    groups: formattedGroups,
    ungroupedAssignments: ungrouped,
    students: formattedStudents,
  }

  return <AdminClassDetailClient initialData={initialData} />
}
