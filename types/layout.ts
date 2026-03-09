// ─── Action Types ──────────────────────────────────────────────────────────

export type ActionType = "new" | "save" | "edit" | "delete" | "discard" | "cancel" | "close" 

interface BaseActionDescriptor {
  type: ActionType
  label: string
  disabled?: boolean
  loading?: boolean
}

export type ActionDescriptor =
  | (BaseActionDescriptor & {
      href: string
      onClick?: () => void
    })
  | (BaseActionDescriptor & {
      onClick: () => void
      href?: never
    })

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
  actions: ActionDescriptor[] | null | undefined
  title: TitleDescriptor | null
  breadcrumbs: BreadcrumbConfig
}

// ─── Reducer Actions ───────────────────────────────────────────────────────

export type LayoutAction =
  | { type: "SET_ACTIONS"; payload: ActionDescriptor[] | null | undefined }
  | { type: "SET_TITLE"; payload: TitleDescriptor | null }
  | { type: "SET_BREADCRUMBS"; payload: BreadcrumbConfig }
  | { type: "SET_PAGE_LAYOUT"; payload: Partial<LayoutContentState> }
  | { type: "RESET" }
