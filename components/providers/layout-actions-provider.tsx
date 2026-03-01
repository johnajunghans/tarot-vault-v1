"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

export type ActionType = "save" | "edit" | "delete" | "discard" | "cancel" | "close"

export interface ActionDescriptor {
  type: ActionType
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

// Split into two contexts so components that SET actions don't re-render when actions CHANGE.
// This prevents the effect in page components from re-running when the sidebar re-renders.
const LayoutActionsContext = createContext<ActionDescriptor[] | null>(null)
const LayoutActionsDispatchContext = createContext<(actions: ActionDescriptor[] | null) => void>(() => {})

/** Read the current action descriptors (used by sidebar to render them) */
export function useLayoutActions() {
  return useContext(LayoutActionsContext)
}

/** Get the setter to register/unregister actions (used by page components) */
export function useSetLayoutActions() {
  return useContext(LayoutActionsDispatchContext)
}

export function LayoutActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ActionDescriptor[] | null>(null)

  const dispatch = useCallback((next: ActionDescriptor[] | null) => {
    setActions(next)
  }, [])

  return (
    <LayoutActionsDispatchContext.Provider value={dispatch}>
      <LayoutActionsContext.Provider value={actions}>
        {children}
      </LayoutActionsContext.Provider>
    </LayoutActionsDispatchContext.Provider>
  )
}
