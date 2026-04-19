import { useEffect, useState } from 'react'
import {
  THEME_STORAGE_KEY,
  ThemeContext,
  type ThemeMode,
} from '@/lib/theme.const.tsx'

function getSystemTheme(): 'dark' | 'light' {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'system' || stored === 'dark' || stored === 'light') {
      return stored
    }
  } catch (e) {
    console.error('Failed to read theme from localStorage:', e)
  }
  return 'system'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode)
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>(() => {
    const initialMode = getStoredMode()
    return initialMode === 'system' ? getSystemTheme() : initialMode
  })

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode)
    } catch (e) {
      console.error('Failed to save theme to localStorage:', e)
    }
  }

  useEffect(() => {
    const updateActualTheme = () => {
      const theme = mode === 'system' ? getSystemTheme() : mode
      setActualTheme(theme)
    }

    updateActualTheme()

    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => updateActualTheme()
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [mode])

  useEffect(() => {
    const root = document.body
    root.classList.remove('dark', 'light')
    root.classList.add(actualTheme)
  }, [actualTheme])

  return (
    <ThemeContext.Provider value={{ mode, setMode, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
