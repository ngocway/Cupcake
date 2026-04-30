"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import Link from "next/link"
import { Loader2, Search, X } from "lucide-react"
import { LoginButton } from "@/components/LoginButton"
import { LanguageToggle } from "@/components/LanguageToggle"
import { ExerciseCard, LessonCard } from "@/components/public/ContentCards"
import { PublicHeader } from "@/components/public/PublicHeader"

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
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [sort, setSort] = useState<"newest" | "popular" | "trending">("newest")

  const [exercises, setExercises] = useState(initialExercises)
  const [exPage, setExPage] = useState(2)
  const [hasMoreEx, setHasMoreEx] = useState(hasMoreExercises)
  const [loadingEx, setLoadingEx] = useState(false)

  const [lessons, setLessons] = useState(initialLessons)
  const [lePage, setLePage] = useState(2)
  const [hasMoreLe, setHasMoreLe] = useState(hasMoreLessons)
  const [loadingLe, setLoadingLe] = useState(false)
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const initialRender = useRef(true)
  const { ref: exBottomRef, inView: exBottomInView } = useInView({ threshold: 0 })
  const { ref: leBottomRef, inView: leBottomInView } = useInView({ threshold: 0 })

  const buildExUrl = useCallback((page: number) => {
    const p = new URLSearchParams({ page: String(page), sort })
    if (search) p.set("search", search)
    if (selectedSubject) p.set("subject", selectedSubject)
    if (selectedGrade) p.set("gradeLevel", selectedGrade)
    if (selectedCategoryId) p.set("categoryId", selectedCategoryId)
    if (selectedTags.length) p.set("tags", selectedTags.join(","))
    return `/api/public/assignments?${p}`
  }, [search, selectedSubject, selectedGrade, selectedTags, selectedCategoryId, sort])

  const buildLeUrl = useCallback((page: number) => {
    const p = new URLSearchParams({ page: String(page), sort })
    if (search) p.set("search", search)
    if (selectedCategoryId) p.set("categoryId", selectedCategoryId)
    return `/api/public/lessons?${p}`
  }, [search, selectedCategoryId, sort])

  useEffect(() => {
    if (initialRender.current) { initialRender.current = false; return }
    if (activeTab === "exercises") {
      setExercises([]); setExPage(1); setHasMoreEx(true)
      fetch(buildExUrl(1)).then(r => r.json()).then(d => { setExercises(d.items); setHasMoreEx(d.hasMore); setExPage(2) })
    } else {
      setLessons([]); setLePage(1); setHasMoreLe(true)
      fetch(buildLeUrl(1)).then(r => r.json()).then(d => { setLessons(d.items); setHasMoreLe(d.hasMore); setLePage(2) })
    }
  }, [activeTab, search, selectedTags, selectedSubject, selectedGrade, selectedCategoryId, sort])

  useEffect(() => {
    if (!exBottomInView || !hasMoreEx || loadingEx || activeTab !== "exercises") return
    setLoadingEx(true)
    fetch(buildExUrl(exPage)).then(r => r.json()).then(d => {
      setExercises(prev => { const ids = new Set(prev.map((i: any) => i.id)); return [...prev, ...d.items.filter((i: any) => !ids.has(i.id))] })
      setHasMoreEx(d.hasMore); setExPage(p => p + 1); setLoadingEx(false)
    })
  }, [exBottomInView])

  useEffect(() => {
    if (!leBottomInView || !hasMoreLe || loadingLe || activeTab !== "lessons") return
    setLoadingLe(true)
    fetch(buildLeUrl(lePage)).then(r => r.json()).then(d => {
      setLessons(prev => { const ids = new Set(prev.map((i: any) => i.id)); return [...prev, ...d.items.filter((i: any) => !ids.has(i.id))] })
      setHasMoreLe(d.hasMore); setLePage(p => p + 1); setLoadingLe(false)
    })
  }, [leBottomInView])

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  const clearFilters = () => { setSelectedTags([]); setSelectedSubject(""); setSelectedGrade(""); setSelectedCategoryId(""); setSearch("") }

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const toggleCategoryExpand = (id: string) => setExpandedCategories(p => ({ ...p, [id]: !p[id] }))

  const renderCategory = (node: any, level = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedCategories[node.id]
    const isSelected = selectedCategoryId === node.id

    return (
      <div key={node.id} className="space-y-1">
        <div 
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all group cursor-pointer ${
            isSelected 
              ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.02]" 
              : "text-on-surface-variant/70 hover:bg-surface-container-high"
          }`}
          style={{ marginLeft: `${level * 12}px` }}
          onClick={() => setSelectedCategoryId(isSelected ? "" : node.id)}
        >
          {hasChildren && (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(node.id) }}
              className={`material-symbols-outlined text-[18px] transition-transform ${isExpanded ? "rotate-90" : ""}`}
            >
              chevron_right
            </button>
          )}
          {!hasChildren && <span className="material-symbols-outlined text-[18px] opacity-40">subdirectory_arrow_right</span>}
          <span className="font-bold flex-1 truncate">{node.name}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="border-l-2 border-slate-100 ml-6 pl-2 space-y-1">
            {node.children.map((child: any) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-background text-on-surface min-h-screen font-body">
      <PublicHeader session={session} search={search} setSearch={setSearch} />

      <div className="w-full pt-24 pb-12 flex items-start gap-8 px-6">
        {/* Sidebar Navigation */}
        <aside className={`hidden lg:flex w-64 flex-col p-6 gap-6 bg-surface-container-low rounded-[20px] h-fit max-h-[calc(100vh-10rem)] overflow-y-auto no-scrollbar sticky transition-all duration-500 ${isAtTop ? "top-28" : "top-6"} text-sm`}>
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">school</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-dim">Categories</h3>
                <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">Explore Topics</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedCategoryId("")}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 font-bold transition-all ${!selectedCategoryId ? "bg-surface-container text-primary shadow-sm" : "text-on-surface-variant/70 hover:bg-surface-container-high"}`}
              >
                <span className="material-symbols-outlined">grid_view</span>
                Tất cả chủ đề
              </button>
              
              <div className="space-y-1 mt-4">
                {categoryTree.map(node => renderCategory(node))}
              </div>
            </div>
          </div>
          <div className="mt-auto space-y-4">
            <div className="p-4 bg-surface-container rounded-xl">
              <p className="text-xs font-bold text-primary-dim mb-2">Popular Tags</p>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 5).map(tag => (
                  <button 
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${selectedTags.includes(tag) ? "bg-primary text-on-primary" : "bg-white text-primary hover:bg-primary-container"}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-4">
          {/* New Pill Style Tabs - Moved to Left */}
          <div className="flex flex-col items-start pt-2 pb-6">
            
            <div className="inline-flex p-1.5 bg-[#1a1c1e] rounded-[24px] items-center shadow-inner border border-white/5">
              <button 
                onClick={() => setActiveTab("lessons")}
                className={`px-8 py-3 rounded-[20px] text-sm font-bold transition-all duration-300 ${
                  activeTab === "lessons" 
                    ? "bg-[#1a73e8] text-white shadow-xl shadow-blue-500/20" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tất cả bài học
              </button>
              <button 
                onClick={() => setActiveTab("exercises")}
                className={`px-8 py-3 rounded-[20px] text-sm font-bold transition-all duration-300 ${
                  activeTab === "exercises" 
                    ? "bg-[#1a73e8] text-white shadow-xl shadow-blue-500/20" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Bài tập / Đề thi
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <section className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button 
              onClick={() => setSelectedTags([])}
              className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${selectedTags.length === 0 ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "bg-tertiary-container/30 text-on-tertiary-container hover:bg-tertiary-container/50"}`}
            >
              Tất cả
            </button>
            {allTags.slice(0, 10).map(tag => (
              <button 
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${selectedTags.includes(tag) ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "bg-tertiary-container/30 text-on-tertiary-container hover:bg-tertiary-container/50"}`}
              >
                #{tag}
              </button>
            ))}
          </section>

          {/* Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeTab === "exercises" ? (
              exercises.map(item => <ExerciseCard key={item.id} item={item} isLoggedIn={!!session} />)
            ) : (
              lessons.map(item => <LessonCard key={item.id} item={item} isLoggedIn={!!session} />)
            )}
          </div>

          {/* Load More */}
          <div className="flex justify-center pt-8">
            <button 
              className="group flex items-center gap-3 bg-white border-2 border-primary/20 text-primary px-8 py-3 rounded-full font-bold hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-lg shadow-primary/5"
              ref={activeTab === "exercises" ? exBottomRef : leBottomRef}
            >
              {loadingEx || loadingLe ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Tải thêm kết quả
                  <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">expand_more</span>
                </>
              )}
            </button>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low py-12 px-8 border-t border-primary/10 font-display text-xs uppercase tracking-widest mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="text-xl font-black text-primary uppercase">Scholar Script</span>
            <p className="text-on-surface-variant/60 normal-case tracking-normal">Learn with kinetic energy. Join the future of education where every script tells a story of success.</p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-primary mb-2">Company</h4>
            <Link className="text-on-surface-variant/60 hover:text-primary transition-transform hover:translate-y-[-2px]" href="#">About Us</Link>
            <Link className="text-on-surface-variant/60 hover:text-primary transition-transform hover:translate-y-[-2px]" href="#">Careers</Link>
            <Link className="text-on-surface-variant/60 hover:text-primary transition-transform hover:translate-y-[-2px]" href="#">Contact</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-primary mb-2">Legal</h4>
            <Link className="text-on-surface-variant/60 hover:text-primary transition-transform hover:translate-y-[-2px]" href="#">Terms of Service</Link>
            <Link className="text-on-surface-variant/60 hover:text-primary transition-transform hover:translate-y-[-2px]" href="#">Privacy Policy</Link>
            <Link className="text-on-surface-variant/60 hover:text-primary transition-transform hover:translate-y-[-2px]" href="#">Cookie Policy</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-primary mb-2">Newsletter</h4>
            <div className="flex bg-white rounded-full p-1 shadow-inner">
              <input className="bg-transparent border-none focus:ring-0 text-xs flex-1 px-4 py-2 lowercase" placeholder="Email của bạn" type="text" />
              <button className="bg-primary text-on-primary p-2 rounded-full"><span className="material-symbols-outlined text-sm">send</span></button>
            </div>
          </div>
        </div>
        <div className="w-full px-6 py-3 flex items-center justify-between border-t border-on-surface-variant/10 flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-surface-variant/40">© 2024 Scholar Script. Learn with kinetic energy.</p>
          <div className="flex gap-6">
            <span className="material-symbols-outlined text-on-surface-variant/40 hover:text-primary cursor-pointer">public</span>
            <span className="material-symbols-outlined text-on-surface-variant/40 hover:text-primary cursor-pointer">chat_bubble</span>
            <span className="material-symbols-outlined text-on-surface-variant/40 hover:text-primary cursor-pointer">video_library</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

