'use client'

import { useEffect, useState } from 'react'

const THEME_KEY = 'faek-taxi-theme'

type Theme = 'dark' | 'light'

function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.classList.toggle('light', theme === 'light')
  document.documentElement.style.colorScheme = theme
  window.localStorage.setItem(THEME_KEY, theme)
}

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY)
    const nextTheme: Theme = savedTheme === 'light' ? 'light' : 'dark'
    setTheme(nextTheme)
    setThemeState(nextTheme)
  }, [])

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(nextTheme)
        setThemeState(nextTheme)
      }}
      aria-label={`Cambiar a modo ${nextTheme === 'dark' ? 'oscuro' : 'claro'}`}
      title={`Modo ${nextTheme === 'dark' ? 'oscuro' : 'claro'}`}
      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-amber-200 transition-colors hover:bg-amber-400/10 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
    >
      {theme === 'dark' ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3.5" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
        </svg>
      )}
    </button>
  )
}
