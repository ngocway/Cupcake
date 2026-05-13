
"use client"
import { use, useState, Suspense, useEffect, useTransition } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { ExerciseCard, LessonCard } from "@/components/public/ContentCards"
import { VisualCategoryMenu } from "@/components/public/VisualCategoryMenu"
import { LoadingBar } from "@/components/public/TopProgressBar"
import { useContentStore } from "@/store/useContentStore"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  promises: {
    assignments: Promise<{ items: any[], total: number }>
    lessons:     Promise<{ items: any[], total: number }>
    categoryTree: Promise<any[]>
  }
  searchParams: any
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="space-y-4">
          <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  )
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategoryMenuSection({ promise }: { promise: Promise<any[]> }) {
  const categoryTree = use(promise)
  return <VisualCategoryMenu categoryTree={categoryTree} />
}

// ─── Newest content lists (rendered via use() — fast, no extra round-trips) ──

function ExerciseNewestList({
  promise,
  isLoggedIn,
}: {
  promise: Promise<{ items: any[] }>
  isLoggedIn: boolean
}) {
  const { items } = use(promise)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {items.map((ex: any) => (
        <ExerciseCard key={ex.id} item={ex} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}

function LessonNewestList({
  promise,
  isLoggedIn,
}: {
  promise: Promise<{ items: any[] }>
  isLoggedIn: boolean
}) {
  const { items } = use(promise)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {items.map((le: any) => (
        <LessonCard key={le.id} item={le} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}

// ─── Popular content lists (rendered from Zustand store) ─────────────────────

function ExercisePopularList({ isLoggedIn }: { isLoggedIn: boolean }) {
  const items = useContentStore(s => s.popularExercises)
  const ready = useContentStore(s => s.popularExercisesReady)
  if (!ready) return <SectionSkeleton />
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {items.map((ex: any) => (
        <ExerciseCard key={ex.id} item={ex} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}

function LessonPopularList({ isLoggedIn }: { isLoggedIn: boolean }) {
  const items = useContentStore(s => s.popularLessons)
  const ready = useContentStore(s => s.popularLessonsReady)
  if (!ready) return <SectionSkeleton />
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {items.map((le: any) => (
        <LessonCard key={le.id} item={le} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LandingPage({ promises, searchParams }: Props) {
  const currentParams = useSearchParams()
  const { data: session } = useSession()
  const isLoggedIn = !!session

  // Local states — switching never triggers server roundtrip
  const [activeTab,  setActiveTab]  = useState<string>(searchParams.tab  || "exercises")
  const [activeSort, setActiveSort] = useState<'newest' | 'popular'>(
    searchParams.sort === 'popular' ? 'popular' : 'newest'
  )

  const setPopularExercises = useContentStore(s => s.setPopularExercises)
  const setPopularLessons   = useContentStore(s => s.setPopularLessons)
  const isFiltering         = useContentStore(s => s.isFiltering)

  // ── Background prefetch: fire-and-forget after page renders ────────────────
  useEffect(() => {
    const qs = new URLSearchParams()
    if (searchParams.categoryId) qs.set('categoryId', searchParams.categoryId)
    if (searchParams.search)     qs.set('search',     searchParams.search)
    const base = qs.toString() ? `&${qs}` : ''

    fetch(`/api/feed?type=exercises${base}`)
      .then(r => r.json())
      .then(data => setPopularExercises(data.items))
      .catch(() => {}) // silent fail — popular is a bonus, not critical

    fetch(`/api/feed?type=lessons${base}`)
      .then(r => r.json())
      .then(data => setPopularLessons(data.items))
      .catch(() => {})
  }, [searchParams.categoryId, searchParams.search]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync URL → state (e.g. browser Back button) ───────────────────────────
  useEffect(() => {
    const tab  = currentParams.get("tab")
    const sort = currentParams.get("sort") as 'newest' | 'popular' | null
    if (tab  && tab  !== activeTab)  setActiveTab(tab)
    if (sort && sort !== activeSort) setActiveSort(sort === 'popular' ? 'popular' : 'newest')
  }, [currentParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab / sort handlers — no server roundtrip ─────────────────────────────
  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    const p = new URLSearchParams(window.location.search)
    p.set("tab", tab)
    window.history.pushState(null, "", `?${p.toString()}`)
  }

  const handleSortChange = (sort: 'newest' | 'popular') => {
    if (sort === activeSort) return
    setActiveSort(sort)
    const p = new URLSearchParams(window.location.search)
    p.set("sort", sort)
    window.history.pushState(null, "", `?${p.toString()}`)
  }

  return (
    <div className="space-y-12 relative">
      {/* Hướng 2: Top progress bar */}
      <LoadingBar active={isFiltering} />

      {/* Category menu */}
      <Suspense fallback={
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      }>
        <CategoryMenuSection promise={promises.categoryTree} />
      </Suspense>

      {/* Tab + Sort controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="inline-flex p-1.5 glass rounded-[28px] items-center shadow-lg bg-white/50 dark:bg-slate-900/50">
          <button
            onClick={() => handleTabChange("exercises")}
            className={`px-8 py-3.5 rounded-[24px] text-small font-black transition-all duration-300 ${
              activeTab === "exercises"
                ? "bg-primary text-on-primary shadow-xl shadow-primary/30 scale-[1.05]"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            BÀI TẬP
          </button>
          <button
            onClick={() => handleTabChange("lessons")}
            className={`px-8 py-3.5 rounded-[24px] text-small font-black transition-all duration-300 ${
              activeTab === "lessons"
                ? "bg-secondary text-on-secondary shadow-xl shadow-secondary/30 scale-[1.05]"
                : "text-on-surface-variant hover:text-secondary"
            }`}
          >
            BÀI HỌC
          </button>
        </div>

        <div className="flex items-center gap-3 glass p-1.5 rounded-2xl bg-white/50 dark:bg-slate-900/50">
          {(["newest", "popular"] as const).map(s => (
            <button
              key={s}
              onClick={() => handleSortChange(s)}
              className={`px-5 py-2.5 rounded-xl text-tiny font-black transition-all uppercase tracking-widest ${
                activeSort === s
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {s === "newest" ? "Mới nhất" : "Phổ biến"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content grids ───────────────────────────────────────────────────── */}
      {/* Hướng 4: Overlay mờ khi đang filter (Optimistic UI) */}
      <div className={`min-h-[600px] relative transition-opacity duration-300 ${isFiltering ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
        {/* Spinner góc trên phải grid khi loading */}
        {isFiltering && (
          <div className="absolute top-0 right-0 z-10 flex items-center gap-2 px-4 py-2 glass rounded-2xl shadow-lg animate-in fade-in duration-200">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-tiny font-bold text-on-surface-variant">Đang lọc...</span>
          </div>
        )}

        {/* EXERCISES TAB */}
        <div className={activeTab === "exercises" ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          {activeSort === "newest" ? (
            <Suspense fallback={<SectionSkeleton />}>
              <ExerciseNewestList promise={promises.assignments} isLoggedIn={isLoggedIn} />
            </Suspense>
          ) : (
            <ExercisePopularList isLoggedIn={isLoggedIn} />
          )}
        </div>

        {/* LESSONS TAB */}
        <div className={activeTab === "lessons" ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          {activeSort === "newest" ? (
            <Suspense fallback={<SectionSkeleton />}>
              <LessonNewestList promise={promises.lessons} isLoggedIn={isLoggedIn} />
            </Suspense>
          ) : (
            <LessonPopularList isLoggedIn={isLoggedIn} />
          )}
        </div>
      </div>
    </div>
  )
}
