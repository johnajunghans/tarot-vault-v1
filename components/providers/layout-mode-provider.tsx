"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

const LAYOUT_COOKIE_NAME = "layout_mode"
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

interface LayoutModeContextValue {
  topbarVisible: boolean
  toggleTopbar: () => void
}

const LayoutModeContext = createContext<LayoutModeContextValue | null>(null)

export function useLayoutMode() {
  const context = useContext(LayoutModeContext)
  if (!context) {
    throw new Error("useLayoutMode must be used within a LayoutModeProvider")
  }
  return context
}

interface LayoutModeProviderProps {
  defaultTopbarVisible?: boolean
  children: ReactNode
}

export function LayoutModeProvider({ defaultTopbarVisible = true, children }: LayoutModeProviderProps) {
  const [topbarVisible, setTopbarVisible] = useState(defaultTopbarVisible)

  const toggleTopbar = useCallback(() => {
    setTopbarVisible((prev) => {
      const next = !prev
      document.cookie = `${LAYOUT_COOKIE_NAME}=${next ? "topbar" : "no-topbar"}; path=/; max-age=${LAYOUT_COOKIE_MAX_AGE}`
      return next
    })
  }, [])

  useEffect(() => {
    if (topbarVisible) {
      delete document.documentElement.dataset.topbar
    } else {
      document.documentElement.dataset.topbar = "hidden"
    }
  }, [topbarVisible])

  const value = useMemo(() => ({ topbarVisible, toggleTopbar }), [topbarVisible, toggleTopbar])

  return (
    <LayoutModeContext.Provider value={value}>
      {children}
    </LayoutModeContext.Provider>
  )
}
