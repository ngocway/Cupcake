"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import Link from "next/link"
import { Loader2, Search, X } from "lucide-react"
import { LoginButton } from "@/components/LoginButton"
import { LanguageToggle } from "@/components/LanguageToggle"
import { ExerciseCard, LessonCard } from "@/components/public/ContentCards"
import { PublicHeader } from "@/components/public/PublicHeader"
import { useThemeStore } from "@/store/useThemeStore"
import { useContentStore } from "@/store/useContentStore"
import { VisualCategoryMenu } from "@/components/public/VisualCategoryMenu"

// Filters for Subject and Grade are removed as per user request to simplify hierarchy

interface Props {
  session: { id: string; name: string | null; image: string | null; role: string | null } | null
  initialExercises: any[]
  hasMoreExercises: boolean
  initialLessons: any[]
  hasMoreLessons: boolean
  allTags: string[]
  categoryTree: any[]
}

export function LandingPage({ session, initialExercises, hasMoreExercises, initialLessons, hasMoreLessons, allTags, categoryTree }: Props) {
  const [activeTab, setActiveTab] = useState<"exercises" | "lessons">("exercises")
  const [search, setSearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")
  const { 
    exercises: storeExercises, setExercises, addExercises, 
    lessons: storeLessons, setLessons, addLessons,
    hasMoreEx, setHasMoreEx, 
    hasMoreLe, setHasMoreLe, 
    exPage, setExPage, 
    lePage, setLePage,
    selectedCategoryId, setSelectedCategoryId,
    selectedSubCategoryId, setSelectedSubCategoryId
  } = useContentStore()
  const { isClearBackground, setClearBackground } = useThemeStore()
  const [sort, setSort] = useState<"newest" | "popular" | "trending">("newest")
  const [isAtTop, setIsAtTop] = useState(true)

  const [loadingEx, setLoadingEx] = useState(false)
  const [loadingLe, setLoadingLe] = useState(false)

  const initialRender = useRef(true)

  // Use props as fallback for the very first render before store is populated
  const exercises = storeExercises.length > 0 || !initialRender.current ? storeExercises : initialExercises
  const lessons = storeLessons.length > 0 || !initialRender.current ? storeLessons : initialLessons

  // Initialize store with server-side data if empty
  useEffect(() => {
    if (storeExercises.length === 0 && initialExercises.length > 0) {
      setExercises(initialExercises); setHasMoreEx(hasMoreExercises); setExPage(2)
    }
    if (storeLessons.length === 0 && initialLessons.length > 0) {
      setLessons(initialLessons); setHasMoreLe(hasMoreLessons); setLePage(2)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const { ref: exBottomRef, inView: exBottomInView } = useInView({ threshold: 0 })
  const { ref: leBottomRef, inView: leBottomInView } = useInView({ threshold: 0 })

  const buildExUrl = useCallback((page: number) => {
    const p = new URLSearchParams({ page: String(page), sort })
    if (search) p.set("search", search)
    if (selectedSubject) p.set("subject", selectedSubject)
    if (selectedGrade) p.set("gradeLevel", selectedGrade)
    const finalCatId = selectedSubCategoryId || selectedCategoryId;
    if (finalCatId) p.set("categoryId", finalCatId)
    if (selectedTags.length) p.set("tags", selectedTags.join(","))
    return `/api/public/assignments?${p}`
  }, [search, selectedSubject, selectedGrade, selectedTags, selectedCategoryId, selectedSubCategoryId, sort])

  const buildLeUrl = useCallback((page: number) => {
    const p = new URLSearchParams({ page: String(page), sort })
    const finalCatId = selectedSubCategoryId || selectedCategoryId;
    if (search) p.set("search", search)
    if (finalCatId) p.set("categoryId", finalCatId)
    return `/api/public/lessons?${p}`
  }, [search, selectedCategoryId, selectedSubCategoryId, sort])

  const prevFilters = useRef("")
  
  useEffect(() => {
    if (initialRender.current) { initialRender.current = false; return }
    
    const filters = JSON.stringify({ search, selectedTags, selectedSubject, selectedGrade, selectedCategoryId, selectedSubCategoryId, sort })
    const filtersChanged = prevFilters.current !== filters
    prevFilters.current = filters

    const isEx = activeTab === "exercises"
    const currentData = isEx ? storeExercises : storeLessons
    const setData = isEx ? setExercises : setLessons
    const setLoading = isEx ? setLoadingEx : setLoadingLe
    const setPage = isEx ? setExPage : setLePage
    const setHasMore = isEx ? setHasMoreEx : setHasMoreLe
    const buildUrl = isEx ? buildExUrl : buildLeUrl

    // If filters changed, reset EVERYTHING
    if (filtersChanged) {
      setExercises([])
      setLessons([])
      setExPage(1)
      setLePage(1)
      setHasMoreEx(true)
      setHasMoreLe(true)
      prevFilters.current = filters
    } else if (currentData.length > 0) {
      // Instant switch: data exists and filters haven't changed
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(buildUrl(1))
      .then(r => r.json())
      .then(d => { 
        setData(d.items)
        setHasMore(d.hasMore)
        setPage(2)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Prefetch other tab if empty
    const otherBuildUrl = isEx ? buildLeUrl : buildExUrl
    const otherData = isEx ? storeLessons : storeExercises
    const setOtherData = isEx ? setLessons : setExercises
    const setOtherHasMore = isEx ? setHasMoreLe : setHasMoreEx
    const setOtherPage = isEx ? setLePage : setExPage
    
    if (otherData.length === 0) {
      fetch(otherBuildUrl(1)).then(r => r.json()).then(d => {
        setOtherData(d.items)
        setOtherHasMore(d.hasMore)
        setOtherPage(2)
      })
    }
  }, [activeTab, search, selectedTags, selectedSubject, selectedGrade, selectedCategoryId, selectedSubCategoryId, sort])

  useEffect(() => {
    if (!exBottomInView || !hasMoreEx || loadingEx || activeTab !== "exercises") return
    setLoadingEx(true)
    fetch(buildExUrl(exPage)).then(r => r.json()).then(d => {
      addExercises(d.items)
      setHasMoreEx(d.hasMore); setExPage(exPage + 1); setLoadingEx(false)
    })
  }, [exBottomInView, exPage, hasMoreEx, loadingEx, activeTab])

  useEffect(() => {
    if (!leBottomInView || !hasMoreLe || loadingLe || activeTab !== "lessons") return
    setLoadingLe(true)
    fetch(buildLeUrl(lePage)).then(r => r.json()).then(d => {
      addLessons(d.items)
      setHasMoreLe(d.hasMore); setLePage(lePage + 1); setLoadingLe(false)
    })
  }, [leBottomInView, lePage, hasMoreLe, loadingLe, activeTab])

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  const clearFilters = () => { setSelectedTags([]); setSelectedSubject(""); setSelectedGrade(""); setSelectedCategoryId(""); setSelectedSubCategoryId(""); setSearch(""); setClearBackground(false) }

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const toggleCategoryExpand = (id: string) => setExpandedCategories(p => ({ ...p, [id]: !p[id] }))

  // Auto-expand sidebar parent when selectedCategoryId changes
  useEffect(() => {
    if (selectedCategoryId) {
      setExpandedCategories(prev => ({ ...prev, [selectedCategoryId]: true }))
    }
  }, [selectedCategoryId])

  const renderCategory = (node: any, level = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedCategories[node.id]
    const isSelected = selectedCategoryId === node.id || selectedSubCategoryId === node.id

    return (
      <div key={node.id} className="space-y-0.5">
        <div 
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 group cursor-pointer ${
            isSelected 
              ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
              : "text-slate-600 hover:bg-slate-50 dark:hover:bg-gray-800"
          }`}
          style={{ marginLeft: `${level * 16}px` }}
          onClick={() => {
            if (level === 0) {
              // Level 1: Toggle parent
              const isNowSelected = selectedCategoryId === node.id ? "" : node.id
              setSelectedCategoryId(isNowSelected)
              setSelectedSubCategoryId("") // Reset sub when parent changes
              setClearBackground(!!isNowSelected && !!node.showClearBackground)
            } else {
              // Level 2+: Set as sub-category
              const isNowSelected = selectedSubCategoryId === node.id ? "" : node.id
              setSelectedSubCategoryId(isNowSelected)
            }
          }}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(node.id) }}
              className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${isExpanded ? "rotate-90" : ""} ${isSelected ? "text-white" : "text-slate-400 group-hover:text-primary"}`}
            >
              chevron_right
            </button>
          ) : (
            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-slate-300 group-hover:bg-primary-dim"}`} />
          )}
          <span className={`text-sm font-bold flex-1 truncate ${isSelected ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>{node.name}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="relative ml-6 space-y-0.5">
            <div className="absolute left-[-14px] top-0 bottom-0 w-[1.5px] bg-slate-100 dark:bg-gray-800 rounded-full" />
            {node.children.map((child: any) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="text-foreground min-h-screen font-sans selection:bg-primary/20 relative">
      <PublicHeader session={session} search={search} setSearch={setSearch} />

      <div className="w-full pt-32 pb-20 flex flex-col lg:flex-row items-start gap-10 px-6 md:px-10 max-w-[1600px] mx-auto">
        {/* Modern Sidebar Navigation */}
        <aside className={`hidden lg:flex w-80 flex-col p-8 gap-10 glass rounded-3xl h-fit max-h-[calc(100vh-10rem)] overflow-y-auto no-scrollbar sticky transition-all duration-500 shadow-xl ${isAtTop ? "top-32" : "top-10"}`}>
          <div>
            
            <div className="space-y-2">
              <button 
                onClick={() => { setSelectedCategoryId(""); setSelectedSubCategoryId(""); setClearBackground(false) }}
                className={`w-full flex items-center gap-3 rounded-2xl px-5 py-4 font-bold transition-all duration-300 ${!selectedCategoryId ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.02]" : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"}`}
              >
                <span className="material-symbols-outlined text-[24px]">grid_view</span>
                Tất cả chủ đề
              </button>
              
              <div className="mt-6 space-y-1">
                {categoryTree.map(node => renderCategory(node))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <div className="px-1 mb-6">
              <h4 className="text-tiny font-black text-on-surface-variant flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
                Thẻ phổ biến
              </h4>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {allTags.slice(0, 10).map(tag => (
                <button 
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-small px-4 py-2 rounded-xl font-bold transition-all duration-300 border ${selectedTags.includes(tag) ? "bg-secondary text-on-secondary border-secondary shadow-lg shadow-secondary/20 scale-105" : "bg-surface/50 text-on-surface-variant border-border hover:border-secondary hover:text-secondary hover:translate-y-[-2px]"}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-12 animate-fade-in-up">
          {/* Visual Category Menu */}
          <VisualCategoryMenu categoryTree={categoryTree} />

          {/* Header Section */}

            {/* Pill Style Tabs */}
            <div className="inline-flex p-1.5 glass rounded-[28px] items-center shadow-lg">
              <button 
                onClick={() => setActiveTab("lessons")}
                className={`px-8 py-3.5 rounded-[24px] text-small font-black transition-all duration-300 ${
                  activeTab === "lessons" 
                    ? "bg-primary text-on-primary shadow-xl shadow-primary/25" 
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                VIDEO BÀI HỌC
              </button>
              <button 
                onClick={() => setActiveTab("exercises")}
                className={`px-8 py-3.5 rounded-[24px] text-small font-black transition-all duration-300 ${
                  activeTab === "exercises" 
                    ? "bg-primary text-on-primary shadow-xl shadow-primary/25" 
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                BÀI TẬP & ĐỀ THI
              </button>
            </div>


          {/* Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {activeTab === "exercises" ? (
              exercises.map((item, idx) => (
                <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                  <ExerciseCard item={item} isLoggedIn={!!session} />
                </div>
              ))
            ) : (
              lessons.map((item, idx) => (
                <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                  <LessonCard item={item} isLoggedIn={!!session} />
                </div>
              ))
            )}
          </div>

          {/* Loading State for initial fetch */}
          {(activeTab === "exercises" ? loadingEx && exercises.length === 0 : loadingLe && lessons.length === 0) && (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 animate-fade-in">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary animate-pulse">downloading</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-on-surface font-bold">Đang tải dữ liệu...</h3>
                <p className="text-body text-on-surface-variant">Vui lòng đợi trong giây lát</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!(activeTab === "exercises" ? loadingEx : loadingLe) && 
           (activeTab === "exercises" ? exercises.length === 0 : lessons.length === 0) && 
           !initialRender.current && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center animate-float">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant">search_off</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-on-surface">Không tìm thấy kết quả</h3>
                <p className="text-body text-on-surface-variant">Hãy thử thay đổi từ khóa hoặc bộ lọc khác nhé!</p>
              </div>
              <button onClick={clearFilters} className="text-primary font-bold hover:underline">Xóa tất cả bộ lọc</button>
            </div>
          )}

          {/* Load More */}
          {(activeTab === "exercises" ? hasMoreEx : hasMoreLe) && (
            <div className="flex justify-center pt-12">
              <button 
                className="group flex items-center gap-4 bg-white dark:bg-slate-900 border-2 border-primary/20 text-primary px-10 py-4 rounded-full text-small font-black hover:bg-primary hover:text-on-primary hover:border-primary transition-all duration-500 shadow-xl shadow-primary/5 hover:shadow-primary/20"
                ref={activeTab === "exercises" ? exBottomRef : leBottomRef}
              >
                {loadingEx || loadingLe ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    XEM THÊM NỘI DUNG
                    <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform duration-300">keyboard_arrow_down</span>
                  </>
                )}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modern Footer */}
      <footer className="w-full glass mt-20 pt-20 pb-10 px-6 md:px-10 border-t border-border overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-40" />
        
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
          <div className="space-y-6">
            <h2 className="text-3xl text-primary font-black uppercase tracking-tighter">Scholar Script</h2>
            <p className="text-body text-on-surface-variant opacity-80 leading-relaxed">Nền tảng học tập thông minh, giúp bạn chinh phục kiến thức bằng trải nghiệm tương tác hiện đại và sáng tạo nhất.</p>
            <div className="flex gap-4">
              {['public', 'chat_bubble', 'video_library', 'share'].map(icon => (
                <button key={icon} className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary hover:border-primary transition-all duration-300">
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-primary font-black uppercase tracking-widest text-tiny">Về chúng tôi</h4>
            <nav className="flex flex-col gap-4">
              {['Câu chuyện thương hiệu', 'Đội ngũ phát triển', 'Tuyển dụng', 'Liên hệ'].map(item => (
                <Link key={item} className="text-body text-on-surface-variant hover:text-primary transition-colors w-fit" href="#">{item}</Link>
              ))}
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="text-primary font-black uppercase tracking-widest text-tiny">Hỗ trợ học viên</h4>
            <nav className="flex flex-col gap-4">
              {['Hướng dẫn sử dụng', 'Điều khoản dịch vụ', 'Chính sách bảo mật', 'Câu hỏi thường gặp'].map(item => (
                <Link key={item} className="text-body text-on-surface-variant hover:text-primary transition-colors w-fit" href="#">{item}</Link>
              ))}
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="text-primary font-black uppercase tracking-widest text-tiny">Đăng ký bản tin</h4>
            <p className="text-small text-on-surface-variant opacity-70">Nhận thông báo về các bài tập và khóa học mới nhất mỗi tuần.</p>
            <div className="flex glass rounded-2xl p-1.5 shadow-inner group focus-within:ring-2 ring-primary/20 transition-all">
              <input className="bg-transparent border-none focus:ring-0 text-small flex-1 px-4 py-2" placeholder="Email của bạn..." type="text" />
              <button className="bg-primary text-on-primary px-6 py-2 rounded-xl font-bold hover:bg-primary-dim transition-colors shadow-lg">Gửi</button>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto mt-20 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 opacity-60">
          <p className="text-small">© 2024 Scholar Script. All rights reserved. Made with ❤️ for students.</p>
          <div className="flex gap-8 text-small font-bold">
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>

  )
}

