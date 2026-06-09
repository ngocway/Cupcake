"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function getUserVocabLanguage() {
  try {
    const session = await auth()
    if (!session?.user?.id) return null

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nativeLanguage: true }
    })

    return user?.nativeLanguage || null
  } catch (error) {
    console.error("Error getting vocab language:", error)
    return null
  }
}

export async function updateUserVocabLanguage(lang: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { nativeLanguage: lang }
    })
    
    return { success: true }
  } catch (error) {
    console.error("Error updating vocab language:", error)
    return { success: false, error: "Failed to update" }
  }
}
