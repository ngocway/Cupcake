
"use client"
import { use, useState, Suspense, useTransition, useEffect, useDeferredValue } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ExerciseCard, LessonCard } from "@/components/public/ContentCards"
import { VisualCategoryMenu } from "@/components/public/VisualCategoryMenu"
import { LoadingBar } from "@/components/public/TopProgressBar"
import { useContentStore } from "@/store/useContentStore"

interface Props {
  promises: {
    assignments: Promise<{ items: any[], total: number }>
    lessons: Promise<{ items: any[], total: number }>
    categoryTree: Promise<any[]>
  }
  searchParams: any
}

function CategoryMenuSection({ promise }: { promise: Promise<any[]> }) {
  const categoryTree = use(promise)
  return <VisualCategoryMenu categoryTree={categoryTree} />
}

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

function ExerciseList({ promise, isLoggedIn }: { promise: Promise<any>, isLoggedIn: boolean }) {
  const data = use(promise)
  const deferredItems = useDeferredValue(data.items)
  const setExercises = useContentStore(s => s.setExercises)
  
  useEffect(() => {
    if (data.items.length > 0) setExercises(data.items)
  }, [data, setExercises])

  const storeItems = useContentStore(s => s.exercises)
  const itemsToRender = deferredItems.length > 0 ? deferredItems : storeItems

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {itemsToRender.map((ex: any) => (
        <ExerciseCard key={ex.id} item={ex} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}

function LessonList({ promise, isLoggedIn }: { promise: Promise<any>, isLoggedIn: boolean }) {
  const data = use(promise)
  const deferredItems = useDeferredValue(data.items)
  const setLessons = useContentStore(s => s.setLessons)

  useEffect(() => {
    if (data.items.length > 0) setLessons(data.items)
  }, [data, setLessons])

  const storeItems = useContentStore(s => s.lessons)
  const itemsToRender = deferredItems.length > 0 ? deferredItems : storeItems

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {itemsToRender.map((le: any) => (
        <LessonCard key={le.id} item={le} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}

export function LandingPage({ promises, searchParams }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const currentParams = useSearchParams()
  const { data: session } = useSession()
  const isLoggedIn = !!session
  const [isPending, startTransition] = useTransition()

  // 1. Local state for instant UI response
  const [activeTab, setActiveTab] = useState(searchParams.tab || "exercises")
  const sort = searchParams.sort || "newest"

  // Synchronize state if URL changes from outside (e.g. Back button)
  useEffect(() => {
    const tab = currentParams.get("tab")
    if (tab && tab !== activeTab) setActiveTab(tab)
  }, [currentParams, activeTab])

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return
    
    // 2. ULTRA-FAST: Update local state immediately (0ms)
    setActiveTab(tab)
    
    // 3. Sync URL using pushState (prevents Next.js Server roundtrip)
    const newParams = new URLSearchParams(window.location.search)
    newParams.set("tab", tab)
    window.history.pushState(null, "", `?${newParams.toString()}`)
    
    // We DON'T use router.push here to avoid the server-side re-render of the whole page payload
    // because we already have the data for both tabs pre-fetched.
  }

  const setSort = (s: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set("sort", s)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="space-y-12 relative">
      <LoadingBar active={isPending} />

      <Suspense fallback={
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      }>
        <CategoryMenuSection promise={promises.categoryTree} />
      </Suspense>

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
          {["newest", "popular"].map((s) => (
            <button
              key={s}
              disabled={isPending}
              onClick={() => setSort(s)}
              className={`px-5 py-2.5 rounded-xl text-tiny font-black transition-all uppercase tracking-widest ${
                sort === s ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-400 hover:text-slate-600"
              } ${isPending ? "opacity-50" : ""}`}
            >
              {s === "newest" ? "Mới nhất" : "Phổ biến"}
            </button>
          ))}
        </div>
      </div>

      <div className={`min-h-[600px] relative`}>
        {/* EXERCISES TAB */}
        <div className={activeTab === "exercises" ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          <Suspense fallback={<SectionSkeleton />}>
            <ExerciseList promise={promises.assignments} isLoggedIn={isLoggedIn} />
          </Suspense>
        </div>

        {/* LESSONS TAB */}
        <div className={activeTab === "lessons" ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          <Suspense fallback={<SectionSkeleton />}>
            <LessonList promise={promises.lessons} isLoggedIn={isLoggedIn} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
