"use client"
import { use, useState, Suspense, useEffect, useTransition, useMemo, memo, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { ExerciseCard, ExerciseCardHorizontal, LessonCard } from "@/components/public/ContentCards"
import { VisualCategoryMenu } from "@/components/public/VisualCategoryMenu"
import { LoadingBar } from "@/components/public/TopProgressBar"
import { useContentStore } from "@/store/useContentStore"
import { useTranslations, useLocale } from "next-intl"
import { TypingText } from "@/components/public/TypingText"
import { updateAllPreferences, getOnboardingConfig } from "@/actions/user-preferences-actions"
import { getBestAgeGroupForSubject } from "@/lib/user-preferences-utils"
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
  
  const [isLoading, setIsLoading] = useState(false)
  const initializedKey = useRef('')
  const goalParam = searchParams.goal || searchParams.categoryId || ''
  const currentKey = `ex-${goalParam}-${userType}-${studySubject}-${studyLevel}-${searchKeyword || ''}`

  useEffect(() => {
    // 1. Initial page load (use server-side resolved items)
    if (!initializedKey.current) {
      setExercises(serverItems)
      setHasMoreEx(serverHasMore ?? serverItems.length >= 12)
      setExPage(1)
      initializedKey.current = currentKey
      return
    }

    // 2. Subsequent client-side filter updates
    if (initializedKey.current !== currentKey) {
      setIsLoading(true)
      
      const qs = new URLSearchParams()
      qs.set('type', 'exercises')
      qs.set('page', '1')
      if (goalParam) qs.set('goal', goalParam)
      if (searchKeyword) qs.set('search', searchKeyword)
      if (userType) qs.set('userType', userType)
      if (studySubject) qs.set('subject', studySubject)
      if (studyLevel) qs.set('level', studyLevel)

      fetch(`/api/feed?${qs.toString()}`)
        .then(r => r.json())
        .then(data => {
          if (data.items) {
            setExercises(data.items)
            setHasMoreEx(data.hasMore ?? data.items.length >= 12)
            setExPage(1)
            initializedKey.current = currentKey
          }
        })
        .catch(e => console.error("Failed to fetch client-side exercises:", e))
        .finally(() => setIsLoading(false))
    }
  }, [currentKey, serverItems, serverHasMore, setExercises, setHasMoreEx, setExPage, goalParam, searchKeyword, userType, studySubject, studyLevel])

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-row rounded-xl overflow-hidden border border-primary/5 shadow-sm animate-pulse">
            <div className="w-[38%] shrink-0"><div className="aspect-video bg-slate-100 dark:bg-slate-800/80" /></div>
            <div className="flex-1 p-3 space-y-2">
              <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800/80 rounded-full" />
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full" />
              <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/80 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (displayItems.length === 0 && searchKeyword) return <EmptySearchState keyword={searchKeyword} onClear={onClear} />

  if (displayItems.length === 0) return <div className="text-center py-20 text-primary/50 font-bold">No content available.</div>

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayItems.map((ex: any) => (
          <ExerciseCardHorizontal key={ex.id} item={ex} isLoggedIn={isLoggedIn} />
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
  
  const [isLoading, setIsLoading] = useState(false)
  const initializedKey = useRef('')
  const goalParam = searchParams.goal || searchParams.categoryId || ''
  const currentKey = `le-${goalParam}-${userType}-${studySubject}-${studyLevel}-${searchKeyword || ''}`

  useEffect(() => {
    // 1. Initial page load (use server-side resolved items)
    if (!initializedKey.current) {
      setLessons(serverItems)
      setHasMoreLe(serverHasMore ?? serverItems.length >= 12)
      setLePage(1)
      initializedKey.current = currentKey
      return
    }

    // 2. Subsequent client-side filter updates
    if (initializedKey.current !== currentKey) {
      setIsLoading(true)
      
      const qs = new URLSearchParams()
      qs.set('type', 'lessons')
      qs.set('page', '1')
      if (goalParam) qs.set('goal', goalParam)
      if (searchKeyword) qs.set('search', searchKeyword)
      if (userType) qs.set('userType', userType)
      if (studySubject) qs.set('subject', studySubject)
      if (studyLevel) qs.set('level', studyLevel)

      fetch(`/api/feed?${qs.toString()}`)
        .then(r => r.json())
        .then(data => {
          if (data.items) {
            setLessons(data.items)
            setHasMoreLe(data.hasMore ?? data.items.length >= 12)
            setLePage(1)
            initializedKey.current = currentKey
          }
        })
        .catch(e => console.error("Failed to fetch client-side lessons:", e))
        .finally(() => setIsLoading(false))
    }
  }, [currentKey, serverItems, serverHasMore, setLessons, setHasMoreLe, setLePage, goalParam, searchKeyword, userType, studySubject, studyLevel])

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800/80 rounded-2xl animate-pulse" />
            <div className="h-5 w-3/4 bg-slate-100 dark:bg-slate-800/80 rounded-xl animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800/80 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

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

const ALL_GAMES_DATA: Record<string, any[]> = {
  kindergarten: [
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
      gradient: "from-pink-250 to-rose-400",
      thumbnail: "/images/games/flashcard-quiz.png",
      emoji: "❓",
      tag: "Quiz",
      desc: "Listen to the questions, look at the images, and choose the correct words. Fun and engaging quiz games!",
      comingSoon: false,
    }
  ],
  kid: [
    {
      id: "flashcard-match",
      title: "Flashcard Match",
      href: "/student/game/flashcard-match/select?level=kid",
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
      href: "/student/game/flashcard-sentence-builder/select?level=kid",
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
      href: "/student/game/flashcard-quiz/select?age=6-12",
      gradient: "from-pink-250 to-rose-400",
      thumbnail: "/images/games/flashcard-quiz.png",
      emoji: "❓",
      tag: "Quiz",
      desc: "Listen to the questions, look at the images, and choose the correct words. Fun and engaging quiz games!",
      comingSoon: false,
    },
    {
      id: "spell-quest",
      title: "Spell Quest",
      href: "#",
      gradient: "from-emerald-250 to-teal-400 dark:from-emerald-900/40 dark:to-teal-800/40",
      emoji: "📝",
      tag: "Spelling",
      desc: "Unscramble letters to spell vocabulary words correctly. Level up your spelling and win badges!",
      comingSoon: true,
    }
  ],
  teen: [
    {
      id: "flashcard-match",
      title: "Flashcard Match",
      href: "/student/game/flashcard-match/select?level=teen",
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
      href: "/student/game/flashcard-sentence-builder/select?level=teen",
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
      href: "/student/game/flashcard-quiz/select?age=teen",
      gradient: "from-pink-250 to-rose-400",
      thumbnail: "/images/games/flashcard-quiz.png",
      emoji: "❓",
      tag: "Quiz",
      desc: "Listen to the questions, look at the images, and choose the correct words. Fun and engaging quiz games!",
      comingSoon: false,
    },
    {
      id: "grammar-escape",
      title: "Grammar Escape",
      href: "#",
      gradient: "from-indigo-250 to-violet-400 dark:from-indigo-900/40 dark:to-violet-800/40",
      emoji: "🏰",
      tag: "Reading",
      desc: "Solve grammar riddles to escape the haunted classroom. Challenge your reading and sentence building skills!",
      comingSoon: true,
    }
  ],
  learner: [
    {
      id: "flashcard-match",
      title: "Flashcard Match",
      href: "/student/game/flashcard-match/select?level=learner",
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
      href: "/student/game/flashcard-sentence-builder/select?level=learner",
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
      href: "/student/game/flashcard-quiz/select?age=readers",
      gradient: "from-pink-250 to-rose-400",
      thumbnail: "/images/games/flashcard-quiz.png",
      emoji: "❓",
      tag: "Quiz",
      desc: "Listen to the questions, look at the images, and choose the correct words. Fun and engaging quiz games!",
      comingSoon: false,
    },
    {
      id: "speed-reader",
      title: "Speed Reader",
      href: "#",
      gradient: "from-amber-250 to-orange-400 dark:from-amber-900/40 dark:to-orange-800/40",
      emoji: "⚡",
      tag: "Reading",
      desc: "Read fast-scrolling texts and answer comprehension questions. Boost your reading speed and accuracy!",
      comingSoon: true,
    }
  ]
};

const FlashcardTopicList = memo(function FlashcardTopicList({ topics }: { topics: any[] }) {
  if (!topics || topics.length === 0) return <div className="text-center py-20 text-primary/50 font-bold">No flashcards available.</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {topics.map((topic, idx) => {
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

const GameList = memo(function GameList({ games, locale }: { games: any[]; locale: string }) {
  if (!games || games.length === 0) return <div className="text-center py-20 text-primary/50 font-bold">{locale === 'vi' ? 'Không có trò chơi nào.' : 'No games available.'}</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {games.map((game) => {
        const isComingSoon = game.comingSoon;
        return (
          <div 
            key={game.id} 
            onClick={() => {
              if (!isComingSoon) {
                window.location.href = game.href;
              }
            }}
            className={`group ${isComingSoon ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
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
                
                {/* Coming Soon overlay */}
                {isComingSoon && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-30">
                    <span className="material-symbols-outlined text-white text-4xl mb-2 animate-pulse">lock</span>
                    <span className="px-4 py-1 bg-white/20 border border-white/25 rounded-full text-white text-xs font-bold uppercase tracking-widest">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider">
                      {game.tag}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {game.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {game.desc}
                  </p>
                </div>
                {!isComingSoon && (
                  <div className="mt-6 flex items-center text-primary font-black text-sm uppercase tracking-widest gap-2 group-hover:translate-x-2 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play w-5 h-5 fill-primary"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    Play Now
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ─── Mobile Subject Bar ───────────────────────────────────────────────────────

const subjectStyleMap: Record<string, { bg: string; activeBg: string; border: string; activeBorder: string; text: string; activeText: string; icon: string }> = {
  english: { bg: "bg-emerald-50", activeBg: "bg-emerald-500", border: "border-emerald-200", activeBorder: "border-emerald-500", text: "text-emerald-800", activeText: "text-white", icon: "/images/english.png" },
  math: { bg: "bg-orange-50", activeBg: "bg-orange-500", border: "border-orange-200", activeBorder: "border-orange-500", text: "text-orange-800", activeText: "text-white", icon: "/images/math.png" },
  global: { bg: "bg-sky-50", activeBg: "bg-sky-500", border: "border-sky-200", activeBorder: "border-sky-500", text: "text-sky-800", activeText: "text-white", icon: "/images/global.png" },
};
const defaultSubjectStyle = { bg: "bg-purple-50", activeBg: "bg-purple-500", border: "border-purple-200", activeBorder: "border-purple-500", text: "text-purple-800", activeText: "text-white", icon: "/images/english.png" };

function MobileSubjectBar({ subjects, activeSubject, onSelect, isPending }: { subjects: any[]; activeSubject: string; onSelect: (id: string) => void; isPending: boolean }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {subjects.map((subject: any) => {
        const isActive = activeSubject === subject.id;
        const style = subjectStyleMap[subject.id] || defaultSubjectStyle;
        return (
          <button
            key={subject.id}
            onClick={() => onSelect(subject.id)}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wide border-2 transition-all duration-300 shadow-sm cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${
              isActive
                ? `${style.activeBg} ${style.activeBorder} ${style.activeText} shadow-md scale-[1.03]`
                : `${style.bg} ${style.border} ${style.text} hover:scale-105 hover:shadow-md opacity-80 hover:opacity-100`
            }`}
          >
            {isActive && isPending ? (
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <img src={style.icon} alt={subject.label} className="w-5 h-5 object-contain" />
            )}
            <span>{subject.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function LandingPage({ promises, searchParams, initialUserType = "learner", hasUserPreference = false, initialStudySubject = "", initialStudyAgeGroup = "", initialStudyLevel = "" }: Props) {
  const currentParams = useSearchParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isLoggedIn = !!session
  const t = useTranslations("home")
  const nt = useTranslations("nav")
  const locale = useLocale()

  // Resolve flashcard topics promise
  const allFlashcardTopics = promises.flashcards ? (use(promises.flashcards) || []) : [];

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
  const isKid = currentAgeGroup === "kid" || currentAgeGroup.toLowerCase().includes("kid");
  const isTeen = currentAgeGroup === "teen" || currentAgeGroup.toLowerCase().includes("teen");
  const isLearner = currentAgeGroup === "learner" || currentAgeGroup.toLowerCase().includes("learner") || currentAgeGroup.toLowerCase().includes("adult");

  // Determine dynamic tabs array based on current age group
  const tabs = useMemo(() => {
    if (isKindergarten) return ["flashcards", "games"];
    if (isKid || isTeen) return ["flashcards", "games", "lessons", "exercises"];
    if (isLearner) return ["lessons", "exercises", "flashcards", "games"];
    return ["lessons", "exercises", "flashcards", "games"]; // Fallback
  }, [isKindergarten, isKid, isTeen, isLearner]);

  // Sync activeTab with available tabs
  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  const [config, setConfig] = useState<any>(null);
  useEffect(() => {
    getOnboardingConfig().then(setConfig).catch(console.error);
  }, []);

  const availableLevels = useMemo(() => {
    const subjectData = config?.subjects?.find((s: any) => s.id === studySubject);
    const ageGroupData = subjectData?.ageGroups?.find((a: any) => a.id === studyAgeGroup);
    return ageGroupData?.levels || [];
  }, [config, studySubject, studyAgeGroup]);

  const handleSelectLevel = (levelId: string) => {
    const newLevel = levelId === "all" ? "" : levelId;
    setStudyLevel(newLevel);
    document.cookie = `study_level=${newLevel}; path=/; max-age=31536000; samesite=lax`;
    updateAllPreferences({ studyLevel: newLevel }).catch(console.error);
  };

  // Age group selector filter for Flashcards/Games (only for Kid, Teen, Learner)
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<string>("");

  useEffect(() => {
    if (isKindergarten) {
      setSelectedAgeFilter("kindergarten");
    } else if (isKid) {
      setSelectedAgeFilter("kid");
    } else if (isTeen) {
      setSelectedAgeFilter("teen");
    } else if (isLearner) {
      setSelectedAgeFilter("learner");
    } else {
      setSelectedAgeFilter("kid"); // Default fallback
    }
  }, [currentAgeGroup, isKindergarten, isKid, isTeen, isLearner]);

  const filteredFlashcards = useMemo(() => {
    return allFlashcardTopics.filter((t: any) => {
      const audiences = (t.targetAudiences || []).map((a: string) => a.toLowerCase());
      if (selectedAgeFilter === "kindergarten") {
        return audiences.some((a: string) => a === "kindergarten" || a === "kids-2-5" || a.includes("kindergarten"));
      }
      return audiences.includes(selectedAgeFilter);
    });
  }, [allFlashcardTopics, selectedAgeFilter]);

  const filteredGames = useMemo(() => {
    return ALL_GAMES_DATA[selectedAgeFilter] || ALL_GAMES_DATA.kindergarten;
  }, [selectedAgeFilter]);

  const setNativeLanguage   = useContentStore(s => s.setNativeLanguage)
  const selectedCategoryId  = useContentStore(s => s.selectedCategoryId)
  const setSelectedCategoryId = useContentStore(s => s.setSelectedCategoryId)
  const selectedSubCategoryId = useContentStore(s => s.selectedSubCategoryId)
  const setSelectedSubCategoryId = useContentStore(s => s.setSelectedSubCategoryId)

  const isFiltering         = useContentStore(s => s.isFiltering)
  const setFiltering        = useContentStore(s => s.setFiltering)

  // Sync initial userType and study preferences
  useEffect(() => {
    const cookieOpts = "; path=/; max-age=31536000; samesite=lax";
    if (initialUserType) {
      setUserType(initialUserType);
      document.cookie = `user_type=${initialUserType}${cookieOpts}`;
    }
    if (initialStudySubject) {
      setStudySubject(initialStudySubject);
      document.cookie = `study_subject=${initialStudySubject}${cookieOpts}`;
    }
    if (initialStudyAgeGroup) {
      setStudyAgeGroup(initialStudyAgeGroup);
      document.cookie = `study_age_group=${initialStudyAgeGroup}${cookieOpts}`;
    }
    if (initialStudyLevel) {
      setStudyLevel(initialStudyLevel);
      document.cookie = `study_level=${initialStudyLevel}${cookieOpts}`;
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
  // Subject selection also removed — now handled in sidebar, defaults to "english"
  const isAllStepsCompleted = !!tempStudyAgeGroup;
  const isReadyEnabled = isAllStepsCompleted && !!tempNativeLanguage;
  const isFirstTimeSetup = !initialStudyAgeGroup;


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

  // Auto-open modal if user has no age group set (first time)
  useEffect(() => {
    const effectiveAgeGroup = studyAgeGroup || initialStudyAgeGroup;
    if (!effectiveAgeGroup && !hasAutoOpened) {
      setIsFilterModalOpen(true)
      setHasAutoOpened(true)
    }
  }, [hasAutoOpened, studyAgeGroup, initialStudyAgeGroup])

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

    // Subject defaults to "english" if not already set (subject is now managed in sidebar)
    const effectiveSubject = studySubject || "english";
    if (effectiveSubject !== studySubject) {
      setStudySubject(effectiveSubject)
    }
    if (studyAgeGroup !== tempStudyAgeGroup) {
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
    // Subject defaults to "english" — managed in sidebar
    const subjectToSave = studySubject || "english";
    document.cookie = `study_subject=${subjectToSave}; path=/; max-age=31536000; samesite=lax`;
    if (tempStudyAgeGroup) document.cookie = `study_age_group=${tempStudyAgeGroup}; path=/; max-age=31536000; samesite=lax`;
    // Clear level when age group changes (level is now selected from sidebar)
    document.cookie = `study_level=; path=/; max-age=31536000; samesite=lax`;

    // 4. Update preferences on server and AWAIT it to prevent client/server race condition
    await updateAllPreferences({
      userType: tempUserType,
      nativeLanguage: tempNativeLanguage,
      studySubject: studySubject || "english",
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
            
            {/* Subject Selection removed — now managed in sidebar */}

            {/* Age Group Selection (Step 1 — was Step 2 before subject removal) */}
            {onboardingConfig && (
              <>
                <div className="space-y-4">
                  <h2 className="text-xl md:text-2xl font-headline font-black text-primary leading-none tracking-tight">
                    {t("whoAreYou")}
                  </h2>
                  <div className="flex flex-wrap gap-8 items-center pl-4 md:pl-10 py-2">
                    {/* Use the first subject's (english) age groups as reference */}
                    {(onboardingConfig.subjects[0]?.ageGroups || []).map((age: any) => {
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
                      <SelectContent className="z-[1000] bg-white dark:bg-slate-900 rounded-[1.5rem] border-[3px] border-emerald-200 shadow-xl overflow-hidden font-bold text-emerald-900 p-2 max-h-[300px] overflow-y-auto">
                        <SelectItem value="vi" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇻🇳</span> Tiếng Việt</SelectItem>
                        <SelectItem value="th" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇹🇭</span> Thailand</SelectItem>
                        <SelectItem value="id" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇮🇩</span> Indonesia</SelectItem>
                        <SelectItem value="zh" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇨🇳</span> Mandarin Chinese</SelectItem>
                        <SelectItem value="hi" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇮🇳</span> Hindi</SelectItem>
                        <SelectItem value="ja" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇯🇵</span> Japanese</SelectItem>
                        <SelectItem value="es" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇪🇸</span> Spanish</SelectItem>
                        <SelectItem value="ar" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇸🇦</span> Arabic</SelectItem>
                        <SelectItem value="fr" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇫🇷</span> French</SelectItem>
                        <SelectItem value="ko" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇰🇷</span> Korean</SelectItem>
                        <SelectItem value="pt" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇵🇹</span> Portuguese</SelectItem>
                        <SelectItem value="ru" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇷🇺</span> Russian</SelectItem>
                        <SelectItem value="de" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🇩🇪</span> German</SelectItem>
                        <SelectItem value="other" className="focus:bg-emerald-100 focus:text-emerald-900 cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors font-headline text-lg"><span className="mr-2 text-2xl align-middle">🌐</span> Other language</SelectItem>
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



      <div 
        id="content-tabs" 
        className="flex flex-col items-center justify-center lg:items-start gap-1.5 sm:gap-4 pt-0 pb-3 px-6 md:px-10 -mx-6 md:-mx-10 sticky top-0 z-[40] touch-manipulation"
      >
        {/* Background gradient decorator with pointer-events-none (bypasses iOS Webkit touch bugs) */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background via-70% to-transparent pointer-events-none h-[calc(100%+32px)] z-0" />
        
        <div className="inline-flex items-center gap-4 relative z-10">
          <div className="relative inline-flex items-center bg-white/95 border-2 border-primary/10 rounded-[2rem] shadow-md p-1.5">
            {/* Sliding indicator */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-[1.5rem] bg-primary shadow-lg shadow-primary/30 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
              style={{
                width: `calc((100% - 12px) / ${tabs.length})`,
                transform: `translateX(calc(${tabs.indexOf(activeTab)} * 100%))`,
                left: "6px",
              }}
            />
            {tabs.map((tab) => {
              const label = 
                tab === "lessons" ? nt("lessons").toUpperCase() :
                tab === "exercises" ? (locale === "vi" ? "BÀI TẬP" : "EXERCISES") :
                tab === "flashcards" ? (locale === "vi" ? "THẺ TỪ VỰNG" : "FLASHCARDS") :
                (locale === "vi" ? "TRÒ CHƠI" : "GAMES");
              return (
                <button
                  key={tab}
                  onPointerDown={(e) => {
                    if (e.button === 0) {
                      e.preventDefault();
                      handleTabChange(tab);
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabChange(tab);
                  }}
                  className="relative z-10 px-2 sm:px-10 py-2.5 sm:py-3.5 min-w-[65px] sm:min-w-[130px] rounded-[1.5rem] text-[10px] sm:text-sm font-black transition-colors duration-300 cursor-pointer text-center text-slate-400 hover:text-primary active:text-white touch-manipulation"
                  style={{
                    color: activeTab === tab ? '#ffffff' : undefined
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>



        {/* Pill Selector for Levels (Pre-A1/A1, A2, etc.) */}
        {!isKindergarten && (activeTab === "lessons" || activeTab === "exercises") && availableLevels.length > 0 && (
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-0.5 sm:mt-1.5 relative z-10 animate-in fade-in slide-in-from-top-2 duration-350">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline-block">
              {locale === "vi" ? "Cấp độ:" : "Level:"}
            </span>
            <button
              onClick={() => handleSelectLevel("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer border ${
                !studyLevel
                  ? "bg-slate-700 text-white border-transparent shadow-md scale-105"
                  : "bg-white/80 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary"
              }`}
            >
              {locale === "vi" ? "Tất cả" : "All"}
            </button>
            {availableLevels.map((level: any) => {
              const isActive = studyLevel === level.id;

              // Helper to get short CEFR code for mobile
              const getShortLevelLabel = (id: string, defaultLabel: string) => {
                const normalizedId = id.toLowerCase();
                if (normalizedId === "pre-a1-a1") return "Pre-A1/A1";
                if (normalizedId === "a2") return "A2";
                const match = defaultLabel.match(/\(([^)]+)\)/);
                if (match && match[1]) {
                  return match[1].replace(", ", "/");
                }
                return defaultLabel;
              };

              return (
                <button
                  key={level.id}
                  onClick={() => handleSelectLevel(level.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? "bg-primary text-white border-transparent shadow-md scale-105"
                      : "bg-white/80 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  <span className="hidden sm:inline">{level.label}</span>
                  <span className="sm:hidden">{getShortLevelLabel(level.id, level.label)}</span>
                </button>
              );
            })}
          </div>
        )}
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
              <FlashcardTopicList topics={filteredFlashcards} />
            </Suspense>
          ) : activeTab === "games" ? (
            <Suspense fallback={<SectionSkeleton />}>
              <GameList games={filteredGames} locale={locale} />
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
