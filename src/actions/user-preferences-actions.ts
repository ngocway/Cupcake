"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function setUserTypePreference(userType: string) {
  // 1. Set cookie for immediate access by server components
  const cookieStore = await cookies()
  cookieStore.set("user_type", userType, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  // 2. If logged in as student, update profile
  const session = await auth()
  if (session?.user?.id) {
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { userType }
      })
    } catch (e) {
      console.error("Failed to update userType in DB", e)
    }
  }

  revalidatePath("/")
  return { success: true }
}

export async function updateAllPreferences(data: {
  userType?: string,
  nativeLanguage?: string,
  studySubject?: string,
  studyAgeGroup?: string,
  studyLevel?: string
}) {
  const cookieStore = await cookies()
  const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" }
  
  if (data.userType) cookieStore.set("user_type", data.userType, cookieOpts)
  if (data.nativeLanguage) cookieStore.set("native_language", data.nativeLanguage, cookieOpts)
  if (data.studySubject) cookieStore.set("study_subject", data.studySubject, cookieOpts)
  if (data.studyAgeGroup) cookieStore.set("study_age_group", data.studyAgeGroup, cookieOpts)
  if (data.studyLevel) cookieStore.set("study_level", data.studyLevel, cookieOpts)

  const session = await auth()
  if (session?.user?.id) {
    try {
      const updateData: any = {}
      if (data.userType) updateData.userType = data.userType
      if (data.nativeLanguage) updateData.nativeLanguage = data.nativeLanguage
      if (data.studySubject !== undefined) updateData.studySubject = data.studySubject
      if (data.studyAgeGroup !== undefined) updateData.studyAgeGroup = data.studyAgeGroup
      if (data.studyLevel !== undefined) updateData.studyLevel = data.studyLevel

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: updateData
        })
      }
    } catch (e) {
      console.error("Failed to update preferences in DB", e)
    }
  }

  revalidatePath("/")
  return { success: true }
}

export async function setOnboardingPreferences(preferences: { studySubject: string, studyAgeGroup: string, studyLevel: string }) {
  const cookieStore = await cookies()
  cookieStore.set("study_subject", preferences.studySubject, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" })
  cookieStore.set("study_age_group", preferences.studyAgeGroup, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" })
  cookieStore.set("study_level", preferences.studyLevel, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" })

  const session = await auth()
  if (session?.user?.id) {
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          studySubject: preferences.studySubject,
          studyAgeGroup: preferences.studyAgeGroup,
          studyLevel: preferences.studyLevel,
        }
      })
    } catch (e) {
      console.error("Failed to update onboarding preferences in DB", e)
    }
  }

  revalidatePath("/")
  return { success: true }
}

export async function setNativeLanguagePreference(nativeLanguage: string) {
  // 1. Set cookie for immediate access by server components
  const cookieStore = await cookies()
  cookieStore.set("native_language", nativeLanguage, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  // 2. If logged in as student, update profile
  const session = await auth()
  if (session?.user?.id) {
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { nativeLanguage }
      })
    } catch (e) {
      console.error("Failed to update nativeLanguage in DB", e)
    }
  }

  return { success: true }
}

const DEFAULT_CONFIG = {
  subjects: [
    {
      id: "english",
      label: "English",
      icon: "/images/english.png",
      ageGroups: [
        {
          id: "kids",
          label: "Kid (6-10 years)",
          avatar: "/images/avatars/kid.png",
          levels: [
            { id: "beginner", label: "Beginner (Pre-A1, A1)" },
            { id: "elementary", label: "Elementary (A2)" },
            { id: "intermediate", label: "Intermediate (B1)" }
          ]
        },
        {
          id: "teens",
          label: "Teen (11-15 years)",
          avatar: "/images/avatars/teen.png",
          levels: [
            { id: "beginner", label: "Beginner (Pre-A1, A1)" },
            { id: "elementary", label: "Elementary (A2)" },
            { id: "intermediate", label: "Intermediate (B1, B2)" }
          ]
        },
        {
          id: "adults",
          label: "Adult (16+ years)",
          avatar: "/images/avatars/adult.png",
          levels: [
            { id: "beginner", label: "Beginner (Pre-A1, A1)" },
            { id: "elementary", label: "Elementary (A2)" },
            { id: "intermediate", label: "Intermediate (B1, B2)" },
            { id: "advanced", label: "Advanced (C1, C2)" }
          ]
        }
      ]
    },
    {
      id: "math",
      label: "Math",
      icon: "/images/math.png",
      ageGroups: [
        {
          id: "kids",
          label: "Kid (6-10 years)",
          avatar: "/images/avatars/kid.png",
          levels: []
        }
      ]
    },
    {
      id: "science",
      label: "Science",
      icon: "/images/global.png",
      ageGroups: [
        {
          id: "kids",
          label: "Kid (6-10 years)",
          avatar: "/images/avatars/kid.png",
          levels: []
        }
      ]
    }
  ]
};

export async function getOnboardingConfig() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'onboarding_config' }
    })
    return setting ? setting.value : DEFAULT_CONFIG
  } catch (e) {
    console.error("Failed to fetch onboarding config", e)
    return DEFAULT_CONFIG
  }
}
