"use server"

import { cookies } from "next/headers"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function setUserTypePreference(userType: string) {
  // 1. Set cookie for immediate access by server components
  const cookieStore = await cookies()
  cookieStore.set("user_type", userType, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  // 2. If logged in as student, update profile
  const session = await auth()
  if (session?.user?.id) {
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { userType }
      })
    } catch (e) {
      console.error("Failed to update userType in DB", e)
    }
  }

  return { success: true }
}
