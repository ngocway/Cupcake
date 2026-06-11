
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
import { setUserTypePreference, setNativeLanguagePreference } from "@/actions/user-preferences-actions"
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
    categoryTree: Promise<any[]>
  }
  searchParams: any
  initialUserType?: string
  hasUserPreference?: boolean
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="group flex flex-col h-full rounded-2xl relative">
          <div className="w-full aspect-video rounded-3xl overflow-hidden relative shadow-lg bg-secondary/10" />
          <div className="relative -mt-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-lg p-6 shadow-2xl z-20 border border-secondary/10">
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
  
  const initializedKey = useRef('')
  const currentKey = `ex-${searchParams.categoryId || ''}-${userType}-${searchKeyword || ''}`

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
        if (searchParams.categoryId) qs.set('categoryId', searchParams.categoryId)
        if (searchKeyword) qs.set('search', searchKeyword)
        if (userType) qs.set('userType', userType)

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
  }, [hasMoreEx, isFetchingMore, exPage, searchParams, userType, searchKeyword, currentKey, addExercises, setHasMoreEx, setExPage])

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
  
  const initializedKey = useRef('')
  const currentKey = `le-${searchParams.categoryId || ''}-${userType}-${searchKeyword || ''}`

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
        if (searchParams.categoryId) qs.set('categoryId', searchParams.categoryId)
        if (searchKeyword) qs.set('search', searchKeyword)
        if (userType) qs.set('userType', userType)

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
  }, [hasMoreLe, isFetchingMore, lePage, searchParams, userType, searchKeyword, currentKey, addLessons, setHasMoreLe, setLePage])

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

// ─── Main component ───────────────────────────────────────────────────────────

export function LandingPage({ promises, searchParams, initialUserType = "adults", hasUserPreference = false }: Props) {
  const currentParams = useSearchParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isLoggedIn = !!session
  const t = useTranslations("home")
  const nt = useTranslations("nav")
  const locale = useLocale()

  // Resolve categoryTree early to get actual categories
  const categoryTree = use(promises.categoryTree)

  // Local states — switching tab never triggers server roundtrip
  const [activeTab,  setActiveTab]  = useState<string>(searchParams.tab  || "lessons")

  // Store states and actions
  const userType            = useContentStore(s => s.userType)
  const setUserType         = useContentStore(s => s.setUserType)
  const nativeLanguage      = useContentStore(s => s.nativeLanguage)
  const setNativeLanguage   = useContentStore(s => s.setNativeLanguage)
  const selectedCategoryId  = useContentStore(s => s.selectedCategoryId)
  const setSelectedCategoryId = useContentStore(s => s.setSelectedCategoryId)
  const selectedSubCategoryId = useContentStore(s => s.selectedSubCategoryId)
  const setSelectedSubCategoryId = useContentStore(s => s.setSelectedSubCategoryId)

  const isFiltering         = useContentStore(s => s.isFiltering)
  const setFiltering        = useContentStore(s => s.setFiltering)

  // Sync initial userType preference
  useEffect(() => {
    if (initialUserType) {
      setUserType(initialUserType);
    }
    const savedLang = localStorage.getItem("cupcakes_native_language");
    if (savedLang) {
      setNativeLanguage(savedLang);
    }
  }, [initialUserType, setUserType, setNativeLanguage]);

  // Sync URL categoryId → store selectedCategoryId / selectedSubCategoryId
  const urlCategoryId = currentParams.get("categoryId") || "";

  // Restore preferred category from localStorage if visiting root without category
  useEffect(() => {
    const rawUrlCategoryId = currentParams.get("categoryId");
    if (rawUrlCategoryId === null) {
      const savedCatId = localStorage.getItem("cupcakes_preferred_category_id");
      if (savedCatId) {
        const qs = new URLSearchParams(window.location.search);
        qs.set("categoryId", savedCatId);
        router.replace(`/?${qs.toString()}`, { scroll: false });
      }
    }
  }, [currentParams, router]);
  const getActiveCategories = useMemo(() => {
    if (!urlCategoryId) return { categoryId: "", subCategoryId: "" };
    
    for (const cat of categoryTree) {
      if (cat.id === urlCategoryId) {
        return { categoryId: cat.id, subCategoryId: "" };
      }
      if (cat.children) {
        for (const sub of cat.children) {
          if (sub.id === urlCategoryId) {
            return { categoryId: cat.id, subCategoryId: sub.id };
          }
        }
      }
    }
    return { categoryId: "", subCategoryId: "" };
  }, [categoryTree, urlCategoryId]);

  useEffect(() => {
    setSelectedCategoryId(getActiveCategories.categoryId);
    setSelectedSubCategoryId(getActiveCategories.subCategoryId);
  }, [getActiveCategories, setSelectedCategoryId, setSelectedSubCategoryId]);

  // Extract display names of category and sub-category for the homepage sentence summary
  const activeNames = useMemo(() => {
    let categoryName = "";
    let subCategoryName = "";
    
    const { categoryId, subCategoryId } = getActiveCategories;
    if (categoryId) {
      const cat = categoryTree.find((c: any) => c.id === categoryId);
      if (cat) {
        categoryName = cat.nameEn || cat.nameVi || "";
        if (subCategoryId && cat.children) {
          const sub = cat.children.find((s: any) => s.id === subCategoryId);
          if (sub) {
            subCategoryName = sub.nameEn || sub.nameVi || "";
          }
        }
      }
    }
    return { categoryName, subCategoryName };
  }, [categoryTree, getActiveCategories]);

  // Avatar lookup map for landing page summary
  const avatarMap: Record<string, { label: string; src: string }> = {
    kids: { label: "KID", src: "/images/avatars/kid.png" },
    teens: { label: "TEEN", src: "/images/avatars/teen.png" },
    adults: { label: "ADULT", src: "/images/avatars/adult.png" },
    business: { label: "BUSINESS", src: "/images/avatars/Business man.png" },
  };
  const activeAvatar = avatarMap[userType] || avatarMap.adults;

  // Modal local staging states
  const isFilterModalOpen = useContentStore(s => (s as any).isFilterModalOpen)
  const setIsFilterModalOpen = useContentStore(s => (s as any).setFilterModalOpen)
  const [hasAutoOpened, setHasAutoOpened] = useState(false)
  const [tempUserType, setTempUserType] = useState(userType)
  const [tempNativeLanguage, setTempNativeLanguage] = useState(nativeLanguage)
  const [tempCategoryId, setTempCategoryId] = useState(selectedCategoryId)
  const [tempSubCategoryId, setTempSubCategoryId] = useState(selectedSubCategoryId)

  const isReadyEnabled = !!tempUserType && !!tempCategoryId && !!tempSubCategoryId;

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
    if (!hasUserPreference && !urlCategoryId && !hasAutoOpened) {
      setIsFilterModalOpen(true)
      setHasAutoOpened(true)
    }
  }, [urlCategoryId, hasAutoOpened, hasUserPreference])

  const handleOpenModal = () => {
    setTempUserType(userType)
    setTempNativeLanguage(nativeLanguage)
    setTempCategoryId(selectedCategoryId)
    setTempSubCategoryId(selectedSubCategoryId)
    setIsFilterModalOpen(true)
  }

  const handleCloseModalDiscard = () => {
    setIsFilterModalOpen(false)
  }

  const handleApplyFilters = async () => {
    setFiltering(true)

    // 1. Commit user type if changed
    if (userType !== tempUserType) {
      setUserType(tempUserType)
      await setUserTypePreference(tempUserType)
    }

    if (nativeLanguage !== tempNativeLanguage) {
      setNativeLanguage(tempNativeLanguage)
      localStorage.setItem("cupcakes_native_language", tempNativeLanguage)
      await setNativeLanguagePreference(tempNativeLanguage)
    }

    // 2. Commit category and sub-category
    setSelectedCategoryId(tempCategoryId)
    setSelectedSubCategoryId(tempSubCategoryId)

    // 3. Update URL categoryId
    const qs = new URLSearchParams(window.location.search)
    if (tempSubCategoryId) {
      qs.set("categoryId", tempSubCategoryId)
      localStorage.setItem("cupcakes_preferred_category_id", tempSubCategoryId)
    } else if (tempCategoryId) {
      qs.set("categoryId", tempCategoryId)
      localStorage.setItem("cupcakes_preferred_category_id", tempCategoryId)
    } else {
      qs.delete("categoryId")
      localStorage.removeItem("cupcakes_preferred_category_id")
    }

    // Clear isFiltering after a short delay since startTransition handles it gracefully
    startTransition(() => {
      router.push(`/?${qs.toString()}`, { scroll: false })
      setTimeout(() => setFiltering(false), 500)
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

  return (
    <div className="space-y-6 relative">


      {/* Hướng 2: Top progress bar */}
      <LoadingBar active={isFiltering} />

      {/* Center Overlay Modal Popup for Filters */}
      {isFilterModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={handleCloseModalDiscard}
        >
          <div 
            className="bg-[#FAF8F5] dark:bg-slate-900 border-[6px] border-primary/20 dark:border-primary/40 rounded-[2.5rem] p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col gap-6 modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Close button (X) */}
            <button
              onClick={handleCloseModalDiscard}
              className="absolute top-6 right-6 text-primary/60 hover:text-primary dark:text-slate-400 dark:hover:text-white p-2 hover:bg-primary/5 rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Who are you Section */}
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-headline font-black text-primary leading-none tracking-tight">
                {t("whoAreYou")}
              </h2>
              <div className="flex flex-wrap gap-8 items-center pl-4 md:pl-10 py-2">
                {[
                  { id: 'kids', label: 'Kid', src: '/images/avatars/kid.png' },
                  { id: 'teens', label: 'Teen', src: '/images/avatars/teen.png' },
                  { id: 'adults', label: 'Adult', src: '/images/avatars/adult.png' },
                  { id: 'business', label: 'Business', src: '/images/avatars/Business man.png' },
                ].map((type) => {
                  const isActive = tempUserType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setTempUserType(type.id)}
                      className="shake-on-hover group flex flex-col items-center gap-3 transition-all duration-500 focus:outline-none cursor-pointer avatar-btn"
                    >
                      <div className={`relative w-[90px] h-[90px] rounded-full overflow-hidden transition-all duration-500 border-[5px] avatar-container ${
                        isActive 
                          ? "border-primary shadow-xl shadow-primary/30 scale-110 rotate-3" 
                          : "border-transparent shadow-md opacity-60 group-hover:opacity-100 group-hover:border-primary/30 group-hover:scale-105 group-hover:-translate-y-1.5 group-hover:rotate-[-3deg]"
                      }`}>
                        <img 
                          src={type.src} 
                          alt={type.label} 
                          className="shake-target w-full h-full object-cover" 
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

            <hr className="border-primary/10" />

            {/* Native Language Section */}
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-xl md:text-2xl font-headline font-black text-primary leading-none tracking-tight shrink-0">
                {locale === "vi" ? "My native language is" : "My native language is"}
              </h2>
              <div className="shrink-0">
                <Select
                  value={tempNativeLanguage}
                  onValueChange={setTempNativeLanguage}
                >
                  <SelectTrigger 
                    className="bg-white border-2 border-primary/20 text-primary font-black rounded-[1.75rem] px-5 py-5 md:px-6 md:py-6 h-auto text-base md:text-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer shadow-sm min-w-[140px] flex gap-2"
                  >
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000] bg-white dark:bg-slate-900 rounded-[1.25rem] border-2 border-primary/10 shadow-xl overflow-hidden font-bold text-primary p-1">
                    <SelectItem value="vi" className="focus:bg-primary/10 focus:text-primary cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors">Tiếng Việt</SelectItem>
                    <SelectItem value="th" className="focus:bg-primary/10 focus:text-primary cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors">Thailand</SelectItem>
                    <SelectItem value="id" className="focus:bg-primary/10 focus:text-primary cursor-pointer py-3 pr-4 pl-10 rounded-xl transition-colors">Indonesia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <hr className="border-primary/10" />

            {/* What to learn & Categories Section */}
            <div className="space-y-4">
              <div className="text-lg md:text-xl text-primary/80 leading-relaxed font-black h-8 flex items-center typing-text-container">
                <TypingText text={t("whatToLearn")} speed={150} />
              </div>
              <div className="pt-2">
                <VisualCategoryMenu
                  categoryTree={categoryTree}
                  activeCategoryId={tempCategoryId}
                  activeSubCategoryId={tempSubCategoryId}
                  onSelectCategory={(id) => {
                    setTempCategoryId(id);
                    setTempSubCategoryId(""); // Clear sub-category when parent category changes
                  }}
                  onSelectSubCategory={setTempSubCategoryId}
                />
              </div>
            </div>

            {/* Ready / Cancel footer */}
            <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-primary/10 modal-footer">
              <button
                onClick={handleCloseModalDiscard}
                className="px-8 py-3 rounded-full text-xs font-black transition-all border-2 border-primary/20 text-primary/60 hover:text-primary hover:border-primary/40 uppercase tracking-[0.1em] cursor-pointer"
              >
                {locale === "vi" ? "CANCEL" : "CANCEL"}
              </button>
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

      {/* Tab + Sort controls */}
      <div 
        id="content-tabs" 
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8 pb-4 sticky top-0 z-40 bg-[#FFF8E7] dark:bg-slate-900"
      >
        <div className="inline-flex items-center gap-4 relative z-10">
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
        </div>
        
        {/* Gradient fade-out at the bottom edge */}
        <div className="absolute top-full left-0 right-0 h-8 bg-gradient-to-b from-[#FFF8E7] to-transparent dark:from-slate-900 pointer-events-none" />
      </div>

      {/* ── Content grids ───────────────────────────────────────────────────── */}
      <div className={`min-h-[600px] relative transition-opacity duration-300 ${isPending || isFiltering ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Loading Spinner Overlay */}
        {(isPending || isFiltering) && (
          <div className="absolute inset-0 z-50 flex items-start justify-center pt-32">
            <div className="flex flex-col items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl border-2 border-primary/20">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
              <span className="text-primary font-black animate-pulse text-sm tracking-widest uppercase">Loading</span>
            </div>
          </div>
        )}

        <div className={activeTab === "exercises" ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          <Suspense fallback={<SectionSkeleton />}>
            <ExerciseList promise={promises.assignments} isLoggedIn={isLoggedIn} searchKeyword={searchParams.search} onClear={handleClearSearch} searchParams={searchParams} />
          </Suspense>
        </div>

        <div className={activeTab === "lessons" ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          <Suspense fallback={<SectionSkeleton />}>
            <LessonList promise={promises.lessons} isLoggedIn={isLoggedIn} searchKeyword={searchParams.search} onClear={handleClearSearch} searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
