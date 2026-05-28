import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AssignmentDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/student/login");
  }

  // Verify assignment exists
  const assignment = await prisma.assignment.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { id: true, slug: true }
  });

  if (!assignment) {
    notFound();
  }

  // Skip landing page — go directly to quiz
  const identifier = assignment.slug || assignment.id;
  redirect(`/student/assignments/${identifier}/run?direct=true`);
}
