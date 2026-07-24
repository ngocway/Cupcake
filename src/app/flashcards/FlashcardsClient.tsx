"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getFlashcardsByTopic } from "@/actions/flashcards-actions"
import { setNativeLanguagePreference } from "@/actions/user-preferences-actions"
import { useContentStore } from "@/store/useContentStore"
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  Award, 
  HelpCircle,
  Play,
  Loader2,
  Languages,
  Keyboard
} from "lucide-react"

// Định nghĩa kiểu dữ liệu
interface Topic {
  id: string
  categoryId: string
  name: string
  slug: string
  iconUrl?: string | null
  flashcardCount?: number
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
  audioUrl: string | null
  audioWordUrl: string | null
  audioSentenceUrl: string | null
  quizQuestion: string | null
  quizAudioUrl: string | null
  orderIndex: number
}

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

const getDefinitionText = (card: any, lang: string) => {
  if (!card) return "";
  if (lang === "en" || lang === "other") return card.definition || "";
  if (lang === "vi") return card.definitionVi || card.definition || "";
  if (lang === "th") return card.definitionTh || card.definition || "";
  if (lang === "id") return card.definitionId || card.definition || "";
  
  if (Array.isArray(card.translations)) {
    const t = card.translations.find((item: any) => item.locale === lang);
    if (t) return t.definition;
  }
  return card.definition || "";
};

const getFlagUrl = (lang: string) => {
  if (lang === "en") return "/flags/flag-en.png";
  if (lang === "vi") return "/flags/flag-vi.png";
  if (lang === "th") return "/flags/flag-th.png";
  if (lang === "id") return "/flags/flag-id.png";
  
  const cdnCodes: Record<string, string> = {
    zh: "cn",
    hi: "in",
    ja: "jp",
    es: "es",
    ar: "sa",
    fr: "fr",
    ko: "kr",
    pt: "pt",
    ru: "ru",
    de: "de",
    other: "other"
  };
  
  const code = cdnCodes[lang];
  if (code === "other") return "/globe.svg";
  if (code) return `https://flagcdn.com/w40/${code}.png`;
  return "/globe.svg";
};

const getLangTitle = (lang: string) => {
  const titles: Record<string, string> = {
    en: "English",
    vi: "Vietnamese",
    th: "Thai",
    id: "Indonesian",
    zh: "Mandarin Chinese",
    hi: "Hindi",
    ja: "Japanese",
    es: "Spanish",
    ar: "Arabic",
    fr: "French",
    ko: "Korean",
    pt: "Portuguese",
    ru: "Russian",
    de: "German",
    other: "Other"
  };
  return titles[lang] || lang.toUpperCase();
};

interface FlashcardsClientProps {
  initialCategories: Category[]
  studyAgeGroup?: string | null
}

export function FlashcardsClient({ initialCategories, studyAgeGroup: serverStudyAgeGroup }: FlashcardsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studyAgeGroup = useContentStore(s => (s as any).studyAgeGroup)

  // Sắp xếp các danh mục theo thứ tự độ tuổi
  const CATEGORY_ORDER = [
    "kindergarten", "kindergarden", "kids-2-5", 
    "kid", "kid-6-12", "kids", 
    "teen", "teens", 
    "learner", "readers", "adults", "adult"
  ]
  const categories = [...initialCategories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.slug);
    const indexB = CATEGORY_ORDER.indexOf(b.slug);
    const rankA = indexA === -1 ? 999 : indexA;
    const rankB = indexB === -1 ? 999 : indexB;
    return rankA - rankB;
  });

  // Trạng thái chọn Danh mục & Chủ đề
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [topicToSelect, setTopicToSelect] = useState<Topic | null>(null)
  
  // Trạng thái học Flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isFlipped, setIsFlipped] = useState<boolean>(false)
  const [focusMode, setFocusMode] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [voicesLoaded, setVoicesLoaded] = useState<boolean>(false)
  
  // Trạng thái ngôn ngữ dịch nghĩa (đồng bộ hóa với vocab settings & localStorage)
  const currentLang = useContentStore(s => s.nativeLanguage)
  const setNativeLanguage = useContentStore(s => s.setNativeLanguage)
  const [displayLang, setDisplayLang] = useState<string>(currentLang)

  useEffect(() => {
    setDisplayLang(currentLang)
  }, [currentLang])

  // Trạng thái load ảnh để hiển thị spinner
  const [isImageLoading, setIsImageLoading] = useState(true)

  // Trạng thái hiển thị từng chữ cái lần lượt ngẫu nhiên
  const [revealedIndices, setRevealedIndices] = useState<number[]>([])
  const [wordAudioEnded, setWordAudioEnded] = useState<boolean>(false)

  // Trạng thái cho chế độ Thử thách từ vựng (Gợi ý, Ghép chữ, Tự gõ)
  const [challengeMode, setChallengeMode] = useState<'hint' | 'scramble' | 'type'>('scramble')
  const [scrambledLetters, setScrambledLetters] = useState<{ id: number, letter: string, index: number, used: boolean }[]>([])
  const [shakeItemId, setShakeItemId] = useState<number | null>(null)
  const [wrongTypedIndex, setWrongTypedIndex] = useState<number | null>(null)
  const [wrongTypedLetter, setWrongTypedLetter] = useState<string | null>(null)
  const [wrongFading, setWrongFading] = useState<boolean>(false)
  const [imeWarning, setImeWarning] = useState<string | null>(null)
  const [unikeyDetected, setUnikeyDetected] = useState<boolean>(false)
  const [showCelebration, setShowCelebration] = useState<boolean>(false)
  const [confettiParticles, setConfettiParticles] = useState<{
    id: number
    x: number
    y: number
    color: string
    size: number
    delay: number
    duration: number
    angle: number
  }[]>([])

  const hiddenInputRef = useRef<HTMLInputElement | null>(null)
  // Timestamp của lần cuối physical keydown xử lý — dùng để tránh onChange xử lý trùng
  const lastPhysicalKeyTimeRef = useRef<number>(0)

  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentPlayPromiseRef = useRef<Promise<void> | null>(null)
  // Flag để tránh useEffect URL re-trigger handleSelectTopic khi chính handleSelectTopic đã gọi router.replace
  const programmaticNavRef = useRef<boolean>(false)

  // Swipe gesture state
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null
    // Only treat as horizontal swipe if dx dominant and > 50px threshold
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
  }

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      const audio = currentAudioRef.current
      const promise = currentPlayPromiseRef.current
      currentAudioRef.current = null
      currentPlayPromiseRef.current = null
      if (promise) {
        // Đợi play() promise settle trước khi pause() để tránh AbortError
        promise.then(() => {
          audio.pause()
          audio.currentTime = 0
        }).catch(() => {})
      } else {
        try {
          audio.pause()
          audio.currentTime = 0
        } catch (_) {}
      }
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }

  // Tự nhận diện ngôn ngữ thiết bị lần đầu tiên nếu chưa có
  useEffect(() => {
    if (typeof window !== "undefined") {
      const localPref = localStorage.getItem('cupcakes_native_language')
      if (!localPref) {
        const browserLang = navigator.language.toLowerCase()
        let defaultLang = 'vi'
        if (browserLang.includes('th')) defaultLang = 'th'
        else if (browserLang.includes('id')) defaultLang = 'id'
        setNativeLanguage(defaultLang)
      }
    }
  }, [setNativeLanguage])

  // Xử lý thay đổi ngôn ngữ dịch nghĩa
  const handleLangChange = async (lang: string) => {
    setNativeLanguage(lang)
    try {
      await setNativeLanguagePreference(lang)
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
  const handleSpeak = (text: string, onEnded?: () => void) => {
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
      
      if (onEnded) {
        utterance.onend = () => {
          onEnded()
        }
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }

  // Hàm phát âm từ vựng (Ưu tiên dùng audio lồng tiếng tải lên nếu có, nếu không thì dùng Web Speech API)
  const handlePlayAudio = (card: any, onEnded?: () => void) => {
    if (!card) return
    stopCurrentAudio()
    // Ưu tiên: audioUrl (full word + sentence) → audioWordUrl → TTS fallback
    const urlToPlay = (card.audioUrl && card.audioUrl.trim())
      ? card.audioUrl
      : (card.audioWordUrl && card.audioWordUrl.trim())
      ? card.audioWordUrl
      : null
    if (urlToPlay) {
      const audio = new Audio(urlToPlay)
      currentAudioRef.current = audio
      if (onEnded) {
        audio.onended = onEnded
      }
      const promise = audio.play()
      currentPlayPromiseRef.current = promise
      promise.catch(err => {
        if (err?.name === 'AbortError') return // bị dừng chủ động, bỏ qua
        console.error("Lỗi phát audio tùy chỉnh:", err)
        // Fallback to speech synthesis
        handleSpeak(card.word, onEnded)
      })
    } else {
      handleSpeak(card.word, onEnded)
    }
  }

  // Hàm phát âm chỉ từ vựng (không kèm câu ví dụ)
  const handlePlayWordAudio = (card: any, onEnded?: () => void) => {
    if (!card) return
    stopCurrentAudio()
    if (card.audioWordUrl && card.audioWordUrl.trim()) {
      const audio = new Audio(card.audioWordUrl)
      currentAudioRef.current = audio
      if (onEnded) {
        audio.onended = onEnded
      }
      const promise = audio.play()
      currentPlayPromiseRef.current = promise
      promise.catch(err => {
        if (err?.name === 'AbortError') return // bị dừng chủ động, bỏ qua
        console.error("Lỗi phát audio từ vựng tùy chỉnh:", err)
        // Fallback to speech synthesis
        handleSpeak(card.word, onEnded)
      })
    } else {
      handleSpeak(card.word, onEnded)
    }
  }

  // Âm thanh chúc mừng tự tổng hợp bằng Web Audio API
  const playSuccessSound = () => {
    if (typeof window === 'undefined') return
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    try {
      const ctx = new AudioContext()
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + duration)
      }
      const now = ctx.currentTime
      playTone(523.25, now, 0.25) // C5
      playTone(659.25, now + 0.08, 0.25) // E5
      playTone(783.99, now + 0.16, 0.25) // G5
      playTone(1046.50, now + 0.24, 0.4) // C6
    } catch (e) {
      console.error(e)
    }
  }

  // Kích hoạt hiệu ứng chúc mừng khi hoàn thành từ vựng
  const triggerSuccessCelebration = (card: any) => {
    playSuccessSound()
    setShowCelebration(true)

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444']
    const newParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 15,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6,
      delay: Math.random() * 0.4,
      duration: Math.random() * 1.5 + 1.5,
      angle: Math.random() * 360
    }))
    setConfettiParticles(newParticles)

    // Đợi 1.8 giây hiển thị hiệu ứng chúc mừng rồi mới tự động lật thẻ
    // Không gọi handlePlayAudio trực tiếp tại đây — Effect #2 sẽ xử lý sau khi isFlipped = true
    setTimeout(() => {
      setShowCelebration(false)
      setIsFlipped(true)
    }, 1800)
  }

  // Xử lý chuyển đổi chế độ học (Gợi ý, Ghép chữ, Tự gõ)
  const handleModeChange = (newMode: 'hint' | 'scramble' | 'type') => {
    setChallengeMode(newMode)
    setWordAudioEnded(false)
    setShakeItemId(null)
    setWrongTypedIndex(null)
    
    const card = flashcards[currentIndex]
    if (card) {
      const initialIndices: number[] = []
      for (let i = 0; i < card.word.length; i++) {
        if (!/[a-zA-Z]/.test(card.word[i])) {
          initialIndices.push(i)
        }
      }
      setRevealedIndices(initialIndices)

      if (newMode === 'scramble') {
        generateScrambledLetters(card.word)
      }

      if (newMode === 'hint') {
        handlePlayWordAudio(card, () => {
          setWordAudioEnded(true)
        })
      }
    }
  }

  // Tạo bong bóng chữ cái xáo trộn (Chế độ Ghép chữ)
  const generateScrambledLetters = useCallback((word: string) => {
    const items: { id: number, letter: string, index: number, used: boolean }[] = []
    for (let i = 0; i < word.length; i++) {
      const char = word[i]
      if (/[a-zA-Z]/.test(char)) {
        items.push({
          id: i,
          letter: char,
          index: i,
          used: false
        })
      }
    }
    // Trộn ngẫu nhiên
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    setScrambledLetters(items)
  }, [])

  // Tìm vị trí chữ cái chưa được lật tiếp theo
  const getNextUnrevealedIndex = (word: string, currentRevealed: number[]) => {
    for (let i = 0; i < word.length; i++) {
      if (/[a-zA-Z]/.test(word[i]) && !currentRevealed.includes(i)) {
        return i
      }
    }
    return -1
  }

  // Click chọn chữ cái xáo trộn
  const handleScrambleClick = (item: { id: number, letter: string, index: number, used: boolean }) => {
    const card = flashcards[currentIndex]
    if (!card) return

    const nextIdx = getNextUnrevealedIndex(card.word, revealedIndices)
    if (nextIdx !== -1) {
      if (card.word[nextIdx].toLowerCase() === item.letter.toLowerCase()) {
        const nextRevealed = [...revealedIndices, nextIdx]
        setRevealedIndices(nextRevealed)
        setScrambledLetters(prev => prev.map(l => l.id === item.id ? { ...l, used: true } : l))

        const checkNext = getNextUnrevealedIndex(card.word, nextRevealed)
        if (checkNext === -1) {
          // Hoàn thành từ -> Kích hoạt hiệu ứng chúc mừng
          triggerSuccessCelebration(card)
        }
      } else {
        // Sai chữ -> Rung lắc bong bóng chữ cái
        setShakeItemId(item.id)
        setTimeout(() => setShakeItemId(null), 500)
      }
    }
  }

  // Đọc chữ từ Input ẩn (Cho bàn phím ảo trên Điện thoại/iPad ở chế độ Tự gõ)
  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!val) return
    const rawChar = val[val.length - 1]
    e.target.value = ""

    // Nếu physical keydown vừa xử lý rồi (trong vòng 100ms) → bỏ qua để tránh trùng lặp
    if (Date.now() - lastPhysicalKeyTimeRef.current < 100) return

    const card = flashcards[currentIndex]
    if (!card) return
    const nextIdx = getNextUnrevealedIndex(card.word, revealedIndices)

    // Phát hiện IME (Unikey/bộ gõ tiếng Việt) đang chuyển đổi ký tự
    // e.g. gõ "ow" → Unikey tạo ra "ơ" (không phải ASCII thuần)
    if (!/^[a-zA-Z]$/.test(rawChar)) {
      setImeWarning(rawChar)
      setUnikeyDetected(true)   // bật banner cố định
      // Hiện ký tự tiếng Việt trong bong bóng để học sinh thấy rõ mình đã gõ gì
      if (nextIdx !== -1) {
        setWrongTypedIndex(nextIdx)
        setWrongTypedLetter(rawChar)   // hiện đúng ký tự IME, không uppercase
        setWrongFading(false)
        setTimeout(() => setWrongFading(true), 700)
        setTimeout(() => { setWrongTypedIndex(null); setWrongTypedLetter(null); setWrongFading(false) }, 1100)
      }
      return
    }

    // Gõ ký tự ASCII bình thường → xoá cảnh báo IME
    setImeWarning(null)

    const key = rawChar.toLowerCase()

    if (nextIdx !== -1) {
      if (card.word[nextIdx].toLowerCase() === key) {
        const nextRevealed = [...revealedIndices, nextIdx]
        setRevealedIndices(nextRevealed)

        const checkNext = getNextUnrevealedIndex(card.word, nextRevealed)
        if (checkNext === -1) {
          triggerSuccessCelebration(card)
        }
      } else {
        setWrongTypedIndex(nextIdx)
        setWrongTypedLetter(key.toUpperCase())
        setWrongFading(false)
        setTimeout(() => setWrongFading(true), 700)
        setTimeout(() => { setWrongTypedIndex(null); setWrongTypedLetter(null); setWrongFading(false) }, 1100)
      }
    }
  }

  // 1. Reset card, đặt lại chữ cái đã lật và tự động phát âm khi chuyển thẻ, đổi chế độ hoặc đổi topic
  useEffect(() => {
    if (isFlipped) return

    const card = flashcards[currentIndex]
    if (!card) return

    setWordAudioEnded(false)
    setShakeItemId(null)
    setWrongTypedIndex(null)
    setImeWarning(null)

    // Khởi tạo các ký tự không phải chữ cái (khoảng trắng, gạch ngang) được hiển thị sẵn
    const initialIndices: number[] = []
    for (let i = 0; i < card.word.length; i++) {
      if (!/[a-zA-Z]/.test(card.word[i])) {
        initialIndices.push(i)
      }
    }
    setRevealedIndices(initialIndices)

    if (challengeMode === 'scramble') {
      generateScrambledLetters(card.word)
    }

    const timer = setTimeout(() => {
      const isHint = challengeMode === 'hint'
      handlePlayWordAudio(card, isHint ? () => {
        setWordAudioEnded(true)
      } : undefined)
    }, 300)

    return () => clearTimeout(timer)
  }, [currentIndex, selectedTopic, challengeMode, isFlipped, flashcards])

  // 2. Tự động phát âm đầy đủ khi lật sang mặt sau
  useEffect(() => {
    if (isFlipped && selectedCategory && flashcards[currentIndex]) {
      const card = flashcards[currentIndex]
      // Chỉ auto-play nếu có audio file thực sự — không dùng TTS cho auto-play
      const hasAudio = (card.audioUrl && card.audioUrl.trim()) || (card.audioWordUrl && card.audioWordUrl.trim())
      if (!hasAudio) return

      const timer = setTimeout(() => {
        handlePlayAudio(card)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isFlipped, currentIndex, selectedCategory, flashcards])

  // 3. Tự động hiển thị gợi ý từng chữ cái ngẫu nhiên (Chỉ hoạt động ở chế độ Gợi ý)
  useEffect(() => {
    const card = flashcards[currentIndex]
    if (!wordAudioEnded || !card || isFlipped || challengeMode !== 'hint') return

    const word = card.word
    const initialIndices: number[] = []
    for (let i = 0; i < word.length; i++) {
      if (!/[a-zA-Z]/.test(word[i])) {
        initialIndices.push(i)
      }
    }
    
    setRevealedIndices(initialIndices)

    let timeoutId: ReturnType<typeof setTimeout>

    const revealNext = (currentRevealed: number[]) => {
      const unrevealed: number[] = []
      for (let i = 0; i < word.length; i++) {
        if (/[a-zA-Z]/.test(word[i]) && !currentRevealed.includes(i)) {
          unrevealed.push(i)
        }
      }

      if (unrevealed.length === 0) return

      timeoutId = setTimeout(() => {
        const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)]
        const nextRevealed = [...currentRevealed, randomIndex]
        setRevealedIndices(nextRevealed)
        
        handlePlayWordAudio(card)

        revealNext(nextRevealed)
      }, 4500)
    }

    revealNext(initialIndices)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [wordAudioEnded, currentIndex, flashcards, isFlipped, challengeMode])

  // 4. Lắng nghe phím gõ từ bàn phím cứng (Chế độ Tự gõ)
  useEffect(() => {
    if (challengeMode !== 'type' || isFlipped) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // Dùng e.code (phím vật lý) thay vì e.key để bypass IME Telex/VNI hoàn toàn
      const codeMatch = e.code.match(/^Key([A-Z])$/)
      if (!codeMatch) return
      const key = codeMatch[1].toLowerCase()

      const card = flashcards[currentIndex]
      if (!card) return

      // Chặn ký tự đi vào hiddenInput, sau đó blur hoàn toàn để Unikey không inject vào input
      // Mobile không fire keydown qua window listener → không bị ảnh hưởng
      e.preventDefault()
      lastPhysicalKeyTimeRef.current = Date.now()
      hiddenInputRef.current?.blur()  // ← Unikey không còn target nào để compose vào

      const nextIdx = getNextUnrevealedIndex(card.word, revealedIndices)
      if (nextIdx !== -1) {
        if (card.word[nextIdx].toLowerCase() === key) {
          const nextRevealed = [...revealedIndices, nextIdx]
          setRevealedIndices(nextRevealed)

          const checkNext = getNextUnrevealedIndex(card.word, nextRevealed)
          if (checkNext === -1) {
            triggerSuccessCelebration(card)
          }
        } else {
          setWrongTypedIndex(nextIdx)
          // Hiện ký tự thực tế học sinh đã gõ (bao gồm ký tự Unikey như Ỉ, ơ, ...)
          // e.key phản ánh những gì browser/OS nhận được sau khi Unikey convert
          const displayChar = e.key.length === 1 ? e.key : key.toUpperCase()
          setWrongTypedLetter(displayChar)
          // Phát hiện Unikey: e.key khác với phím vật lý
          if (e.key.length === 1 && e.key.toLowerCase() !== key) {
            setUnikeyDetected(true)
          }
          setWrongFading(false)
          setTimeout(() => setWrongFading(true), 700)
          setTimeout(() => { setWrongTypedIndex(null); setWrongTypedLetter(null); setWrongFading(false) }, 1100)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [challengeMode, isFlipped, currentIndex, flashcards, revealedIndices])

  // 5. Tự động hiển thị bàn phím ảo trên Mobile khi ở chế độ Tự gõ
  useEffect(() => {
    if (challengeMode === 'type' && !isFlipped) {
      setTimeout(() => {
        hiddenInputRef.current?.focus()
      }, 300)
    }
  }, [challengeMode, isFlipped, currentIndex])

  // Xử lý nạp Flashcards khi chọn xong Topic
  const handleSelectTopic = useCallback(async (topic: Topic) => {
    setLoading(true)
    setSelectedTopic(topic)
    
    // Đánh dấu đây là navigation do code gọi (không phải user nhập URL)
    // để useEffect URL không re-trigger handleSelectTopic lần 2
    programmaticNavRef.current = true
    router.replace(`/flashcards?topic=${topic.id}`, { scroll: false })
    
    try {
      const cards = await getFlashcardsByTopic(topic.id)
      
      if (cards.length > 0) {
        // Shuffling cards using Fisher-Yates algorithm
        const shuffledCards = [...cards].sort(() => Math.random() - 0.5)
        setFlashcards(shuffledCards)
        setCurrentIndex(0)
        setIsFlipped(false)
        setIsImageLoading(true)
        setFocusMode(true)
      } else {
        alert("This topic does not have any flashcards yet. Please choose another topic!")
        setSelectedTopic(null)
        router.push("/flashcards", { scroll: false })
      }
    } catch (error) {
      console.error("Error loading flashcards:", error)
      alert("An error occurred while loading flashcards. Please try again later.")
      router.push("/flashcards", { scroll: false })
    } finally {
      setLoading(false)
    }
  }, [router])
  
  const handleChooseMode = useCallback((mode: 'hint' | 'scramble' | 'type') => {
    if (!topicToSelect) return
    handleModeChange(mode)
    const topic = topicToSelect
    setTopicToSelect(null)
    handleSelectTopic(topic)
  }, [topicToSelect, handleSelectTopic])

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    stopCurrentAudio()
    setIsFlipped(false)
    // Chờ hiệu ứng lật thẻ về mặt trước hoàn tất trước khi đổi nội dung
    setTimeout(() => {
      setIsImageLoading(true)
      setCurrentIndex((prev) => (prev + 1) % flashcards.length)
    }, 200)
  }, [flashcards.length])

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    stopCurrentAudio()
    setIsFlipped(false)
    setTimeout(() => {
      setIsImageLoading(true)
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    }, 200)
  }, [flashcards.length])

  // Quay lại màn hình chọn
  const handleBackToSelection = useCallback(() => {
    stopCurrentAudio()
    router.push("/flashcards", { scroll: false })
  }, [router])

  // Initialize selectedCategory based on studyAgeGroup or URL topic
  useEffect(() => {
    const topicId = searchParams.get("topic")
    if (topicId) {
      // Nếu URL thay đổi do chính handleSelectTopic gọi router.replace → bỏ qua để tránh double-call
      if (programmaticNavRef.current) {
        programmaticNavRef.current = false
        return
      }
      // URL có topic (deep link / reload / back button) nhưng chưa vào focusMode
      // → Hiện popup chọn mode thay vì vào thẳng, đảm bảo user luôn chọn được mode
      if (!focusMode && (!selectedTopic || selectedTopic.id !== topicId)) {
        for (const cat of categories) {
          const foundTopic = cat.topics.find(t => t.id === topicId)
          if (foundTopic) {
            setSelectedCategory(cat)
            setTopicToSelect(foundTopic)   // ← Hiện popup thay vì gọi handleSelectTopic trực tiếp
            return
          }
        }
      }
    } else {
      if (selectedTopic || focusMode) {
        stopCurrentAudio()
        setFocusMode(false)
        setSelectedTopic(null)
        setFlashcards([])
        setCurrentIndex(0)
        setIsFlipped(false)
      }
    }

    // Fallback: match category with studyAgeGroup if no selectedCategory set yet
    if (!selectedCategory) {
      const activeAgeGroup = serverStudyAgeGroup || studyAgeGroup
      if (activeAgeGroup) {
        const cleanAge = activeAgeGroup.toLowerCase()
        const found = categories.find(c => {
          const slug = c.slug.toLowerCase()
          if (cleanAge.includes("kindergarten") || cleanAge.includes("kindergarden") || cleanAge === "kids-2-5") {
            return slug.includes("kindergarten") || slug.includes("kindergarden") || slug === "kids-2-5"
          }
          return slug === cleanAge || cleanAge.includes(slug) || slug.includes(cleanAge)
        })
        if (found) {
          setSelectedCategory(found)
          return
        }
      }
      setSelectedCategory(categories[0] || null)
    }
  }, [categories, studyAgeGroup, serverStudyAgeGroup, searchParams, selectedCategory, selectedTopic, handleSelectTopic, focusMode])

  // Hỗ trợ bấm phím mũi tên & Space để lật/chuyển thẻ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusMode || flashcards.length === 0) return
      
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        if (isFlipped) {
          handleNext()
        } else {
          setIsFlipped(true)
        }
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
  }, [focusMode, flashcards, currentIndex, isFlipped, handleNext, handlePrev, handleBackToSelection])

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
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Title & Introduction */}
        <div className="text-center space-y-5 relative py-3">
          {/* Floating subtle pastel colorful blur spots in background */}
          <div className="absolute top-0 left-1/4 w-16 h-16 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-20 h-20 bg-pink-400/20 rounded-full blur-xl animate-pulse" />
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
            English <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-primary bg-clip-text text-transparent">Flashcards</span> Hub
          </h1>
        </div>

        {/* Selection Area (Category & Topic on the same page) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[40px] p-6 md:p-8 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-10">
          
          {/* B. Choose Topic */}
          <div className="space-y-5">
            {selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCategory.topics.map((topic, idx) => {
                  const topicEmoji = getTopicEmoji(topic.slug, topic.name)
                  const style = cardBackgroundStyles[idx % cardBackgroundStyles.length];
                  
                  // Vibrant theme configs for each topic based on category
                  let topicColorClass = "from-amber-400/10 to-orange-500/10 border-orange-200/50 text-orange-700 shadow-orange-100"
                  let topicButtonBg = "bg-orange-500 text-white shadow-orange-500/30 shadow-lg"
                  
                  if (selectedCategory.slug === "kid-6-12" || selectedCategory.slug === "kid" || selectedCategory.slug === "kids") {
                    topicColorClass = "from-emerald-400/10 to-teal-500/10 border-emerald-200/50 text-emerald-700 shadow-emerald-100"
                    topicButtonBg = "bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg"
                  } else if (selectedCategory.slug === "teen" || selectedCategory.slug === "teens") {
                    topicColorClass = "from-indigo-400/10 to-violet-500/10 border-indigo-200/50 text-indigo-700 shadow-indigo-100"
                    topicButtonBg = "bg-indigo-500 text-white shadow-indigo-500/30 shadow-lg"
                  } else if (selectedCategory.slug === "readers" || selectedCategory.slug === "learner" || selectedCategory.slug === "adults" || selectedCategory.slug === "adult") {
                    topicColorClass = "from-pink-400/10 to-rose-500/10 border-pink-200/50 text-pink-700 shadow-pink-100"
                    topicButtonBg = "bg-pink-500 text-white shadow-pink-500/30 shadow-lg"
                  }

                  return (
                    <div
                      key={topic.id}
                      onClick={() => setTopicToSelect(topic)}
                      className={`group p-5 rounded-[36px] border-4 border-slate-200 dark:border-slate-700 ${style.bg} cursor-pointer transition-all duration-500 shadow-sm hover:shadow-2xl hover:scale-[1.02] ${style.borderHover} ${style.bgHover} flex flex-col justify-between h-40 relative overflow-hidden`}
                    >
                      {/* Ambient Bubbly Blurs inside card */}
                      {style.circles.map((c, cIdx) => (
                        <div key={cIdx} className={c.className} />
                      ))}

                      {/* Huge background floating topic emoji for fun depth */}
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
                          {topicEmoji}
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
                            topicEmoji
                          )}
                        </div>
                      </div>

                      {/* Bottom row: Card count */}
                      <div className="w-full relative z-10 mt-auto">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                          {topic.flashcardCount ?? 0} Cards
                        </span>
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

        {/* Study Mode Selection Modal */}
        {topicToSelect && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[40px] border-4 border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-2xl space-y-5 md:space-y-8 animate-in zoom-in-95 duration-300 max-h-[90dvh] overflow-y-auto">
              
              {/* Header */}
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  Choose Study Mode
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Pick how you want to learn vocabulary for <span className="font-bold text-slate-800 dark:text-slate-200">"{topicToSelect.name}"</span>
                </p>
              </div>

              {/* Grid of 3 modes — Word Puzzle first (recommended) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                {/* ⭐ Word Puzzle Card — RECOMMENDED, highlighted */}
                <button
                  onClick={() => handleChooseMode('scramble')}
                  className="group relative p-4 md:p-6 rounded-[32px] border-4 border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 transition-all duration-300 flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0 md:space-y-4 shadow-lg shadow-emerald-200/60 hover:shadow-xl hover:shadow-emerald-300/60 hover:-translate-y-1 ring-2 ring-emerald-300/50"
                >

                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Layers className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                      Word Puzzle
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      Solve the puzzle by putting mixed-up letters in the correct order.
                    </p>
                  </div>
                </button>

                {/* Type Card */}
                <button
                  onClick={() => handleChooseMode('type')}
                  className="group p-4 md:p-6 rounded-[32px] border-4 border-slate-200 dark:border-slate-800 bg-indigo-50/45 dark:bg-indigo-950/10 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0 md:space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Keyboard className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                      Type Mode
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      Spell the word by typing manually using your physical or virtual keyboard.
                    </p>
                  </div>
                </button>

                {/* Hint Card */}
                <button
                  onClick={() => handleChooseMode('hint')}
                  className="group p-4 md:p-6 rounded-[32px] border-4 border-slate-200 dark:border-slate-800 bg-amber-50/45 dark:bg-amber-950/10 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0 md:space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                      Hint Mode
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      Flip the card, listen to audio, and learn with automatic letter suggestions.
                    </p>
                  </div>
                </button>

              </div>
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
  // Người dùng yêu cầu dùng chung phong cách Kid cho tất cả độ tuổi
  const isKidMode = true;
  // Theme colors for Focus Mode
  let focusThemeColor = "from-amber-400 to-orange-500 text-orange-500"
  if (selectedCategory.slug === "kid-6-12" || selectedCategory.slug === "kid" || selectedCategory.slug === "kids") focusThemeColor = "from-emerald-400 to-teal-500 text-emerald-500"
  else if (selectedCategory.slug === "teen" || selectedCategory.slug === "teens") focusThemeColor = "from-indigo-400 to-violet-500 text-indigo-500"
  else if (selectedCategory.slug === "readers" || selectedCategory.slug === "learner" || selectedCategory.slug === "adults" || selectedCategory.slug === "adult") focusThemeColor = "from-pink-400 to-rose-500 text-pink-500"

  // Dynamic rich style configurations for both buttons to prevent interaction confusion
  const themeConfig = {
    "kids-2-5": {
      revealBg: "from-amber-400 to-orange-500 text-white shadow-orange-300/40 border-white",
      nextBg: "bg-white border-4 border-orange-400 text-orange-600 shadow-orange-100/60 hover:bg-orange-50/40 hover:border-orange-500",
    },
    "kindergarten": {
      revealBg: "from-amber-400 to-orange-500 text-white shadow-orange-300/40 border-white",
      nextBg: "bg-white border-4 border-orange-400 text-orange-600 shadow-orange-100/60 hover:bg-orange-50/40 hover:border-orange-500",
    },
    "kindergarden": {
      revealBg: "from-amber-400 to-orange-500 text-white shadow-orange-300/40 border-white",
      nextBg: "bg-white border-4 border-orange-400 text-orange-600 shadow-orange-100/60 hover:bg-orange-50/40 hover:border-orange-500",
    },
    "kid-6-12": {
      revealBg: "from-emerald-400 to-teal-500 text-white shadow-teal-300/40 border-white",
      nextBg: "bg-white border-4 border-teal-400 text-teal-600 shadow-teal-100/60 hover:bg-teal-50/40 hover:border-teal-500",
    },
    "kids": {
      revealBg: "from-emerald-400 to-teal-500 text-white shadow-teal-300/40 border-white",
      nextBg: "bg-white border-4 border-teal-400 text-teal-600 shadow-teal-100/60 hover:bg-teal-50/40 hover:border-teal-500",
    },
    "kid": {
      revealBg: "from-emerald-400 to-teal-500 text-white shadow-teal-300/40 border-white",
      nextBg: "bg-white border-4 border-teal-400 text-teal-600 shadow-teal-100/60 hover:bg-teal-50/40 hover:border-teal-500",
    },
    "teen": {
      revealBg: "from-indigo-400 to-violet-500 text-white shadow-indigo-300/30 border-white",
      nextBg: "bg-white border-4 border-indigo-400 text-indigo-600 shadow-indigo-50/80 hover:bg-indigo-50/30 hover:border-indigo-500",
    },
    "teens": {
      revealBg: "from-indigo-400 to-violet-500 text-white shadow-indigo-300/30 border-white",
      nextBg: "bg-white border-4 border-indigo-400 text-indigo-600 shadow-indigo-50/80 hover:bg-indigo-50/30 hover:border-indigo-500",
    },
    "readers": {
      revealBg: "from-pink-400 to-rose-500 text-white shadow-rose-300/30 border-white",
      nextBg: "bg-white border-4 border-rose-400 text-rose-600 shadow-rose-50/80 hover:bg-rose-50/30 hover:border-rose-500",
    },
    "learner": {
      revealBg: "from-pink-400 to-rose-500 text-white shadow-rose-300/30 border-white",
      nextBg: "bg-white border-4 border-rose-400 text-rose-600 shadow-rose-50/80 hover:bg-rose-50/30 hover:border-rose-500",
    },
    "adults": {
      revealBg: "from-pink-400 to-rose-500 text-white shadow-rose-300/30 border-white",
      nextBg: "bg-white border-4 border-rose-400 text-rose-600 shadow-rose-50/80 hover:bg-rose-50/30 hover:border-rose-500",
    },
    "adult": {
      revealBg: "from-pink-400 to-rose-500 text-white shadow-rose-300/30 border-white",
      nextBg: "bg-white border-4 border-rose-400 text-rose-600 shadow-rose-50/80 hover:bg-rose-50/30 hover:border-rose-500",
    }
  }[selectedCategory.slug as string] || {
    revealBg: "from-indigo-400 to-violet-500 text-white shadow-indigo-300/30 border-white",
    nextBg: "bg-white border-4 border-indigo-400 text-indigo-600 shadow-indigo-50/80 hover:bg-indigo-50/30 hover:border-indigo-500",
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

  let cardBorderColor = "border-amber-300 shadow-amber-200/80"
  if (selectedCategory.slug === "kid-6-12" || selectedCategory.slug === "kid" || selectedCategory.slug === "kids") cardBorderColor = "border-emerald-300 shadow-emerald-200/80"
  else if (selectedCategory.slug === "teen" || selectedCategory.slug === "teens") cardBorderColor = "border-indigo-300 shadow-indigo-200/80"
  else if (selectedCategory.slug === "readers" || selectedCategory.slug === "learner" || selectedCategory.slug === "adults" || selectedCategory.slug === "adult") cardBorderColor = "border-rose-300 shadow-rose-200/80"

  const cardContainerClass = isKidMode
    ? `absolute inset-0 w-full h-full rounded-[48px] bg-white border-8 ${cardBorderColor} flex flex-col justify-between overflow-hidden shadow-[0_24px_50px_rgba(251,191,36,0.12)]`
    : "absolute inset-0 w-full h-full rounded-[36px] bg-white border border-slate-200/80 flex flex-col justify-between overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.05)]"

  return (
    <div
      className={`fixed inset-0 z-[100] ${pageBg} flex flex-col overflow-y-auto md:overflow-hidden font-body animate-in fade-in zoom-in-95 duration-500`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Floating Header Actions (Transparent) */}
      <div className="absolute top-[max(16px,env(safe-area-inset-top,16px))] left-4 right-4 md:top-6 md:left-8 md:right-8 z-50 flex justify-between items-center pointer-events-none">
        <button 
          onClick={handleBackToSelection}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold pointer-events-auto ${backButtonClass}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline">Back to Topics</span>
        </button>

        {/* Mode Switcher Segmented Control (Top Right) */}
        <div className="pointer-events-auto">
          <div className={`flex items-center gap-1 p-1 rounded-2xl border shadow-sm transition-all duration-300 ${
            isKidMode 
              ? "bg-amber-50/90 border-amber-200/60" 
              : "bg-slate-50 border-slate-200"
          }`}>
            {/* Mode Switcher — order: Word Puzzle | Type | Hint */}
            <button 
              onClick={() => handleModeChange('scramble')} 
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ${
                challengeMode === 'scramble' 
                  ? (isKidMode ? 'bg-amber-500 text-white shadow-md' : 'bg-primary text-white shadow-md') 
                  : (isKidMode ? 'text-amber-800 hover:bg-amber-100/50' : 'text-slate-600 hover:bg-slate-100')
              }`}
            >
              Word Puzzle
            </button>
            <button 
              onClick={() => handleModeChange('type')} 
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ${
                challengeMode === 'type' 
                  ? (isKidMode ? 'bg-amber-500 text-white shadow-md' : 'bg-primary text-white shadow-md') 
                  : (isKidMode ? 'text-amber-800 hover:bg-amber-100/50' : 'text-slate-600 hover:bg-slate-100')
              }`}
            >
              Type
            </button>
            <button 
              onClick={() => handleModeChange('hint')} 
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ${
                challengeMode === 'hint' 
                  ? (isKidMode ? 'bg-amber-500 text-white shadow-md' : 'bg-primary text-white shadow-md') 
                  : (isKidMode ? 'text-amber-800 hover:bg-amber-100/50' : 'text-slate-600 hover:bg-slate-100')
              }`}
            >
              Hint
            </button>
          </div>
        </div>
      </div>


      {/* 2. Central Content: 3D Flip Card */}
      <main className="flex-1 flex flex-col justify-start md:justify-center items-center px-4 md:px-6 pt-24 sm:pt-24 md:pt-16 pb-4 md:pb-0 relative max-w-4xl mx-auto w-full">

        {/* Hidden input for mobile keyboard support */}
        <input 
          ref={hiddenInputRef}
          type="text"
          className="opacity-0 absolute pointer-events-none w-0 h-0"
          value=""
          onChange={handleHiddenInputChange}
          aria-hidden="true"
        />

        {/* Custom keyframe styles for shake, fall and flyIn animation */}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
          }
          .animate-shake {
            animation: shake 0.2s ease-in-out 0s 2;
          }
          @keyframes fall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(115vh) rotate(720deg);
              opacity: 0;
            }
          }
          .animate-fall {
            animation: fall var(--duration) linear var(--delay) infinite;
          }
          @keyframes flyIn {
            0% {
              transform: translateY(24px) scale(0.3);
              opacity: 0;
            }
            60% {
              transform: translateY(-4px) scale(1.1);
              opacity: 0.8;
            }
            100% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          .animate-fly-in {
            animation: flyIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>



        {/* 3D Depth Container */}
        <div 
          className={`w-[min(85vw,280px)] sm:w-[320px] md:w-[380px] md:h-[380px] sm:h-[320px] transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isFlipped ? 'h-[380px]' : 'h-[min(85vw,280px)]'
          }`}
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
                <div className="w-full h-full rounded-[32px] overflow-hidden relative bg-white">
                  {activeCard?.imageUrl ? (
                    <>
                      {isImageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-amber-50/50 backdrop-blur-sm z-10">
                          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                        </div>
                      )}
                      <img 
                        key={activeCard?.id}
                        src={activeCard.imageUrl} 
                        alt="Flashcard illustration"
                        className={`w-full h-full object-contain transition-all duration-700 hover:scale-105 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={() => setIsImageLoading(false)}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-30">✨</span>
                    </div>
                  )}
                </div>
              ) : (
                // TEEN & READERS: Clean modern image and word on front
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="w-full h-[68%] rounded-2xl overflow-hidden relative border border-slate-100 bg-slate-50 shrink-0">
                    {activeCard?.imageUrl ? (
                      <>
                        {isImageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10">
                            <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
                          </div>
                        )}
                        <img 
                          key={activeCard?.id}
                          src={activeCard.imageUrl} 
                          alt="Flashcard illustration"
                          className={`w-full h-full object-cover transition-opacity duration-500 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                          onLoad={() => setIsImageLoading(false)}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-30">🖼️</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center pt-4">
                    {challengeMode === 'hint' ? (
                      <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none text-center">
                        {activeCard?.word}
                      </h3>
                    ) : (
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        Spell the word below
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================
                B. BACK SIDE
                ======================================================== */}
            <div 
              className={`${cardContainerClass} ${isKidMode ? 'pt-3 pb-2 px-4 md:pt-4 md:pb-3 md:px-5' : 'p-6'}`}
              style={{ 
                backfaceVisibility: "hidden", 
                transform: "rotateY(180deg)"
              }}
            >
              {/* Soft interior background gradient */}
              <span className="absolute inset-0 bg-gradient-to-b from-slate-50/10 via-transparent to-transparent pointer-events-none" />

              {/* 2. Central Area */}
              <div className="flex-1 flex flex-col justify-start px-2 overflow-y-auto max-h-full no-scrollbar pb-1">
                <div className="w-full my-auto flex flex-col gap-2 md:gap-2.5">
                  
                  {/* Word, Phonetic & Audio */}
                  <div className="flex flex-col items-center text-center space-y-1.5 md:space-y-2 shrink-0">
                    <h2 className={`text-3xl md:text-4xl font-black tracking-tight leading-none ${isKidMode ? "text-amber-900" : "text-slate-800"}`}>
                      {activeCard?.word}
                    </h2>
                    
                    <div className="flex items-center justify-center gap-3 mt-1">
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
                        className={`p-2 md:p-2.5 rounded-full bg-gradient-to-r ${focusThemeColor} text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 shadow-orange-300/30`}
                        title="Listen to pronunciation"
                      >
                        <Volume2 className="w-4 md:w-4.5 h-4 md:h-4.5" />
                      </button>
                    </div>
                  </div>

                  <hr className={`${isKidMode ? "border-amber-100" : "border-slate-100"} shrink-0 w-full`} />

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
                        onClick={(e) => { e.stopPropagation(); setDisplayLang('en'); }}
                        title="English"
                        className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 hover:opacity-100 ${
                          displayLang === 'en'
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-white shadow-sm scale-110 opacity-100'
                            : 'opacity-40'
                        }`}
                      >
                        <img src="/flags/flag-en.png" alt="English" className="w-full h-full object-cover" />
                      </button>
                      
                      {/* Native Language Flag (only if it is not English or other) */}
                      {currentLang !== 'en' && currentLang !== 'other' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDisplayLang(currentLang); }}
                          title={getLangTitle(currentLang)}
                          className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 hover:opacity-100 ${
                            displayLang === currentLang
                              ? 'ring-2 ring-primary ring-offset-2 ring-offset-white shadow-sm scale-110 opacity-100'
                              : 'opacity-40'
                          }`}
                        >
                          <img src={getFlagUrl(currentLang)} alt={getLangTitle(currentLang)} className="w-full h-full object-cover" />
                        </button>
                      )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <p className={`text-center min-h-[40px] flex items-center justify-center px-4 font-black ${
                      isKidMode ? "text-amber-950 text-base md:text-lg" : "text-slate-700 text-sm md:text-base"
                    }`}>
                      {getDefinitionText(activeCard, displayLang)}
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
        </div>

        {/* Native Language Definition — below card, in flow (no overlap) */}
        {activeCard && !isFlipped && challengeMode !== 'hint' && (
          <div className="mt-4 text-center animate-in fade-in zoom-in-95 duration-300 px-4">
            <span className={`font-black tracking-wide text-xl md:text-2xl lg:text-3xl ${
              isKidMode ? "text-amber-900" : "text-slate-800"
            }`}>
              {getDefinitionText(activeCard, currentLang)}
            </span>
          </div>
        )}

        {challengeMode === 'type' && !isFlipped && unikeyDetected && (
          <div className="w-full max-w-[480px] flex items-start gap-2.5 px-4 py-3 rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-800 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm mt-3">
            <span className="text-base shrink-0">⚠️</span>
            <span className="flex-1 leading-relaxed">
              Có vẻ bạn đang bật <strong>Unikey</strong> (bộ gõ tiếng Việt).
              {' '}Hãy tắt để gõ chữ tiếng Anh chính xác nhé! (⌨️ Alt + Shift hoặc click Unikey → OFF)
            </span>
            <button
              onClick={() => setUnikeyDetected(false)}
              className="shrink-0 text-orange-400 hover:text-orange-700 transition-colors p-0.5 rounded"
              title="Đóng"
            >
              ✕
            </button>
          </div>
        )}

        {/* Random letter-by-letter reveal area (outside card container) */}
        {!isFlipped && (isKidMode || challengeMode !== 'hint') && activeCard && (
          <div className="mt-3 flex flex-wrap justify-center items-center gap-1.5 md:gap-2 max-w-[480px] w-full select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeCard.word.split("").map((char, index) => {
              const isSpace = char === " ";
              const isLetterChar = /[a-zA-Z]/.test(char);
              const isRevealed = !isLetterChar || revealedIndices.includes(index);
              
              // Hiệu ứng rung đỏ khi gõ sai chữ cái
              const isWrong = wrongTypedIndex === index;

              if (isSpace) {
                return (
                  <span key={index} className="w-3.5 md:w-5" />
                );
              }
              
              // Xác định kích thước động cho từ dài ngắn khác nhau
              const wordLength = activeCard.word.replace(/\s/g, '').length;
              let sizeClass = "w-9 h-9 md:w-11 md:h-11 text-lg md:text-xl rounded-xl";
              if (wordLength > 12) {
                sizeClass = "w-5 h-5 md:w-7 md:h-7 text-[10px] md:text-xs rounded-md";
              } else if (wordLength > 9) {
                sizeClass = "w-6 h-6 md:w-8 md:h-8 text-xs md:text-sm rounded-md";
              } else if (wordLength > 6) {
                sizeClass = "w-7 h-7 md:w-9 md:h-9 text-sm md:text-base rounded-lg";
              }
              
              return (
                <span 
                  key={index} 
                  className={`${sizeClass} flex items-center justify-center font-black border-2 transition-all duration-500 ${
                    isWrong
                      ? `animate-shake border-red-500 bg-red-100 text-red-600 ${wrongFading ? 'opacity-0 scale-90' : 'opacity-100'}`
                      : isRevealed 
                      ? `${challengeMode === 'scramble' ? 'animate-fly-in' : ''} ${
                          isKidMode 
                            ? "bg-amber-100 border-amber-300 text-amber-950" 
                            : "bg-indigo-50 border-indigo-200 text-indigo-950"
                        } scale-100 shadow-sm` 
                      : (challengeMode === 'scramble'
                          ? "border-transparent bg-transparent text-transparent opacity-0 pointer-events-none scale-50"
                          : `${isKidMode ? "bg-slate-50/80 border-slate-200 text-slate-300" : "bg-slate-50/60 border-slate-200/80 text-slate-300"} border-dashed scale-95`)
                  }`}
                >
                  {isWrong && wrongTypedLetter
                    ? wrongTypedLetter
                    : isRevealed ? char.toUpperCase() : ""}
                </span>
              );
            })}
          </div>
        )}

        {/* Sequential Action Button */}
        <div className={`shrink-0 flex justify-center w-full ${!isFlipped && (isKidMode || challengeMode !== 'hint') ? 'mt-4' : 'mt-4 md:mt-8'}`}>
          {!isFlipped ? (
            challengeMode === 'hint' ? (
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
            ) : challengeMode === 'scramble' ? (
              /* Bong bóng chữ cái xáo trộn */
              <div className="flex items-center justify-center gap-3 md:gap-3.5 shrink-0 flex-wrap min-h-[52px] w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-300">
                {scrambledLetters.map((item) => {
                  const isShaking = shakeItemId === item.id
                  return (
                    <button
                      key={item.id}
                      disabled={item.used}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleScrambleClick(item)
                      }}
                      className={`w-11 h-11 md:w-13 md:h-13 rounded-full font-black text-lg md:text-xl border-3 flex items-center justify-center shadow-md transition-all duration-300 ${
                        item.used
                          ? "opacity-0 scale-50 pointer-events-none"
                          : isShaking
                          ? "animate-shake border-red-500 bg-red-100 text-red-600"
                          : (isKidMode 
                              ? "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 active:scale-90 hover:scale-105" 
                              : "bg-white hover:bg-primary/5 border-primary text-primary active:scale-90 hover:scale-105")
                      }`}
                    >
                      {item.letter.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            ) : (
              /* Khung hướng dẫn Tự Gõ + nút Hint & Reveal */
              <div className="flex flex-col items-center gap-3 w-full animate-in fade-in zoom-in-95 duration-300">
                <div 
                  onClick={() => hiddenInputRef.current?.focus()}
                  className={`cursor-pointer px-6 py-3 rounded-2xl border text-center transition-all duration-200 hover:scale-102 active:scale-98 max-w-[360px] w-full shadow-sm ${
                    isKidMode 
                      ? "bg-amber-50/50 border-amber-200/40 text-amber-800 text-xs md:text-sm font-extrabold animate-pulse" 
                      : "bg-slate-50 border-slate-200/60 text-slate-500 text-xs md:text-sm font-medium animate-pulse"
                  }`}
                >
                  <span className="hidden md:inline">⌨️ Type any key to spell the word</span>
                  <span className="md:hidden">📱 Tap here to open the keyboard</span>
                </div>

                {/* Cảnh báo IME / Unikey: hiện mỗi lần phát hiện ký tự tiếng Việt */}
                {imeWarning && (
                  <div className="flex items-start gap-2 px-4 py-2.5 rounded-2xl border border-orange-300 bg-orange-50 text-orange-800 text-xs font-semibold w-full max-w-[360px] animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
                    <span className="text-base shrink-0 mt-0.5">⚠️</span>
                    <span className="leading-relaxed">
                      Bạn đã gõ:{' '}
                      <strong className="text-orange-900 font-black text-sm">&ldquo;{imeWarning}&rdquo;</strong>
                      {' '}→ đây là ký tự tiếng Việt.{' '}
                      Hãy tắt <strong>Unikey</strong> và thử lại!
                    </span>
                  </div>
                )}

                {/* Hint + Reveal buttons row */}
                <div className="flex items-center gap-3">
                  {/* Hint button — reveals next letter */}
                  {(() => {
                    const card = flashcards[currentIndex]
                    const nextIdx = card ? getNextUnrevealedIndex(card.word, revealedIndices) : -1
                    const allRevealed = nextIdx === -1
                    return (
                      <button
                        disabled={allRevealed}
                        onClick={() => {
                          if (!card || allRevealed) return
                          setRevealedIndices(prev => [...prev, nextIdx])
                        }}
                        className={`transition-all duration-300 font-black uppercase tracking-widest flex items-center gap-2 group active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 ${
                          isKidMode
                            ? `px-8 py-4.5 rounded-full border-4 shadow-xl hover:scale-105 text-base bg-gradient-to-r from-sky-400 to-blue-500 text-white border-sky-300`
                            : `px-6 py-3.5 rounded-full shadow-md hover:scale-105 text-sm bg-gradient-to-r from-sky-400 to-blue-500 text-white`
                        }`}
                      >
                        <HelpCircle className="w-5 h-5" />
                        <span>Hint</span>
                      </button>
                    )
                  })()}

                  {/* Reveal Details button */}
                  <button
                    onClick={() => setIsFlipped(true)}
                    className={`transition-all duration-300 font-black uppercase tracking-widest flex items-center gap-2 group active:scale-95 ${
                      isKidMode
                        ? `px-8 py-4.5 rounded-full border-4 shadow-xl hover:scale-105 text-base bg-gradient-to-r ${themeConfig.revealBg}`
                        : `px-6 py-3.5 rounded-full shadow-md hover:scale-105 text-sm bg-gradient-to-r ${themeConfig.revealBg}`
                    }`}
                  >
                    <span>Reveal</span>
                    <Sparkles className="w-5 h-5 group-hover:animate-pulse text-white" />
                  </button>
                </div>
              </div>
            )
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
      <footer className={`px-6 md:px-12 py-3 md:py-6 pb-[max(12px,env(safe-area-inset-bottom,12px))] border-t flex flex-col items-center gap-3 md:gap-4 shrink-0 ${
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
          Tip: Press <kbd className={`px-1.5 py-0.5 rounded border shadow-sm font-sans ${isKidMode ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>Space</kbd> to flip / next card, use <kbd className={`px-1.5 py-0.5 rounded border shadow-sm font-sans ${isKidMode ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>←</kbd> <kbd className={`px-1.5 py-0.5 rounded border shadow-sm font-sans ${isKidMode ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>→</kbd> to switch cards
        </div>
      </footer>

      {/* Hiệu ứng pháo hoa giấy chúc mừng rơi toàn màn hình */}
      {showCelebration && confettiParticles.map((p) => (
        <span
          key={p.id}
          className="fixed z-[150] rounded-sm animate-fall pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.angle}deg)`,
            '--duration': `${p.duration}s`,
            '--delay': `${p.delay}s`,
          } as any}
        />
      ))}

    </div>
  )
}
