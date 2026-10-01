import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  // 1. Find assignment (needed for maxAttempts and slug)
  const assignment = await prisma.assignment.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { id: true, slug: true, maxAttempts: true }
  });

  if (!assignment) {
    return new NextResponse("Assignment not found", { status: 404 });
  }

  let classId: string | undefined;
  let groupId: string | undefined;
  try {
    const body = await request.json();
    classId = body.classId;
    groupId = body.groupId;
  } catch {}
  if (!classId) {
    const url = new URL(request.url);
    classId = url.searchParams.get("classId") || undefined;
    groupId = url.searchParams.get("groupId") || undefined;
  }

  // 2. Check for active submission or count completed attempts
  const submissions = await prisma.submission.findMany({
    where: { 
      assignmentId: assignment.id, 
      studentId: userId,
      classId: classId || undefined,
      groupId: groupId || undefined
    },
    select: { id: true, submittedAt: true, attemptNumber: true },
    orderBy: { attemptNumber: "desc" }
  });

  const activeSubmission = submissions.find((s) => !s.submittedAt);
  const identifier = assignment.slug || assignment.id;
  const qStr = `${classId ? `&classId=${classId}` : ''}${groupId ? `&groupId=${groupId}` : ''}`;

  if (activeSubmission) {
    return NextResponse.json({ 
      redirectUrl: `/student/assignments/${identifier}/run/quiz?submissionId=${activeSubmission.id}${qStr}` 
    });
  }

  const completedCount = submissions.filter((s) => s.submittedAt).length;

  if (completedCount >= assignment.maxAttempts) {
    return NextResponse.json({ error: "Maximum attempts reached" }, { status: 403 });
  }

  // 3. Create new submission
  const newSubmission = await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      studentId: userId,
      classId: classId || null,
      groupId: groupId || null,
      attemptNumber: completedCount + 1
    }
  });

  return NextResponse.json({ 
    redirectUrl: `/student/assignments/${identifier}/run/quiz?submissionId=${newSubmission.id}${qStr}` 
  });
}
