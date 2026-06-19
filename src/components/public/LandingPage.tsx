"use client"
import { use, useState, Suspense, useEffect, useTransition, useMemo, memo, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { ExerciseCard, LessonCard } from "@/components/public/ContentCards"
import { VisualCategoryMenu } from "@/components/public/VisualCategoryMenu"
import { LoadingBar } from "@/components/public/TopProgressBar"
import { useContentStore } from "@/store/useContentStore"
import { useTranslations, useLocale } from "next-intl"
import { TypingText } from "@/components/public/TypingText"
import { updateAllPreferences, getOnboardingConfig } from "@/actions/user-preferences-actions"
import { X, SlidersHorizontal } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  promises: {
    assignments: Promise<{ items: any[], total: number }>
    lessons:     Promise<{ items: any[], total: number }>
    categoryTree?: Promise<any[]>
    flashcards?: Promise<any[]>
    kindergartenGames?: Promise<any[]>
  }
  searchParams: any
  initialUserType?: string
  hasUserPreference?: boolean
  initialStudySubject?: string
  initialStudyAgeGroup?: string
  initialStudyLevel?: string
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="relative min-h-[400px] w-full">
      {/* Centered spinner loading */}
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-md" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 animate-pulse opacity-50">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="group flex flex-col h-full rounded-2xl relative">
            <div className="w-full aspect-video rounded-3xl overflow-hidden relative shadow-lg bg-secondary/10" />
            <div className="relative -mt-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-lg p-6 shadow-2xl z-20 border border-secondary/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-secondary/20" />
                <div className="h-3 w-20 bg-secondary/20 rounded" />
              </div>
              <div className="h-6 w-full bg-secondary/20 rounded mb-2" />
              <div className="h-6 w-2/3 bg-secondary/20 rounded mb-6" />
              <div className="flex items-center justify-between pt-5 border-t border-secondary/5">
                <div className="flex gap-2">
                  <div className="h-4 w-12 bg-secondary/20 rounded" />
                  <div className="h-4 w-12 bg-secondary/20 rounded" />
                </div>
                <div className="h-6 w-16 bg-secondary/20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptySearchState({ keyword, onClear }: { keyword: string, onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative w-48 h-48 mb-8">
        <img src="/images/bird.png" alt="No results" className="w-full h-full object-contain drop-shadow-xl opacity-60 grayscale" />
      </div>
      <h3 className="text-2xl font-headline font-black text-primary mb-3">Oops! No results found.</h3>
      <p className="text-on-surface-variant max-w-md mx-auto mb-8">
        We couldn't find any content matching <strong className="text-primary">"{keyword}"</strong>. Please check your spelling or try different keywords.
      </p>
    </div>
  )
}

// ─── Content lists (rendered via use() — fast, no extra round-trips) ──

const ExerciseList = memo(function ExerciseList({
  promise,
  isLoggedIn,
  searchKeyword,
  onClear,
  searchParams
}: {
  promise: Promise<{ items: any[], hasMore?: boolean }>
  isLoggedIn: boolean
  searchKeyword?: string
  onClear: () => void
  searchParams: any
}) {
  const { items: serverItems, hasMore: serverHasMore } = use(promise)
  
  const exercises = useContentStore(s => s.exercises)
  const setExercises = useContentStore(s => s.setExercises)
  const addExercises = useContentStore(s => s.addExercises)
  const hasMoreEx = useContentStore(s => s.hasMoreEx)
  const setHasMoreEx = useContentStore(s => s.setHasMoreEx)
  const exPage = useContentStore(s => s.exPage)
  const setExPage = useContentStore(s => s.setExPage)
  const userType = useContentStore(s => s.userType)
  const studySubject = useContentStore(s => (s as any).studySubject)
  const studyLevel = useContentStore(s => (s as any).studyLevel)
  
  const initializedKey = useRef('')
  const goalParam = searchParams.goal || searchParams.categoryId || ''
  const currentKey = `ex-${goalParam}-${userType}-${studySubject}-${studyLevel}-${searchKeyword || ''}`

  useEffect(() => {
    if (initializedKey.current !== currentKey) {
      setExercises(serverItems)
      setHasMoreEx(serverHasMore ?? serverItems.length >= 12)
      setExPage(1)
      initializedKey.current = currentKey
    }
  }, [currentKey, serverItems, serverHasMore, setExercises, setHasMoreEx, setExPage])

  const displayItems = initializedKey.current === currentKey ? exercises : serverItems

  const bottomRef = useRef<HTMLDivElement>(null)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreEx && !isFetchingMore && initializedKey.current === currentKey) {
        setIsFetchingMore(true)
        const nextPage = exPage + 1
        
        const qs = new URLSearchParams()
        qs.set('type', 'exercises')
        qs.set('page', nextPage.toString())
        if (searchParams.goal) qs.set('goal', searchParams.goal)
        else if (searchParams.categoryId) qs.set('goal', searchParams.categoryId)
        if (searchKeyword) qs.set('search', searchKeyword)
        if (userType) qs.set('userType', userType)
        if (studySubject) qs.set('subject', studySubject)
        if (studyLevel) qs.set('level', studyLevel)

        fetch(`/api/feed?${qs.toString()}`)
          .then(r => r.json())
          .then(data => {
            if (data.items) {
              addExercises(data.items)
              setHasMoreEx(data.hasMore ?? data.items.length >= 12)
              setExPage(nextPage)
            }
          })
          .catch(e => console.error(e))
          .finally(() => setIsFetchingMore(false))
      }
    }, { threshold: 0.1, rootMargin: "400px" })

    if (bottomRef.current) observer.observe(bottomRef.current)
    return () => observer.disconnect()
  }, [hasMoreEx, isFetchingMore, exPage, searchParams, userType, studySubject, studyLevel, searchKeyword, currentKey, addExercises, setHasMoreEx, setExPage])

  if (displayItems.length === 0 && searchKeyword) return <EmptySearchState keyword={searchKeyword} onClear={onClear} />
  if (displayItems.length === 0) return <div className="text-center py-20 text-primary/50 font-bold">No content available.</div>

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {displayItems.map((ex: any) => (
          <ExerciseCard key={ex.id} item={ex} isLoggedIn={isLoggedIn} />
        ))}
      </div>
      {hasMoreEx && (
        <div ref={bottomRef} className="w-full flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </>
  )
});

const LessonList = memo(function LessonList({
  promise,
  isLoggedIn,
  searchKeyword,
  onClear,
  searchParams
}: {
  promise: Promise<{ items: any[], hasMore?: boolean }>
  isLoggedIn: boolean
  searchKeyword?: string
  onClear: () => void
  searchParams: any
}) {
  const { items: serverItems, hasMore: serverHasMore } = use(promise)
  
  const lessons = useContentStore(s => s.lessons)
  const setLessons = useContentStore(s => s.setLessons)
  const addLessons = useContentStore(s => s.addLessons)
  const hasMoreLe = useContentStore(s => s.hasMoreLe)
  const setHasMoreLe = useContentStore(s => s.setHasMoreLe)
  const lePage = useContentStore(s => s.lePage)
  const setLePage = useContentStore(s => s.setLePage)
  const userType = useContentStore(s => s.userType)
  const studySubject = useContentStore(s => (s as any).studySubject)
  const studyLevel = useContentStore(s => (s as any).studyLevel)
  
  const initializedKey = useRef('')
  const goalParam = searchParams.goal || searchParams.categoryId || ''
  const currentKey = `le-${goalParam}-${userType}-${studySubject}-${studyLevel}-${searchKeyword || ''}`

  useEffect(() => {
    if (initializedKey.current !== currentKey) {
      setLessons(serverItems)
      setHasMoreLe(serverHasMore ?? serverItems.length >= 12)
      setLePage(1)
      initializedKey.current = currentKey
    }
  }, [currentKey, serverItems, serverHasMore, setLessons, setHasMoreLe, setLePage])

  const displayItems = initializedKey.current === currentKey ? lessons : serverItems

  const bottomRef = useRef<HTMLDivElement>(null)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreLe && !isFetchingMore && initializedKey.current === currentKey) {
        setIsFetchingMore(true)
        const nextPage = lePage + 1
        
        const qs = new URLSearchParams()
        qs.set('type', 'lessons')
        qs.set('page', nextPage.toString())
        if (searchParams.goal) qs.set('goal', searchParams.goal)
        else if (searchParams.categoryId) qs.set('goal', searchParams.categoryId)
        if (searchKeyword) qs.set('search', searchKeyword)
        if (userType) qs.set('userType', userType)
        if (studySubject) qs.set('subject', studySubject)
        if (studyLevel) qs.set('level', studyLevel)

        fetch(`/api/feed?${qs.toString()}`)
          .then(r => r.json())
          .then(data => {
            if (data.items) {
              addLessons(data.items)
              setHasMoreLe(data.hasMore ?? data.items.length >= 12)
              setLePage(nextPage)
            }
          })
          .catch(e => console.error(e))
          .finally(() => setIsFetchingMore(false))
      }
    }, { threshold: 0.1, rootMargin: "400px" })

    if (bottomRef.current) observer.observe(bottomRef.current)
    return () => observer.disconnect()
  }, [hasMoreLe, isFetchingMore, lePage, searchParams, userType, studySubject, studyLevel, searchKeyword, currentKey, addLessons, setHasMoreLe, setLePage])

  if (displayItems.length === 0 && searchKeyword) return <EmptySearchState keyword={searchKeyword} onClear={onClear} />
  if (displayItems.length === 0) return <div className="text-center py-20 text-primary/50 font-bold">No content available.</div>

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {displayItems.map((le: any) => (
          <LessonCard key={le.id} item={le} isLoggedIn={isLoggedIn} />
        ))}
      </div>
      {hasMoreLe && (
        <div ref={bottomRef} className="w-full flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </>
  )
});

const cardBackgroundStyles = [
  {
    bg: "bg-amber-100/75 dark:bg-amber-950/20",
    circles: [
      { className: "absolute -top-12 -right-12 w-28 h-28 bg-amber-300/60 dark:bg-amber-500/20 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-24 h-24 bg-orange-200/60 dark:bg-orange-600/20 rounded-full blur-xl" }
    ],
    borderHover: "hover:border-amber-400",
    bgHover: "hover:bg-amber-100/90"
  },
  {
    bg: "bg-pink-100/75 dark:bg-pink-950/20",
    circles: [
      { className: "absolute -top-12 -right-12 w-28 h-28 bg-pink-300/60 dark:bg-pink-500/20 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-24 h-24 bg-purple-200/60 dark:bg-purple-600/20 rounded-full blur-xl" }
    ],
    borderHover: "hover:border-pink-400",
    bgHover: "hover:bg-pink-100/90"
  },
  {
    bg: "bg-sky-100/75 dark:bg-sky-950/20",
    circles: [
      { className: "absolute -top-12 -right-12 w-28 h-28 bg-sky-300/60 dark:bg-sky-500/20 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-24 h-24 bg-teal-200/60 dark:bg-teal-600/20 rounded-full blur-xl" }
    ],
    borderHover: "hover:border-sky-400",
    bgHover: "hover:bg-sky-100/90"
  },
  {
    bg: "bg-emerald-100/75 dark:bg-emerald-950/20",
    circles: [
      { className: "absolute -top-12 -right-12 w-28 h-28 bg-emerald-300/60 dark:bg-emerald-500/20 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-24 h-24 bg-green-200/60 dark:bg-green-600/20 rounded-full blur-xl" }
    ],
    borderHover: "hover:border-emerald-400",
    bgHover: "hover:bg-emerald-100/90"
  },
  {
    bg: "bg-rose-100/75 dark:bg-rose-950/20",
    circles: [
      { className: "absolute -top-12 -right-12 w-28 h-28 bg-rose-300/60 dark:bg-rose-500/20 rounded-full blur-xl animate-pulse" },
      { className: "absolute -bottom-8 -left-8 w-24 h-24 bg-orange-200/50 dark:bg-orange-500/20 rounded-full blur-xl" }
    ],
    borderHover: "hover:border-rose-400",
    bgHover: "hover:bg-rose-100/90"
  }
];

const FlashcardTopicList = memo(function FlashcardTopicList({ promise }: { promise?: Promise<any[]> }) {
  if (!promise) return null;
  const items = use(promise);
  if (!items || items.length === 0) return <div className="text-center py-20 text-primary/50 font-bold">No flashcards available.</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((topic, idx) => {
        const style = cardBackgroundStyles[idx % cardBackgroundStyles.length];
        return (
          <div
            key={topic.id}
            onClick={() => window.location.href = `/flashcards?topic=${topic.id}`}
            className={`group p-5 rounded-[36px] border-4 border-slate-200 dark:border-slate-700 ${style.bg} cursor-pointer transition-all duration-500 shadow-sm hover:shadow-2xl hover:scale-[1.02] ${style.borderHover} ${style.bgHover} flex flex-col justify-between h-40 relative overflow-hidden`}
          >
            {/* Ambient Bubbly Blurs inside card */}
            {style.circles.map((c, cIdx) => (
              <div key={cIdx} className={c.className} />
            ))}

            {topic.iconUrl ? (
              topic.iconUrl.startsWith("http") || topic.iconUrl.startsWith("/") ? (
                <img 
                  src={topic.iconUrl} 
                  alt="" 
                  className="absolute -bottom-4 -right-4 w-28 h-28 object-cover opacity-[0.06] transform rotate-12 transition-transform duration-500 group-hover:scale-125 select-none pointer-events-none" 
                />
              ) : (
                <span className="absolute -bottom-4 -right-4 text-7xl opacity-[0.06] transform rotate-12 transition-transform duration-500 group-hover:scale-125 select-none pointer-events-none">
                  {topic.iconUrl}
                </span>
              )
            ) : (
              <span className="absolute -bottom-4 -right-4 text-7xl opacity-[0.06] transform rotate-12 transition-transform duration-500 group-hover:scale-125 select-none pointer-events-none">
                🧸
              </span>
            )}

            {/* Top row: Title (left) & Icon (right) */}
            <div className="flex justify-between items-center gap-4 w-full relative z-10">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight break-words flex-1">
                {topic.name}
              </h3>
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-4xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-sm overflow-hidden relative z-10 shrink-0">
                {topic.iconUrl ? (
                  topic.iconUrl.startsWith("http") || topic.iconUrl.startsWith("/") ? (
                    <img src={topic.iconUrl} alt={topic.name} className="w-full h-full object-cover" />
                  ) : (
                    topic.iconUrl
                  )
                ) : (
                  "🧸"
                )}
              </div>
            </div>

            {/* Bottom row: Card count */}
            <div className="w-full relative z-10 mt-auto">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                {topic._count?.flashcards ?? 0} Cards
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
});

const KindergartenGameList = memo(function KindergartenGameList({ promise }: { promise?: Promise<any[]> }) {
  if (!promise) return null;
  const items = use(promise);
  if (!items || items.length === 0) return <div className="text-center py-20 text-primary/50 font-bold">No games available.</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((game) => (
        <div 
          key={game.id} 
          onClick={() => window.location.href = game.href}
          className="group cursor-pointer"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col h-full transform hover:-translate-y-2">
            <div className={`aspect-video relative overflow-hidden flex items-center justify-center ${!game.thumbnail ? `bg-gradient-to-br ${game.gradient} p-6` : ''}`}>
              {game.thumbnail ? (
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                  <div className="relative z-20 flex flex-col items-center justify-center space-y-2">
                    <div className="text-6xl animate-bounce">{game.emoji}</div>
                    <h3 className="text-3xl font-black text-white text-center drop-shadow-md">{game.title}</h3>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -ml-10 -mb-10" />
                </>
              )}
              {/* Title overlay on thumbnail */}
              {game.thumbnail && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-5 z-10">
                  <h3 className="text-2xl font-black text-white drop-shadow-lg">{game.title}</h3>
                </div>
              )}
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider">
                    {game.tag}
                  </span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-wider">
                    Kids
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 group-hover:text-primary transition-colors">
                  {game.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {game.desc}
                </p>
              </div>
              <div className="mt-6 flex items-center text-primary font-black text-sm uppercase tracking-widest gap-2 group-hover:translate-x-2 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play w-5 h-5 fill-primary"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                Play Now
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
});

export function LandingPage({ promises, searchParams, initialUserType = "learner", hasUserPreference = false, initialStudySubject = "", initialStudyAgeGroup = "", initialStudyLevel = "" }: Props) {
  const currentParams = useSearchParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isLoggedIn = !!session
  const t = useTranslations("home")
  const nt = useTranslations("nav")
  const locale = useLocale()

  // Local states — switching tab never triggers server roundtrip
  const [activeTab,  setActiveTab]  = useState<string>(searchParams.tab  || "lessons")


  // Store states and actions
  const userType            = useContentStore(s => s.userType)
  const setUserType         = useContentStore(s => s.setUserType)
  
  const studySubject        = useContentStore(s => (s as any).studySubject)
  const setStudySubject     = useContentStore(s => (s as any).setStudySubject)
  const studyAgeGroup       = useContentStore(s => (s as any).studyAgeGroup)
  const setStudyAgeGroup    = useContentStore(s => (s as any).setStudyAgeGroup)
  const studyLevel          = useContentStore(s => (s as any).studyLevel)
  const setStudyLevel       = useContentStore(s => (s as any).setStudyLevel)

  const nativeLanguage      = useContentStore(s => s.nativeLanguage)

  const currentAgeGroup = studyAgeGroup || initialStudyAgeGroup || "";
  const isKindergarten = 
    currentAgeGroup.toLowerCase().includes("kindergarten") || 
    currentAgeGroup.toLowerCase().includes("kindergarden") || 
    currentAgeGroup === "KINDERGARTEN (< 6 YEARS)" ||
    currentAgeGroup === "kids-2-5";
  useEffect(() => {
    if (isKindergarten) {
       if (activeTab === "lessons" || activeTab === "exercises") {
         setActiveTab("flashcards");
       }
     } else {
       if (activeTab === "flashcards" || activeTab === "games") {
         setActiveTab("lessons");
       }
     }
  }, [isKindergarten, activeTab]);

  const setNativeLanguage   = useContentStore(s => s.setNativeLanguage)
  const selectedCategoryId  = useContentStore(s => s.selectedCategoryId)
  const setSelectedCategoryId = useContentStore(s => s.setSelectedCategoryId)
  const selectedSubCategoryId = useContentStore(s => s.selectedSubCategoryId)
  const setSelectedSubCategoryId = useContentStore(s => s.setSelectedSubCategoryId)

  const isFiltering         = useContentStore(s => s.isFiltering)
  const setFiltering        = useContentStore(s => s.setFiltering)

  // Sync initial userType and study preferences
  useEffect(() => {
    if (initialUserType) {
      setUserType(initialUserType);
    }
    if (initialStudySubject) {
      setStudySubject(initialStudySubject);
    }
    if (initialStudyAgeGroup) {
      setStudyAgeGroup(initialStudyAgeGroup);
    }
    if (initialStudyLevel) {
      setStudyLevel(initialStudyLevel);
    }
    const savedLang = localStorage.getItem("cupcakes_native_language");
    if (savedLang) {
      setNativeLanguage(savedLang);
    }
  }, [initialUserType, initialStudySubject, initialStudyAgeGroup, initialStudyLevel, setUserType, setStudySubject, setStudyAgeGroup, setStudyLevel, setNativeLanguage]);

  // Sync URL goal → store selectedCategoryId / selectedSubCategoryId (used as goal compatibility bridge)
  const urlGoal = currentParams.get("goal") || currentParams.get("categoryId") || "";

  // Restore preferred goal from localStorage if visiting root without category/goal
  useEffect(() => {
    const rawUrlGoal = currentParams.get("goal") || currentParams.get("categoryId");
    if (rawUrlGoal === null) {
      const savedGoalId = localStorage.getItem("cupcakes_preferred_goal_id") || localStorage.getItem("cupcakes_preferred_category_id");
      if (savedGoalId) {
        const qs = new URLSearchParams(window.location.search);
        qs.set("goal", savedGoalId);
        router.replace(`/?${qs.toString()}`, { scroll: false });
      }
    }
  }, [currentParams, router]);

  // Local config state populated in useEffect
  const [onboardingConfig, setOnboardingConfig] = useState<any>(null)

  useEffect(() => {
    getOnboardingConfig().then(config => {
      if (config) setOnboardingConfig(config)
    })
  }, [])

  useEffect(() => {
    setSelectedCategoryId(urlGoal);
    setSelectedSubCategoryId("");
  }, [urlGoal, setSelectedCategoryId, setSelectedSubCategoryId]);

  const activeGoalName = useMemo(() => {
    if (!urlGoal || !onboardingConfig) return "";
    const subjectData = onboardingConfig.subjects?.find((s: any) => s.id === studySubject);
    const ageGroupData = subjectData?.ageGroups?.find((a: any) => a.id === studyAgeGroup);
    const goalData = ageGroupData?.goals?.find((g: any) => g.id === urlGoal);
    return goalData ? goalData.label : "";
  }, [onboardingConfig, studySubject, studyAgeGroup, urlGoal]);

  // Cleanup obsolete/invalid goals (e.g. leftovers from previous Category model)
  useEffect(() => {
    if (onboardingConfig && urlGoal && urlGoal !== "all" && !activeGoalName) {
      console.warn(`Obsolete/invalid goal detected: ${urlGoal}. Resetting to all.`);
      localStorage.removeItem("cupcakes_preferred_goal_id");
      localStorage.removeItem("cupcakes_preferred_category_id");
      const qs = new URLSearchParams(window.location.search);
      qs.delete("goal");
      qs.delete("categoryId");
      router.replace(`/?${qs.toString()}`, { scroll: false });
    }
  }, [onboardingConfig, urlGoal, activeGoalName, router]);

  // Extract display names of category and sub-category for the homepage sentence summary
  const activeNames = useMemo(() => {
    return { categoryName: activeGoalName, subCategoryName: "" };
  }, [activeGoalName]);

  // Avatar lookup map for landing page summary
  const avatarMap: Record<string, { label: string; src: string }> = {
    kindergarten: { label: "KINDERGARTEN", src: "/images/avatars/kid.png" },
    kid: { label: "KID", src: "/images/avatars/kid.png" },
    teen: { label: "TEEN", src: "/images/avatars/teen.png" },
    learner: { label: "LEARNER", src: "/images/avatars/adult.png" },
  };
  const activeAvatar = avatarMap[userType] || avatarMap.learner;


  // Modal local staging states
  const isFilterModalOpen = useContentStore(s => (s as any).isFilterModalOpen)
  const setIsFilterModalOpen = useContentStore(s => (s as any).setFilterModalOpen)
  const [hasAutoOpened, setHasAutoOpened] = useState(false)
  const [tempUserType, setTempUserType] = useState(userType)
  const [tempNativeLanguage, setTempNativeLanguage] = useState(nativeLanguage)
  const [tempCategoryId, setTempCategoryId] = useState(selectedCategoryId)
  const [tempSubCategoryId, setTempSubCategoryId] = useState(selectedSubCategoryId)

  const [tempStudySubject, setTempStudySubject] = useState(studySubject)
  const [tempStudyAgeGroup, setTempStudyAgeGroup] = useState(studyAgeGroup)
  const [tempStudyLevel, setTempStudyLevel] = useState(studyLevel)

  // Sync temp states from store whenever the modal is opened
  useEffect(() => {
    if (isFilterModalOpen) {
      setTempUserType(userType)
      setTempNativeLanguage(nativeLanguage)
      setTempCategoryId(selectedCategoryId)
      setTempSubCategoryId(selectedSubCategoryId)
      setTempStudySubject(studySubject)
      setTempStudyAgeGroup(studyAgeGroup)
      setTempStudyLevel(studyLevel)
    }
  }, [
    isFilterModalOpen, 
    userType, 
    nativeLanguage, 
    selectedCategoryId, 
    selectedSubCategoryId, 
    studySubject, 
    studyAgeGroup, 
    studyLevel
  ])

  // Level selection removed from popup — now handled in sidebar
  const isAllStepsCompleted = !!tempStudySubject && !!tempStudyAgeGroup;
  const isReadyEnabled = isAllStepsCompleted && !!tempNativeLanguage;
  const isFirstTimeSetup = !initialStudySubject;


  // Auto-detect native language if not set
  useEffect(() => {
    if (!hasUserPreference) {
      const localPref = localStorage.getItem("cupcakes_native_language")
      if (localPref) {
        setNativeLanguage(localPref)
        setTempNativeLanguage(localPref)
      } else {
        if (typeof navigator !== "undefined") {
          const browserLang = navigator.language.toLowerCase()
          let defaultLang = 'vi'
          if (browserLang.includes('th')) defaultLang = 'th'
          else if (browserLang.includes('id')) defaultLang = 'id'
          else if (browserLang.includes('vi')) defaultLang = 'vi'
          
          setNativeLanguage(defaultLang)
          setTempNativeLanguage(defaultLang)
          localStorage.setItem("cupcakes_native_language", defaultLang)
        }
      }
    }
  }, [hasUserPreference, setNativeLanguage])

  // Auto-open modal if user has no filter selections AND hasn't explicitly set a preference
  useEffect(() => {
    // Use initialStudySubject to prevent race condition during hydration
    const effectiveSubject = studySubject || initialStudySubject;
    if (!effectiveSubject && !urlGoal && !hasAutoOpened) {
      setIsFilterModalOpen(true)
      setHasAutoOpened(true)
    }
  }, [urlGoal, hasAutoOpened, studySubject, initialStudySubject])

  const handleOpenModal = () => {
    setTempUserType(userType)
    setTempNativeLanguage(nativeLanguage)
    setTempCategoryId(selectedCategoryId)
    setTempSubCategoryId(selectedSubCategoryId)
    setTempStudySubject(studySubject)
    setTempStudyAgeGroup(studyAgeGroup)
    setTempStudyLevel(studyLevel)
    setIsFilterModalOpen(true)
  }

  const handleCloseModalDiscard = () => {
    if (isFirstTimeSetup) return // Force setup if no subject
    setIsFilterModalOpen(false)
  }

  const handleApplyFilters = async () => {
    setIsFilterModalOpen(false) // Close modal instantly

    // 1. Update all client state instantly (optimistic UI)
    if (userType !== tempUserType) {
      setUserType(tempUserType)
    }

    if (nativeLanguage !== tempNativeLanguage) {
      setNativeLanguage(tempNativeLanguage)
      localStorage.setItem("cupcakes_native_language", tempNativeLanguage)
    }

    if (studySubject !== tempStudySubject || studyAgeGroup !== tempStudyAgeGroup) {
      setStudySubject(tempStudySubject || "")
      setStudyAgeGroup(tempStudyAgeGroup || "")
      // Level is not set from popup — user selects from sidebar
      setStudyLevel("")
    }

    // 2. Commit category and sub-category
    setSelectedCategoryId("")
    setSelectedSubCategoryId("")

    // 3. Set cookies immediately on the client side so next request has them instantly
    if (tempUserType) document.cookie = `user_type=${tempUserType}; path=/; max-age=31536000; samesite=lax`;
    if (tempNativeLanguage) document.cookie = `native_language=${tempNativeLanguage}; path=/; max-age=31536000; samesite=lax`;
    if (tempStudySubject) document.cookie = `study_subject=${tempStudySubject}; path=/; max-age=31536000; samesite=lax`;
    if (tempStudyAgeGroup) document.cookie = `study_age_group=${tempStudyAgeGroup}; path=/; max-age=31536000; samesite=lax`;
    // Clear level when age group changes (level is now selected from sidebar)
    document.cookie = `study_level=; path=/; max-age=31536000; samesite=lax`;

    // 4. Trigger background update to server (FIRE AND FORGET - NO AWAIT)
    updateAllPreferences({
      userType: tempUserType,
      nativeLanguage: tempNativeLanguage,
      studySubject: tempStudySubject,
      studyAgeGroup: tempStudyAgeGroup,
      studyLevel: "" // Level is now selected from sidebar, reset on age group change
    }).catch(console.error);

    // 5. Update URL goal and categoryId
    const qs = new URLSearchParams(window.location.search)
    qs.delete("categoryId")
    qs.delete("goal")
    localStorage.removeItem("cupcakes_preferred_category_id")
    localStorage.removeItem("cupcakes_preferred_goal_id")

    // Transition instantly, no artificial delay
    startTransition(() => {
      router.push(`/?${qs.toString()}`, { scroll: false })
      router.refresh()
    })

    // 4. Close the modal
    setIsFilterModalOpen(false)

    // 5. Scroll to content tabs
    setTimeout(() => {
      document.getElementById("content-tabs")?.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      })
    }, 150)
  }

  // ── Sync URL → state (e.g. browser Back button) ───────────────────────────
  useEffect(() => {
    const tab  = currentParams.get("tab")
    if (tab  && tab  !== activeTab)  setActiveTab(tab)
  }, [currentParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab / sort handlers — no server roundtrip ─────────────────────────────
  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    const p = new URLSearchParams(window.location.search)
    p.set("tab", tab)
    window.history.pushState(null, "", `?${p.toString()}`)
  }

  const handleClearSearch = useCallback(() => {
    const p = new URLSearchParams(window.location.search)
    p.delete("search")
    router.push(`?${p.toString()}`, { scroll: false })
  }, [router])

  // Listen for escape key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFilterModalOpen) {
        handleCloseModalDiscard()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFilterModalOpen])

  const feedKey = `feed-${initialUserType}-${initialStudySubject}-${initialStudyLevel}-${searchParams.goal || searchParams.categoryId || ''}-${searchParams.search || ''}`

  return (
    <div className="space-y-6 relative">

      {/* Hướng 2: Top progress bar */}
      <LoadingBar active={isFiltering} />

      {/* Center Overlay Modal Popup for Filters */}
      {isFilterModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={!isFirstTimeSetup ? handleCloseModalDiscard : undefined}
        >
          <div 
            className="bg-[#FAF8F5] dark:bg-slate-900 border-[6px] border-primary/20 dark:border-primary/40 rounded-[2.5rem] p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col gap-6 modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Close button (X) */}
            {!isFirstTimeSetup && (
              <button
                onClick={handleCloseModalDiscard}
                className="absolute top-6 right-6 text-primary/60 hover:text-primary dark:text-slate-400 dark:hover:text-white p-2 hover:bg-primary/5 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            )}
            
            {/* Subject Selection (Step 1) */}
            {onboardingConfig && (
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-headline font-black text-primary leading-none tracking-tight">
                  What do you want to learn?
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-6 category-grid">
                  {onboardingConfig.subjects.map((subject: any, idx: number) => {
                    const isActive = tempStudySubject === subject.id;
                    const blobShapes = [
                      "rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem]",
                      "rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem]",
                      "rounded-[2.5rem_4.5rem_3rem_4rem_/_4rem_3rem_4.5rem_2.5rem]",
                      "rounded-[4rem_2.5rem_4rem_3rem_/_2.5rem_4.5rem_3rem_4.5rem]",
                      "rounded-[3rem_4rem_2.5rem_4.5rem_/_4.5rem_2.5rem_4.5rem_3rem]",
                    ];
                    const solarpunkStyles = [
                      { icon: "/images/english.png", color: "text-emerald-900", bg: "bg-emerald-50", activeBg: "bg-emerald-200", border: "border-emerald-400", iconBg: "bg-emerald-200", shadow: "shadow-emerald-900/10" },
                      { icon: "/images/math.png", color: "text-orange-900", bg: "bg-orange-50", activeBg: "bg-orange-200", border: "border-orange-400", iconBg: "bg-orange-200", shadow: "shadow-orange-900/10" },
                      { icon: "/images/global.png", color: "text-sky-900", bg: "bg-sky-50", activeBg: "bg-sky-200", border: "border-sky-400", iconBg: "bg-sky-200", shadow: "shadow-sky-900/10" },
                      { icon: "/images/english.png", color: "text-purple-900", bg: "bg-purple-50", activeBg: "bg-purple-200", border: "border-purple-400", iconBg: "bg-purple-200", shadow: "shadow-purple-900/10" },
                    ];
                    const n = (subject.label || "").toLowerCase();
                    let style = solarpunkStyles[idx % solarpunkStyles.length];
                    if (n.includes("anh") || n.includes("english")) style = solarpunkStyles[0];
                    else if (n.includes("toán") || n.includes("math")) style = solarpunkStyles[1];
                    else if (n.includes("global") || n.includes("xã hội") || n.includes("science")) style = solarpunkStyles[2];
                    
                    const blobShape = blobShapes[idx % blobShapes.length];
                    const Icon = style.icon;

                    return (
                      <button
                        key={subject.id}
                        onClick={() => {
                          setTempStudySubject(subject.id);
                          setTempStudyAgeGroup("");
                          setTempStudyLevel("");
                        }}
                        className={`group relative h-24 md:h-28 ${blobShape} p-6 transition-all duration-700 flex flex-col items-center justify-center gap-2 border-[3px] shadow-xl cursor-pointer ${
                          isActive 
                            ? `${style.activeBg} ${style.border} scale-[1.08] shadow-2xl z-20 animate-solar-pulse border-4` 
                            : `${style.bg} ${style.border} hover:scale-[1.05] ${style.shadow} opacity-80 hover:opacity-100`
                        }`}
                      >
                         <div className={`absolute -top-5 -left-4 rounded-2xl shadow-lg transition-all duration-700 flex items-center justify-center w-14 h-14 ${style.iconBg} ${style.color} ${isActive ? "scale-110 -rotate-6 shadow-xl" : "group-hover:scale-110 group-hover:-rotate-12"}`}>
                           <img src={Icon} alt={subject.label} className="w-10 h-10 object-contain drop-shadow-sm" />
                         </div>
                         <div className={`relative z-10 font-headline font-black text-lg md:text-xl tracking-tight transition-all duration-500 ${isActive ? style.color + " scale-105" : "text-slate-700/80"}`}>
                           {subject.label}
                         </div>
                         {isActive && (
                           <div className={`relative z-10 w-8 h-1.5 bg-current opacity-20 rounded-full blur-[1px] ${style.color}`} />
                         )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Age Group Selection (Step 2) */}
            {onboardingConfig && tempStudySubject && (
              <>
                <hr className="border-primary/10" />
                <div className="space-y-4">
                  <h2 className="text-xl md:text-2xl font-headline font-black text-primary leading-none tracking-tight">
                    {t("whoAreYou")}
                  </h2>
                  <div className="flex flex-wrap gap-8 items-center pl-4 md:pl-10 py-2">
                    {onboardingConfig.subjects.find((s: any) => s.id === tempStudySubject)?.ageGroups.map((age: any) => {
                      const isActive = tempStudyAgeGroup === age.id;
                      return (
                         <button
                          key={age.id}
                          onClick={() => {
                            setTempStudyAgeGroup(age.id);
                            setTempStudyLevel("");
                            // Map age back to "kindergarten/kid/teen/learner" for target filtering
                            if (age.id === "kindergarten" || age.id === "kindergarden" || age.id === "kids-2-5" || age.id.toLowerCase().includes("kindergarten")) setTempUserType("kindergarten");
                            else if (age.id === "kid" || age.id === "kids" || age.id.startsWith("grade")) setTempUserType("kid");
                            else if (age.id === "teen" || age.id === "teens" || age.id === "primary") setTempUserType("teen");
                            else setTempUserType("learner");
                          }}
                          className="shake-on-hover group flex flex-col items-center gap-3 transition-all duration-500 cursor-pointer avatar-btn"
                         >
                            <div className={`relative w-[90px] h-[90px] rounded-full overflow-hidden transition-all duration-500 border-[5px] avatar-container ${
                              isActive 
                                ? "border-primary shadow-xl shadow-primary/30 scale-110 rotate-3" 
                                : "border-transparent shadow-md opacity-60 group-hover:opacity-100 group-hover:border-primary/30 group-hover:scale-105 group-hover:-translate-y-1.5 group-hover:rotate-[-3deg]"
                            }`}>
                              <img src={age.avatar || "/images/avatars/kid.png"} alt={age.label} className="shake-target w-full h-full object-cover" />
                            </div>
                            <span className={`text-sm font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                              isActive ? "text-primary scale-110" : "text-primary/50 group-hover:text-primary"
                            }`}>{age.label}</span>
                         </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Level Selection removed from popup — now in sidebar */}

            {/* Native Language Section */}
            {isAllStepsCompleted && (
              <>
                <hr className="border-primary/10" />
                <div className="flex flex-wrap items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-500 py-2">
                  <h2 className="text-xl md:text-2xl font-headline font-black text-primary leading-none tracking-tight shrink-0 flex items-center h-full pt-1">
                    {locale === "vi" ? "My native language is" : "My native language is"}
                  </h2>
                  <div className="shrink-0 inline-flex items-center">
                    <Select
                      value={tempNativeLanguage}
                      onValueChange={setTempNativeLanguage}
                    >
                      <SelectTrigger 
                        className="bg-emerald-50 border-[3px] border-emerald-400 text-emerald-900 font-headline font-black rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem] px-6 py-3 h-auto text-lg md:text-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 ease-out cursor-pointer shadow-[0_4px_0_0_rgba(52,211,153,0.4)] hover:shadow-[0_6px_0_0_rgba(52,211,153,0.4)] active:translate-y-1 active:shadow-none active:scale-[0.98] min-w-[180px] flex gap-2 items-center"
                      >
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="z-[1000] bg-white dark:bg-slate-900 rounded-[1.5rem] border-[3px] border-emerald-200 shadow-xl overflow-hidden font-bold text-emerald-900 p-2">
                        <SelectItem value="vi" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇻🇳</span> Tiếng Việt</SelectItem>
                        <SelectItem value="th" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇹🇭</span> Thailand</SelectItem>
                        <SelectItem value="id" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇮🇩</span> Indonesia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Ready / Cancel footer */}

            <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-primary/10 modal-footer">
              {!isFirstTimeSetup && (
                <button
                  onClick={handleCloseModalDiscard}
                  className="px-8 py-3 rounded-full text-xs font-black transition-all border-2 border-primary/20 text-primary/60 hover:text-primary hover:border-primary/40 uppercase tracking-[0.1em] cursor-pointer"
                >
                  {locale === "vi" ? "CANCEL" : "CANCEL"}
                </button>
              )}
              <button
                onClick={handleApplyFilters}
                disabled={!isReadyEnabled}
                className={`px-10 py-3.5 rounded-full text-xs font-black transition-all uppercase tracking-[0.1em] ${
                  isReadyEnabled
                    ? "bg-primary border-2 border-primary text-on-primary shadow-lg hover:shadow-primary/30 hover:scale-[1.03] active:scale-95 cursor-pointer"
                    : "bg-slate-200 border-2 border-slate-200 dark:bg-slate-800 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
                }`}
              >
                {locale === "vi" ? "READY" : "READY"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Background content wrapped for blurring during first time setup */}
      <div className={`transition-all duration-700 ${isFirstTimeSetup ? 'blur-md opacity-40 grayscale pointer-events-none select-none' : ''}`}>

      {/* Tab + Sort controls */}
      <div 
        id="content-tabs" 
        className="flex flex-col md:flex-row md:items-center justify-start gap-6 pt-0 pb-12 -mb-8 px-6 md:px-10 -mx-6 md:-mx-10 sticky top-0 z-40 bg-gradient-to-b from-background via-background via-70% to-transparent pointer-events-none"
      >
        <div className="inline-flex items-center gap-4 relative z-10 pointer-events-auto">
          {isKindergarten ? (
            <div className="relative inline-flex items-center bg-white/90 backdrop-blur-sm border-2 border-primary/10 rounded-[2rem] shadow-md p-1.5">
              {/* Sliding indicator */}
              <div
                className="absolute top-1.5 bottom-1.5 rounded-[1.5rem] bg-primary shadow-lg shadow-primary/30 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  left: activeTab === "flashcards" ? "6px" : "calc(50%)",
                  right: activeTab === "games" ? "6px" : "calc(50%)",
                }}
              />
              <button
                onClick={() => handleTabChange("flashcards")}
                className={`relative z-10 px-10 py-3.5 min-w-[130px] rounded-[1.5rem] text-sm font-black transition-colors duration-300 cursor-pointer ${
                  activeTab === "flashcards" ? "text-white" : "text-slate-400 hover:text-primary"
                }`}
              >
                {locale === "vi" ? "THẺ TỪ VỰNG" : "FLASHCARDS"}
              </button>
              <button
                onClick={() => handleTabChange("games")}
                className={`relative z-10 px-10 py-3.5 min-w-[130px] rounded-[1.5rem] text-sm font-black transition-colors duration-300 cursor-pointer ${
                  activeTab === "games" ? "text-white" : "text-slate-400 hover:text-primary"
                }`}
              >
                {locale === "vi" ? "TRÒ CHƠI" : "GAMES"}
              </button>
            </div>
          ) : (
            <div className="relative inline-flex items-center bg-white/90 backdrop-blur-sm border-2 border-primary/10 rounded-[2rem] shadow-md p-1.5">
              {/* Sliding indicator */}
              <div
                className="absolute top-1.5 bottom-1.5 rounded-[1.5rem] bg-primary shadow-lg shadow-primary/30 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  left: activeTab === "lessons" ? "6px" : "calc(50%)",
                  right: activeTab === "exercises" ? "6px" : "calc(50%)",
                }}
              />
              <button
                onClick={() => handleTabChange("lessons")}
                className={`relative z-10 px-10 py-3.5 min-w-[130px] rounded-[1.5rem] text-sm font-black transition-colors duration-300 cursor-pointer ${
                  activeTab === "lessons" ? "text-white" : "text-slate-400 hover:text-primary"
                }`}
              >
                {nt("lessons").toUpperCase()}
              </button>
              <button
                onClick={() => handleTabChange("exercises")}
                className={`relative z-10 px-10 py-3.5 min-w-[130px] rounded-[1.5rem] text-sm font-black transition-colors duration-300 cursor-pointer ${
                  activeTab === "exercises" ? "text-white" : "text-slate-400 hover:text-primary"
                }`}
              >
                {locale === "vi" ? "BÀI TẬP" : "EXERCISES"}
              </button>
            </div>
          )}
        </div>
      </div>




      {/* Lists */}
      <div className="relative">
        {(isPending || isFiltering) && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-md" />
          </div>
        )}
        <div className={isPending || isFiltering ? "opacity-50 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
          {activeTab === "flashcards" ? (
            <Suspense fallback={<SectionSkeleton />}>
              <FlashcardTopicList promise={promises.flashcards} />
            </Suspense>
          ) : activeTab === "games" ? (
            <Suspense fallback={<SectionSkeleton />}>
              <KindergartenGameList promise={promises.kindergartenGames} />
            </Suspense>
          ) : activeTab === "exercises" ? (
            <Suspense fallback={<SectionSkeleton />}>
              <ExerciseList key={`ex-${feedKey}`} promise={promises.assignments} isLoggedIn={isLoggedIn} searchKeyword={searchParams.search} onClear={handleClearSearch} searchParams={searchParams} />
            </Suspense>
          ) : (
            <Suspense fallback={<SectionSkeleton />}>
              <LessonList key={`ls-${feedKey}`} promise={promises.lessons} isLoggedIn={isLoggedIn} searchKeyword={searchParams.search} onClear={handleClearSearch} searchParams={searchParams} />
            </Suspense>
          )}
        </div>
      </div>

      </div>

    </div>
  )
}
