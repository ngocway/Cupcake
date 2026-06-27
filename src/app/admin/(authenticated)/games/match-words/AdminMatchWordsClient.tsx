"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Search, Image as ImageIcon, CheckCircle2, Gamepad2, Folders, ArrowRightLeft, Pencil, Check, Sparkles, X, Wand2, Volume2, Play } from "lucide-react"
import { searchImagesAction } from "@/actions/image-search-actions"
import { uploadUrlMedia } from "@/actions/upload-actions"
import { useRouter } from "next/navigation"
import { 
  createMatchWordGame,
  deleteMatchWordGame,
  createMatchWordTopic, 
  deleteMatchWordTopic, 
  moveMatchWordTopic,
  addMatchWordItem, 
  updateMatchWordItem,
  deleteMatchWordItem,
  deleteMatchWordItems,
  updateMatchWordGame,
  updateMatchWordTopic
} from "@/actions/admin-match-words"
import { 
  generateMatchWordVocabList, 
  generateSingleMatchWordItem, 
  generateAudioForMatchWordItem,
  generateMatchWordImageAction,
  generateMatchWordAudioAction 
} from "@/actions/admin-match-words-ai"

export function AdminMatchWordsClient({ 
  initialGames2to5, 
  initialGames6to12,
  initialGamesTeen,
  initialGamesReaders
}: { 
  initialGames2to5: any[], 
  initialGames6to12: any[],
  initialGamesTeen: any[],
  initialGamesReaders: any[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"2-5" | "6-12" | "teen" | "readers">("2-5")
  const [isPending, startTransition] = useTransition()
  
  const currentGames = activeTab === "2-5" ? initialGames2to5 
                     : activeTab === "6-12" ? initialGames6to12 
                     : activeTab === "teen" ? initialGamesTeen 
                     : initialGamesReaders
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  
  // Selected items for bulk action
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  
  // Rename state
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [editingGameName, setEditingGameName] = useState("")

  // Auto-select first game when tab changes
  useEffect(() => {
    setSelectedItemIds([])
    if (currentGames.length > 0 && !currentGames.find(g => g.id === selectedGameId)) {
      setSelectedGameId(currentGames[0].id)
    } else if (currentGames.length === 0) {
      setSelectedGameId(null)
    }
  }, [activeTab, currentGames])

  useEffect(() => {
    setSelectedItemIds([])
  }, [selectedGameId])

  const selectedGame = currentGames.find(g => g.id === selectedGameId)

  // --- Modals State ---
  const [showGameModal, setShowGameModal] = useState(false)
  const [gameForm, setGameForm] = useState({ name: "" })

  const [showTopicModal, setShowTopicModal] = useState(false)
  const [topicForm, setTopicForm] = useState({ name: "", icon: "🐶" })
  const [draftWords, setDraftWords] = useState<{ word: string; emoji: string }[]>([])
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [newDraftWord, setNewDraftWord] = useState("")
  const [newDraftEmoji, setNewDraftEmoji] = useState("✨")
  const [aiProgress, setAiProgress] = useState<{
    active: boolean;
    text: string;
    current: number;
    total: number;
  } | null>(null)

  const [showMoveTopicModal, setShowMoveTopicModal] = useState(false)
  const [topicToMove, setTopicToMove] = useState<{id: string, name: string} | null>(null)
  const [targetGameId, setTargetGameId] = useState<string>("")
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editingTopicForm, setEditingTopicForm] = useState({ name: "", icon: "" })

  const [showItemModal, setShowItemModal] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState({ word: "", emoji: "", imageUrl: "" })

  // Image Search State
  const [isSearchingImage, setIsSearchingImage] = useState(false)
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([])
  const [showImageSearch, setShowImageSearch] = useState(false)
  const [imageSearchStyle, setImageSearchStyle] = useState<"REALISTIC" | "CARTOON">("REALISTIC")
  const [isUploadingVocabImage, setIsUploadingVocabImage] = useState(false)
  const [isGeneratingTopicAudio, setIsGeneratingTopicAudio] = useState<string | null>(null) // stores topic id currently generating
  const [topicAudioProgress, setTopicAudioProgress] = useState<{current: number, total: number} | null>(null)

  // --- Game Actions ---
  const handleSaveGame = () => {
    if (!gameForm.name) return toast.error("Vui lòng nhập tên Game")
    startTransition(async () => {
      const res = await createMatchWordGame({
        name: gameForm.name,
        ageGroup: activeTab
      })
      if (res.success) {
        toast.success("Tạo Game thành công")
        setShowGameModal(false)
        setGameForm({ name: "" })
        if (!selectedGameId) setSelectedGameId(res.game?.id || null)
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  const handleDeleteGame = (id: string, e: any) => {
    e.stopPropagation()
    if (!confirm("Bạn có chắc chắn muốn xóa bộ game này? (Sẽ xóa toàn bộ dữ liệu bên trong)")) return
    startTransition(async () => {
      const res = await deleteMatchWordGame(id)
      if (res.success) {
        toast.success("Đã xóa bộ Game")
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  const handleRenameGame = (id: string, e: any) => {
    e.stopPropagation()
    if (!editingGameName.trim()) return toast.error("Tên game không được để trống")
    startTransition(async () => {
      const res = await updateMatchWordGame(id, { name: editingGameName.trim() })
      if (res.success) {
        toast.success("Đổi tên Game thành công")
        setEditingGameId(null)
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  // --- Topic Actions ---
  const handleAIGenerateDraft = async () => {
    if (!topicForm.name.trim()) return toast.error("Vui lòng nhập tên chủ đề trước")
    setIsGeneratingDraft(true)
    try {
      const res = await generateMatchWordVocabList(activeTab, topicForm.name)
      if (res.success && res.vocabularies) {
        setDraftWords(res.vocabularies)
        if (res.topicEmoji) {
          setTopicForm(prev => ({ ...prev, icon: res.topicEmoji }))
        }
        toast.success("Đã tạo 10 từ gợi ý nháp kèm icon phù hợp!")
      } else {
        toast.error(res.error || "Không thể tạo từ gợi ý.")
      }
    } catch (err: any) {
      toast.error("Lỗi: " + err.message)
    } finally {
      setIsGeneratingDraft(false)
    }
  }

  const handleAddDraftWord = () => {
    if (!newDraftWord.trim()) return toast.error("Vui lòng nhập từ vựng")
    const wordLower = newDraftWord.trim().toLowerCase()
    if (draftWords.some(d => d.word === wordLower)) {
      return toast.error("Từ này đã có trong danh sách nháp")
    }
    setDraftWords(prev => [...prev, { word: wordLower, emoji: newDraftEmoji }])
    setNewDraftWord("")
    setNewDraftEmoji("✨")
  }

  const handleRemoveDraftWord = (index: number) => {
    setDraftWords(prev => prev.filter((_, i) => i !== index))
  }

  const handleCloseTopicModal = () => {
    setShowTopicModal(false)
    setDraftWords([])
    setTopicForm({ name: "", icon: "🐶" })
  }

  const handleSaveTopic = () => {
    if (!selectedGameId) return toast.error("Vui lòng chọn một bộ Game trước")
    if (!topicForm.name || !topicForm.icon) return toast.error("Vui lòng điền đủ tên và icon")
    
    startTransition(async () => {
      // 1. Tạo chủ đề trước
      const res = await createMatchWordTopic({
        gameId: selectedGameId,
        name: topicForm.name,
        icon: topicForm.icon,
        ageGroup: activeTab
      })

      if (!res.success || !res.topic) {
        toast.error("Lỗi tạo chủ đề: " + res.error)
        return
      }

      const topicId = res.topic.id

      // 2. Nếu có từ nháp, chạy tiến trình AI sinh ảnh/audio
      if (draftWords.length > 0) {
        setAiProgress({
          active: true,
          text: "Bắt đầu tạo tài nguyên học tập bằng AI...",
          current: 0,
          total: draftWords.length
        })

        for (let i = 0; i < draftWords.length; i++) {
          const item = draftWords[i]
          
          setAiProgress({
            active: true,
            text: `[${i + 1}/${draftWords.length}] Đang tìm ảnh cho "${item.word}"...`,
            current: i + 1,
            total: draftWords.length
          })
          const imgRes = await generateMatchWordImageAction(item.word, activeTab)

          setAiProgress({
            active: true,
            text: `[${i + 1}/${draftWords.length}] Đang tạo âm thanh cho "${item.word}"...`,
            current: i + 1,
            total: draftWords.length
          })
          const audioRes = await generateMatchWordAudioAction(item.word, activeTab)

          setAiProgress({
            active: true,
            text: `[${i + 1}/${draftWords.length}] Đang lưu từ "${item.word}"...`,
            current: i + 1,
            total: draftWords.length
          })

          try {
            const singleRes = await addMatchWordItem({
              topicId,
              word: item.word.toLowerCase().trim(),
              emoji: item.emoji || "✨",
              imageUrl: imgRes.imageUrl || undefined,
              audioUrl: audioRes.audioUrl || undefined
            })
            if (!singleRes.success) {
              console.error(`Lỗi tạo từ ${item.word}:`, singleRes.error)
            }
          } catch (itemErr) {
            console.error(`Lỗi hệ thống khi tạo từ ${item.word}:`, itemErr)
          }
        }

        setAiProgress(null)
      }

      toast.success("Đã tạo chủ đề và đồng bộ từ vựng thành công!")
      setShowTopicModal(false)
      setTopicForm({ name: "", icon: "🐶" })
      setDraftWords([])
      router.refresh()
    })
  }

  const handleRenameTopic = (id: string) => {
    if (!editingTopicForm.name.trim() || !editingTopicForm.icon.trim()) {
      return toast.error("Tên chủ đề và icon không được để trống")
    }
    startTransition(async () => {
      const res = await updateMatchWordTopic(id, { 
        name: editingTopicForm.name.trim(),
        icon: editingTopicForm.icon.trim()
      })
      if (res.success) {
        toast.success("Cập nhật chủ đề thành công")
        setEditingTopicId(null)
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  const handleDeleteTopic = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chủ đề này?")) return
    startTransition(async () => {
      const res = await deleteMatchWordTopic(id)
      if (res.success) {
        toast.success("Đã xóa chủ đề")
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  const handleMoveTopic = () => {
    if (!topicToMove || !targetGameId) return toast.error("Vui lòng chọn Game đích")
    if (targetGameId === selectedGameId) return toast.error("Chủ đề đã ở trong Game này rồi")

    startTransition(async () => {
      const res = await moveMatchWordTopic(topicToMove.id, targetGameId)
      if (res.success) {
        toast.success("Đã chuyển chủ đề")
        setShowMoveTopicModal(false)
        setTopicToMove(null)
        setTargetGameId("")
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  // --- Item Actions ---
  const handleSaveItem = () => {
    if (!itemForm.word) return toast.error("Vui lòng nhập từ vựng")
    
    startTransition(async () => {
      let res;
      if (selectedItemId) {
        // Edit mode
        res = await updateMatchWordItem(selectedItemId, {
          word: itemForm.word,
          emoji: itemForm.emoji,
          imageUrl: itemForm.imageUrl
        })
      } else {
        // Add mode
        if (!selectedTopicId) {
          toast.error("Lỗi: Không tìm thấy Chủ đề");
          return;
        }
        res = await addMatchWordItem({
          topicId: selectedTopicId,
          word: itemForm.word,
          emoji: itemForm.emoji,
          imageUrl: itemForm.imageUrl
        })
      }

      if (res.success) {
        toast.success(selectedItemId ? "Đã cập nhật từ vựng" : "Đã thêm từ vựng")
        setShowItemModal(false)
        setSelectedItemId(null)
        setItemForm({ word: "", emoji: "", imageUrl: "" })
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  const handleDeleteItem = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa từ này?")) return
    startTransition(async () => {
      const res = await deleteMatchWordItem(id)
      if (res.success) {
        toast.success("Đã xóa từ vựng")
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  const handleToggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  }

  const handleBulkDelete = () => {
    if (selectedItemIds.length === 0) return
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedItemIds.length} từ vựng đã chọn?`)) return
    startTransition(async () => {
      const res = await deleteMatchWordItems(selectedItemIds)
      if (res.success) {
        toast.success(`Đã xóa thành công ${selectedItemIds.length} từ vựng`)
        setSelectedItemIds([])
        router.refresh()
      } else {
        toast.error("Lỗi xóa hàng loạt: " + res.error)
      }
    })
  }

  const handleGenerateTopicAudio = async (topicId: string, items: any[]) => {
    const itemsWithoutAudio = items.filter(i => !i.audioUrl);
    if (itemsWithoutAudio.length === 0) {
      return toast.info("Tất cả các từ trong chủ đề này đã có Audio!");
    }
    
    setIsGeneratingTopicAudio(topicId);
    setTopicAudioProgress({ current: 0, total: itemsWithoutAudio.length });
    
    let successCount = 0;
    
    for (let i = 0; i < itemsWithoutAudio.length; i++) {
      const item = itemsWithoutAudio[i];
      setTopicAudioProgress({ current: i + 1, total: itemsWithoutAudio.length });
      
      try {
        const res = await generateAudioForMatchWordItem(item.id, item.word, activeTab);
        if (res.success) {
          successCount++;
        } else {
          console.error(`Lỗi tạo audio cho từ ${item.word}:`, res.error);
        }
        
        // Add a 1.2-second pause to prevent hitting API rate limit (429) too fast
        if (i < itemsWithoutAudio.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      } catch (err) {
        console.error(`System error creating audio for ${item.word}:`, err);
      }
    }
    
    toast.success(`Đã tạo thành công Audio cho ${successCount}/${itemsWithoutAudio.length} từ!`);
    setIsGeneratingTopicAudio(null);
    setTopicAudioProgress(null);
    router.refresh();
  }

  const handlePlayAudio = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = new Audio(url);
    audio.play().catch(err => console.error("Error playing audio", err));
  }

  // --- Image Search Actions ---
  const handleSearchImage = async (wordToSearch?: string | React.MouseEvent | any, styleOverride?: "REALISTIC" | "CARTOON") => {
    let word = itemForm.word;
    if (typeof wordToSearch === 'string') {
      word = wordToSearch;
    }
    if (!word) return toast.error("Vui lòng nhập từ vựng trước khi tìm ảnh")
    setIsSearchingImage(true)
    setShowImageSearch(true)
    
    const currentStyle = styleOverride || imageSearchStyle;
    const searchTerm = currentStyle === "CARTOON" ? `${word} cartoon illustration` : word
    
    try {
      const results = await searchImagesAction(searchTerm)
      setImageSearchResults(results || [])
    } catch (err: any) {
      toast.error("Lỗi tìm ảnh: " + err.message)
    } finally {
      setIsSearchingImage(false)
    }
  }

  const handleSelectImage = async (url: string) => {
    setIsUploadingVocabImage(true)
    setShowImageSearch(false)
    toast.info("Đang đồng bộ ảnh về Cloud...")
    try {
      const result = await uploadUrlMedia(url)
      if (result.success && result.url) {
        setItemForm(prev => ({ ...prev, imageUrl: result.url }))
        toast.success("Lưu ảnh thành công!")
        
        // QUICK UPDATE MODE: If the Item Modal is NOT open but we clicked on an item to edit its image
        if (!showItemModal && selectedItemId) {
          let targetItem: any = null;
          selectedGame?.topics?.forEach((t: any) => {
            const found = t.items?.find((i: any) => i.id === selectedItemId);
            if (found) targetItem = found;
          });

          if (targetItem) {
            startTransition(async () => {
              const res = await updateMatchWordItem(selectedItemId, {
                word: targetItem.word,
                emoji: targetItem.emoji,
                imageUrl: result.url
              })
              if (res.success) {
                toast.success("Đã cập nhật ảnh cho từ vựng!")
                router.refresh()
              } else {
                toast.error("Lỗi cập nhật ảnh: " + res.error)
              }
            })
          }
        }
      } else {
        toast.error("Lỗi: " + result.error)
      }
    } catch (err: any) {
      toast.error("Lỗi đồng bộ: " + err.message)
    } finally {
      setIsUploadingVocabImage(false)
    }
  }

  return (
    <div className="flex flex-col h-[80vh]">
      {/* TABS */}
      <div className="flex gap-4 mb-6 shrink-0">
        <button 
          onClick={() => setActiveTab("2-5")}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === "2-5" ? "bg-blue-600 text-white shadow-lg" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
        >
          Tuổi 2-5
        </button>
        <button 
          onClick={() => setActiveTab("6-12")}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === "6-12" ? "bg-blue-600 text-white shadow-lg" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
        >
          Tuổi 6-12
        </button>
        <button 
          onClick={() => setActiveTab("teen")}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === "teen" ? "bg-blue-600 text-white shadow-lg" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
        >
          Teenagers
        </button>
        <button 
          onClick={() => setActiveTab("readers")}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === "readers" ? "bg-blue-600 text-white shadow-lg" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
        >
          Advanced Readers
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <div className="h-full bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden">
          {/* HEADER: GAME SELECTOR & ACTIONS */}
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50 shrink-0 flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1.5 focus-within:border-blue-500 transition-colors">
                <Gamepad2 className="text-blue-500 w-5 h-5 shrink-0" />
                {editingGameId === selectedGame?.id && selectedGame ? (
                  <input
                    value={editingGameName}
                    onChange={e => setEditingGameName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameGame(selectedGame.id, e)
                      if (e.key === 'Escape') setEditingGameId(null)
                    }}
                    autoFocus
                    className="bg-transparent text-white font-bold outline-none w-48 lg:w-64"
                  />
                ) : (
                  <select 
                    value={selectedGameId || ""}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="bg-transparent text-white font-bold text-lg outline-none cursor-pointer pr-8 w-48 lg:w-64 truncate"
                  >
                    {currentGames.map((g: any) => (
                      <option key={g.id} value={g.id} className="bg-neutral-900 text-white text-base font-normal">
                        {g.name}
                      </option>
                    ))}
                    {currentGames.length === 0 && <option value="" disabled>Chưa có Game nào</option>}
                  </select>
                )}
              </div>

              {selectedGame && (
                <div className="flex gap-1 items-center bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                  <span className="text-sm font-medium text-neutral-400 px-3 border-r border-neutral-800">
                    {selectedGame.topics?.length || 0} chủ đề
                  </span>
                  {editingGameId === selectedGame.id ? (
                    <button 
                      onClick={(e) => handleRenameGame(selectedGame.id, e)}
                      className="p-1.5 mx-1 rounded-lg hover:bg-green-500/20 text-green-400"
                      title="Lưu tên"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingGameId(selectedGame.id)
                        setEditingGameName(selectedGame.name)
                      }}
                      className="p-1.5 mx-1 rounded-lg hover:bg-blue-500/20 text-blue-400"
                      title="Đổi tên Game"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleDeleteGame(selectedGame.id, e)}
                    className="p-1.5 mr-1 rounded-lg hover:bg-red-500/20 text-red-400"
                    title="Xóa Game"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button 
                onClick={() => setShowGameModal(true)}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors flex items-center gap-2 font-medium border border-neutral-700"
                title="Thêm Game Mới"
              >
                <Plus className="w-4 h-4 text-blue-400" /> <span className="text-sm">Thêm Game</span>
              </button>
            </div>

            {selectedGame && (
              <button 
                onClick={() => setShowTopicModal(true)} 
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" /> Thêm Chủ Đề
              </button>
            )}
          </div>

          {selectedGame ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-6">
                  {selectedGame.topics?.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500 flex flex-col items-center">
                      <Folders className="w-16 h-16 opacity-20 mb-4" />
                      <p>Chưa có chủ đề nào trong Game này.</p>
                      <p className="text-sm">Bấm "Thêm Chủ Đề" để bắt đầu tạo nội dung.</p>
                    </div>
                  ) : (
                    selectedGame.topics?.map((topic: any) => (
                      <div key={topic.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-800">
                          {editingTopicId === topic.id ? (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <input
                                value={editingTopicForm.icon}
                                onChange={e => setEditingTopicForm(p => ({ ...p, icon: e.target.value }))}
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm w-12 text-center outline-none focus:border-indigo-500 font-bold"
                                placeholder="🐶"
                                title="Icon/Emoji"
                              />
                              <input
                                value={editingTopicForm.name}
                                onChange={e => setEditingTopicForm(p => ({ ...p, name: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameTopic(topic.id)
                                  if (e.key === 'Escape') setEditingTopicId(null)
                                }}
                                autoFocus
                                className="bg-neutral-900 border border-neutral-800 rounded px-3 py-1 text-sm w-48 outline-none focus:border-indigo-500 font-bold text-white"
                                placeholder="Tên chủ đề"
                              />
                              <button 
                                onClick={() => handleRenameTopic(topic.id)}
                                className="p-1 text-green-400 hover:bg-green-500/10 rounded"
                                title="Lưu"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setEditingTopicId(null)}
                                className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                title="Hủy"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              <span className="text-2xl">{topic.icon}</span> {topic.name}
                            </h3>
                          )}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleGenerateTopicAudio(topic.id, topic.items || [])}
                              disabled={isGeneratingTopicAudio !== null}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                              title="Dùng Gemini 2.5 Flash Preview TTS tạo audio cho các từ chưa có"
                            >
                              {isGeneratingTopicAudio === topic.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                              Tạo Audio AI {topicAudioProgress && isGeneratingTopicAudio === topic.id ? `(${topicAudioProgress.current}/${topicAudioProgress.total})` : ""}
                            </button>
                            <button 
                              onClick={() => { setSelectedTopicId(topic.id); setShowItemModal(true); setItemForm({ word: "", emoji: "", imageUrl: "" }) }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-4 h-4" /> Thêm Từ
                            </button>
                            {topic.items && topic.items.length > 0 && (
                              <button
                                onClick={() => {
                                  const topicItemIds = topic.items.map((i: any) => i.id);
                                  const allSelected = topicItemIds.every((id: string) => selectedItemIds.includes(id));
                                  if (allSelected) {
                                    setSelectedItemIds(prev => prev.filter(id => !topicItemIds.includes(id)));
                                  } else {
                                    setSelectedItemIds(prev => {
                                      const newSelections = [...prev];
                                      topicItemIds.forEach((id: string) => {
                                        if (!newSelections.includes(id)) newSelections.push(id);
                                      });
                                      return newSelections;
                                    });
                                  }
                                }}
                                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                              >
                                {topic.items.map((i: any) => i.id).every((id: string) => selectedItemIds.includes(id)) ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                              </button>
                            )}
                            {editingTopicId !== topic.id && (
                              <button 
                                onClick={() => {
                                  setEditingTopicId(topic.id);
                                  setEditingTopicForm({ name: topic.name, icon: topic.icon || "🐶" });
                                }}
                                className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Sửa chủ đề"
                              >
                                <Pencil className="w-5 h-5" />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                  setTopicToMove({ id: topic.id, name: topic.name })
                                  setTargetGameId("")
                                  setShowMoveTopicModal(true)
                              }}
                              className="p-1.5 text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                              title="Chuyển Game"
                            >
                              <ArrowRightLeft className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteTopic(topic.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {topic.items?.map((item: any) => (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setItemForm({ word: item.word, emoji: item.emoji || "", imageUrl: item.imageUrl || "" });
                                handleSearchImage(item.word);
                              }}
                              className={`bg-neutral-800 cursor-pointer rounded-xl p-3 flex flex-col items-center relative group border transition-all ${
                                selectedItemIds.includes(item.id) 
                                  ? "border-indigo-500 ring-2 ring-indigo-500/30" 
                                  : "border-neutral-700 hover:border-indigo-500"
                              }`}
                            >
                              {item.audioUrl && (
                                <button 
                                  onClick={(e) => handlePlayAudio(item.audioUrl, e)} 
                                  className="absolute top-2 left-2 p-1.5 bg-green-500/90 hover:bg-green-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity z-10 shadow-md"
                                  title="Nghe audio"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                              )}
                              
                              {/* Selection Checkbox */}
                              <div 
                                onClick={(e) => handleToggleSelectItem(item.id, e)}
                                className={`absolute top-2 right-2 w-5 h-5 rounded-md border flex items-center justify-center z-20 transition-all ${
                                  selectedItemIds.includes(item.id) 
                                    ? "bg-indigo-600 border-indigo-500 text-white" 
                                    : "border-neutral-500 bg-neutral-900 hover:border-neutral-400 opacity-60 group-hover:opacity-100"
                                }`}
                              >
                                {selectedItemIds.includes(item.id) && (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                )}
                              </div>

                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} 
                                className="absolute top-2 right-9 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
                                title="Xóa từ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-3 overflow-hidden shadow-inner">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.word} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-3xl drop-shadow-md">{item.emoji || "✨"}</span>
                                )}
                              </div>
                              <span className="font-bold text-neutral-200 text-center text-sm">{item.word}</span>
                              <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none flex items-center justify-center">
                                <div className="absolute bottom-2 text-xs font-bold text-indigo-300 bg-black/60 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Đổi Ảnh</div>
                              </div>
                            </div>
                          ))}
                          {topic.items?.length === 0 && <p className="text-neutral-500 text-sm col-span-full">Chưa có từ vựng nào.</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500 flex-col gap-4">
              <Gamepad2 className="w-16 h-16 opacity-20" />
              <p>Hãy chọn một Game ở bên trên để xem và quản lý chủ đề.</p>
            </div>
          )}
        </div>
      </div>

      {/* GAME MODAL */}
      {showGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Thêm Bộ Game Mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Tên Bộ Game</label>
                <input value={gameForm.name} onChange={e => setGameForm(p => ({...p, name: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Ví dụ: Game Mức Cơ Bản" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowGameModal(false)} className="px-5 py-2.5 text-neutral-400 hover:text-white font-medium transition-colors">Hủy</button>
                <button onClick={handleSaveGame} disabled={isPending} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50">Lưu Game</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC MODAL */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md shadow-2xl transition-all">
            <h3 className="text-xl font-bold text-white mb-4">Thêm Chủ Đề Mới</h3>
            <div className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Tên chủ đề (Tiếng Anh)</label>
                  <input value={topicForm.name} onChange={e => setTopicForm(p => ({...p, name: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="e.g. Animals" />
                </div>
                <button 
                  type="button"
                  onClick={handleAIGenerateDraft} 
                  disabled={isGeneratingDraft || !topicForm.name.trim()} 
                  className="px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 hover:border-blue-500/50 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed h-[46px]"
                  title="Gợi ý 10 từ bằng AI"
                >
                  {isGeneratingDraft ? (
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>AI Gợi Ý</span>
                </button>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Icon / Emoji chủ đề</label>
                <input value={topicForm.icon} onChange={e => setTopicForm(p => ({...p, icon: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="e.g. 🐶" />
              </div>

              {/* Draft words list */}
              {draftWords.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Danh sách từ nháp ({draftWords.length})</label>
                  <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 max-h-40 overflow-y-auto flex flex-wrap gap-2">
                    {draftWords.map((item, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1 bg-neutral-800 text-neutral-200 px-2.5 py-1 rounded-lg text-sm border border-neutral-700 font-medium group"
                      >
                        <span>{item.emoji}</span>
                        <span>{item.word}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveDraftWord(idx)} 
                          className="text-neutral-500 hover:text-red-400 transition-colors ml-1 focus:outline-none"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add manual draft word */}
              {draftWords.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-800/55">
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Thêm nhanh từ mới vào nháp</label>
                  <div className="flex gap-2">
                    <input 
                      value={newDraftEmoji} 
                      onChange={e => setNewDraftEmoji(e.target.value)} 
                      className="w-12 text-center bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-blue-500 transition-all text-lg"
                      placeholder="🍎"
                      title="Emoji đại diện"
                    />
                    <input 
                      value={newDraftWord} 
                      onChange={e => setNewDraftWord(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDraftWord(); } }}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
                      placeholder="Nhập từ mới (e.g. orange)"
                    />
                    <button 
                      type="button"
                      onClick={handleAddDraftWord}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-sm font-bold transition-all shadow-md"
                    >
                      Thêm từ
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-neutral-800/55">
                <button onClick={handleCloseTopicModal} className="px-5 py-2.5 text-neutral-400 hover:text-white font-medium transition-colors">Hủy</button>
                <button onClick={handleSaveTopic} disabled={isPending} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50">Lưu Chủ Đề</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOVE TOPIC MODAL */}
      {showMoveTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Chuyển Game</h3>
            <div className="space-y-4">
              <p className="text-neutral-400 text-sm">
                Bạn đang chuyển chủ đề <span className="font-bold text-white">{topicToMove?.name}</span> sang Game khác.
              </p>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Chọn Game Đích</label>
                <select 
                  value={targetGameId} 
                  onChange={e => setTargetGameId(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="" disabled>-- Chọn Game --</option>
                  {currentGames.filter(g => g.id !== selectedGameId).map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                {currentGames.filter(g => g.id !== selectedGameId).length === 0 && (
                  <p className="text-xs text-red-400 mt-2">Không có Game nào khác trong độ tuổi này để chuyển sang.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowMoveTopicModal(false); setTopicToMove(null); setTargetGameId(""); }} className="px-5 py-2.5 text-neutral-400 hover:text-white font-medium transition-colors">Hủy</button>
                <button 
                  onClick={handleMoveTopic} 
                  disabled={isPending || !targetGameId} 
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-orange-600/20 disabled:opacity-50"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedItemId ? "Cập Nhật Từ Vựng" : "Thêm Từ Vựng Mới"}
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Từ vựng (Tiếng Anh)</label>
                <input value={itemForm.word} onChange={e => setItemForm(p => ({...p, word: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="e.g. Dog" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Emoji (Tùy chọn nếu không có ảnh)</label>
                <input value={itemForm.emoji} onChange={e => setItemForm(p => ({...p, emoji: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="e.g. 🐶" />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Hình ảnh minh họa</label>
                <div className="flex gap-2">
                  <input value={itemForm.imageUrl} readOnly className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-400 outline-none" placeholder="URL ảnh (Tìm Google hoặc dán URL)" />
                  <button onClick={handleSearchImage} disabled={isSearchingImage || isUploadingVocabImage} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 font-bold transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 shrink-0">
                    <Search className="w-4 h-4" /> {isSearchingImage ? "Đang tìm..." : "Tìm Google"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-neutral-800">
                <button onClick={() => { setShowItemModal(false); setSelectedItemId(null); }} className="px-5 py-2.5 text-neutral-400 hover:text-white font-medium transition-colors">Hủy</button>
                <button onClick={handleSaveItem} disabled={isPending || isUploadingVocabImage} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50">
                  {selectedItemId ? "Cập Nhật" : "Lưu Từ Vựng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE SEARCH DRAWER */}
      {showImageSearch && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950 shrink-0">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                Chọn ảnh cho từ "{itemForm.word}"
              </h2>
              <button onClick={() => setShowImageSearch(false)} className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-colors">Đóng</button>
            </div>

            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 shrink-0 flex justify-center gap-3">
              <button onClick={() => { setImageSearchStyle("REALISTIC"); handleSearchImage(undefined, "REALISTIC"); }} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${imageSearchStyle === "REALISTIC" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"}`}>📸 Ảnh thật thực tế</button>
              <button onClick={() => { setImageSearchStyle("CARTOON"); handleSearchImage(undefined, "CARTOON"); }} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${imageSearchStyle === "CARTOON" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"}`}>🎨 Hình vẽ (Cartoon)</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-neutral-950">
              {isSearchingImage ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-medium animate-pulse">Đang tìm kiếm hình ảnh tuyệt đẹp...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {imageSearchResults.slice(0, 30).map((img, idx) => (
                    <button key={idx} onClick={() => handleSelectImage(img.url)} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all bg-neutral-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/30">
                      <img src={img.thumb || img.url} alt="result" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-3 transition-opacity">
                        <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <CheckCircle2 className="w-4 h-4" /> Dùng ảnh này
                        </div>
                      </div>
                    </button>
                  ))}
                  {imageSearchResults.length === 0 && !isSearchingImage && (
                    <div className="col-span-full py-20 text-center text-neutral-500">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>Không tìm thấy hình ảnh nào phù hợp.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* AI PROCESSING OVERLAY */}
      {aiProgress && aiProgress.active && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl w-full max-w-md shadow-2xl flex flex-col items-center text-center">
            {/* Spinning glowing gradient ring */}
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              <div className="absolute inset-0 border-4 border-indigo-500/20 border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin"></div>
              <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
            </div>

            <h3 className="text-xl font-black text-white mb-2">Đang xử lý bằng AI</h3>
            <p className="text-neutral-400 text-sm mb-6 max-w-xs h-12 flex items-center justify-center">
              {aiProgress.text}
            </p>

            {/* Custom progress bar */}
            <div className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-1 mb-3">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-xl transition-all duration-300 shadow-md"
                style={{ width: `${aiProgress.total > 0 ? (aiProgress.current / aiProgress.total) * 100 : 0}%` }}
              ></div>
            </div>

            {/* Step indicator */}
            <div className="flex justify-between items-center w-full px-2 text-xs font-bold text-neutral-500">
              <span>Tiến trình</span>
              <span className="text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                {aiProgress.current} / {aiProgress.total} từ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* BULK ACTIONS FLOATING BAR */}
      {selectedItemIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-neutral-800 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            <span className="text-white font-bold text-sm">
              Đã chọn <span className="text-indigo-400 text-base">{selectedItemIds.length}</span> từ vựng
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedItemIds([])}
              className="px-4 py-2 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold transition-all border border-neutral-800"
            >
              Bỏ chọn
            </button>
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-red-600/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa hàng loạt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
