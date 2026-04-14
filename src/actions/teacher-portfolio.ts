"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updatePortfolioVisibility(isPublished: boolean) {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { isPortfolioPublished: isPublished },
  });

  revalidatePath("/teacher/settings");
  revalidatePath(`/teacher/profile/${session.user.id}`);
  return { success: true };
}

export async function updatePortfolioDetails(data: {
  bio?: string;
  professionalTitle?: string;
  hourlyRate?: number;
  location?: string;
  education?: string;
  teachingExperience?: string;
  expertiseTags?: string;
}) {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...data,
    },
  });

  revalidatePath("/teacher/settings");
  revalidatePath(`/teacher/profile/${session.user.id}`);
  return { success: true };
}

export async function addCertificate(data: {
  title: string;
  issuer: string;
  issueDate?: Date;
  imageUrl: string;
}) {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") {
    throw new Error("Unauthorized");
  }

  await prisma.certificate.create({
    data: {
      ...data,
      userId: session.user.id,
    },
  });

  revalidatePath("/teacher/settings");
  return { success: true };
}

export async function deleteCertificate(id: string) {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") {
    throw new Error("Unauthorized");
  }

  await prisma.certificate.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  });

  revalidatePath("/teacher/settings");
  return { success: true };
}
