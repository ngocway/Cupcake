import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Calendar, AlertTriangle, BookOpen, ChevronRight, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

import BackButton from "@/components/ui/BackButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AssignmentDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/student/login");
  }

  const assignment = await prisma.assignment.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      teacher: {
        select: { name: true, image: true, professionalTitle: true }
      },
      _count: { select: { questions: true } }
    }
  });

  if (!assignment) {
    notFound();
  }

  const dateLocale = enUS;

  const now = new Date();
  const isDeadlinePassed = assignment.deadline ? new Date(assignment.deadline) < now : false;

  const submissions = await prisma.submission.findMany({
    where: { assignmentId: assignment.id, studentId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 1
  });

  const submissionCount = await prisma.submission.count({
    where: { assignmentId: assignment.id, studentId: session.user.id }
  });

  const hasAttemptsLeft = assignment.maxAttempts 
    ? submissionCount < assignment.maxAttempts 
    : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="mb-4">
          <BackButton className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95">
            <ChevronLeft className="w-4 h-4" />
            Back
          </BackButton>
        </div>
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{assignment.title}</h1>
              {(() => {
                 const tagsArray = assignment.tags
                    ? assignment.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                    : [];
                 if (tagsArray.length === 0) return null;
                 return (
                    <div className="flex flex-wrap gap-2 mt-2 mb-4">
                       {tagsArray.map((tag: string) => (
                          <Link 
                             key={tag} 
                             href={`/tags/${encodeURIComponent(tag)}`}
                             className="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-yellow-100 dark:border-yellow-800/30 hover:scale-105 hover:bg-yellow-100 transition-all duration-300"
                          >
                             #{tag}
                          </Link>
                       ))}
                    </div>
                 );
              })()}
              {assignment.teacher && (
                <div className="flex items-center gap-2 text-slate-600">
                  {assignment.teacher.image && (
                    <img 
                      src={assignment.teacher.image} 
                      alt={assignment.teacher.name || "Teacher"}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span>{assignment.teacher.name}</span>
                  {assignment.teacher.professionalTitle && (
                    <span className="text-sm text-slate-400">
                      • {assignment.teacher.professionalTitle}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Questions</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{assignment._count.questions}</p>
            </div>

            {assignment.timeLimit && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{assignment.timeLimit} min</p>
              </div>
            )}

            {assignment.deadline && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Deadline</span>
                </div>
                <p className={`text-lg font-semibold ${isDeadlinePassed ? 'text-red-500' : 'text-slate-900'}`}>
                  {format(new Date(assignment.deadline), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
                </p>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <span className="text-sm">Attempts</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {submissionCount} {assignment.maxAttempts && `/ ${assignment.maxAttempts}`}
              </p>
            </div>
          </div>

          {/* Deadline Warning */}
          {isDeadlinePassed && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">The deadline has passed</p>
            </div>
          )}

          {/* Action Button */}
          <Link
            href={`/student/assignments/${id}/run`}
            className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              !hasAttemptsLeft || isDeadlinePassed
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30"
            }`}
          >
            {!hasAttemptsLeft ? (
              "No attempts left"
            ) : isDeadlinePassed ? (
              "Expired"
            ) : (
              <>
                Start Assignment
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Link>

          {submissions.length > 0 && submissions[0].submittedAt && (
            <p className="text-center text-sm text-slate-500 mt-3">
              Last submission: {format(new Date(submissions[0].submittedAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
            </p>
          )}
        </div>

        {/* Instructions Preview */}
        {assignment.instructions && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Instructions</h2>
            <div 
              className="prose prose-slate max-w-none text-slate-600"
              dangerouslySetInnerHTML={{ __html: assignment.instructions }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
