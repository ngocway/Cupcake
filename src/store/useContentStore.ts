import { create } from 'zustand'

interface ContentState {
  exercises: any[]
  lessons: any[]
  hasMoreEx: boolean
  hasMoreLe: boolean
  exPage: number
  lePage: number

  // Background-prefetched popular data for instant sort switching
  popularExercises: any[]
  popularLessons: any[]
  popularExercisesReady: boolean
  popularLessonsReady: boolean

  // Global filter navigation loading state (shared across sidebar + grid)
  isFiltering: boolean
  setFiltering: (val: boolean) => void

  isFilterModalOpen: boolean
  setFilterModalOpen: (val: boolean) => void

  selectedCategoryId: string
  selectedSubCategoryId: string

  userType: string
  setUserType: (val: string) => void

  studySubject: string
  setStudySubject: (val: string) => void

  studyAgeGroup: string
  setStudyAgeGroup: (val: string) => void

  studyLevel: string
  setStudyLevel: (val: string) => void

  nativeLanguage: string
  setNativeLanguage: (val: string) => void

  showNativeLang: boolean
  setShowNativeLang: (val: boolean) => void

  setExercises: (items: any[]) => void
  setLessons: (items: any[]) => void
  addExercises: (items: any[]) => void
  addLessons: (items: any[]) => void

  setHasMoreEx: (val: boolean) => void
  setHasMoreLe: (val: boolean) => void
  setExPage: (val: number) => void
  setLePage: (val: number) => void

  setPopularExercises: (items: any[]) => void
  setPopularLessons: (items: any[]) => void

  setSelectedCategoryId: (val: string) => void
  setSelectedSubCategoryId: (val: string) => void

  // Active tab for home page (flashcards | lessons | exercises | games)
  // Stored in Zustand so switching is instant (no server round-trip)
  activeTab: string
  setActiveTab: (val: string) => void

  // Lessons per CEFR level cache — keyed by "userType:subject:level"
  // Priority-fetched (current level first), then background-fetched for other levels
  lessonsPerLevel: Record<string, any[]>
  lessonsLevelLoading: Record<string, boolean>
  setLessonsForLevel: (key: string, items: any[]) => void
  setLessonsLevelLoading: (key: string, loading: boolean) => void

  // Flashcard topics cache (prefetched on mount, persists across tab switches)
  flashcardTopics: any[]
  flashcardTopicsLoaded: boolean
  setFlashcardTopics: (items: any[]) => void

  // Exercise counts cache (prefetched on mount, persists across tab switches)
  exerciseCounts: Record<string, number>
  exerciseCountsLoaded: boolean
  setExerciseCounts: (counts: Record<string, number>) => void

  // Books per CEFR level cache — keyed by "level" (no userType/subject filter for books)
  // Priority-fetched (current level first), then background-fetched for other levels
  booksPerLevel: Record<string, any[]>
  booksLevelLoading: Record<string, boolean>
  setBooksForLevel: (key: string, items: any[]) => void
  setBooksLevelLoading: (key: string, loading: boolean) => void

  // Flashcard quick-start cache — cards prefetched from homepage popup
  // Consumed once by FlashcardsClient then cleared
  pendingFlashcards: { topicId: string; cards: any[]; mode: string } | null
  setPendingFlashcards: (data: { topicId: string; cards: any[]; mode: string } | null) => void

  // Quiz quick-start cache — questions prefetched from lobby (run page) while user reads instructions
  // Consumed once by quiz/page.tsx server component then cleared
  pendingQuizData: { assignmentId: string; questions: any[] } | null
  setPendingQuizData: (data: { assignmentId: string; questions: any[] } | null) => void

  // Lazy onboarding action queue — executed ONCE after user confirms onboarding popup
  pendingOnboardingAction: (() => void) | null
  setPendingOnboardingAction: (action: (() => void) | null) => void
  checkAndRequireOnboarding: (action: () => void) => boolean

  clearContent: () => void

  // Mobile sidebar drawer state
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (val: boolean) => void
}

export const useContentStore = create<ContentState>((set, get) => ({
  exercises: [],
  lessons: [],
  hasMoreEx: true,
  hasMoreLe: true,
  exPage: 1,
  lePage: 1,

  popularExercises: [],
  popularLessons: [],
  popularExercisesReady: false,
  popularLessonsReady: false,

  isFiltering: false,
  setFiltering: (val) => set({ isFiltering: val }),

  isFilterModalOpen: false,
  setFilterModalOpen: (val) => set({ isFilterModalOpen: val }),

  mobileSidebarOpen: false,
  setMobileSidebarOpen: (val) => set({ mobileSidebarOpen: val }),

  selectedCategoryId: "",
  selectedSubCategoryId: "",

  activeTab: "flashcards",
  setActiveTab: (val) => set({ activeTab: val }),

  lessonsPerLevel: {},
  lessonsLevelLoading: {},
  setLessonsForLevel: (key, items) => set((s) => ({
    lessonsPerLevel: { ...s.lessonsPerLevel, [key]: items }
  })),
  setLessonsLevelLoading: (key, loading) => set((s) => ({
    lessonsLevelLoading: { ...s.lessonsLevelLoading, [key]: loading }
  })),

  flashcardTopics: [],
  flashcardTopicsLoaded: false,
  setFlashcardTopics: (items) => set({ flashcardTopics: items, flashcardTopicsLoaded: true }),

  exerciseCounts: {},
  exerciseCountsLoaded: false,
  setExerciseCounts: (counts) => set({ exerciseCounts: counts, exerciseCountsLoaded: true }),

  booksPerLevel: {},
  booksLevelLoading: {},
  setBooksForLevel: (key, items) => set((s) => ({
    booksPerLevel: { ...s.booksPerLevel, [key]: items }
  })),
  setBooksLevelLoading: (key, loading) => set((s) => ({
    booksLevelLoading: { ...s.booksLevelLoading, [key]: loading }
  })),

  pendingFlashcards: null,
  setPendingFlashcards: (data) => set({ pendingFlashcards: data }),

  pendingQuizData: null,
  setPendingQuizData: (data) => set({ pendingQuizData: data }),

  userType: "learner",
  setUserType: (val) => set({ userType: val }),

  studySubject: "english",
  setStudySubject: (val) => set({ studySubject: val }),

  studyAgeGroup: "",
  setStudyAgeGroup: (val) => set({ studyAgeGroup: val }),

  studyLevel: "",
  setStudyLevel: (val) => set({ studyLevel: val }),

  nativeLanguage: typeof window !== "undefined" ? (localStorage.getItem("cupcakes_native_language") || "vi") : "vi",
  setNativeLanguage: (val) => set((state) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cupcakes_native_language", val)
    }
    return { nativeLanguage: val }
  }),

  showNativeLang: typeof window !== "undefined" ? localStorage.getItem("cupcakes_show_native_lang") === "true" : false,
  setShowNativeLang: (val) => set(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cupcakes_show_native_lang", String(val))
    }
    return { showNativeLang: val }
  }),

  setExercises: (items) => set({ exercises: items }),
  setLessons: (items) => set({ lessons: items }),

  addExercises: (items) => set((state) => {
    const existingIds = new Set(state.exercises.map(i => i.id))
    const newItems = items.filter(i => !existingIds.has(i.id))
    return { exercises: [...state.exercises, ...newItems] }
  }),

  addLessons: (items) => set((state) => {
    const existingIds = new Set(state.lessons.map(i => i.id))
    const newItems = items.filter(i => !existingIds.has(i.id))
    return { lessons: [...state.lessons, ...newItems] }
  }),

  setHasMoreEx: (val) => set({ hasMoreEx: val }),
  setHasMoreLe: (val) => set({ hasMoreLe: val }),
  setExPage: (val) => set({ exPage: val }),
  setLePage: (val) => set({ lePage: val }),

  setPopularExercises: (items) => set({ popularExercises: items, popularExercisesReady: true }),
  setPopularLessons:   (items) => set({ popularLessons:   items, popularLessonsReady:   true }),

  setSelectedCategoryId: (val) => set({ selectedCategoryId: val }),
  setSelectedSubCategoryId: (val) => set({ selectedSubCategoryId: val }),

  pendingOnboardingAction: null,
  setPendingOnboardingAction: (action) => set({ pendingOnboardingAction: action }),
  checkAndRequireOnboarding: (action) => {
    const state = get() as any;
    if (state.studyAgeGroup && String(state.studyAgeGroup).trim() !== "") {
      action();
      return true;
    }
    set({ pendingOnboardingAction: action, isFilterModalOpen: true });
    return false;
  },

  clearContent: () => set({
    exercises: [],
    lessons: [],
    hasMoreEx: true,
    hasMoreLe: true,
    exPage: 1,
    lePage: 1,
    popularExercises: [],
    popularLessons: [],
    popularExercisesReady: false,
    popularLessonsReady: false,
    isFiltering: false,
    selectedCategoryId: "",
    selectedSubCategoryId: "",
    userType: "learner",
    studySubject: "english",
    studyAgeGroup: "",
    studyLevel: "",
    pendingOnboardingAction: null
  })
}))
