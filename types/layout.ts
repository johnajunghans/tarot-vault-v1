// ─── Action Types ──────────────────────────────────────────────────────────

export type ActionType = "save" | "edit" | "delete" | "discard" | "cancel" | "close"

export interface ActionDescriptor {
  type: ActionType
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

// ─── Title Types ───────────────────────────────────────────────────────────

export type TitleDescriptor =
  | { variant: "page"; label: string; icon?: string }
  | { variant: "spread"; name: string; count: number; countUnit?: "card" | "position"; badge?: string }

// ─── Breadcrumb Types ──────────────────────────────────────────────────────

export interface BreadcrumbDescriptor {
  href: string
  label: string
}

export type BreadcrumbConfig =
  | { mode: "auto" }
  | { mode: "custom"; items: BreadcrumbDescriptor[] }

// ─── Layout Content State ──────────────────────────────────────────────────

export interface LayoutContentState {
  actions: ActionDescriptor[] | null
  title: TitleDescriptor | null
  breadcrumbs: BreadcrumbConfig
}

// ─── Reducer Actions ───────────────────────────────────────────────────────

export type LayoutAction =
  | { type: "SET_ACTIONS"; payload: ActionDescriptor[] | null }
  | { type: "SET_TITLE"; payload: TitleDescriptor | null }
  | { type: "SET_BREADCRUMBS"; payload: BreadcrumbConfig }
  | { type: "SET_PAGE_LAYOUT"; payload: Partial<LayoutContentState> }
  | { type: "RESET" }
