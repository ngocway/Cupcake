"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createSubAdmin(data: {
  name: string;
  email: string;
  password?: string;
  adminRoleId: string;
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
      data: { isBlocked }
    })
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Toggle Block User Error:", error)
    return { success: false, error: "Lỗi Server" }
  }
}
