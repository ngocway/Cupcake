"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import Link from "next/link"
import { Loader2, Search, X } from "lucide-react"
import { LoginButton } from "@/components/LoginButton"
import { LanguageToggle } from "@/components/LanguageToggle"
import { ExerciseCard, LessonCard } from "@/components/public/ContentCards"
import { PublicHeader } from "@/components/public/PublicHeader"

const SUBJECTS = [
  { label: "Tiếng Anh", icon: "category" },
  { label: "Toán học", icon: "functions" },
  { label: "Khoa học", icon: "science" },
]

const GRADES = [
  { label: "Mầm non", icon: "child_care" },
  { label: "Tiểu học", icon: "escalator_warning" },
  { label: "Trung học", icon: "history_edu" },
]

interface Props {
  session: { id: string; name: string | null; image: string | null; role: string | null } | null
  initialExercises: any[]
  hasMoreExercises: boolean
  initialLessons: any[]
  hasMoreLessons: boolean
  allTags: string[]
}

export function LandingPage({ session, initialExercises, hasMoreExercises, initialLessons, hasMoreLessons, allTags }: Props) {
  const [activeTab, setActiveTab] = useState<"exercises" | "lessons">("exercises")
  const [search, setSearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")
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
    if (selectedTags.length) p.set("tags", selectedTags.join(","))
    return `/api/public/assignments?${p}`
  }, [search, selectedSubject, selectedGrade, selectedTags, sort])

  const buildLeUrl = useCallback((page: number) => {
    const p = new URLSearchParams({ page: String(page), sort })
    if (search) p.set("search", search)
    return `/api/public/lessons?${p}`
  }, [search, sort])

  useEffect(() => {
    if (initialRender.current) { initialRender.current = false; return }
    if (activeTab === "exercises") {
      setExercises([]); setExPage(1); setHasMoreEx(true)
      fetch(buildExUrl(1)).then(r => r.json()).then(d => { setExercises(d.items); setHasMoreEx(d.hasMore); setExPage(2) })
    } else {
      setLessons([]); setLePage(1); setHasMoreLe(true)
      fetch(buildLeUrl(1)).then(r => r.json()).then(d => { setLessons(d.items); setHasMoreLe(d.hasMore); setLePage(2) })
    }
  }, [activeTab, search, selectedTags, selectedSubject, selectedGrade, sort])

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
  const clearFilters = () => { setSelectedTags([]); setSelectedSubject(""); setSelectedGrade(""); setSearch("") }

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
            <div className="space-y-1">
              <p className="px-4 py-2 text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest">Môn Học</p>
              {SUBJECTS.map(({ label, icon }) => (
                <button 
                  key={label}
                  onClick={() => setSelectedSubject(selectedSubject === label ? "" : label)}
                  className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 font-bold transition-all ${selectedSubject === label ? "bg-surface-container text-primary scale-98 shadow-sm" : "text-on-surface-variant/70 hover:bg-surface-container-high"}`}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-1 mt-6">
              <p className="px-4 py-2 text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest">Khối Lớp</p>
              {GRADES.map(({ label, icon }) => (
                <button 
                  key={label}
                  onClick={() => setSelectedGrade(selectedGrade === label ? "" : label)}
                  className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 font-bold transition-all ${selectedGrade === label ? "bg-surface-container text-primary scale-98 shadow-sm" : "text-on-surface-variant/70 hover:bg-surface-container-high"}`}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                  {label}
                </button>
              ))}
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
          {/* CTA Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setActiveTab("exercises")}
              className={`relative overflow-hidden group p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer border-2 ${activeTab === "exercises" ? "border-primary bg-primary-container scale-[1.02] shadow-xl shadow-primary/10" : "border-transparent bg-surface-container-high hover:scale-[1.01]"}`}
            >
              <div className="z-10">
                <h2 className="text-2xl font-black text-on-primary-container mb-1">Bài tập</h2>
                <p className="text-on-primary-container/70 text-sm font-medium">Rèn luyện kỹ năng mỗi ngày</p>
              </div>
              <div className="bg-white/30 backdrop-blur-md p-4 rounded-lg z-10 shadow-inner">
                <span className="material-symbols-outlined text-4xl text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
              </div>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
            </div>
            <div 
              onClick={() => setActiveTab("lessons")}
              className={`relative overflow-hidden group p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer border-2 ${activeTab === "lessons" ? "border-secondary bg-secondary-container scale-[1.02] shadow-xl shadow-secondary/10" : "border-transparent bg-surface-container-high hover:scale-[1.01]"}`}
            >
              <div className="z-10">
                <h2 className="text-2xl font-black text-on-secondary-container mb-1">Bài học</h2>
                <p className="text-on-secondary-container/70 text-sm font-medium">Khám phá kiến thức mới</p>
              </div>
              <div className="bg-white/30 backdrop-blur-md p-4 rounded-lg z-10 shadow-inner">
                <span className="material-symbols-outlined text-4xl text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
              </div>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
            </div>
          </section>

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

