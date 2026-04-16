"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from '@/auth'

export async function adminToggleBlockClass(id: string, isBlocked: boolean) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized')

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
