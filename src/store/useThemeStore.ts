import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  isClearBackground: boolean
  setClearBackground: (val: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isClearBackground: false,
      setClearBackground: (val) => set({ isClearBackground: val }),
    }),
    {
      name: 'theme-storage',
    }
  )
)
