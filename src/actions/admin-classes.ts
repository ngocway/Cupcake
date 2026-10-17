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
