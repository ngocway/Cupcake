"use client"

import { useState, useTransition, useRef } from "react"
import { uploadMedia, uploadUrlMedia } from "@/actions/upload-actions"
import { 
  adminCreateFlashcard, 
  adminUpdateFlashcard, 
  adminDeleteFlashcard,
  adminCreateTopic,
  adminUpdateTopic,
  adminDeleteTopic
} from "@/actions/admin-flashcards"
import { generateVocabularyDetails } from "@/actions/ai-actions"
import { searchImagesAction } from "@/actions/image-search-actions"
import { toast } from "sonner"
import { Volume2, Plus, Edit, Trash2, Search, Filter, Image as ImageIcon, CheckCircle2, AlertCircle, Globe, Sparkles, Wand2, Copy } from "lucide-react"

// TypeScript interfaces
interface Topic {
  id: string
  categoryId: string
  name: string
  slug: string
  createdAt: Date
  category: {
    name: string
    slug: string
  }
  _count?: {
    flashcards: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
  topics: {
    id: string
    name: string
    slug: string
  }[]
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
  createdAt: Date
  topic: {
    id: string
    name: string
    category: {
      id: string
      name: string
    }
  }
}

interface AdminFlashcardsClientProps {
  initialCategories: Category[]
  initialTopics: Topic[]
  initialFlashcards: any[]
}

export function AdminFlashcardsClient({ 
  initialCategories, 
  initialTopics, 
  initialFlashcards 
}: AdminFlashcardsClientProps) {
  // Navigation & Core Lists
  const [activeTab, setActiveTab] = useState<"cards" | "topics">("cards")
  const [categories] = useState<Category[]>(initialCategories)
  const [topics, setTopics] = useState<Topic[]>(initialTopics)
  const [flashcards, setFlashcards] = useState<any[]>(initialFlashcards)

  // Filters
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>("ALL")
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("ALL")
  const [searchWord, setSearchWord] = useState<string>("")

  const [selectedCatTopicFilter, setSelectedCatTopicFilter] = useState<string>("ALL")
  const [searchTopicName, setSearchTopicName] = useState<string>("")

  // Modals & Pending Actions
  const [showCardModal, setShowCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [cardForm, setCardForm] = useState({
    categoryId: "",
    topicId: "",
    word: "",
    phonetic: "",
    imageUrl: "",
    definition: "",
    definitionVi: "",
    definitionTh: "",
    definitionId: "",
    exampleSentence: ""
  })
  
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [topicForm, setTopicForm] = useState({
    categoryId: "",
    name: ""
  })

  // Delete confirms
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState("")
  const [deletingType, setDeletingType] = useState<"card" | "topic">("card")
  const [deletingName, setDeletingName] = useState("")

  // Action status
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI & Image Search states
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSearchingImage, setIsSearchingImage] = useState(false)
  const [isUploadingVocabImage, setIsUploadingVocabImage] = useState(false)
  const [showImageSearchDrawer, setShowImageSearchDrawer] = useState(false)
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([])
  const [showAIPromptModal, setShowAIPromptModal] = useState(false)

  // -------------------------------------------------------------
  // FLASHCARD FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredFlashcards = flashcards.filter(card => {
    const matchWord = card.word.toLowerCase().includes(searchWord.toLowerCase())
    const matchCat = selectedCatFilter === "ALL" || card.topic?.category?.id === selectedCatFilter
    const matchTopic = selectedTopicFilter === "ALL" || card.topic?.id === selectedTopicFilter
    return matchWord && matchCat && matchTopic
  })

  // Dynamic topics under selected Category inside Filters dropdown
  const filteredTopicsForFilter = selectedCatFilter === "ALL" 
    ? topics 
    : topics.filter(t => t.categoryId === selectedCatFilter)

  // -------------------------------------------------------------
  // TOPIC FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredTopics = topics.filter(topic => {
    const matchName = topic.name.toLowerCase().includes(searchTopicName.toLowerCase())
    const matchCat = selectedCatTopicFilter === "ALL" || topic.categoryId === selectedCatTopicFilter
    return matchName && matchCat
  })

  // -------------------------------------------------------------
  // IMAGE UPLOAD HANDLER
  // -------------------------------------------------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await uploadMedia(formData)
      if (res.success && res.url) {
        setCardForm(prev => ({ ...prev, imageUrl: res.url }))
      } else {
        alert("Upload thất bại: " + res.error)
      }
    } catch (err: any) {
      alert("Lỗi tải ảnh lên R2: " + err.message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // -------------------------------------------------------------
  // AI AUTO-FILL HANDLER
  // -------------------------------------------------------------
  const handleAiFill = async () => {
    if (!cardForm.word || !cardForm.word.trim()) {
      toast.error("Vui lòng nhập từ vựng tiếng Anh trước.")
      return
    }

    setIsAiLoading(true)
    const word = cardForm.word.trim().replace(/[.,!?;:]/g, "")
    const cleanLookup = word.toLowerCase()

    try {
      // 1. Try generateVocabularyDetails
      const result = await generateVocabularyDetails(word)
      if (result && !result.error) {
        setCardForm(prev => ({
          ...prev,
          word: result.word || prev.word,
          phonetic: result.pronunciation || prev.phonetic || "...",
          definition: result.explanationEn || prev.definition || "",
          definitionVi: result.meaningVi || prev.definitionVi || "",
          definitionTh: result.meaningTh || prev.definitionTh || "",
          definitionId: result.meaningId || prev.definitionId || "",
          exampleSentence: Array.isArray(result.examples) && result.examples.length > 0 
            ? result.examples[0] 
            : (typeof result.examples === "string" ? result.examples : prev.exampleSentence || "")
        }))

        toast.success("AI tự điền thông tin thành công!")
        
        // 2. Automatically trigger Google Image search as requested!
        setIsAiLoading(false)
        await handleGoogleImageSearch(result.word || word)
        return
      } else if (result?.error) {
        console.warn("AI details error response:", result.error)
      }
    } catch (error) {
      console.error("AI autofill error:", error)
    }

    // 2. Fallback to dictionary and MyMemory translation APIs
    try {
      toast.info("Đang tra cứu từ điển dự phòng...")
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanLookup}`)
      const dictData = await dictRes.json()
      
      let pronunciation = ""
      let explanationEn = ""
      let exampleSentence = ""
      
      if (Array.isArray(dictData) && dictData.length > 0) {
        const entry = dictData[0]
        pronunciation = entry.phonetic || entry.phonetics?.find((ph: any) => ph.text)?.text || ""
        const firstMeaning = entry.meanings?.[0]
        if (firstMeaning) {
          explanationEn = firstMeaning.definitions?.[0]?.definition || ""
          exampleSentence = firstMeaning.definitions?.[0]?.example || ""
        }
      }

      const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`)
      const transData = await transRes.json()
      const meaningVi = transData?.responseData?.translatedText || ""

      setCardForm(prev => ({
        ...prev,
        phonetic: pronunciation || prev.phonetic || "/.../",
        definition: explanationEn || prev.definition || `Definition for '${prev.word}' not found.`,
        definitionVi: meaningVi || prev.definitionVi || `(Nghĩa của từ "${prev.word}")`,
        exampleSentence: exampleSentence || prev.exampleSentence || ""
      }))

      toast.success("Tự điền thông tin từ điển thành công!")
      await handleGoogleImageSearch(word)
    } catch (innerError) {
      console.error("Fallback dictionary error:", innerError)
      toast.error("Không thể lấy thông tin tự động. Vui lòng nhập thủ công.")
    } finally {
      setIsAiLoading(false)
    }
  }

  // -------------------------------------------------------------
  // GOOGLE IMAGE SEARCH HANDLER
  // -------------------------------------------------------------
  const handleGoogleImageSearch = async (searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim()) {
      toast.error("Vui lòng nhập từ khóa tìm kiếm ảnh.")
      return
    }

    setIsSearchingImage(true)
    setShowImageSearchDrawer(true)

    try {
      const results = await searchImagesAction(searchTerm)
      setImageSearchResults(results || [])
    } catch (err: any) {
      console.error(err)
      toast.error("Lỗi tìm ảnh: " + (err.message || "Không thể tải ảnh từ Google Images."))
    } finally {
      setIsSearchingImage(false)
    }
  }

  // -------------------------------------------------------------
  // IMAGE SELECT & R2 UPLOAD HANDLER
  // -------------------------------------------------------------
  const handleImageSelect = async (imageUrl: string) => {
    setIsUploadingVocabImage(true)
    setShowImageSearchDrawer(false)
    toast.info("Đang đồng bộ ảnh về R2...")

    try {
      const result = await uploadUrlMedia(imageUrl)
      if (result.success && result.url) {
        setCardForm(prev => ({ ...prev, imageUrl: result.url }))
        toast.success("Lưu ảnh lên Cloudflare R2 thành công!")
      } else {
        toast.error("Lưu ảnh thất bại: " + result.error)
      }
    } catch (err: any) {
      console.error("Image upload URL error:", err)
      toast.error("Lỗi đồng bộ ảnh: " + (err.message || String(err)))
    } finally {
      setIsUploadingVocabImage(false)
    }
  }

  // -------------------------------------------------------------
  // OPEN FLASHCARD MODAL
  // -------------------------------------------------------------
  const openCardModal = (card: Flashcard | null = null) => {
    if (card) {
      setEditingCard(card)
      setCardForm({
        categoryId: card.topic?.category?.id || "",
        topicId: card.topicId,
        word: card.word,
        phonetic: card.phonetic || "",
        imageUrl: card.imageUrl || "",
        definition: card.definition || "",
        definitionVi: card.definitionVi || "",
        definitionTh: card.definitionTh || "",
        definitionId: card.definitionId || "",
        exampleSentence: card.exampleSentence || ""
      })
    } else {
      setEditingCard(null)
      // Pick first category and its first topic as default
      const defaultCat = categories[0]
      const defaultTopic = defaultCat?.topics[0]
      setCardForm({
        categoryId: defaultCat?.id || "",
        topicId: defaultTopic?.id || "",
        word: "",
        phonetic: "",
        imageUrl: "",
        definition: "",
        definitionVi: "",
        definitionTh: "",
        definitionId: "",
        exampleSentence: ""
      })
    }
    setShowCardModal(true)
  }

  // Handle dynamic category change inside Card modal to update topics dropdown
  const handleModalCategoryChange = (catId: string) => {
    const targetCat = categories.find(c => c.id === catId)
    const targetTopic = targetCat?.topics[0]
    setCardForm(prev => ({
      ...prev,
      categoryId: catId,
      topicId: targetTopic?.id || ""
    }))
  }

  // -------------------------------------------------------------
  // SAVE FLASHCARD ACTION
  // -------------------------------------------------------------
  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardForm.word || !cardForm.topicId) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc.")
      return
    }

    startTransition(async () => {
      if (editingCard) {
        // UPDATE
        const res = await adminUpdateFlashcard(editingCard.id, {
          topicId: cardForm.topicId,
          word: cardForm.word,
          phonetic: cardForm.phonetic,
          imageUrl: cardForm.imageUrl,
          definition: cardForm.definition,
          definitionVi: cardForm.definitionVi,
          definitionTh: cardForm.definitionTh,
          definitionId: cardForm.definitionId,
          exampleSentence: cardForm.exampleSentence
        })

        if (res.success && res.card) {
          // Update local state in place
          setFlashcards(prev => prev.map(c => c.id === editingCard.id ? {
            ...c,
            ...res.card,
            topic: {
              id: cardForm.topicId,
              name: topics.find(t => t.id === cardForm.topicId)?.name || "",
              category: {
                id: cardForm.categoryId,
                name: categories.find(c => c.id === cardForm.categoryId)?.name || ""
              }
            }
          } : c))
          setShowCardModal(false)
        } else {
          alert("Lỗi khi sửa thẻ: " + res.error)
        }
      } else {
        // CREATE
        const res = await adminCreateFlashcard({
          topicId: cardForm.topicId,
          word: cardForm.word,
          phonetic: cardForm.phonetic,
          imageUrl: cardForm.imageUrl,
          definition: cardForm.definition,
          definitionVi: cardForm.definitionVi,
          definitionTh: cardForm.definitionTh,
          definitionId: cardForm.definitionId,
          exampleSentence: cardForm.exampleSentence
        })

        if (res.success && res.card) {
          // Add to local state (at top because it's newest)
          const newLocalCard = {
            ...res.card,
            topic: {
              id: cardForm.topicId,
              name: topics.find(t => t.id === cardForm.topicId)?.name || "",
              category: {
                id: cardForm.categoryId,
                name: categories.find(c => c.id === cardForm.categoryId)?.name || ""
              }
            }
          }
          setFlashcards(prev => [newLocalCard, ...prev])
          setShowCardModal(false)
        } else {
          alert("Lỗi khi tạo thẻ mới: " + res.error)
        }
      }
    })
  }

  // -------------------------------------------------------------
  // OPEN TOPIC MODAL
  // -------------------------------------------------------------
  const openTopicModal = (topic: Topic | null = null) => {
    if (topic) {
      setEditingTopic(topic)
      setTopicForm({
        categoryId: topic.categoryId,
        name: topic.name
      })
    } else {
      setEditingTopic(null)
      setTopicForm({
        categoryId: categories[0]?.id || "",
        name: ""
      })
    }
    setShowTopicModal(true)
  }

  // -------------------------------------------------------------
  // SAVE TOPIC ACTION
  // -------------------------------------------------------------
  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topicForm.name || !topicForm.categoryId) {
      alert("Vui lòng nhập tên chủ đề.")
      return
    }

    startTransition(async () => {
      if (editingTopic) {
        // UPDATE
        const res = await adminUpdateTopic(editingTopic.id, topicForm.name, topicForm.categoryId)
        if (res.success && res.topic) {
          // Update in local state
          const updatedLocalTopic = {
            ...editingTopic,
            ...res.topic,
            category: {
              name: categories.find(c => c.id === topicForm.categoryId)?.name || "",
              slug: categories.find(c => c.id === topicForm.categoryId)?.slug || ""
            }
          }
          setTopics(prev => prev.map(t => t.id === editingTopic.id ? updatedLocalTopic : t))
          setShowTopicModal(false)
        } else {
          alert("Lỗi sửa chủ đề: " + res.error)
        }
      } else {
        // CREATE
        const res = await adminCreateTopic(topicForm.categoryId, topicForm.name)
        if (res.success && res.topic) {
          const newLocalTopic = {
            ...res.topic,
            category: {
              name: categories.find(c => c.id === topicForm.categoryId)?.name || "",
              slug: categories.find(c => c.id === topicForm.categoryId)?.slug || ""
            },
            _count: { flashcards: 0 }
          }
          // Prepend as it is the newest
          setTopics(prev => [newLocalTopic, ...prev])
          setShowTopicModal(false)
        } else {
          alert("Lỗi tạo chủ đề: " + res.error)
        }
      }
    })
  }

  // -------------------------------------------------------------
  // TRIGGER DELETE COMFIRMATION
  // -------------------------------------------------------------
  const triggerDelete = (id: string, type: "card" | "topic", name: string) => {
    setDeletingId(id)
    setDeletingType(type)
    setDeletingName(name)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      if (deletingType === "card") {
        const res = await adminDeleteFlashcard(deletingId)
        if (res.success) {
          setFlashcards(prev => prev.filter(c => c.id !== deletingId))
          setShowDeleteConfirm(false)
        } else {
          alert("Không thể xóa thẻ: " + res.error)
        }
      } else {
        const res = await adminDeleteTopic(deletingId)
        if (res.success) {
          // Cascade local state updates: remove topic and all cards under this topic!
          setTopics(prev => prev.filter(t => t.id !== deletingId))
          setFlashcards(prev => prev.filter(c => c.topicId !== deletingId))
          setShowDeleteConfirm(false)
        } else {
          alert("Không thể xóa chủ đề: " + res.error)
        }
      }
    })
  }

  // Help calculate translations done status
  const getLangsDoneCount = (card: any) => {
    let count = 1 // English default
    if (card.definitionVi) count++
    if (card.definitionTh) count++
    if (card.definitionId) count++
    return count
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Toggle Navigation Tabs */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-center justify-between shadow-xl">
        <div className="flex gap-1.5 p-1.5 bg-neutral-800 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-8 py-2.5 font-bold rounded-xl transition-all text-center flex-grow md:flex-none text-sm ${
              activeTab === "cards" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Quản lý Thẻ học ({flashcards.length})
          </button>
          <button
            onClick={() => setActiveTab("topics")}
            className={`px-8 py-2.5 font-bold rounded-xl transition-all text-center flex-grow md:flex-none text-sm ${
              activeTab === "topics" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Quản lý Chủ đề ({topics.length})
          </button>
        </div>

        <button
          onClick={() => activeTab === "cards" ? openCardModal() : openTopicModal()}
          className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all whitespace-nowrap text-sm shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-5.5 h-5.5" />
          <span>{activeTab === "cards" ? "Thêm thẻ mới" : "Thêm chủ đề mới"}</span>
        </button>
      </div>

      {/* =======================================================================
          TAB 1: FLASHCARDS MANAGEMENT
          ======================================================================= */}
      {activeTab === "cards" && (
        <div className="space-y-6">
          
          {/* Dynamic Filter Row */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4 shadow-md">
            
            {/* Filter Category */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Nhóm tuổi (Category)</label>
              <div className="relative">
                <select
                  value={selectedCatFilter}
                  onChange={(e) => {
                    setSelectedCatFilter(e.target.value)
                    setSelectedTopicFilter("ALL") // Reset topic filter
                  }}
                  className="w-full pl-4 pr-10 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-semibold appearance-none cursor-pointer"
                >
                  <option value="ALL">Tất cả nhóm tuổi</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                  <Filter className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Filter Topic */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Chủ đề từ vựng (Topic)</label>
              <div className="relative">
                <select
                  value={selectedTopicFilter}
                  onChange={(e) => setSelectedTopicFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-semibold appearance-none cursor-pointer"
                >
                  <option value="ALL">Tất cả chủ đề</option>
                  {filteredTopicsForFilter.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({categories.find(c => c.id === t.categoryId)?.name})</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                  <Filter className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Search Word */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Tìm từ vựng (Word Search)</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  placeholder="Nhập từ vựng cần tìm..."
                  className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-semibold"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Search className="w-4.5 h-4.5" />
                </div>
              </div>
            </div>

          </div>

          {/* Flashcards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFlashcards.length === 0 ? (
              <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-16 rounded-[32px] text-center shadow-inner">
                <div className="w-20 h-20 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md border border-neutral-700">
                  <ImageIcon className="text-neutral-500 w-9 h-9" />
                </div>
                <p className="text-neutral-400 font-extrabold text-lg">Không tìm thấy thẻ học nào</p>
                <p className="text-neutral-500 text-sm mt-1">Vui lòng thay đổi bộ lọc hoặc thêm thẻ học mới!</p>
              </div>
            ) : (
              filteredFlashcards.map((card) => {
                const langsCount = getLangsDoneCount(card)
                return (
                  <div key={card.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-[28px] flex justify-between gap-4 shadow-lg hover:border-neutral-700 transition-all duration-300">
                    
                    <div className="flex gap-4 min-w-0">
                      {/* Thumbnail frame */}
                      <div className="w-24 h-24 rounded-2xl overflow-hidden relative border border-neutral-800 bg-neutral-950 shrink-0">
                        {card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.word} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-neutral-900">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1.5 flex flex-col justify-center">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-neutral-800 text-neutral-400 border border-neutral-700 self-start">
                          {card.topic?.category?.name || "Kids"}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-black text-lg truncate leading-tight">{card.word}</h3>
                          {card.phonetic && (
                            <span className="text-blue-400 font-mono text-xs font-bold">{card.phonetic}</span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-neutral-400 truncate max-w-xs">{card.definition || "No definition set"}</p>
                        
                        {/* Translations Badge Row */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-bold text-neutral-500 mr-1 uppercase">Translations:</span>
                          <span className="text-xs" title="English default">🇺🇸</span>
                          <span className={`text-xs transition-opacity ${card.definitionVi ? "opacity-100" : "opacity-20"}`} title="Tiếng Việt">🇻🇳</span>
                          <span className={`text-xs transition-opacity ${card.definitionTh ? "opacity-100" : "opacity-20"}`} title="Thai">🇹🇭</span>
                          <span className={`text-xs transition-opacity ${card.definitionId ? "opacity-100" : "opacity-20"}`} title="Indonesian">🇮🇩</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end shrink-0 pl-2">
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                        Topic: <span className="text-blue-500 font-black">{card.topic?.name}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openCardModal(card)}
                          className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-all border border-neutral-700 shadow-sm active:scale-95"
                          title="Sửa thẻ"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => triggerDelete(card.id, "card", card.word)}
                          className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 flex items-center justify-center transition-all border border-neutral-700 shadow-sm active:scale-95"
                          title="Xóa thẻ"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                )
              })
            )}
          </div>

        </div>
      )}

      {/* =======================================================================
          TAB 2: TOPICS MANAGEMENT (Quản lý Chủ đề)
          ======================================================================= */}
      {activeTab === "topics" && (
        <div className="space-y-6">
          
          {/* Filters topic row */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-4 shadow-md">
            
            {/* Filter category */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Lọc theo nhóm tuổi (Category)</label>
              <div className="relative">
                <select
                  value={selectedCatTopicFilter}
                  onChange={(e) => setSelectedCatTopicFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-semibold appearance-none cursor-pointer"
                >
                  <option value="ALL">Tất cả nhóm tuổi</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                  <Filter className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Search topic */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Tìm chủ đề (Topic Search)</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTopicName}
                  onChange={(e) => setSearchTopicName(e.target.value)}
                  placeholder="Nhập tên chủ đề cần tìm..."
                  className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-semibold"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Search className="w-4.5 h-4.5" />
                </div>
              </div>
            </div>

          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTopics.length === 0 ? (
              <div className="md:col-span-3 bg-neutral-900 border border-neutral-800 p-16 rounded-[32px] text-center shadow-inner">
                <div className="w-20 h-20 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md border border-neutral-700">
                  <AlertCircle className="text-neutral-500 w-9 h-9" />
                </div>
                <p className="text-neutral-400 font-extrabold text-lg">Không tìm thấy chủ đề nào</p>
                <p className="text-neutral-500 text-sm mt-1">Vui lòng thay đổi bộ lọc hoặc thêm chủ đề mới!</p>
              </div>
            ) : (
              filteredTopics.map((topic) => (
                <div key={topic.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-[28px] flex flex-col justify-between gap-6 shadow-lg hover:border-neutral-700 transition-all duration-300">
                  
                  <div className="space-y-3">
                    <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600/10 text-blue-500 border border-blue-600/15">
                      {topic.category?.name}
                    </span>
                    
                    <h3 className="text-xl font-black text-white leading-tight">{topic.name}</h3>
                    
                    <div className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
                      <span>URL Slug: <span className="text-neutral-400 font-mono">/flashcards?topic={topic.slug}</span></span>
                      <span>Ngày tạo: <span className="text-neutral-400">{new Date(topic.createdAt).toLocaleDateString("vi-VN")}</span></span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-800/80 pt-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-400 bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700">
                      📁 <span className="text-white font-black">{topic._count?.flashcards || 0}</span> Thẻ học
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openTopicModal(topic)}
                        className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-all border border-neutral-700 active:scale-95"
                        title="Sửa chủ đề"
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => triggerDelete(topic.id, "topic", topic.name)}
                        className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 flex items-center justify-center transition-all border border-neutral-700 active:scale-95"
                        title="Xóa chủ đề"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* =======================================================================
          MODAL 1: CREATE / EDIT FLASHCARD (Thêm & Sửa thẻ học)
          ======================================================================= */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 w-full max-w-2xl shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {editingCard ? "Chỉnh sửa Thẻ học" : "Tạo Thẻ học Mới"}
                </h2>
                <p className="text-xs text-neutral-400 font-semibold mt-1">Thiết lập các thông tin chi tiết và nghĩa dịch cho từ vựng.</p>
              </div>
              <button
                type="button"
                disabled={isAiLoading}
                onClick={handleAiFill}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold rounded-2xl flex items-center gap-1.5 transition-all text-xs shadow-lg shadow-violet-600/20 disabled:opacity-50 shrink-0"
              >
                {isAiLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>AI Tự Điền</span>
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-6">
              
              {/* Dropdowns selectors row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Nhóm tuổi (Category) <span className="text-red-500">*</span></label>
                  <select
                    value={cardForm.categoryId}
                    onChange={(e) => handleModalCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-semibold cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Chủ đề từ vựng (Topic) <span className="text-red-500">*</span></label>
                  <select
                    value={cardForm.topicId}
                    onChange={(e) => setCardForm(prev => ({ ...prev, topicId: e.target.value }))}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-semibold cursor-pointer"
                  >
                    {categories.find(c => c.id === cardForm.categoryId)?.topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Word & Phonetics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Từ vựng (Word) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={cardForm.word}
                    onChange={(e) => setCardForm(prev => ({ ...prev, word: e.target.value }))}
                    placeholder="Ví dụ: Wind"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none text-white focus:border-blue-500 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Phiên âm (Phonetic)</label>
                  <input
                    type="text"
                    value={cardForm.phonetic}
                    onChange={(e) => setCardForm(prev => ({ ...prev, phonetic: e.target.value }))}
                    placeholder="Ví dụ: /wɪnd/"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none text-white focus:border-blue-500 text-sm font-semibold font-mono"
                  />
                </div>
              </div>

              {/* R2 Image Uploader & custom link */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Hình ảnh thẻ học (Image URL)</label>
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-grow min-w-[200px]">
                    <input
                      type="text"
                      value={cardForm.imageUrl}
                      onChange={(e) => setCardForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="Nhập đường dẫn URL ảnh hoặc chọn file tải lên..."
                      className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-semibold"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      <ImageIcon className="w-4.5 h-4.5" />
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 active:scale-95 text-blue-400 font-bold rounded-2xl transition-all whitespace-nowrap text-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ImageIcon className="w-4.5 h-4.5" />
                    )}
                    <span>Tải ảnh lên R2</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSearchingImage}
                    onClick={() => handleGoogleImageSearch(cardForm.word)}
                    className="px-4 py-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 active:scale-95 text-blue-400 font-bold rounded-2xl transition-all whitespace-nowrap text-sm flex items-center gap-1.5 disabled:opacity-50"
                    title="Tìm ảnh trên Google"
                  >
                    {isSearchingImage ? (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Globe className="w-4.5 h-4.5" />
                    )}
                    <span>Web</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAIPromptModal(true)}
                    className="px-4 py-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 active:scale-95 text-purple-400 font-bold rounded-2xl transition-all whitespace-nowrap text-sm flex items-center gap-1.5"
                    title="Tạo prompt AI"
                  >
                    <Wand2 className="w-4.5 h-4.5" />
                    <span>AI Prompt</span>
                  </button>
                </div>
              </div>

              {/* Image preview frame */}
              {(cardForm.imageUrl || isUploadingVocabImage) && (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 relative group">
                  {isUploadingVocabImage ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 bg-neutral-900 border border-neutral-800">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-center">Đang lưu R2</span>
                    </div>
                  ) : (
                    <>
                      <img src={cardForm.imageUrl} alt="Form preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setCardForm(prev => ({ ...prev, imageUrl: "" }))}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-black text-rose-500 transition-opacity"
                      >
                        Xóa ảnh
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* 4 Languages Translation block */}
              <div className="border-t border-neutral-800/80 pt-6 space-y-4">
                <span className="block text-[11px] font-black text-neutral-500 uppercase tracking-widest">Biên dịch nghĩa từ vựng (4 Languages)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* EN Definition */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">
                      <span>🇺🇸 English (Gốc)</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={cardForm.definition}
                      onChange={(e) => setCardForm(prev => ({ ...prev, definition: e.target.value }))}
                      placeholder="e.g. A natural movement of air."
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none text-white focus:border-blue-500 text-sm font-semibold resize-none"
                    />
                  </div>

                  {/* VI Definition */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">🇻🇳 Tiếng Việt</label>
                    <textarea
                      rows={2}
                      value={cardForm.definitionVi}
                      onChange={(e) => setCardForm(prev => ({ ...prev, definitionVi: e.target.value }))}
                      placeholder="e.g. Luồng không khí chuyển động trong tự nhiên."
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none text-white focus:border-blue-500 text-sm font-semibold resize-none"
                    />
                  </div>

                  {/* TH Definition */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">🇹🇭 Tiếng Thái (Thai)</label>
                    <textarea
                      rows={2}
                      value={cardForm.definitionTh}
                      onChange={(e) => setCardForm(prev => ({ ...prev, definitionTh: e.target.value }))}
                      placeholder="e.g. ลม (การเคลื่อนไหวตามธรรมชาติของอากาศ)"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none text-white focus:border-blue-500 text-sm font-semibold resize-none"
                    />
                  </div>

                  {/* ID Definition */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">🇮🇩 Tiếng Indonesia (Indo)</label>
                    <textarea
                      rows={2}
                      value={cardForm.definitionId}
                      onChange={(e) => setCardForm(prev => ({ ...prev, definitionId: e.target.value }))}
                      placeholder="e.g. Angin (gerakan udara alami)"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none text-white focus:border-blue-500 text-sm font-semibold resize-none"
                    />
                  </div>

                </div>
              </div>

              {/* Example Sentence */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Câu ví dụ (Example Sentence)</label>
                <textarea
                  rows={2}
                  value={cardForm.exampleSentence}
                  onChange={(e) => setCardForm(prev => ({ ...prev, exampleSentence: e.target.value }))}
                  placeholder="e.g. The strong wind blew the colorful kite high up."
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none text-white focus:border-blue-500 text-sm font-semibold resize-none"
                />
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-3 justify-end border-t border-neutral-800/80 pt-6">
                <button 
                  type="button"
                  disabled={isPending}
                  onClick={() => setShowCardModal(false)}
                  className="px-5 py-2.5 font-bold text-neutral-400 hover:text-white transition-colors text-sm"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-2xl flex items-center gap-2 text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Lưu dữ liệu'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 2: CREATE / EDIT TOPIC (Thêm & Sửa chủ đề)
          ======================================================================= */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 w-full max-w-md shadow-2xl space-y-6">
            
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {editingTopic ? "Sửa Chủ đề" : "Tạo Chủ đề Mới"}
              </h2>
              <p className="text-xs text-neutral-400 font-semibold mt-1">Các nhóm tuổi cố định, Admin chỉ tạo chủ đề con đại diện.</p>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Chọn nhóm tuổi (Category) <span className="text-red-500">*</span></label>
                <select
                  value={topicForm.categoryId}
                  onChange={(e) => setTopicForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl outline-none focus:border-blue-500 text-white transition-all text-sm font-semibold cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Tên chủ đề (Topic Name) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={topicForm.name}
                  onChange={(e) => setTopicForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Nature"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl outline-none text-white focus:border-blue-500 text-sm font-semibold"
                />
              </div>

              {/* Info slug standardizer description */}
              <div className="bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-500 flex gap-2 items-center">
                <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
                <span>Hệ thống tự động đồng bộ đường dẫn URL Slug dạng: <code className="text-blue-400 bg-neutral-900 px-1 rounded">nature</code></span>
              </div>

              <div className="flex items-center gap-3 justify-end border-t border-neutral-800/80 pt-6">
                <button 
                  type="button"
                  disabled={isPending}
                  onClick={() => setShowTopicModal(false)}
                  className="px-5 py-2.5 font-bold text-neutral-400 hover:text-white transition-colors text-sm"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-2xl flex items-center gap-2 text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Lưu dữ liệu'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 3: DELETE COMFIRMATION DIALOG (Chặn & Xóa Cascade an toàn)
          ======================================================================= */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 w-full max-w-md shadow-2xl space-y-6">
            
            <div className="flex items-center gap-4 text-rose-500">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner shrink-0">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Xác nhận xóa bỏ?</h2>
                <p className="text-xs text-neutral-500 font-semibold mt-0.5">Thao tác này sẽ xóa vĩnh viễn khỏi Database.</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-neutral-300 leading-relaxed">
                Bạn có chắc chắn muốn xóa {deletingType === "card" ? "thẻ học" : "chủ đề"} <strong className="text-white">"{deletingName}"</strong> không?
              </p>

              {deletingType === "topic" && (
                <div className="bg-rose-500/10 border-2 border-rose-500/20 p-4 rounded-[20px] flex gap-3 text-xs font-black text-rose-400 leading-relaxed shadow-sm">
                  <AlertCircle className="w-6 h-6 shrink-0 text-rose-500" />
                  <span>
                    🛑 CẢNH BÁO NGUY HIỂM (Cascade Delete): Hành động xóa chủ đề này sẽ đồng thời xóa vĩnh viễn TOÀN BỘ các thẻ Flashcard đang trực thuộc bên trong chủ đề đó!
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end border-t border-neutral-800/80 pt-6">
              <button 
                type="button"
                disabled={isPending}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 font-bold text-neutral-400 hover:text-white transition-colors text-sm"
              >
                Hủy
              </button>
              <button 
                type="button"
                disabled={isPending}
                onClick={handleDeleteConfirm}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-2xl flex items-center gap-2 text-sm shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Đồng ý xóa'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =======================================================================
          SLIDE-OUT DRAWER: TÌM ẢNH TỪ GOOGLE IMAGES
          ======================================================================= */}
      {showImageSearchDrawer && (
        <div className="fixed top-0 right-0 h-full w-[360px] bg-neutral-900 border-l border-neutral-800 p-6 shadow-2xl flex flex-col z-[60] animate-in slide-in-from-right duration-300">
          
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="text-blue-500 w-5 h-5" />
                Tìm ảnh Internet
              </h4>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">
                Từ khoá: <span className="text-blue-500">{cardForm?.word}</span>
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setShowImageSearchDrawer(false)} 
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {isSearchingImage ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest">Đang tìm kiếm...</span>
              </div>
            ) : imageSearchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 pb-8">
                {imageSearchResults.map((img) => (
                  <div 
                    key={img.id} 
                    className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer border border-neutral-850 hover:border-blue-500 hover:shadow-lg transition-all" 
                    onClick={() => handleImageSelect(img.url)}
                  >
                    <img 
                      src={img.thumb} 
                      alt="Google result" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <span className="text-[9px] text-white/80 font-medium truncate">by {img.author}</span>
                    </div>
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-neutral-500 text-xs mt-10">Không tìm thấy ảnh nào phù hợp.</div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 4: AI PROMPT COPIER
          ======================================================================= */}
      {showAIPromptModal && cardForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[32px] w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-black text-white flex items-center gap-2">
                <Wand2 className="text-purple-500 w-5 h-5" />
                Tạo ảnh bằng AI
              </h4>
              <button 
                type="button" 
                onClick={() => setShowAIPromptModal(false)} 
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p className="text-sm text-neutral-400 leading-relaxed font-medium">
              Sao chép đoạn lệnh (prompt) tối ưu hóa dưới đây và dán vào các mô hình vẽ tranh (như Gemini, ChatGPT, Midjourney) để thu về hình ảnh vector giáo dục tuyệt đẹp cho thẻ học này:
            </p>
            
            <div className="bg-purple-900/10 rounded-2xl p-5 border border-purple-900/30 relative group">
              <p className="text-[14px] font-mono text-neutral-300 break-words leading-relaxed select-all">
                Create a high-quality, flat vector educational illustration of the word "{cardForm.word}" which means "{cardForm.definitionVi || cardForm.definition}". The style should be clear, vibrant, cartoonish, with a clean white background. IMPORTANT: no text in image.
              </p>
              <button 
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Create a high-quality, flat vector educational illustration of the word "${cardForm.word}" which means "${cardForm.definitionVi || cardForm.definition}". The style should be clear, vibrant, cartoonish, with a clean white background. IMPORTANT: no text in image.`);
                  toast.success("Đã sao chép Prompt!");
                }}
                className="absolute top-3 right-3 p-2 bg-neutral-800 rounded-xl shadow-sm border border-neutral-700 text-neutral-400 hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Copy Prompt"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                type="button" 
                onClick={() => setShowAIPromptModal(false)} 
                className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
