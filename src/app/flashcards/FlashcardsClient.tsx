"use client"

import { useState, useEffect, useRef } from "react"
import { getFlashcardsByTopic } from "@/actions/flashcards-actions"
import { getUserVocabLanguage, updateUserVocabLanguage } from "@/actions/vocab-settings"
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  Award, 
  HelpCircle,
  Play
} from "lucide-react"

// Định nghĩa kiểu dữ liệu
interface Topic {
  id: string
  categoryId: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
  slug: string
  topics: Topic[]
}

interface Flashcard {
  id: string
  topicId: string
  word: string
  phonetic: string | null
  definition: string | null
  definitionVi: string | null
  definitionTh: string | null
  definitionId: string | null
  exampleSentence: string | null
  imageUrl: string | null
  orderIndex: number
}

interface FlashcardsClientProps {
  initialCategories: Category[]
}

export function FlashcardsClient({ initialCategories }: FlashcardsClientProps) {
  // Sắp xếp các danh mục theo thứ tự độ tuổi: 2-5 -> 6-12 -> Teenagers -> Advanced Readers
  const CATEGORY_ORDER = ["kids-2-5", "kid-6-12", "teen", "readers"]
  const categories = [...initialCategories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.slug);
    const indexB = CATEGORY_ORDER.indexOf(b.slug);
    return indexA - indexB;
  });

  // Trạng thái chọn Danh mục & Chủ đề
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(categories[0] || null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  
  // Trạng thái học Flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isFlipped, setIsFlipped] = useState<boolean>(false)
  const [focusMode, setFocusMode] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [voicesLoaded, setVoicesLoaded] = useState<boolean>(false)
  
  // Trạng thái ngôn ngữ dịch nghĩa (đồng bộ hóa với vocab settings & localStorage)
  const [currentLang, setCurrentLang] = useState<string>('EN')

  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }

  // Tải tùy chọn ngôn ngữ khi hiển thị
  useEffect(() => {
    async function loadLangPref() {
      if (typeof window !== "undefined") {
        const dbPref = await getUserVocabLanguage()
        if (dbPref) {
          setCurrentLang(dbPref)
        } else {
          const localPref = localStorage.getItem('vocabLang')
          if (localPref) {
            setCurrentLang(localPref)
          } else {
            // Tự nhận diện ngôn ngữ thiết bị lần đầu tiên
            const browserLang = navigator.language.toLowerCase()
            let defaultLang = 'EN'
            if (browserLang.includes('vi')) defaultLang = 'VI'
            else if (browserLang.includes('th')) defaultLang = 'TH'
            else if (browserLang.includes('id')) defaultLang = 'ID'
            
            setCurrentLang(defaultLang)
            localStorage.setItem('vocabLang', defaultLang)
          }
        }
      }
    }
    loadLangPref()
  }, [])

  // Xử lý thay đổi ngôn ngữ dịch nghĩa
  const handleLangChange = async (lang: string) => {
    setCurrentLang(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem('vocabLang', lang)
    }
    try {
      await updateUserVocabLanguage(lang)
    } catch (e) {
      console.error("Failed to update language preference in database:", e)
    }
  }

  // Tải danh sách giọng nói Web Speech API chuẩn en-US
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
        setVoicesLoaded(true)
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Hàm phát âm từ vựng tiếng Anh
  const handleSpeak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel() // Dừng giọng nói hiện tại (nếu có)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = 0.8 // Đọc chậm hơn 20% giúp phát âm cực kỳ rõ ràng, thong thả
      utterance.pitch = 1.05 // Tăng cao độ nhẹ giúp giọng nói trong trẻo sinh động hơn

      // Ưu tiên chọn các giọng đọc en-US tự nhiên, chất lượng cao
      const voices = window.speechSynthesis.getVoices()
      const premiumVoice = voices.find(v => 
        (v.lang.startsWith("en-US") || v.lang === "en_US") && 
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Zira") || v.name.includes("Samantha"))
      ) || voices.find(v => v.lang.startsWith("en-US") || v.lang === "en_US")

      if (premiumVoice) {
        utterance.voice = premiumVoice
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }

  // Hàm phát âm từ vựng (Ưu tiên dùng audio lồng tiếng tải lên nếu có, nếu không thì dùng Web Speech API)
  const handlePlayAudio = (card: any) => {
    if (!card) return
    stopCurrentAudio()
    if (card.audioUrl && card.audioUrl.trim()) {
      const audio = new Audio(card.audioUrl)
      currentAudioRef.current = audio
      audio.play().catch(err => {
        console.error("Lỗi phát audio tùy chỉnh:", err)
        // Fallback to speech synthesis
        handleSpeak(card.word)
      })
    } else {
      handleSpeak(card.word)
    }
  }

  // Tự động phát âm khi lật sang mặt sau (áp dụng cho mọi nhóm tuổi)
  useEffect(() => {
    if (isFlipped && selectedCategory && flashcards[currentIndex]) {
      // Delay nhẹ để âm thanh phát ra đồng thời cùng lúc xoay mặt thẻ xong
      const timer = setTimeout(() => {
        handlePlayAudio(flashcards[currentIndex])
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isFlipped, currentIndex, selectedCategory, flashcards])

  // Xử lý nạp Flashcards khi chọn xong Topic
  const handleSelectTopic = async (topic: Topic) => {
    setLoading(true)
    setSelectedTopic(topic)
    
    try {
      const cards = await getFlashcardsByTopic(topic.id)
      
      if (cards.length > 0) {
        // Shuffling cards using Fisher-Yates algorithm
        const shuffledCards = [...cards].sort(() => Math.random() - 0.5)
        setFlashcards(shuffledCards)
        setCurrentIndex(0)
        setIsFlipped(false)
        setFocusMode(true)
      } else {
        alert("This topic does not have any flashcards yet. Please choose another topic!")
        setSelectedTopic(null)
      }
    } catch (error) {
      console.error("Error loading flashcards:", error)
      alert("An error occurred while loading flashcards. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Điều hướng thẻ
  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    stopCurrentAudio()
    setIsFlipped(false)
    // Chờ hiệu ứng lật thẻ về mặt trước hoàn tất trước khi đổi nội dung
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length)
    }, 200)
  }

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    stopCurrentAudio()
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    }, 200)
  }

  // Quay lại màn hình chọn
  const handleBackToSelection = () => {
    stopCurrentAudio()
    setFocusMode(false)
    setSelectedTopic(null)
    setFlashcards([])
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  // Hỗ trợ bấm phím mũi tên & Space để lật/chuyển thẻ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusMode || flashcards.length === 0) return
      
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        setIsFlipped(prev => !prev)
      } else if (e.key === "ArrowRight") {
        handleNext()
      } else if (e.key === "ArrowLeft") {
        handlePrev()
      } else if (e.key === "Escape") {
        handleBackToSelection()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [focusMode, flashcards, currentIndex])

  const activeCard = flashcards[currentIndex]
  const progressPercent = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0

  // Tải trước ảnh của thẻ tiếp theo và thẻ trước đó để tránh bóng ma/độ trễ
  useEffect(() => {
    if (flashcards.length > 0) {
      const nextIndex = (currentIndex + 1) % flashcards.length
      const prevIndex = (currentIndex - 1 + flashcards.length) % flashcards.length
      
      const nextCard = flashcards[nextIndex]
      const prevCard = flashcards[prevIndex]
      
      if (nextCard?.imageUrl) {
        const img = new Image()
        img.src = nextCard.imageUrl
      }
      if (prevCard?.imageUrl) {
        const img = new Image()
        img.src = prevCard.imageUrl
      }
    }
  }, [currentIndex, flashcards])

  // -------------------------------------------------------------
  // VIEW 1: SELECTION SCREEN
  // -------------------------------------------------------------
  if (!focusMode) {
    // Helper function to map topics to beautiful visual emojis
    const getTopicEmoji = (slug: string, name: string) => {
      const n = name.toLowerCase()
      const s = slug.toLowerCase()
      if (n.includes("animal")) return "🦁"
      if (n.includes("fruit")) return "🍓"
      if (n.includes("school")) return "🏫"
      if (n.includes("nature")) return "🌲"
      if (n.includes("space") || n.includes("universe")) return "🚀"
      if (n.includes("sport") || n.includes("hobby") || n.includes("hobbies")) return "⚽"
      if (n.includes("tech") || n.includes("business") || n.includes("computer")) return "💻"
      if (n.includes("art") || n.includes("literature") || n.includes("book")) return "🎨"
      return "📚"
    }

    return (
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
        
        {/* Title & Introduction */}
        <div className="text-center space-y-5 relative py-6">
          {/* Floating subtle pastel colorful blur spots in background */}
          <div className="absolute top-0 left-1/4 w-16 h-16 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-20 h-20 bg-pink-400/20 rounded-full blur-xl animate-pulse" />
          
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-400/10 to-teal-500/10 border border-emerald-200/50 text-emerald-700 dark:text-emerald-400 font-black text-xs uppercase tracking-widest shadow-sm">
            <Sparkles className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
            <span>✨ Interactive Learning Playground ✨</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
            English <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-primary bg-clip-text text-transparent">Flashcards</span> Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            Learn vocabulary naturally through interactive 3D cards, professional Text-To-Speech pronunciation, and beautiful visual associations!
          </p>
        </div>

        {/* Selection Area (Category & Topic on the same page) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[40px] p-6 md:p-8 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-10">
          
          {/* A. Category Selector */}
          <div className="space-y-5">
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-primary" />
              <span>Step 1: Select Age Category</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {categories.map((cat) => {
                const isActive = selectedCategory?.id === cat.id
                
                // Dynamic style and emoji mapping for categories
                let catIcon = "🧸"
                let catBg = "bg-amber-100/80 border-amber-200 text-amber-600"
                let bgGradient = "from-amber-400 to-orange-500"
                let ageRange = "2-5 Years"
                let glowShadow = "shadow-amber-100/60"

                if (cat.slug === "kid-6-12") {
                  catIcon = "🎒"
                  catBg = "bg-emerald-100/80 border-emerald-200 text-emerald-600"
                  bgGradient = "from-emerald-400 to-teal-500"
                  ageRange = "6-12 Years"
                  glowShadow = "shadow-emerald-100/60"
                } else if (cat.slug === "teen") {
                  catIcon = "🎧"
                  catBg = "bg-indigo-100/80 border-indigo-200 text-indigo-600"
                  bgGradient = "from-indigo-400 to-violet-500"
                  ageRange = "Teenagers"
                  glowShadow = "shadow-indigo-100/60"
                } else if (cat.slug === "readers") {
                  catIcon = "🚀"
                  catBg = "bg-pink-100/80 border-pink-200 text-pink-600"
                  bgGradient = "from-pink-400 to-rose-500"
                  ageRange = "Advanced"
                  glowShadow = "shadow-pink-100/60"
                }

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat)
                      setSelectedTopic(null) // Reset old topic
                    }}
                    className={`relative overflow-hidden p-6 rounded-[32px] border-4 transition-all duration-500 flex flex-col text-left group active:scale-95 ${
                      isActive 
                        ? `border-primary bg-white shadow-2xl ${glowShadow} scale-[1.03]` 
                        : "border-slate-100 dark:border-slate-800 bg-slate-50/50 hover:bg-white hover:border-primary/30 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-100"
                    }`}
                  >
                    {/* Background Glow */}
                    {isActive && (
                      <span className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgGradient} opacity-[0.08] rounded-full blur-2xl -translate-y-8 translate-x-8`} />
                    )}
                    
                    {/* Category circular icon box */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 transition-transform duration-500 group-hover:scale-110 shadow-sm border ${catBg}`}>
                      {catIcon}
                    </div>

                    <span className="font-black text-xl text-slate-800 dark:text-slate-200 leading-tight group-hover:text-primary transition-colors">
                      {cat.name}
                    </span>
                    
                    {/* Active indicator bar */}
                    <span className={`h-2 rounded-full mt-5 transition-all duration-500 ${
                      isActive 
                        ? `w-14 bg-gradient-to-r ${bgGradient}` 
                        : "w-0 bg-slate-200 dark:bg-slate-700"
                    }`} />
                  </button>
                )
              })}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/50" />

          {/* B. Choose Topic */}
          <div className="space-y-5">
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-emerald-500" />
              <span>Step 2: Select Vocabulary Topic</span>
            </h2>

            {selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCategory.topics.map((topic) => {
                  const topicEmoji = getTopicEmoji(topic.slug, topic.name)
                  
                  // Vibrant theme configs for each topic based on category
                  let topicColorClass = "from-amber-400/10 to-orange-500/10 border-orange-200/50 text-orange-700 shadow-orange-100"
                  let topicButtonBg = "bg-orange-500 text-white shadow-orange-500/30 shadow-lg"
                  let topicCardHover = "hover:border-orange-300 hover:bg-gradient-to-b hover:from-white hover:to-orange-50/20"
                  
                  if (selectedCategory.slug === "kid-6-12") {
                    topicColorClass = "from-emerald-400/10 to-teal-500/10 border-emerald-200/50 text-emerald-700 shadow-emerald-100"
                    topicButtonBg = "bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg"
                    topicCardHover = "hover:border-emerald-300 hover:bg-gradient-to-b hover:from-white hover:to-emerald-50/20"
                  } else if (selectedCategory.slug === "teen") {
                    topicColorClass = "from-indigo-400/10 to-violet-500/10 border-indigo-200/50 text-indigo-700 shadow-indigo-100"
                    topicButtonBg = "bg-indigo-500 text-white shadow-indigo-500/30 shadow-lg"
                    topicCardHover = "hover:border-indigo-300 hover:bg-gradient-to-b hover:from-white hover:to-indigo-50/20"
                  } else if (selectedCategory.slug === "readers") {
                    topicColorClass = "from-pink-400/10 to-rose-500/10 border-pink-200/50 text-pink-700 shadow-pink-100"
                    topicButtonBg = "bg-pink-500 text-white shadow-pink-500/30 shadow-lg"
                    topicCardHover = "hover:border-pink-300 hover:bg-gradient-to-b hover:from-white hover:to-pink-50/20"
                  }

                  return (
                    <div
                      key={topic.id}
                      onClick={() => handleSelectTopic(topic)}
                      className={`group p-6 rounded-[36px] border-4 border-slate-100/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 cursor-pointer transition-all duration-500 shadow-sm hover:shadow-2xl hover:scale-[1.02] ${topicCardHover} flex flex-col justify-between h-48 relative overflow-hidden`}
                    >
                      {/* Huge background floating topic emoji for fun depth */}
                      <span className="absolute -bottom-4 -right-4 text-7xl opacity-[0.06] transform rotate-12 transition-transform duration-500 group-hover:scale-125 select-none pointer-events-none">
                        {topicEmoji}
                      </span>

                      <div className="flex justify-between items-start">
                        <div></div>
                        
                        {/* Little cute 3D emoji bubble */}
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-sm">
                          {topicEmoji}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight">
                          {topic.name}
                        </h3>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                            Ready to explore
                          </span>
                          <button className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg ${topicButtonBg}`}>
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-600 border-4 border-dashed border-slate-200/80 dark:border-slate-800 rounded-3xl">
                Please select an age category above first.
              </div>
            )}
          </div>

        </div>

        {/* Loading overlay when loading topic */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 px-8 py-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Preparing flashcards...</span>
            </div>
          </div>
        )}

      </div>
    )
  }

  if (!selectedCategory) return null;

  // -------------------------------------------------------------
  // VIEW 2: FOCUS MODE (Bright Style & Cute Kindergarten/Preschool details for kids)
  // -------------------------------------------------------------
  const isKidMode = selectedCategory.slug === "kids-2-5" || selectedCategory.slug === "kid-6-12"
  
  // Theme colors for Focus Mode
  let focusThemeColor = "from-amber-400 to-orange-500 text-orange-500"
  if (selectedCategory.slug === "kid-6-12") focusThemeColor = "from-emerald-400 to-teal-500 text-emerald-500"
  else if (selectedCategory.slug === "teen") focusThemeColor = "from-indigo-400 to-violet-500 text-indigo-500"
  else if (selectedCategory.slug === "readers") focusThemeColor = "from-pink-400 to-rose-500 text-pink-500"

  // Dynamic rich style configurations for both buttons to prevent interaction confusion
  const themeConfig = {
    "kids-2-5": {
      revealBg: "from-amber-400 to-orange-500 text-white shadow-orange-300/40 border-white",
      nextBg: "bg-white border-4 border-orange-400 text-orange-600 shadow-orange-100/60 hover:bg-orange-50/40 hover:border-orange-500",
    },
    "kid-6-12": {
      revealBg: "from-emerald-400 to-teal-500 text-white shadow-teal-300/40 border-white",
      nextBg: "bg-white border-4 border-teal-400 text-teal-600 shadow-teal-100/60 hover:bg-teal-50/40 hover:border-teal-500",
    },
    "teen": {
      revealBg: "from-indigo-400 to-violet-500 text-white shadow-indigo-300/30 border-transparent",
      nextBg: "bg-white border-2 border-indigo-400 text-indigo-600 shadow-indigo-50/80 hover:bg-indigo-50/30 hover:border-indigo-500",
    },
    "readers": {
      revealBg: "from-pink-400 to-rose-500 text-white shadow-rose-300/30 border-transparent",
      nextBg: "bg-white border-2 border-rose-400 text-rose-600 shadow-rose-50/80 hover:bg-rose-50/30 hover:border-rose-500",
    }
  }[selectedCategory.slug] || {
    revealBg: "from-indigo-400 to-violet-500 text-white shadow-indigo-300/30 border-transparent",
    nextBg: "bg-white border-2 border-indigo-400 text-indigo-600 shadow-indigo-50/80 hover:bg-indigo-50/30 hover:border-indigo-500",
  }

  // Dynamic visual configurations
  const pageBg = isKidMode
    ? "bg-gradient-to-tr from-amber-100 via-pink-50 to-sky-100 text-slate-800"
    : "bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-800"

  const headerBg = isKidMode
    ? "bg-white/90 border-b-4 border-amber-200/50 backdrop-blur-md"
    : "bg-white/95 border-b border-slate-200/80 backdrop-blur-md"

  const backButtonClass = isKidMode
    ? "bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-800 font-black rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
    : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-extrabold rounded-full transition-all duration-200 hover:scale-105 active:scale-95"

  const cardCountClass = isKidMode
    ? "bg-amber-100 border-2 border-amber-300 text-amber-800 font-black"
    : "bg-slate-50 border border-slate-200 text-slate-600 font-extrabold"

  const categoryTextClass = isKidMode
    ? "text-[10px] font-black text-amber-500 uppercase tracking-widest"
    : "text-[10px] font-black text-slate-400 uppercase tracking-widest"

  const topicTextClass = isKidMode
    ? "font-extrabold text-base md:text-lg text-amber-900"
    : "font-extrabold text-base md:text-lg text-slate-800"

  const cardContainerClass = isKidMode
    ? `absolute inset-0 w-full h-full rounded-[48px] bg-white border-8 ${
        selectedCategory.slug === "kids-2-5" ? "border-amber-300 shadow-amber-200/80" : "border-emerald-300 shadow-emerald-200/80"
      } flex flex-col justify-between overflow-hidden shadow-[0_24px_50px_rgba(251,191,36,0.12)]`
    : "absolute inset-0 w-full h-full rounded-[36px] bg-white border border-slate-200/80 flex flex-col justify-between overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.05)]"

  return (
    <div className={`fixed inset-0 z-[100] ${pageBg} flex flex-col justify-between overflow-hidden font-body animate-in fade-in zoom-in-95 duration-500`}>
      
      {/* 1. Header Toolbar */}
      <header className={`px-6 md:px-12 py-4 flex justify-between items-center shrink-0 ${headerBg}`}>
        <button 
          onClick={handleBackToSelection}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold ${backButtonClass}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Topics</span>
        </button>
        
        <div className="text-center hidden sm:block">
          <p className={categoryTextClass}>{selectedCategory.name}</p>
          <p className={topicTextClass}>{selectedTopic?.name}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Card Count Indicator */}
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${cardCountClass}`}>
            {currentIndex + 1} / {flashcards.length}
          </span>
        </div>
      </header>

      {/* 2. Central Content: 3D Flip Card */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 md:px-6 relative max-w-4xl mx-auto w-full">

        {/* 3D Depth Container */}
        <div 
          className="w-full max-w-[480px] h-[360px] md:h-[420px]"
          style={{ perspective: "1200px" }}
        >
          {/* Card Inner wrapper */}
          <div 
            className="w-full h-full relative transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ 
              transformStyle: "preserve-3d", 
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}
          >
            
            {/* ========================================================
                A. FRONT SIDE
                ======================================================== */}
            <div 
              className={`${cardContainerClass} ${isKidMode ? 'p-2' : 'p-6'}`}
              style={{ backfaceVisibility: "hidden" }}
            >
              {/* Soft interior background gradient */}
              <span className="absolute inset-0 bg-gradient-to-b from-slate-50/10 via-transparent to-transparent pointer-events-none" />

              {isKidMode ? (
                // KIDS & KID: Bubbly preschool cartoon style image container
                <div className="w-full h-full rounded-[32px] overflow-hidden relative border-4 border-amber-100 bg-amber-50/20">
                  <img 
                    key={activeCard?.id}
                    src={activeCard?.imageUrl || ""} 
                    alt="Flashcard illustration"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ) : (
                // TEEN & READERS: Clean modern image and word on front
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="w-full h-[68%] rounded-2xl overflow-hidden relative border border-slate-100 bg-slate-50 shrink-0">
                    <img 
                      key={activeCard?.id}
                      src={activeCard?.imageUrl || ""} 
                      alt="Flashcard illustration"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center pt-4">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none text-center">
                      {activeCard?.word}
                    </h3>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================
                B. BACK SIDE
                ======================================================== */}
            <div 
              className={`${cardContainerClass} ${isKidMode ? 'p-5 md:p-6' : 'p-6'}`}
              style={{ 
                backfaceVisibility: "hidden", 
                transform: "rotateY(180deg)"
              }}
            >
              {/* Soft interior background gradient */}
              <span className="absolute inset-0 bg-gradient-to-b from-slate-50/10 via-transparent to-transparent pointer-events-none" />

              {/* 1. Header Badge */}
              <div className="w-full text-center shrink-0">
                {isKidMode ? (
                  <span className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
                    ⭐ Fun Vocabulary ⭐
                  </span>
                ) : (
                  <span className="inline-flex px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-200 text-slate-500">
                    Word Details
                  </span>
                )}
              </div>

              {/* 2. Central Area */}
              <div className="flex-1 flex flex-col justify-center gap-4 px-2 overflow-y-auto max-h-[calc(100%-60px)] scrollbar-thin">
                {/* Word, Phonetic & Audio */}
                <div className="flex flex-col items-center text-center space-y-2 shrink-0">
                  <h2 className={`text-3xl md:text-4xl font-black tracking-tight leading-none ${isKidMode ? "text-amber-900" : "text-slate-800"}`}>
                    {activeCard?.word}
                  </h2>
                  
                  <div className="flex items-center justify-center gap-3">
                    {activeCard?.phonetic && (
                      <span className={`${isKidMode ? "text-amber-600" : "text-primary"} font-mono text-xs md:text-sm tracking-wide font-extrabold`}>
                        {activeCard.phonetic}
                      </span>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlayAudio(activeCard)
                      }}
                      className={`p-2.5 rounded-full bg-gradient-to-r ${focusThemeColor} text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 shadow-orange-300/30`}
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                <hr className={`${isKidMode ? "border-amber-100" : "border-slate-100"} shrink-0`} />

                {/* Multilingual Definition */}
                <div className="space-y-2 shrink-0">
                  <div className="flex items-center justify-between px-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest block ${isKidMode ? "text-amber-500" : "text-slate-400"}`}>
                      Definition
                    </span>
                    
                    {/* Flag Selector Row */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${isKidMode ? "bg-amber-50 border-amber-200/60" : "bg-slate-50 border-slate-200"}`}>
                      {/* US - English */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLangChange('EN'); }}
                        title="English"
                        className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 hover:opacity-100 ${
                          currentLang === 'EN'
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-white shadow-sm scale-110 opacity-100'
                            : 'opacity-40'
                        }`}
                      >
                        <img src="/flags/flag-en.png" alt="English" className="w-full h-full object-cover" />
                      </button>
                      {/* Vietnam - VI */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLangChange('VI'); }}
                        title="Vietnamese"
                        className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 hover:opacity-100 ${
                          currentLang === 'VI'
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-white shadow-sm scale-110 opacity-100'
                            : 'opacity-40'
                        }`}
                      >
                        <img src="/flags/flag-vi.png" alt="Vietnamese" className="w-full h-full object-cover" />
                      </button>
                      {/* Thai - TH */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLangChange('TH'); }}
                        title="Thai"
                        className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 hover:opacity-100 ${
                          currentLang === 'TH'
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-white shadow-sm scale-110 opacity-100'
                            : 'opacity-40'
                        }`}
                      >
                        <img src="/flags/flag-th.png" alt="Thai" className="w-full h-full object-cover" />
                      </button>
                      {/* Indonesian - ID */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLangChange('ID'); }}
                        title="Indonesian"
                        className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 hover:opacity-100 ${
                          currentLang === 'ID'
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-white shadow-sm scale-110 opacity-100'
                            : 'opacity-40'
                        }`}
                      >
                        <img src="/flags/flag-id.png" alt="Indonesian" className="w-full h-full object-cover" />
                      </button>
                    </div>
                  </div>

                  <p className={`text-center min-h-[40px] flex items-center justify-center px-4 font-black ${
                    isKidMode ? "text-amber-950 text-base md:text-lg" : "text-slate-700 text-sm md:text-base"
                  }`}>
                    {currentLang === 'VI' ? (activeCard?.definitionVi || activeCard?.definition)
                     : currentLang === 'TH' ? (activeCard?.definitionTh || activeCard?.definition)
                     : currentLang === 'ID' ? (activeCard?.definitionId || activeCard?.definition)
                     : activeCard?.definition}
                  </p>
                </div>

                {/* Example Sentence */}
                {activeCard?.exampleSentence && (
                  <div className={`space-y-1.5 p-3.5 shrink-0 ${
                    isKidMode 
                      ? "bg-amber-50/50 border-2 border-amber-100 rounded-[24px] text-center" 
                      : "bg-slate-50 border border-slate-100 rounded-2xl text-left"
                  }`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest block ${isKidMode ? "text-amber-500" : "text-slate-400"}`}>
                      Example Sentence
                    </span>
                    <p className={`italic leading-relaxed ${
                      isKidMode ? "text-amber-800 font-extrabold text-xs md:text-sm" : "text-slate-600 font-medium text-xs md:text-sm"
                    }`}>
                      "{activeCard.exampleSentence}"
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* Sequential Action Button */}
        <div className="mt-8 shrink-0 flex justify-center w-full">
          {!isFlipped ? (
            <button
              onClick={() => setIsFlipped(true)}
              className={`transition-all duration-300 font-black uppercase tracking-widest flex items-center gap-2 group active:scale-95 ${
                isKidMode
                  ? `px-12 py-4.5 rounded-full border-4 shadow-xl hover:scale-105 text-base bg-gradient-to-r ${themeConfig.revealBg}`
                  : `px-8 py-3.5 rounded-full shadow-md hover:scale-105 text-sm bg-gradient-to-r ${themeConfig.revealBg}`
              }`}
            >
              <span>Reveal Details</span>
              <Sparkles className="w-5 h-5 group-hover:animate-pulse text-white" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className={`transition-all duration-300 font-black uppercase tracking-widest flex items-center gap-2 group active:scale-95 shadow-lg ${
                isKidMode
                  ? `px-12 py-4.5 rounded-full text-base ${themeConfig.nextBg}`
                  : `px-8 py-3.5 rounded-full text-sm ${themeConfig.nextBg}`
              }`}
            >
              <span>Next Card</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

      </main>

      {/* 3. Footer Controls */}
      <footer className={`px-6 md:px-12 py-6 border-t flex flex-col items-center gap-4 shrink-0 ${
        isKidMode ? "bg-white/90 border-amber-200/50" : "bg-white/95 border-slate-200/80"
      }`}>
        
        {/* Progress Bar & Counter */}
        <div className="w-full max-w-[500px] flex items-center gap-4">
          <div className={`flex-grow h-3 rounded-full overflow-hidden ${isKidMode ? "bg-amber-100" : "bg-slate-100"}`}>
            <div 
              className={`h-full bg-gradient-to-r ${focusThemeColor} transition-all duration-300 rounded-full`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className={`text-center text-[10px] font-black uppercase tracking-widest hidden sm:block select-none ${
          isKidMode ? "text-amber-500/80" : "text-slate-400"
        }`}>
          Tip: Press <kbd className={`px-1.5 py-0.5 rounded border shadow-sm font-sans ${isKidMode ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>Space</kbd> to flip, use <kbd className={`px-1.5 py-0.5 rounded border shadow-sm font-sans ${isKidMode ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>←</kbd> <kbd className={`px-1.5 py-0.5 rounded border shadow-sm font-sans ${isKidMode ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>→</kbd> to switch cards
        </div>
      </footer>

    </div>
  )
}
