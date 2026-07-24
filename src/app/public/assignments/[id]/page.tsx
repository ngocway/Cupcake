import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import QuizClientRunner from "@/app/student/assignments/[id]/run/quiz/QuizClientRunner";
import { fetchWithRedis } from "@/lib/cached-queries";
import { getCachedAssignmentQuestions, getRelatedAssignmentsCached, getQuestionTranslationMap, getAssignmentTranslations } from "@/app/student/assignments/[id]/run/data";
import type { Metadata } from "next";

// --- Per-exercise SEO Metadata ---

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const assignment = await prisma.assignment.findFirst({
    where: { OR: [{ id }, { slug: id }], deletedAt: null },
    select: { id: true, slug: true, title: true, shortDescription: true, thumbnail: true },
  });

  if (!assignment) {
    return { title: "Exercise Not Found | Dolcake" };
  }

  const title = `${assignment.title} | Dolcake`;
  const description =
    assignment.shortDescription ||
    `Practice English with "${assignment.title}" — an interactive exercise on Dolcake, the fun English learning platform.`;
  const thumbnail = assignment.thumbnail ?? "/images/og-image.png";
  const canonicalPath = `/public/assignments/${assignment.slug ?? assignment.id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `https://dolcake.com${canonicalPath}`,
      siteName: "Dolcake",
      images: [{ url: thumbnail, width: 1200, height: 630, alt: assignment.title }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [thumbnail],
    },
  };
}

export default async function PublicAssignmentPage({ 
  params,
}: { 
  params: Promise<{ id: string }>,
  searchParams?: Promise<Record<string, string>>
}) {
  const sessionData = await auth();
  const session = sessionData?.user ? {
    id: sessionData.user.id!,
    name: sessionData.user.name ?? null,
    image: sessionData.user.image ?? null,
    role: sessionData.user.role ?? null,
  } : null;

  const { id } = await params;

  const assignment = await fetchWithRedis(`assignment:public:${id}`, 300, async () => {
    return prisma.assignment.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      },
      include: {
        teacher: {
          include: {
            _count: {
              select: { lessons: true, assignments: true }
            }
          }
        },
        _count: { select: { questions: true } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        lesson: { select: { id: true, targetAudiences: true } }
      }
    });
  });

  if (!assignment) {
    notFound();
  }

  const questions = await getCachedAssignmentQuestions(assignment.id);

  // ── Always go directly to quiz (no landing page) ──────────────────────────

  // For logged-in users: create/resume submission then redirect to quiz
  if (session) {
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: assignment.id, studentId: session.id },
      orderBy: { attemptNumber: 'desc' }
    });
    const activeSubmission = submissions.find(s => !s.submittedAt);
    const completedCount = submissions.filter(s => s.submittedAt).length;

    if (activeSubmission) {
      redirect(`/student/assignments/${assignment.id}/run/quiz?submissionId=${activeSubmission.id}`);
    } else {
      const newSubmission = await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: session.id,
          attemptNumber: completedCount + 1
        }
      });
      redirect(`/student/assignments/${assignment.id}/run/quiz?submissionId=${newSubmission.id}`);
    }
  }

  const relatedAssignments = await getRelatedAssignmentsCached(assignment.id, assignment.tags, assignment.targetAudiences as string[]);
  const questionTranslationsPromise = getQuestionTranslationMap(assignment.id);
  const assignmentTranslationsPromise = getAssignmentTranslations(assignment.id);

  // Build JSON-LD Course schema for exercises
  const canonicalUrl = `https://dolcake.com/public/assignments/${assignment.slug ?? assignment.id}`;
  const exerciseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: assignment.title,
    description:
      assignment.shortDescription ||
      `Practice English with "${assignment.title}" — an interactive exercise on Dolcake.`,
    url: canonicalUrl,
    provider: {
      "@type": "EducationalOrganization",
      name: "Dolcake",
      url: "https://dolcake.com",
      logo: "https://dolcake.com/images/og-image.png",
    },
    ...(assignment.thumbnail && { image: assignment.thumbnail }),
    inLanguage: "en",
    isAccessibleForFree: true,
    ...(assignment.level && {
      educationalLevel: assignment.level,
    }),
    ...(assignment.learningGoals && assignment.learningGoals.length > 0 && {
      teaches: assignment.learningGoals,
    }),
    ...(assignment.targetAudiences && assignment.targetAudiences.length > 0 && {
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
        audienceType: (assignment.targetAudiences as string[]).join(", "),
      },
    }),
    ...(assignment.teacher?.name && {
      creator: {
        "@type": "Person",
        name: assignment.teacher.name,
      },
    }),
    dateCreated: assignment.createdAt?.toISOString(),
    dateModified: assignment.updatedAt?.toISOString(),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: assignment.timeLimit
        ? `PT${assignment.timeLimit}M`
        : "PT10M",
      inLanguage: "en",
    },
    ...(assignment._count?.questions && {
      numberOfCredits: assignment._count.questions,
    }),
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
       <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{ __html: JSON.stringify(exerciseJsonLd) }}
       />
       <QuizClientRunner 
          assignment={assignment}
          questions={questions}
          initialAnswers={{}}
          extraDataPromise={Promise.resolve(assignment)}
          relatedAssignmentsPromise={Promise.resolve(relatedAssignments)}
          questionTranslationsPromise={questionTranslationsPromise}
          assignmentTranslationsPromise={assignmentTranslationsPromise}
          isGuest={true}
       />
    </div>
  );
}
