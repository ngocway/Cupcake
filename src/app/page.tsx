
import { Suspense } from "react"
import { LandingPage } from "@/components/public/LandingPage"
import { HomeShell } from "./_components/HomeShell"
import { HomeSidebar } from "./_components/HomeSidebar"
import { getCachedAssignments, getCachedLessons } from "@/lib/cached-queries"
import { cookies } from "next/headers"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export const revalidate = 10; // ISR: Revalidate every 10 seconds

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
      const dbHasPrefs = !!(user.studySubject || user.userType)
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
  const assignmentsPromise  = getCachedAssignments(queryParams);
  const lessonsPromise      = getCachedLessons(queryParams);

  // Kindergarten specific data
  let flashcardsPromise = Promise.resolve([] as any[]);
  if (initialUserType === 'kindergarten' || initialUserType === 'kid' || studyAgeGroup?.toLowerCase().includes('kindergarten') || studyAgeGroup === 'KINDERGARTEN (< 6 YEARS)') {
    const { getFlashcardTopics } = await import('@/actions/flashcards-actions');
    flashcardsPromise = getFlashcardTopics().then(topics => 
      topics.filter(t => t.targetAudience === 'kindergarten' || t.targetAudience === 'kids-2-5' || t.targetAudience === 'KINDERGARTEN (< 6 YEARS)')
    );
  }

  const kindergartenGamesPromise = Promise.resolve([
    {
      id: "word-match",
      title: "Word Match",
      href: "/student/game/match-words/select?age=2-5",
      gradient: "from-blue-200 to-sky-400",
      thumbnail: "/images/games/word-match.png",
      emoji: "🐾",
      tag: "Vocabulary",
      desc: "Drag and drop English words to match the correct illustrations. Exciting vocabulary topics are waiting for you to discover!",
      comingSoon: false,
    },
    {
      id: "sentence-builder",
      title: "Sentence Builder",
      href: "/student/game/sentence-builder?age=2-5",
      gradient: "from-purple-200 to-fuchsia-400",
      thumbnail: "/images/games/sentence-builder.png",
      emoji: "🧩",
      tag: "Grammar",
      desc: "Arrange the given words into a complete sentence describing the image. Practice grammar in a fun way!",
      comingSoon: false,
    },
    {
      id: "flashcard-quiz",
      title: "Flashcard Quiz",
      href: "/student/game/flashcard-quiz/select?age=2-5",
      gradient: "from-pink-300 to-rose-500",
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
            />
          </Suspense>
        </main>
      </div>
    </HomeShell>
  )
}
