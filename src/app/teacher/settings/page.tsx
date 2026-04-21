import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import SettingsForm from "./form"

export default async function TeacherSettingsPage() {
    const session = await auth();
    
    if (!session?.user?.id || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
        redirect("/login");
    }

    const teacher = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!teacher) return notFound();

    return (
        <div className="bg-[#fafbff] min-h-screen">
            <SettingsForm user={teacher} />
        </div>
    );
}
