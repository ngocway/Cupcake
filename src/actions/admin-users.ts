"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createSubAdmin(data: {
  name: string
  email: string
  password?: string
  adminRoleId: string
}) {
  try {
    const hashedPassword = await bcrypt.hash(data.password || "123456Abc", 10)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "ADMIN",
        adminRoleId: data.adminRoleId,
      },
    })

    revalidatePath("/admin/users")
    return { success: true, user }
  } catch (error) {
    console.error("Create SubAdmin Error:", error)
    return { success: false, error: "Email đã tồn tại hoặc lỗi hệ thống." }
  }
}

export async function adminToggleBlockUser(id: string, isBlocked: boolean) {
  try {
    await prisma.user.update({
      where: { id },
      data: { isBlocked },
    })
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Toggle Block User Error:", error)
    return { success: false, error: "Lỗi Server" }
  }
}

export async function adminGetUserDetail(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        isBlocked: true,
        locale: true,
        nativeLanguage: true,
        image: true,
        enrollments: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                classCode: true,
              },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
        submissions: {
          select: {
            id: true,
            score: true,
            submittedAt: true,
            assignment: {
              select: {
                id: true,
                title: true,
                materialType: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { submittedAt: "desc" },
          take: 12,
        },
      },
    })

    if (!user) return { success: false, error: "Không tìm thấy người dùng" }

    // Last 25 page views for timeline
    const pageviews = await prisma.pageViewLog.findMany({
      where: { userId },
      select: {
        id: true,
        path: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const totalPageviews = await prisma.pageViewLog.count({ where: { userId } })
    const totalSubmissions = await prisma.submission.count({
      where: { studentId: userId },
    })

    // Active days in last 30d
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const logs30 = await prisma.pageViewLog.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    })
    const distinctDaysSet = new Set(
      logs30.map((l) => l.createdAt.toISOString().slice(0, 10))
    )

    return {
      success: true,
      data: {
        ...user,
        pageviews,
        totalPageviews,
        totalSubmissions,
        activeDays30: distinctDaysSet.size,
      },
    }
  } catch (error) {
    console.error("adminGetUserDetail error:", error)
    return { success: false, error: "Lỗi tải thông tin chi tiết" }
  }
}

export async function adminUpdateUserRole(
  userId: string,
  role: "TEACHER" | "STUDENT"
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("adminUpdateUserRole error:", error)
    return { success: false, error: "Lỗi cập nhật vai trò" }
  }
}
