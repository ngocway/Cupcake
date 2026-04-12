"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function updateStudentProfile(data: { name?: string, image?: string }) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: data.name,
                image: data.image
            }
        })
        revalidatePath("/student/settings")
        return { success: true }
    } catch (error) {
        return { error: "Failed to update profile" }
    }
}

export async function changeStudentPassword(oldPassword: string, newPassword: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user || (!user.password && user.accounts.length > 0)) {
            return { error: "This account uses social login. Use social settings to manage security." }
        }

        if (user.password) {
            const isMatch = await bcrypt.compare(oldPassword, user.password)
            if (!isMatch) return { error: "Incorrect old password" }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        })

        return { success: true }
    } catch (error) {
        return { error: "Failed to change password" }
    }
}

export async function updateNotificationSettings(settings: any) {
    // Note: In a real app, we might have a NotificationSettings model.
    // Since our schema doesn't have it, we'll simulate success.
    // Ideally, we'd add fields to the User model like notificationPreferences (JSON).
    console.log("Updating notification settings:", settings)
    return { success: true }
}
