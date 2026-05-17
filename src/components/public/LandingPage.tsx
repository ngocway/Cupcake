
"use client"
import { use, useState, Suspense, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { ExerciseCard, LessonCard } from "@/components/public/ContentCards"
import { VisualCategoryMenu } from "@/components/public/VisualCategoryMenu"
import { LoadingBar } from "@/components/public/TopProgressBar"
import { useContentStore } from "@/store/useContentStore"
import { useTranslations } from "next-intl"
import { TypingText } from "@/components/public/TypingText"

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
  const t = useTranslations("home")
  const nt = useTranslations("nav")

  // Local states — switching never triggers server roundtrip
  const [activeTab,  setActiveTab]  = useState<string>(searchParams.tab  || "exercises")
  const [activeSort, setActiveSort] = useState<'newest' | 'popular'>(
    searchParams.sort === 'popular' ? 'popular' : 'newest'
  )

  // User type selection (Kids, Teens, Adults, Business)
  const [userType, setUserType] = useState<string>("adults")

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
    <div className="space-y-6 relative">
      {/* Hướng 2: Top progress bar */}
      <LoadingBar active={isFiltering} />

      {/* Solarpunk Hero Section */}
      <section className="relative pt-8 pb-2 md:pt-12 md:pb-4 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center overflow-hidden transition-all duration-1000 ease-in-out">
        <div className="lg:col-span-3 space-y-12 animate-fade-in-up h-full flex flex-col justify-center min-h-[480px] transition-all duration-1000 ease-in-out">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-8">
              <h2 className="text-xl md:text-2xl font-headline font-black text-primary leading-none tracking-tight">
                Tôi là
              </h2>
              <div className="flex flex-wrap gap-8 items-center pl-12 md:pl-20 py-4">
                {[
                  { id: 'kids', label: 'Kid', src: '/images/avatars/kid.png' },
                  { id: 'teens', label: 'Teen', src: '/images/avatars/teen.png' },
                  { id: 'adults', label: 'Adult', src: '/images/avatars/adult.png' },
                  { id: 'business', label: 'Business', src: '/images/avatars/Business man.png' },
                ].map((type) => {
                  const isActive = userType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setUserType(type.id)}
                      className={`group flex flex-col items-center gap-3 transition-all duration-500 focus:outline-none`}
                    >
                      <div className={`relative w-[100px] h-[100px] rounded-full overflow-hidden transition-all duration-500 border-[6px] ${
                        isActive 
                          ? "border-primary shadow-2xl shadow-primary/40 scale-110 rotate-3" 
                          : "border-transparent shadow-md opacity-60 group-hover:opacity-100 group-hover:border-primary/30 group-hover:scale-105 group-hover:-translate-y-2 group-hover:rotate-[-3deg]"
                      }`}>
                        <img 
                          src={type.src} 
                          alt={type.label} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <span className={`text-sm font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                        isActive ? "text-primary scale-110" : "text-primary/50 group-hover:text-primary"
                      }`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-lg md:text-xl text-primary/80 max-w-xl leading-relaxed font-black h-12 flex items-center">
              <TypingText text={t("whatToLearn")} speed={150} />
            </div>
          </div>

          <div className="pt-2">
            <Suspense fallback={
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
                ))}
              </div>
            }>
              <CategoryMenuSection promise={promises.categoryTree} />
            </Suspense>
          </div>
        </div>

        <div className="lg:col-span-2 relative animate-in zoom-in fade-in duration-1000 delay-300 transition-all duration-700 ease-in-out">
          {/* H1 moved here to the right column */}
          <h1 className="text-2xl md:text-4xl font-headline font-black text-primary leading-[1.1] tracking-tight mb-6">
            The Future of <br />
            <span className="relative inline-block px-3 py-1 mr-2">
              <span className="relative z-10 text-secondary-dim">Learning</span>
              <div className="absolute inset-0 bg-white shadow-xl shadow-primary/5 rounded-2xl -rotate-1 -z-0 border border-primary/5" />
            </span>
            is Bright.
          </h1>

          {/* Main Hero Image in Solarpunk Frame */}
          <div className="relative z-10 aspect-[4/3] rounded-[2.5rem] overflow-hidden border-[12px] border-white shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700">
            <img 
              src="https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=1200" 
              alt="Solar Learning" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Floating Eco Elements */}
          <div className="absolute -bottom-8 -right-8 z-20 w-32 h-32 text-primary/40 animate-leaf-sway">
            <span className="material-symbols-outlined !text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
          <div className="absolute -top-12 -left-8 z-0 w-24 h-24 bg-secondary/20 blur-3xl rounded-full" />
          
          {/* Small Bird Mascot Placeholder */}
          <div className="absolute -top-10 right-10 z-20 animate-float">
            <div className="w-16 h-16 bg-sky-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white">flutter_dash</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tab + Sort controls */}
      <div id="content-tabs" className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10">
        <div className="inline-flex items-center gap-4">
          <button
            onClick={() => handleTabChange("exercises")}
            className={`px-10 py-4 rounded-[1.75rem] text-sm font-black transition-all duration-500 ease-out border-2 ${
              activeTab === "exercises"
                ? "bg-secondary border-secondary text-on-secondary shadow-lg shadow-secondary/20 scale-[1.03] translate-y-[-2px]"
                : "bg-white border-primary/10 text-on-surface-variant hover:text-primary hover:border-primary/40 shadow-sm"
            }`}
          >
            {nt("assignments").toUpperCase()}
          </button>
          <button
            onClick={() => handleTabChange("lessons")}
            className={`px-10 py-4 rounded-[1.75rem] text-sm font-black transition-all duration-500 ease-out border-2 ${
              activeTab === "lessons"
                ? "bg-primary border-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.03] translate-y-[-2px]"
                : "bg-white border-primary/10 text-on-surface-variant hover:text-primary hover:border-primary/40 shadow-sm"
            }`}
          >
            {nt("lessons").toUpperCase()}
          </button>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/50 border border-outline/10 backdrop-blur-sm">
          {(["newest", "popular"] as const).map(s => (
            <button
              key={s}
              onClick={() => handleSortChange(s)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-[0.2em] ${
                activeSort === s
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-slate-400 hover:text-primary hover:bg-primary/5"
              }`}
            >
              {s === "newest" ? t("newest") : t("popular")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content grids ───────────────────────────────────────────────────── */}
      <div className={`min-h-[600px] relative transition-opacity duration-300 ${isFiltering ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
        {isFiltering && (
          <div className="absolute top-0 right-0 z-10 flex items-center gap-2 px-4 py-2 glass rounded-2xl shadow-lg animate-in fade-in duration-200">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-tiny font-bold text-on-surface-variant">{t("filtering")}</span>
          </div>
        )}

        <div className={activeTab === "exercises" ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          {activeSort === "newest" ? (
            <Suspense fallback={<SectionSkeleton />}>
              <ExerciseNewestList promise={promises.assignments} isLoggedIn={isLoggedIn} />
            </Suspense>
          ) : (
            <ExercisePopularList isLoggedIn={isLoggedIn} />
          )}
        </div>

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
