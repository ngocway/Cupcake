"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getOnboardingConfig } from "@/actions/user-preferences-actions";
import { redis } from "@/lib/redis";

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

  // Invalidate Redis cache so the change is reflected immediately
  try { await redis.del('system:onboarding_config') } catch (_) {}

  revalidatePath("/", "layout");
  return { success: true };
}
