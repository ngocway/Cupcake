import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { answersDraft, cheatCount } = body

    const submission = await prisma.submission.findUnique({
      where: { id }
    })

    if (!submission) {
      return new NextResponse("Submission not found", { status: 404 })
    }

    if (submission.studentId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    if (submission.submittedAt) {
      return new NextResponse("Already submitted", { status: 400 })
    }

    const updateData: any = {}
    if (answersDraft !== undefined) updateData.answersDraft = answersDraft
    if (cheatCount !== undefined) updateData.cheatCount = cheatCount

    const updated = await prisma.submission.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[SUBMISSION_DRAFT_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
