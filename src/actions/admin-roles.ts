"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createAdminRole(name: string, permissions: string[]) {
  try {
    const role = await prisma.adminRole.create({
      data: {
        name,
        permissions: JSON.stringify(permissions),
      },
    })
    revalidatePath("/admin/roles")
    return { success: true, role }
  } catch (error) {
    console.error("Create Role Error:", error)
    return { success: false, error: "Tên vai trò đã tồn tại hoặc lỗi hệ thống." }
  }
}

export async function deleteAdminRole(id: string) {
  try {
    await prisma.adminRole.delete({ where: { id } })
    revalidatePath("/admin/roles")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Không thể xóa vai trò đang có người sử dụng." }
  }
}
