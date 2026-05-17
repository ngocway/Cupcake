
import { Suspense } from "react"
import { LandingPage } from "@/components/public/LandingPage"
import { HomeShell } from "./_components/HomeShell"
import { HomeSidebar } from "./_components/HomeSidebar"
import { getCachedCategoryTree, getCachedAssignments, getCachedLessons } from "@/lib/cached-queries"
import { cookies } from "next/headers"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export const revalidate = 10; // ISR: Revalidate every 10 seconds

export default async function HomePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;

  const cookieStore = await cookies()
  let initialUserType = cookieStore.get("user_type")?.value || "adults"

  const session = await auth()
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ 
      where: { id: session.user.id },
      select: { userType: true }
    })
    if (user?.userType) {
      initialUserType = user.userType
    }
  }

  // FAST FIRST LOAD: Only fetch newest variants on the server.
  // Popular data is pre-fetched client-side in the background (via /api/feed)
  // after the page has already rendered — so sort switching feels instant
  // without slowing down the initial page load.
  const assignmentsPromise  = getCachedAssignments(params);
  const lessonsPromise      = getCachedLessons(params);
  const categoryTreePromise = getCachedCategoryTree();

  return (
    <HomeShell>
      <div className="w-full pt-24 pb-20 flex flex-col lg:flex-row items-start gap-10 px-6 md:px-10 max-w-[1600px] mx-auto">
        <HomeSidebar searchParams={params} />

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
                categoryTree: categoryTreePromise,
              }}
              searchParams={params}
              initialUserType={initialUserType}
            />
          </Suspense>
        </main>
      </div>
    </HomeShell>
  )
}
