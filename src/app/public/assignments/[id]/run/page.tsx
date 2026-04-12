import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import PublicQuizRunner from "./PublicQuizRunner"

export default async function PublicAssignmentRunPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' }
      },
      teacher: {
        select: {
          name: true,
          image: true
        }
      }
    }
  })

  // Security check: Only allow access if public
  if (!assignment || assignment.status !== "PUBLIC") {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50">
       <PublicQuizRunner 
          assignment={assignment}
          questions={assignment.questions}
       />
    </div>
  )
}
