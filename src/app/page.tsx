
import { Suspense } from "react"
import { LandingPage } from "@/components/public/LandingPage"
import { HomeShell } from "./_components/HomeShell"
import { HomeSidebar } from "./_components/HomeSidebar"
import { getCachedAssignments, getCachedLessons } from "@/lib/cached-queries"
import { cookies } from "next/headers"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getOnboardingConfig } from "@/actions/user-preferences-actions"
import { getBestAgeGroupForSubject } from "@/lib/user-preferences-utils"

export default async function HomePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;

  const cookieStore = await cookies()
  console.log("=== INCOMING COOKIES ===", cookieStore.getAll());
  const userTypeCookie = cookieStore.get("user_type")?.value
  let initialUserType = userTypeCookie || "learner"
  let hasUserPreference = !!userTypeCookie

  const studySubjectCookie = cookieStore.get("study_subject")?.value
  const studyLevelCookie = cookieStore.get("study_level")?.value
  const studyAgeGroupCookie = cookieStore.get("study_age_group")?.value
  let studySubject = studySubjectCookie || "english"
  let studyAgeGroup = studyAgeGroupCookie || ""
  let studyLevel = studyLevelCookie || ""

  const session = await auth()
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ 
      where: { id: session.user.id },
      select: { userType: true, studySubject: true, studyAgeGroup: true, studyLevel: true }
    })
    if (user) {
      const dbHasPrefs = !!(user.studySubject || user.studyAgeGroup)
      const cookieHasPrefs = !!(studySubjectCookie || userTypeCookie)

      if (dbHasPrefs) {
        // DB wins — logged-in user's saved preferences override any guest cookie
        if (user.userType) initialUserType = user.userType
        if (user.studySubject) studySubject = user.studySubject
        if (user.studyAgeGroup) studyAgeGroup = user.studyAgeGroup
        if (user.studyLevel) studyLevel = user.studyLevel
        hasUserPreference = true
      } else if (cookieHasPrefs) {
        // DB empty but guest had already set preferences in cookie → sync to DB
        // This handles: guest sets up → logs in → preferences persist across devices
        const syncData: Record<string, string> = {}
        if (userTypeCookie) syncData.userType = userTypeCookie
        if (studySubjectCookie) syncData.studySubject = studySubjectCookie
        if (studyAgeGroupCookie) syncData.studyAgeGroup = studyAgeGroupCookie
        if (studyLevelCookie) syncData.studyLevel = studyLevelCookie
        prisma.user.update({ where: { id: session.user.id }, data: syncData }).catch(() => {})
        hasUserPreference = true
      }
    }
  }

  // Default to pre-a1-a1 for english if no level is stored in cookie/DB
  if (studySubject === "english" && (!studyLevel || studyLevel.trim() === "")) {
    studyLevel = "pre-a1-a1"
    try {
      cookieStore.set("study_level", "pre-a1-a1", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
    } catch (e) {
      // Safe to ignore in Server Components rendering
    }

    if (session?.user?.id) {
      prisma.user.update({
        where: { id: session.user.id },
        data: { studyLevel: "pre-a1-a1" }
      }).catch(e => console.error("Failed to default studyLevel in DB", e))
    }
  }

  // Resolve matching age group if it is mismatched for the active subject
  const config = await getOnboardingConfig()
  const resolvedAgeGroup = getBestAgeGroupForSubject(studySubject, initialUserType, studyAgeGroup, config)
  if (resolvedAgeGroup !== studyAgeGroup) {
    studyAgeGroup = resolvedAgeGroup
    // Update the cookie for server component persistence
    try {
      cookieStore.set("study_age_group", resolvedAgeGroup, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
    } catch (e) {
      // In Next.js, setting cookies might fail if headers are already sent, which is safe to ignore here
    }
  }

  // FAST FIRST LOAD: Only fetch newest variants on the server.
  // Popular data is pre-fetched client-side in the background (via /api/feed)
  // after the page has already rendered — so sort switching feels instant
  // without slowing down the initial page load.
  const queryParams = { 
    ...params, 
    userType: initialUserType,
    studySubject,
    studyLevel
  };
  const assignmentsPromise  = Promise.resolve({ items: [], total: 0 });
  const lessonsPromise      = Promise.resolve({ items: [], total: 0 });
  const flashcardsPromise   = Promise.resolve([]);


  const kindergartenGamesPromise = Promise.resolve([
    {
      id: "flashcard-match",
      title: "Flashcard Match",
      href: "/student/game/flashcard-match/select?level=kindergarten",
      gradient: "from-blue-200 to-indigo-405",
      thumbnail: "/images/games/flashcard-match.png",
      emoji: "🎴",
      tag: "Vocabulary",
      desc: "Flip and match words with their correct images from your flashcards. Simple, fun and engaging memory game!",
      comingSoon: false,
    },
    {
      id: "flashcard-sentence-builder",
      title: "Sentence Builder (Flashcards)",
      href: "/student/game/flashcard-sentence-builder/select?level=kindergarten",
      gradient: "from-violet-200 to-purple-400",
      thumbnail: "/images/games/flashcard-sentence-builder.png",
      emoji: "🧩",
      tag: "Grammar",
      desc: "Arrange words to build sentences matching your flashcard images and examples. Practice writing and speaking!",
      comingSoon: false,
    },
    {
      id: "flashcard-quiz",
      title: "Flashcard Quiz",
      href: "/student/game/flashcard-quiz/select?age=2-5",
      gradient: "from-pink-300 to-rose-500",
      thumbnail: "/images/games/flashcard-quiz.png",
      emoji: "❓",
      tag: "Quiz",
      desc: "Listen to the questions, look at the images, and choose the correct words. Fun and engaging quiz games!",
      comingSoon: false,
    }
  ]);

  return (
    <HomeShell>
      <div className="w-full pb-20 flex flex-col lg:flex-row items-start gap-10 px-6 md:px-10 max-w-[1600px] mx-auto">
        <HomeSidebar searchParams={params} initialUserType={initialUserType} studySubject={studySubject} studyAgeGroup={studyAgeGroup} />

        <main className="flex-1 space-y-12">
          <Suspense fallback={
            <div className="space-y-12 animate-pulse">
              <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              <div className="h-14 w-64 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-video bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
                ))}
              </div>
            </div>
          }>
            <LandingPage
              promises={{
                assignments: assignmentsPromise,
                lessons: lessonsPromise,
                flashcards: flashcardsPromise,
                kindergartenGames: kindergartenGamesPromise,
              }}
              searchParams={params}
              initialUserType={initialUserType}
              hasUserPreference={hasUserPreference}
              initialStudySubject={studySubject}
              initialStudyAgeGroup={studyAgeGroup}
              initialStudyLevel={studyLevel}
              onboardingConfig={config}
            />
          </Suspense>
        </main>
      </div>
    </HomeShell>
  )
}
