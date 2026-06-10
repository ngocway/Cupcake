"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Search, Image as ImageIcon, CheckCircle2, Gamepad2, Folders, ArrowRightLeft, Pencil, Check } from "lucide-react"
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
  updateMatchWordGame
} from "@/actions/admin-match-words"

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
  
  // Rename state
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [editingGameName, setEditingGameName] = useState("")

  // Auto-select first game when tab changes
  useEffect(() => {
    if (currentGames.length > 0 && !currentGames.find(g => g.id === selectedGameId)) {
      setSelectedGameId(currentGames[0].id)
    } else if (currentGames.length === 0) {
      setSelectedGameId(null)
    }
  }, [activeTab, currentGames])

  const selectedGame = currentGames.find(g => g.id === selectedGameId)

  // --- Modals State ---
  const [showGameModal, setShowGameModal] = useState(false)
  const [gameForm, setGameForm] = useState({ name: "" })

  const [showTopicModal, setShowTopicModal] = useState(false)
  const [topicForm, setTopicForm] = useState({ name: "", icon: "🐶" })

  const [showMoveTopicModal, setShowMoveTopicModal] = useState(false)
  const [topicToMove, setTopicToMove] = useState<{id: string, name: string} | null>(null)
  const [targetGameId, setTargetGameId] = useState<string>("")

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
  const handleSaveTopic = () => {
    if (!selectedGameId) return toast.error("Vui lòng chọn một bộ Game trước")
    if (!topicForm.name || !topicForm.icon) return toast.error("Vui lòng điền đủ tên và icon")
    
    startTransition(async () => {
      const res = await createMatchWordTopic({
        gameId: selectedGameId,
        name: topicForm.name,
        icon: topicForm.icon,
        ageGroup: activeTab
      })
      if (res.success) {
        toast.success("Tạo chủ đề thành công")
        setShowTopicModal(false)
        setTopicForm({ name: "", icon: "🐶" })
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
        if (!selectedTopicId) return toast.error("Lỗi: Không tìm thấy Chủ đề");
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

  // --- Image Search Actions ---
  const handleSearchImage = async (wordToSearch?: string | React.MouseEvent) => {
    const word = typeof wordToSearch === 'string' ? wordToSearch : itemForm.word;
    if (!word) return toast.error("Vui lòng nhập từ vựng trước khi tìm ảnh")
    setIsSearchingImage(true)
    setShowImageSearch(true)
    
    const searchTerm = imageSearchStyle === "CARTOON" ? `${word} cartoon illustration` : word
    
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

      {/* TWO COLUMNS */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* LEFT PANE: GAMES LIST */}
        <div className="w-1/4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
            <h2 className="font-bold text-neutral-200 flex items-center gap-2">
              <Folders className="w-5 h-5 text-blue-500" />
              Danh sách Game
            </h2>
            <button 
              onClick={() => setShowGameModal(true)}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Thêm Game Mới"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {currentGames.length === 0 ? (
              <p className="text-sm text-neutral-500 p-4 text-center">Chưa có Game nào.</p>
            ) : (
              currentGames.map(game => (
                <div 
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id)}
                  className={`group flex justify-between items-center p-3 rounded-xl cursor-pointer transition-colors ${selectedGameId === game.id ? 'bg-blue-600/20 border border-blue-500/50 text-blue-100' : 'hover:bg-neutral-800 text-neutral-300 border border-transparent'}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Gamepad2 className={`w-4 h-4 shrink-0 ${selectedGameId === game.id ? 'text-blue-400' : 'text-neutral-500'}`} />
                    {editingGameId === game.id ? (
                      <input
                        value={editingGameName}
                        onChange={e => setEditingGameName(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameGame(game.id, e)
                          if (e.key === 'Escape') setEditingGameId(null)
                        }}
                        autoFocus
                        className="bg-neutral-950 border border-blue-500 rounded px-2 py-0.5 text-sm w-full outline-none"
                      />
                    ) : (
                      <span className="font-medium truncate">{game.name}</span>
                    )}
                  </div>
                  <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {editingGameId === game.id ? (
                      <button 
                        onClick={(e) => handleRenameGame(game.id, e)}
                        className={`p-1.5 rounded-lg hover:bg-green-500/20 text-green-400`}
                        title="Lưu"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingGameId(game.id)
                          setEditingGameName(game.name)
                        }}
                        className={`p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400`}
                        title="Đổi tên"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDeleteGame(game.id, e)}
                      className={`p-1.5 rounded-lg hover:bg-red-500/20 text-red-400`}
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE: TOPICS LIST */}
        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden">
          {selectedGame ? (
            <>
              <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50 shrink-0">
                <h2 className="font-bold text-white text-lg flex items-center gap-2">
                  <Gamepad2 className="text-blue-500" /> {selectedGame.name}
                  <span className="text-sm font-normal text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-md">
                    {selectedGame.topics?.length || 0} chủ đề
                  </span>
                </h2>
                <button 
                  onClick={() => setShowTopicModal(true)} 
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-lg"
                >
                  <Plus className="w-5 h-5" /> Thêm Chủ Đề
                </button>
              </div>
              
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
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">{topic.icon}</span> {topic.name}
                          </h3>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setSelectedTopicId(topic.id); setShowItemModal(true); setItemForm({ word: "", emoji: "", imageUrl: "" }) }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-4 h-4" /> Thêm Từ
                            </button>
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
                              className="bg-neutral-800 cursor-pointer rounded-xl p-3 flex flex-col items-center relative group border border-neutral-700 hover:border-indigo-500 transition-colors"
                            >
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} 
                                className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500 flex-col gap-4">
              <Gamepad2 className="w-16 h-16 opacity-20" />
              <p>Hãy chọn một Game ở bên trái để xem và quản lý chủ đề.</p>
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
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Thêm Chủ Đề Mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Tên chủ đề (Tiếng Anh)</label>
                <input value={topicForm.name} onChange={e => setTopicForm(p => ({...p, name: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="e.g. Animals" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Icon / Emoji</label>
                <input value={topicForm.icon} onChange={e => setTopicForm(p => ({...p, icon: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="e.g. 🐶" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowTopicModal(false)} className="px-5 py-2.5 text-neutral-400 hover:text-white font-medium transition-colors">Hủy</button>
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
              <button onClick={() => { setImageSearchStyle("REALISTIC"); handleSearchImage(); }} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${imageSearchStyle === "REALISTIC" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"}`}>📸 Ảnh thật thực tế</button>
              <button onClick={() => { setImageSearchStyle("CARTOON"); handleSearchImage(); }} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${imageSearchStyle === "CARTOON" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"}`}>🎨 Hình vẽ (Cartoon)</button>
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
    </div>
  )
}
