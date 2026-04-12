import { create } from 'zustand'

interface QuizRunnerState {
  answers: Record<string, any>
  cheatCount: number
  isSyncing: boolean
  lastSyncedAt: Date | null
  
  initDraft: (answers: Record<string, any>, cheatCount: number) => void
  setAnswers: (questionId: string, selected: any) => void
  setAnswer: (submissionId: string, questionId: string, answer: any) => void
  incrementCheatCount: (submissionId: string) => void
  syncDraft: (submissionId: string) => Promise<void>
}

let syncTimeout: NodeJS.Timeout | null = null

export const useQuizRunnerStore = create<QuizRunnerState>((set, get) => ({
  answers: {},
  cheatCount: 0,
  isSyncing: false,
  lastSyncedAt: null,

  initDraft: (answers, cheatCount) => {
    set({ answers, cheatCount });
  },

  setAnswers: (questionId: string, selected: any) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: selected },
    }));
  },

  setAnswer: (submissionId, questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer }
    }))
    
    if (syncTimeout) clearTimeout(syncTimeout)
    syncTimeout = setTimeout(() => {
      get().syncDraft(submissionId)
    }, 3000)
  },

  incrementCheatCount: (submissionId) => {
    set((state) => ({ cheatCount: state.cheatCount + 1 }))
    get().syncDraft(submissionId)
  },

  syncDraft: async (submissionId: string) => {
    const { answers, cheatCount } = get()
    set({ isSyncing: true })
    try {
      await fetch(`/api/submissions/${submissionId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answersDraft: JSON.stringify(answers),
          cheatCount
        })
      })
      set({ lastSyncedAt: new Date(), isSyncing: false })
    } catch (error) {
      console.error("Failed to sync draft", error)
      set({ isSyncing: false })
    }
  }
}))
