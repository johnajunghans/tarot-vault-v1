"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type {
  ActionDescriptor,
  BreadcrumbConfig,
  LayoutAction,
  LayoutContentState,
  TitleDescriptor,
} from "@/types/layout"

// ─── Constants ─────────────────────────────────────────────────────────────

const LAYOUT_COOKIE_NAME = "layout_mode"
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const INITIAL_CONTENT_STATE: LayoutContentState = {
  actions: null,
  title: null,
  breadcrumbs: { mode: "auto" },
}

// ─── Reducer ───────────────────────────────────────────────────────────────

function layoutReducer(state: LayoutContentState, action: LayoutAction): LayoutContentState {
  switch (action.type) {
    case "SET_ACTIONS":
      return { ...state, actions: action.payload }
    case "SET_TITLE":
      return { ...state, title: action.payload }
    case "SET_BREADCRUMBS":
      return { ...state, breadcrumbs: action.payload }
    case "SET_PAGE_LAYOUT":
      return {
        actions: action.payload.actions !== undefined ? action.payload.actions : state.actions,
        title: action.payload.title !== undefined ? action.payload.title : state.title,
        breadcrumbs: action.payload.breadcrumbs !== undefined ? action.payload.breadcrumbs : state.breadcrumbs,
      }
    case "RESET":
      return INITIAL_CONTENT_STATE
    default:
      return state
  }
}

// ─── Contexts ──────────────────────────────────────────────────────────────

interface LayoutModeContextValue {
  topbarVisible: boolean
  toggleTopbar: () => void
}

interface LayoutDispatchMethods {
  setActions: (actions: ActionDescriptor[] | null) => void
  setTitle: (title: TitleDescriptor | null) => void
  setBreadcrumbs: (config: BreadcrumbConfig) => void
  setPageLayout: (layout: Partial<LayoutContentState>) => void
  reset: () => void
}

const LayoutModeContext = createContext<LayoutModeContextValue | null>(null)
const LayoutContentContext = createContext<LayoutContentState>(INITIAL_CONTENT_STATE)
const LayoutDispatchContext = createContext<LayoutDispatchMethods | null>(null)

// ─── Hooks ─────────────────────────────────────────────────────────────────

export function useLayoutMode() {
  const context = useContext(LayoutModeContext)
  if (!context) {
    throw new Error("useLayoutMode must be used within a LayoutProvider")
  }
  return context
}

export function useLayoutContent() {
  return useContext(LayoutContentContext)
}

export function useLayoutDispatch() {
  const context = useContext(LayoutDispatchContext)
  if (!context) {
    throw new Error("useLayoutDispatch must be used within a LayoutProvider")
  }
  return context
}

// ─── Provider ──────────────────────────────────────────────────────────────

interface LayoutProviderProps {
  defaultTopbarVisible?: boolean
  children: ReactNode
}

export function LayoutProvider({ defaultTopbarVisible = true, children }: LayoutProviderProps) {
  // ── Topbar mode state (cookie-persisted) ──

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

  const modeValue = useMemo(() => ({ topbarVisible, toggleTopbar }), [topbarVisible, toggleTopbar])

  // ── Content state (reducer) ──

  const [contentState, dispatch] = useReducer(layoutReducer, INITIAL_CONTENT_STATE)

  // Deferred reset to prevent flicker during route transitions.
  // When a page unmounts and calls reset(), the clear is deferred by one microtask.
  // If the new page dispatches a setter before the timeout fires, the pending reset
  // is flushed immediately (not canceled) so stale fields are cleared, then the new
  // value is applied on top. React 18+ batches both dispatches into one render.
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dispatchMethods = useMemo<LayoutDispatchMethods>(() => {
    const flushPendingReset = () => {
      if (resetTimeoutRef.current !== null) {
        clearTimeout(resetTimeoutRef.current)
        resetTimeoutRef.current = null
        dispatch({ type: "RESET" })
      }
    }

    return {
      setActions: (actions) => {
        flushPendingReset()
        dispatch({ type: "SET_ACTIONS", payload: actions })
      },
      setTitle: (title) => {
        flushPendingReset()
        dispatch({ type: "SET_TITLE", payload: title })
      },
      setBreadcrumbs: (config) => {
        flushPendingReset()
        dispatch({ type: "SET_BREADCRUMBS", payload: config })
      },
      setPageLayout: (layout) => {
        flushPendingReset()
        dispatch({ type: "SET_PAGE_LAYOUT", payload: layout })
      },
      reset: () => {
        flushPendingReset()
        resetTimeoutRef.current = setTimeout(() => {
          dispatch({ type: "RESET" })
          resetTimeoutRef.current = null
        }, 0)
      },
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  return (
    <LayoutModeContext.Provider value={modeValue}>
      <LayoutDispatchContext.Provider value={dispatchMethods}>
        <LayoutContentContext.Provider value={contentState}>
          {children}
        </LayoutContentContext.Provider>
      </LayoutDispatchContext.Provider>
    </LayoutModeContext.Provider>
  )
}
