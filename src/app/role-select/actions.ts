"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function submitRoleSelection(formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const role = formData.get("role") as string
  if (role !== "TEACHER" && role !== "STUDENT") {
    throw new Error("Invalid role selected")
  }

  // Cập nhật role vào cơ sở dữ liệu
  await prisma.user.update({
    where: { id: session.user.id },
    data: { role }
  })

  // Điều hướng dựa theo role
  if (role === "TEACHER") {
    redirect("/teacher/dashboard")
  } else {
    redirect("/student/assignments")
  }
}
