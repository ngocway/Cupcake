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

  nativeLanguage: string
  setNativeLanguage: (val: string) => void

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

  clearContent: () => void
}

export const useContentStore = create<ContentState>((set) => ({
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

  selectedCategoryId: "",
  selectedSubCategoryId: "",

  userType: "adults",
  setUserType: (val) => set({ userType: val }),

  nativeLanguage: typeof window !== "undefined" ? (localStorage.getItem("cupcakes_native_language") || "vi") : "vi",
  setNativeLanguage: (val) => set((state) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cupcakes_native_language", val)
    }
    return { nativeLanguage: val }
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
    userType: "adults"
  })
}))
