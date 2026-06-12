"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getOnboardingConfig } from "@/actions/user-preferences-actions";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function saveOnboardingConfig(configData: any) {
  await requireAdmin();

  await prisma.systemSetting.upsert({
    where: { key: 'onboarding_config' },
    update: { value: configData },
    create: { key: 'onboarding_config', value: configData }
  });

  revalidatePath("/", "layout");
  return { success: true };
}
