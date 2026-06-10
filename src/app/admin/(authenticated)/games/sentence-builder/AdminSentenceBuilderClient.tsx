"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Search, Image as ImageIcon, CheckCircle2, Gamepad2, ArrowRightLeft, MessageSquare, Pencil, Check } from "lucide-react"
import { searchImagesAction } from "@/actions/image-search-actions"
import { uploadUrlMedia } from "@/actions/upload-actions"
import { useRouter } from "next/navigation"
import { 
  createSentenceBuilderGame,
  deleteSentenceBuilderGame,
  createSentenceBuilderQuestion,
  updateSentenceBuilderQuestion,
  deleteSentenceBuilderQuestion,
  moveSentenceBuilderQuestion,
  updateSentenceBuilderGame
} from "@/actions/admin-sentence-builder"

export function AdminSentenceBuilderClient({ 
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
  
  const initialGames = activeTab === "2-5" ? initialGames2to5
                     : activeTab === "6-12" ? initialGames6to12
                     : activeTab === "teen" ? initialGamesTeen
                     : initialGamesReaders

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  // Rename state
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [editingGameName, setEditingGameName] = useState("")

  useEffect(() => {
    if (initialGames.length > 0 && !initialGames.find((g: any) => g.id === selectedGameId)) {
      setSelectedGameId(initialGames[0].id)
    } else if (initialGames.length === 0) {
      setSelectedGameId(null)
    }
  }, [initialGames, activeTab])

  const selectedGame = initialGames.find(g => g.id === selectedGameId)

  // --- Modals State ---
  const [showGameModal, setShowGameModal] = useState(false)
  const [gameForm, setGameForm] = useState({ name: "" })

  const [showMoveQuestionModal, setShowMoveQuestionModal] = useState(false)
  const [questionToMove, setQuestionToMove] = useState<{id: string, name: string} | null>(null)
  const [targetGameId, setTargetGameId] = useState<string>("")

  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [questionForm, setQuestionForm] = useState({ expected: "", pool: "", imageUrl: "", audioUrl: "" })

  // Image Search State
  const [isSearchingImage, setIsSearchingImage] = useState(false)
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([])
  const [showImageSearch, setShowImageSearch] = useState(false)
  const [imageSearchStyle, setImageSearchStyle] = useState<"REALISTIC" | "CARTOON">("REALISTIC")
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // --- Game Actions ---
  const handleSaveGame = () => {
    if (!gameForm.name) return toast.error("Vui lòng nhập tên Game")
    startTransition(async () => {
      const res = await createSentenceBuilderGame({ name: gameForm.name, ageGroup: activeTab })
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
    if (!confirm("Bạn có chắc chắn muốn xóa bộ game này và TOÀN BỘ câu hỏi bên trong?")) return
    startTransition(async () => {
      const res = await deleteSentenceBuilderGame(id)
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
      const res = await updateSentenceBuilderGame(id, { name: editingGameName.trim() })
      if (res.success) {
        toast.success("Đổi tên Game thành công")
        setEditingGameId(null)
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  const handleMoveQuestion = () => {
    if (!questionToMove || !targetGameId) return toast.error("Vui lòng chọn Game đích")
    if (targetGameId === selectedGameId) return toast.error("Câu hỏi đã ở trong Game này rồi")

    startTransition(async () => {
      const res = await moveSentenceBuilderQuestion(questionToMove.id, targetGameId)
      if (res.success) {
        toast.success("Đã chuyển câu hỏi")
        setShowMoveQuestionModal(false)
        setQuestionToMove(null)
        setTargetGameId("")
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  // --- Question Actions ---
  const handleSaveQuestion = () => {
    if (!questionForm.expected) return toast.error("Vui lòng nhập câu đúng (expected)")
    
    startTransition(async () => {
      const expectedArray = questionForm.expected.trim().split(" ").filter(Boolean)
      const poolArray = questionForm.pool ? questionForm.pool.trim().split(" ").filter(Boolean) : expectedArray
      
      let res;
      if (selectedQuestionId) {
        res = await updateSentenceBuilderQuestion(selectedQuestionId, {
          expected: expectedArray,
          pool: poolArray,
          image: questionForm.imageUrl,
          audio: questionForm.audioUrl
        })
      } else {
        if (!selectedGameId) {
          toast.error("Lỗi: Không tìm thấy Game");
          return;
        }
        res = await createSentenceBuilderQuestion({
          gameId: selectedGameId,
          expected: expectedArray,
          pool: poolArray,
          image: questionForm.imageUrl,
          audio: questionForm.audioUrl
        })
      }

      if (res.success) {
        toast.success(selectedQuestionId ? "Đã cập nhật câu hỏi" : "Đã thêm câu hỏi")
        setShowQuestionModal(false)
        setSelectedQuestionId(null)
        setQuestionForm({ expected: "", pool: "", imageUrl: "", audioUrl: "" })
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  const handleDeleteQuestion = (id: string, e: any) => {
    e.stopPropagation()
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return
    startTransition(async () => {
      const res = await deleteSentenceBuilderQuestion(id)
      if (res.success) {
        toast.success("Đã xóa câu hỏi")
        router.refresh()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    })
  }

  // --- Image Search Actions ---
  const handleSearchImage = async (wordToSearch?: string | React.MouseEvent) => {
    const word = typeof wordToSearch === 'string' ? wordToSearch : questionForm.expected;
    if (!word) return toast.error("Vui lòng nhập câu trước khi tìm ảnh")
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
    setIsUploadingImage(true)
    setShowImageSearch(false)
    toast.info("Đang đồng bộ ảnh về Cloud...")
    try {
      const result = await uploadUrlMedia(url)
      if (result.success && result.url) {
        setQuestionForm(prev => ({ ...prev, imageUrl: result.url }))
        toast.success("Lưu ảnh thành công!")
      } else {
        toast.error("Lỗi: " + result.error)
      }
    } catch (err: any) {
      toast.error("Lỗi đồng bộ: " + err.message)
    } finally {
      setIsUploadingImage(false)
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

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* LEFT PANE: GAMES LIST */}
        <div className="w-1/4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
            <h2 className="font-bold text-neutral-200 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-blue-500" />
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
            {initialGames.length === 0 ? (
              <p className="text-sm text-neutral-500 p-4 text-center">Chưa có Game nào.</p>
            ) : (
              initialGames.map((game: any) => (
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

        {/* RIGHT PANE: QUESTIONS LIST */}
        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden">
          {selectedGame ? (
            <>
              <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50 shrink-0">
                <h2 className="font-bold text-white text-lg flex items-center gap-2">
                  <Gamepad2 className="text-blue-500" /> {selectedGame.name}
                  <span className="text-sm font-normal text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-md">
                    {selectedGame.questions?.length || 0} câu hỏi
                  </span>
                </h2>
                <button 
                  onClick={() => { setSelectedQuestionId(null); setShowQuestionModal(true); setQuestionForm({ expected: "", pool: "", imageUrl: "", audioUrl: "" }) }} 
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-lg"
                >
                  <Plus className="w-5 h-5" /> Thêm Câu Hỏi
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {selectedGame.questions?.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-neutral-500 flex flex-col items-center">
                      <MessageSquare className="w-16 h-16 opacity-20 mb-4" />
                      <p>Chưa có câu hỏi nào trong Game này.</p>
                      <p className="text-sm">Bấm "Thêm Câu Hỏi" để bắt đầu tạo nội dung.</p>
                    </div>
                  ) : (
                    selectedGame.questions?.map((q: any) => (
                      <div 
                        key={q.id} 
                        onClick={() => {
                          setSelectedQuestionId(q.id);
                          setQuestionForm({ 
                            expected: q.expected.join(" "), 
                            pool: q.pool.join(" "), 
                            imageUrl: q.image || "", 
                            audioUrl: q.audio || "" 
                          });
                          setShowQuestionModal(true);
                        }}
                        className="bg-neutral-800 cursor-pointer rounded-xl overflow-hidden flex flex-col relative group border border-neutral-700 hover:border-blue-500 transition-colors"
                      >
                        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuestionToMove({ id: q.id, name: q.expected.join(" ") });
                              setTargetGameId("");
                              setShowMoveQuestionModal(true);
                            }}
                            className="p-1.5 bg-orange-500/90 hover:bg-orange-600 text-white rounded-md shadow-md"
                            title="Chuyển Game"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteQuestion(q.id, e)} 
                            className="p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-md shadow-md"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="h-32 bg-neutral-900 w-full relative">
                          {q.image ? (
                            <img src={q.image} alt="Question" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <p className="font-bold text-white text-sm line-clamp-2 mb-2">{q.expected.join(" ")}</p>
                          <div className="flex flex-wrap gap-1 mt-auto">
                            {q.pool.map((word: string, i: number) => (
                              <span key={i} className="text-[10px] bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded">{word}</span>
                            ))}
                          </div>
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
              <p>Hãy chọn một Game ở bên trái để xem và quản lý câu hỏi.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Thêm Bộ Game Mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Tên Bộ Game</label>
                <input value={gameForm.name} onChange={e => setGameForm(p => ({...p, name: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Ví dụ: Game 1" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowGameModal(false)} className="px-5 py-2.5 text-neutral-400 hover:text-white font-medium">Hủy</button>
                <button onClick={handleSaveGame} disabled={isPending} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Lưu Game</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMoveQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Chuyển Game</h3>
            <div className="space-y-4">
              <p className="text-neutral-400 text-sm">
                Bạn đang chuyển câu hỏi <span className="font-bold text-white">"{questionToMove?.name}"</span> sang Game khác.
              </p>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Chọn Game Đích</label>
                <select 
                  value={targetGameId} 
                  onChange={e => setTargetGameId(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none"
                >
                  <option value="" disabled>-- Chọn Game --</option>
                  {initialGames.filter((g: any) => g.id !== selectedGameId).map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowMoveQuestionModal(false)} className="px-5 py-2.5 text-neutral-400 hover:text-white font-medium">Hủy</button>
                <button onClick={handleMoveQuestion} disabled={isPending || !targetGameId} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedQuestionId ? "Cập Nhật Câu Hỏi" : "Thêm Câu Hỏi Mới"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Câu đúng (Cách nhau bởi dấu cách)</label>
                <input value={questionForm.expected} onChange={e => setQuestionForm(p => ({...p, expected: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="The frog is green" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Từ nhiễu (Cách nhau bởi dấu cách - để trống = không có từ nhiễu)</label>
                <input value={questionForm.pool} onChange={e => setQuestionForm(p => ({...p, pool: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="The frog is green cat dog" />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Hình ảnh minh họa</label>
                <div className="flex gap-2">
                  <input value={questionForm.imageUrl} onChange={e => setQuestionForm(p => ({...p, imageUrl: e.target.value}))} className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white outline-none" placeholder="URL ảnh" />
                  <button onClick={handleSearchImage} disabled={isSearchingImage || isUploadingImage} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center font-bold">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Audio</label>
                <input value={questionForm.audioUrl} onChange={e => setQuestionForm(p => ({...p, audioUrl: e.target.value}))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="/games/sentence-builder/audio/l1_q1.wav" />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-800">
                <button onClick={() => setShowQuestionModal(false)} className="px-5 py-2.5 text-neutral-400 hover:text-white font-medium">Hủy</button>
                <button onClick={handleSaveQuestion} disabled={isPending || isUploadingImage} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                  {selectedQuestionId ? "Cập Nhật" : "Lưu Câu Hỏi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImageSearch && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950 shrink-0">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Search className="text-indigo-400" /> Chọn ảnh
              </h2>
              <button onClick={() => setShowImageSearch(false)} className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold">Đóng</button>
            </div>
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex gap-3 justify-center">
              <button onClick={() => { setImageSearchStyle("REALISTIC"); handleSearchImage(); }} className={`px-6 py-2.5 rounded-xl font-bold ${imageSearchStyle === "REALISTIC" ? "bg-indigo-600 text-white" : "bg-neutral-800 text-neutral-400"}`}>Ảnh thật</button>
              <button onClick={() => { setImageSearchStyle("CARTOON"); handleSearchImage(); }} className={`px-6 py-2.5 rounded-xl font-bold ${imageSearchStyle === "CARTOON" ? "bg-indigo-600 text-white" : "bg-neutral-800 text-neutral-400"}`}>Hoạt hình</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-950">
              {isSearchingImage ? (
                <div className="text-center text-neutral-400 py-20">Đang tìm kiếm...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {imageSearchResults.map((img, idx) => (
                    <button key={idx} onClick={() => handleSelectImage(img.url)} className="aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-indigo-500 relative group">
                      <img src={img.thumb || img.url} alt="result" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <CheckCircle2 className="text-white w-8 h-8" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
