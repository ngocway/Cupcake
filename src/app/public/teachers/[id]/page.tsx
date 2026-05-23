import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PublicHeader } from "@/components/public/PublicHeader";
import { LessonCard, ExerciseCard } from "@/components/public/ContentCards";
import { TeacherProfileContent } from "./TeacherProfileContent";
import { User, MapPin, Briefcase, GraduationCap, LayoutGrid, BookOpen } from "lucide-react";
import Image from "next/image";

export default async function TeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const sessionData = await auth();
  const isLoggedIn = !!sessionData?.user;
  const { id } = await params;

  const teacher = await prisma.user.findUnique({
    where: { id },
    include: {
      lessons: {
        where: { deletedAt: null, isBlocked: false },
        orderBy: { createdAt: "desc" },
        include: { teacher: true, _count: { select: { reviews: true } } }
      },
      assignments: {
        where: { status: "PUBLIC", deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { teacher: true, _count: { select: { reviews: true } } }
      },
      _count: {
        select: { lessons: true, assignments: true }
      }
    }
  });

  if (!teacher) {
    notFound();
  }

  const allContent = [
    ...teacher.lessons.map(l => ({ ...l, itemType: 'lesson' })),
    ...teacher.assignments.map(a => ({ ...a, itemType: 'assignment' }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const headerSession = sessionData?.user ? {
    id: sessionData.user.id,
    name: sessionData.user.name || null,
    image: sessionData.user.image || null,
    role: sessionData.user.role || null
  } : null;

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20 selection:text-primary">
      <PublicHeader session={headerSession} />
      
      <main className="pt-24 pb-20">
        {/* Cover Image */}
        <div className="w-full h-40 md:h-56 lg:h-64 relative bg-gradient-to-br from-primary/20 via-tertiary/20 to-secondary/20 overflow-hidden">
          {teacher.coverImage && (
            <Image 
              src={teacher.coverImage} 
              alt="Cover" 
              fill 
              className="object-cover"
            />
          )}
          {/* Solarpunk aesthetic blob over cover */}
          <div className="absolute top-0 right-0 w-full h-full bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>

        <TeacherProfileContent teacher={teacher} allContent={allContent} isLoggedIn={isLoggedIn} />
      </main>
    </div>
  );
}
