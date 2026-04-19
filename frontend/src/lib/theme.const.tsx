import { createContext } from 'react'

export type ThemeMode = 'system' | 'dark' | 'light'

export interface ThemeContextType {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  actualTheme: 'dark' | 'light'
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
)

export const THEME_STORAGE_KEY = 'theme-mode'
