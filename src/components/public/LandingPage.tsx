
"use client"
import { use, useState, Suspense, useEffect, useTransition, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { ExerciseCard, LessonCard } from "@/components/public/ContentCards"
import { VisualCategoryMenu } from "@/components/public/VisualCategoryMenu"
import { LoadingBar } from "@/components/public/TopProgressBar"
import { useContentStore } from "@/store/useContentStore"
import { useTranslations, useLocale } from "next-intl"
import { TypingText } from "@/components/public/TypingText"
import { setUserTypePreference } from "@/actions/user-preferences-actions"
import { X, SlidersHorizontal } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  promises: {
    assignments: Promise<{ items: any[], total: number }>
    lessons:     Promise<{ items: any[], total: number }>
    categoryTree: Promise<any[]>
  }
  searchParams: any
  initialUserType?: string
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

// ─── Category section ─────────────────────────────────────────────────────────

function CategoryMenuSection({ promise }: { promise: Promise<any[]> }) {
  const categoryTree = use(promise)
  return <VisualCategoryMenu categoryTree={categoryTree} />
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptySearchState({ keyword, onClear }: { keyword: string, onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative w-48 h-48 mb-8">
        <img src="/images/bird.png" alt="No results" className="w-full h-full object-contain drop-shadow-xl opacity-60 grayscale" />
      </div>
      <h3 className="text-2xl font-headline font-black text-primary mb-3">Oops! Không tìm thấy kết quả.</h3>
      <p className="text-on-surface-variant max-w-md mx-auto mb-8">
        Chúng mình không tìm thấy nội dung nào phù hợp với từ khóa <strong className="text-primary">"{keyword}"</strong>. Bạn thử kiểm tra lại chính tả hoặc dùng từ khóa khác xem sao nhé.
      </p>
    </div>
  )
}

// ─── Content lists (rendered via use() — fast, no extra round-trips) ──

function ExerciseList({
  promise,
  isLoggedIn,
  searchKeyword,
  onClear,
}: {
  promise: Promise<{ items: any[] }>
  isLoggedIn: boolean
  searchKeyword?: string
  onClear: () => void
}) {
  const { items } = use(promise)
  if (items.length === 0 && searchKeyword) return <EmptySearchState keyword={searchKeyword} onClear={onClear} />
  if (items.length === 0) return <div className="text-center py-20 text-primary/50 font-bold">Chưa có nội dung nào.</div>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {items.map((ex: any) => (
        <ExerciseCard key={ex.id} item={ex} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}

function LessonList({
  promise,
  isLoggedIn,
  searchKeyword,
  onClear,
}: {
  promise: Promise<{ items: any[] }>
  isLoggedIn: boolean
  searchKeyword?: string
  onClear: () => void
}) {
  const { items } = use(promise)
  if (items.length === 0 && searchKeyword) return <EmptySearchState keyword={searchKeyword} onClear={onClear} />
  if (items.length === 0) return <div className="text-center py-20 text-primary/50 font-bold">Chưa có nội dung nào.</div>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {items.map((le: any) => (
        <LessonCard key={le.id} item={le} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LandingPage({ promises, searchParams, initialUserType = "adults" }: Props) {
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
  }, [initialUserType, setUserType]);

  // Sync URL categoryId → store selectedCategoryId / selectedSubCategoryId
  const urlCategoryId = currentParams.get("categoryId") || "";
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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [hasAutoOpened, setHasAutoOpened] = useState(false)
  const [tempUserType, setTempUserType] = useState(userType)
  const [tempCategoryId, setTempCategoryId] = useState(selectedCategoryId)
  const [tempSubCategoryId, setTempSubCategoryId] = useState(selectedSubCategoryId)

  // Auto-open modal if user has no filter selections
  useEffect(() => {
    if (!urlCategoryId && !hasAutoOpened) {
      setIsFilterModalOpen(true)
      setHasAutoOpened(true)
    }
  }, [urlCategoryId, hasAutoOpened])

  const handleOpenModal = () => {
    setTempUserType(userType)
    setTempCategoryId(selectedCategoryId)
    setTempSubCategoryId(selectedSubCategoryId)
    setIsFilterModalOpen(true)
  }

  const handleCloseModalDiscard = () => {
    setIsFilterModalOpen(false)
  }

  const handleApplyFilters = () => {
    // 1. Commit user type if changed
    if (userType !== tempUserType) {
      setFiltering(true)
      setUserType(tempUserType)
      startTransition(() => {
        setUserTypePreference(tempUserType).finally(() => setFiltering(false))
      })
    }

    // 2. Commit category and sub-category
    setSelectedCategoryId(tempCategoryId)
    setSelectedSubCategoryId(tempSubCategoryId)

    // 3. Update URL categoryId
    const qs = new URLSearchParams(window.location.search)
    if (tempSubCategoryId) {
      qs.set("categoryId", tempSubCategoryId)
    } else if (tempCategoryId) {
      qs.set("categoryId", tempCategoryId)
    } else {
      qs.delete("categoryId")
    }

    setFiltering(true)
    startTransition(() => {
      router.push(`/?${qs.toString()}`, { scroll: false })
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

  const handleClearSearch = () => {
    const p = new URLSearchParams(window.location.search)
    p.delete("search")
    router.push(`?${p.toString()}`, { scroll: false })
  }

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
      {/* Dynamic height styles for modal viewport compression */}
      <style>{`
        @media (max-height: 850px) {
          .modal-card {
            padding: 1.25rem !important;
            gap: 0.8rem !important;
          }
          .modal-card h2 {
            font-size: 1.15rem !important;
            margin-bottom: 0.25rem !important;
          }
          .modal-card hr {
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }
          .avatar-container {
            width: 68px !important;
            height: 68px !important;
            border-width: 4px !important;
          }
          .avatar-btn {
            gap: 0.4rem !important;
          }
          .avatar-btn span {
            font-size: 0.75rem !important;
          }
          .typing-text-container {
            font-size: 1rem !important;
            height: 1.5rem !important;
          }
          .modal-footer {
            margin-top: 0.25rem !important;
            padding-top: 0.5rem !important;
            gap: 0.8rem !important;
          }
          .modal-footer button {
            padding: 0.5rem 1.5rem !important;
            font-size: 0.75rem !important;
          }
        }

        @media (max-height: 720px) {
          .modal-card {
            padding: 1rem !important;
            gap: 0.6rem !important;
          }
          .avatar-container {
            width: 54px !important;
            height: 54px !important;
            border-width: 3px !important;
          }
          .avatar-btn {
            gap: 0.25rem !important;
          }
          .avatar-btn span {
            font-size: 0.7rem !important;
          }
          .typing-text-container {
            font-size: 0.9rem !important;
            height: 1.25rem !important;
          }
        }
      `}</style>

      {/* Hướng 2: Top progress bar */}
      <LoadingBar active={isFiltering} />

      {/* Solarpunk Hero Section */}
      <section className="relative pt-8 pb-1 md:pt-12 md:pb-2 overflow-hidden transition-all duration-1000 ease-in-out">
        <div className="w-full space-y-8 animate-fade-in-up flex flex-col justify-center min-h-[160px] transition-all duration-1000 ease-in-out">
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left duration-1000">
            {/* Merged sentence on a single row (flex-wrap for responsiveness) */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-3 text-lg md:text-xl lg:text-2xl font-headline font-black text-primary leading-relaxed max-w-4xl">
              <span>I am</span>
              <div className="flex flex-col items-center gap-0.5 shrink-0 px-1">
                <div className="relative w-[40px] h-[40px] md:w-[48px] md:h-[48px] rounded-full overflow-hidden border-3 border-primary shadow-md">
                  <img 
                    src={activeAvatar.src} 
                    alt={activeAvatar.label} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] text-primary/70 leading-none mt-0.5">
                  {activeAvatar.label}
                </span>
              </div>
              <span>, I want to learn</span>
              <div className="inline-block border-2 border-emerald-300 px-4 py-1.5 bg-emerald-100/60 text-emerald-900 rounded-[2rem_3.5rem_2rem_4rem_/_3.5rem_2rem_4rem_2.5rem] shadow-sm transform rotate-1 hover:rotate-0 transition-transform duration-300 text-base md:text-lg lg:text-xl">
                {activeNames.categoryName || "Anything"}
              </div>
              <span>and I want to practice</span>
              <div className="inline-block border-2 border-sky-300 px-4 py-1.5 bg-sky-100/60 text-sky-900 rounded-[3.5rem_2rem_4rem_2.5rem_/_2rem_3.5rem_2.5rem_4rem] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform duration-300 text-base md:text-lg lg:text-xl">
                {activeNames.subCategoryName || "All Topics"}
              </div>
            </div>

            {/* Change link below */}
            <div className="pt-2">
              <button
                onClick={handleOpenModal}
                className="text-sm md:text-base font-black text-secondary hover:text-secondary-dim underline underline-offset-4 cursor-pointer focus:outline-none transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Center Overlay Modal Popup for Filters */}
      {isFilterModalOpen && (
        <div 
          className="fixed inset-0 bg-black/55 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={handleCloseModalDiscard}
        >
          <div 
            className="bg-[#FAF8F5] dark:bg-slate-900 border-[6px] border-primary/20 dark:border-primary/40 rounded-[2.5rem] p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col gap-6 modal-card"
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
                {locale === "vi" ? "HỦY BỎ" : "CANCEL"}
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-10 py-3.5 bg-primary border-2 border-primary text-on-primary rounded-full text-xs font-black transition-all shadow-lg hover:shadow-primary/30 hover:scale-[1.03] active:scale-95 uppercase tracking-[0.1em] cursor-pointer"
              >
                {locale === "vi" ? "SẴN SÀNG" : "READY"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Tab + Sort controls */}
      <div id="content-tabs" className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
        <div className="inline-flex items-center gap-4">
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
      </div>

      {/* ── Content grids ───────────────────────────────────────────────────── */}
      <div className="min-h-[600px] relative transition-opacity duration-300">
        <div className={activeTab === "exercises" ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          {isFiltering ? <SectionSkeleton /> : (
            <Suspense key={`ex-${searchParams.search || ''}-${searchParams.categoryId || ''}-${userType}`} fallback={<SectionSkeleton />}>
              <ExerciseList promise={promises.assignments} isLoggedIn={isLoggedIn} searchKeyword={searchParams.search} onClear={handleClearSearch} />
            </Suspense>
          )}
        </div>

        <div className={activeTab === "lessons" ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          {isFiltering ? <SectionSkeleton /> : (
            <Suspense key={`le-${searchParams.search || ''}-${searchParams.categoryId || ''}-${userType}`} fallback={<SectionSkeleton />}>
              <LessonList promise={promises.lessons} isLoggedIn={isLoggedIn} searchKeyword={searchParams.search} onClear={handleClearSearch} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
