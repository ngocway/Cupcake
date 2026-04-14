"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function updateTeacherSettings(data: {
    themeColor?: string,
    logoUrl?: string,
    isIncognito?: boolean,
    notifySubmission?: boolean,
    notifyReview?: boolean,
    notifyWeekly?: boolean,
    studentViewTheme?: string
}) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "TEACHER") {
            return { error: "Không có quyền thực hiện" };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                themeColor: data.themeColor,
                logoUrl: data.logoUrl,
                isIncognito: data.isIncognito,
                notifySubmission: data.notifySubmission,
                notifyReview: data.notifyReview,
                notifyWeekly: data.notifyWeekly,
                studentViewTheme: data.studentViewTheme
            }
        });


        revalidatePath("/teacher/settings");
        return { success: true };
    } catch (error) {
        console.error("Error updating settings:", error);
        return { error: "Lỗi hệ thống khi cập nhật cài đặt" };
    }
}

export async function updateAccountSecurity(data: {
    email?: string,
    password?: string,
    oldPassword?: string
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Yêu cầu đăng nhập" };

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return { error: "Người dùng không tồn tại" };

        const updateData: any = {};

        if (data.email) {
            updateData.email = data.email;
        }

        if (data.password) {
            if (!data.oldPassword) return { error: "Cần nhập mật khẩu cũ" };
            const isMatch = await bcrypt.compare(data.oldPassword, user.password || "");
            if (!isMatch) return { error: "Mật khẩu cũ không đúng" };
            
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating security:", error);
        return { error: "Lỗi hệ thống" };
    }
}

export async function toggleBlockUser(targetUserId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Yêu cầu đăng nhập" };

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return { error: "Người dùng không tồn tại" };

        let blocked = user.blockedUserIds ? user.blockedUserIds.split(',') : [];
        if (blocked.includes(targetUserId)) {
            blocked = blocked.filter(id => id !== targetUserId);
        } else {
            blocked.push(targetUserId);
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { blockedUserIds: blocked.join(',') }
        });

        revalidatePath("/teacher/settings");
        return { success: true };
    } catch (error) {
        return { error: "Lỗi khi cập nhật danh sách chặn" };
    }
}
