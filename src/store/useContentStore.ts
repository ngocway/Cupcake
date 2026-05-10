import { create } from 'zustand'

interface ContentState {
  exercises: any[]
  lessons: any[]
  hasMoreEx: boolean
  hasMoreLe: boolean
  exPage: number
  lePage: number
  
  setExercises: (items: any[]) => void
  setLessons: (items: any[]) => void
  addExercises: (items: any[]) => void
  addLessons: (items: any[]) => void
  
  setHasMoreEx: (val: boolean) => void
  setHasMoreLe: (val: boolean) => void
  setExPage: (val: number) => void
  setLePage: (val: number) => void
  
  clearContent: () => void
}

export const useContentStore = create<ContentState>((set) => ({
  exercises: [],
  lessons: [],
  hasMoreEx: true,
  hasMoreLe: true,
  exPage: 1,
  lePage: 1,

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

  clearContent: () => set({ 
    exercises: [], 
    lessons: [], 
    hasMoreEx: true, 
    hasMoreLe: true, 
    exPage: 1, 
    lePage: 1 
  })
}))
