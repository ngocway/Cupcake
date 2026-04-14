import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import TeacherProfileEditor from "./editor"

export default async function TeacherProfilePage() {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== "TEACHER") {
        redirect("/login");
    }

    const teacher = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!teacher) return notFound();

    return (
        <div className="bg-[#fafbff] min-h-screen">
            <TeacherProfileEditor profile={teacher} />
        </div>
    );
}
