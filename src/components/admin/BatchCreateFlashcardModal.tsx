"use client"

import { useState } from "react"
import { Sparkles, X, ChevronLeft, Loader2, CheckSquare, Square, AlertCircle, CheckCircle2, Rocket } from "lucide-react"
import { suggestWordsForTopic, createCompleteFlashcardFull } from "@/actions/admin-flashcards-ai"
import { toast } from "sonner"

interface Topic {
  id: string
  name: string
  slug: string
  targetAudiences: string[]
}

interface BatchCreateFlashcardModalProps {
  topics: Topic[]
  targetAudiences: any[]
  existingWords?: string[]   // words already in the selected topic
  allFlashcards?: any[]      // to derive existingWords per topic dynamically
  onClose: () => void
  onCardsCreated: (newCards: any[], topicId: string, audienceId: string) => void
  defaultAudience?: string
  defaultTopicId?: string
}

type Step = "config" | "review" | "creating" | "done"

export function BatchCreateFlashcardModal({
  topics,
  targetAudiences,
  allFlashcards = [],
  onClose,
  onCardsCreated,
  defaultAudience,
  defaultTopicId,
}: BatchCreateFlashcardModalProps) {
  // Step control
  const [step, setStep] = useState<Step>("config")

  // Config step state
  const firstAudience = targetAudiences[0]?.id ?? ""

  // Derive audience: prefer explicit prop, then derive from topic, then fallback to first
  const initialAudience = defaultAudience
    ?? (defaultTopicId ? topics.find(t => t.id === defaultTopicId)?.targetAudiences[0] : undefined)
    ?? firstAudience

  const [selectedAudience, setSelectedAudience] = useState(initialAudience)
  const filteredTopics = topics.filter(t => t.targetAudiences.includes(selectedAudience))
  const [selectedTopicId, setSelectedTopicId] = useState(() => {
    if (defaultTopicId && topics.find(t => t.id === defaultTopicId)) return defaultTopicId
    return filteredTopics[0]?.id ?? ""
  })
  const [wordCount, setWordCount] = useState(5)
  const [isSuggesting, setIsSuggesting] = useState(false)

  // Review step state
  const [suggestedWords, setSuggestedWords] = useState<string[]>([])
  const [checkedWords, setCheckedWords] = useState<Set<string>>(new Set())

  // Creating step state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentWord, setCurrentWord] = useState("")
  const [createdCards, setCreatedCards] = useState<any[]>([])
  const [errorMessage, setErrorMessage] = useState("")

  // Computed
  const selectedTopic = topics.find(t => t.id === selectedTopicId)
  const selectedCategoryName = targetAudiences.find(a => a.id === selectedAudience)?.name ?? selectedAudience
  const existingWords = allFlashcards
    .filter(c => c.topic?.id === selectedTopicId || c.topicId === selectedTopicId)
    .map((c: any) => c.word as string)

  const handleAudienceChange = (val: string) => {
    setSelectedAudience(val)
    const newFilteredTopics = topics.filter(t => t.targetAudiences.includes(val))
    setSelectedTopicId(newFilteredTopics[0]?.id ?? "")
  }

  const handleSuggest = async () => {
    if (!selectedTopicId) { toast.error("Vui lòng chọn chủ đề."); return }
    if (wordCount < 1 || wordCount > 20) { toast.error("Số lượng từ từ 1–20."); return }

    setIsSuggesting(true)
    try {
      const res = await suggestWordsForTopic(selectedCategoryName, selectedTopic?.name ?? "", existingWords, wordCount)
      if (!res.success || !res.words) {
        toast.error(res.error ?? "Không thể gợi ý từ vựng.")
        return
      }
      setSuggestedWords(res.words)
      setCheckedWords(new Set(res.words))
      setStep("review")
    } catch (e: any) {
      toast.error("Lỗi: " + e.message)
    } finally {
      setIsSuggesting(false)
    }
  }

  const toggleWord = (word: string) => {
    setCheckedWords(prev => {
      const next = new Set(prev)
      if (next.has(word)) next.delete(word)
      else next.add(word)
      return next
    })
  }

  const handleStartCreating = async () => {
    const words = suggestedWords.filter(w => checkedWords.has(w))
    if (words.length === 0) { toast.error("Vui lòng chọn ít nhất 1 từ."); return }

    setStep("creating")
    setCurrentIndex(0)
    setCreatedCards([])
    setErrorMessage("")

    const created: any[] = []
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      setCurrentIndex(i)
      setCurrentWord(word)
      const res = await createCompleteFlashcardFull(word, selectedTopicId, selectedCategoryName)
      if (!res.success || !res.card) {
        setErrorMessage(`Lỗi khi tạo "${word}": ${res.error ?? "Unknown error"}`)
        return
      }
      created.push(res.card)
      setCreatedCards([...created])
    }

    setStep("done")
    onCardsCreated(created, selectedTopicId, selectedAudience)
  }

  const confirmedWords = suggestedWords.filter(w => checkedWords.has(w))
  const progressPct = step === "creating"
    ? Math.round((currentIndex / confirmedWords.length) * 100)
    : step === "done" ? 100 : 0

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            {step === "review" && (
              <button
                onClick={() => setStep("config")}
                disabled={step !== "review"}
                className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-400" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {step === "config" && "Tạo Thẻ học Hàng Loạt"}
                {step === "review" && "Xác nhận Từ vựng"}
                {step === "creating" && "Đang tạo thẻ..."}
                {step === "done" && "Hoàn thành!"}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {step === "config" && "AI gợi ý từ vựng phù hợp với chủ đề"}
                {step === "review" && `${checkedWords.size} / ${suggestedWords.length} từ được chọn`}
                {step === "creating" && `Đang tạo card ${currentIndex + 1}/${confirmedWords.length}: ${currentWord}`}
                {step === "done" && `Đã tạo thành công ${createdCards.length} thẻ học`}
              </p>
            </div>
          </div>
          {(step === "config" || step === "review" || step === "done") && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">

          {/* ── STEP: CONFIG ───────────────────────────────────────────── */}
          {step === "config" && (
            <div className="space-y-4">
              {/* Audience */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Nhóm tuổi
                </label>
                <select
                  value={selectedAudience}
                  onChange={e => handleAudienceChange(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl text-white text-sm font-semibold outline-none focus:border-violet-500 transition-all cursor-pointer"
                >
                  {targetAudiences.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Chủ đề từ vựng
                </label>
                <select
                  value={selectedTopicId}
                  onChange={e => setSelectedTopicId(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl text-white text-sm font-semibold outline-none focus:border-violet-500 transition-all cursor-pointer"
                >
                  {filteredTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Word count */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Số lượng từ muốn tạo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={wordCount}
                    onChange={e => setWordCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    className="w-28 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl text-white text-sm font-bold outline-none focus:border-violet-500 transition-all text-center"
                  />
                  <p className="text-xs text-neutral-500">từ mới sẽ được gợi ý (tối đa 20)</p>
                </div>
              </div>

              {/* Existing words info */}
              {existingWords.length > 0 && (
                <div className="bg-neutral-800/60 rounded-2xl px-4 py-3">
                  <p className="text-xs text-neutral-400">
                    <span className="text-neutral-300 font-semibold">{existingWords.length} từ</span> đã có trong chủ đề này — AI sẽ không gợi ý lại.
                  </p>
                </div>
              )}

              <button
                onClick={handleSuggest}
                disabled={isSuggesting || !selectedTopicId}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20"
              >
                {isSuggesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gợi ý từ vựng...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Gợi ý từ vựng</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── STEP: REVIEW ───────────────────────────────────────────── */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {suggestedWords.map((word) => (
                  <button
                    key={word}
                    onClick={() => toggleWord(word)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${
                      checkedWords.has(word)
                        ? "bg-violet-600/10 border-violet-500/50 text-white"
                        : "bg-neutral-800/40 border-neutral-700/50 text-neutral-500"
                    }`}
                  >
                    {checkedWords.has(word)
                      ? <CheckSquare className="w-4 h-4 text-violet-400 shrink-0" />
                      : <Square className="w-4 h-4 text-neutral-600 shrink-0" />
                    }
                    <span className="font-semibold text-sm">{word}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("config")}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-2xl transition-all text-sm"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleStartCreating}
                  disabled={checkedWords.size === 0}
                  className="flex-[2] py-3 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Bắt đầu tạo {checkedWords.size} thẻ</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: CREATING ─────────────────────────────────────────── */}
          {step === "creating" && (
            <div className="space-y-5">
              {errorMessage ? (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-rose-300 mb-1">Đã xảy ra lỗi</p>
                    <p className="text-xs text-rose-400">{errorMessage}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-neutral-400">Tiến trình</span>
                      <span className="text-violet-400">{currentIndex}/{confirmedWords.length} card</span>
                    </div>
                    <div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Current status */}
                  <div className="bg-neutral-800/60 rounded-2xl px-4 py-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-violet-400 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">
                        Đang tạo card {currentIndex + 1}/{confirmedWords.length}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        "{currentWord}" — Gemini text + FLUX image + TTS audio
                      </p>
                    </div>
                  </div>

                  {/* Completed words so far */}
                  {createdCards.length > 0 && (
                    <div className="space-y-1.5">
                      {createdCards.map((card, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-semibold">{card.word}</span>
                          <span className="text-neutral-600">— đã tạo xong</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── STEP: DONE ─────────────────────────────────────────────── */}
          {step === "done" && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-300 mb-1">
                    🎉 Đã tạo {createdCards.length} thẻ học thành công!
                  </p>
                  <p className="text-xs text-emerald-500">
                    Mỗi thẻ bao gồm ảnh FLUX, 4 file audio Gemini TTS và đầy đủ bản dịch 10 ngôn ngữ.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {createdCards.map((card, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white bg-neutral-800/60 rounded-xl px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{card.word}</span>
                    {card.phonetic && <span className="text-neutral-500 text-xs font-mono">{card.phonetic}</span>}
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
