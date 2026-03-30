import { buttonVariants } from "@/components/ui/button"
import { type VariantProps } from "class-variance-authority"
import { IconSvgElement } from "@hugeicons/react"

// ─── Action Types ──────────────────────────────────────────────────────────

export type ActionVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>

interface BaseActionDescriptor {
  variant: ActionVariant
  label: string
  icon: IconSvgElement
  iconStrokeWidth?: number
  className?: string
  disabled?: boolean
  loading?: boolean
}

interface ButtonActionDescriptor extends BaseActionDescriptor {
  type: "button"
  onClick: () => void
  href?: never
  menuStructure?: never
}

interface LinkActionDescriptor extends BaseActionDescriptor {
  type: "link"
  href: string
  onClick?: never
  menuStructure?: never
}

interface BaseMenuOption {
  label: string
  icon?: IconSvgElement
}

interface ButtonMenuOption extends BaseMenuOption {
  type: "button"
  onClick: () => void
  href?: never
}

interface LinkMenuOption extends BaseMenuOption {
  type: "link"
  href: string
  onClick?: never
}

export type MenuOption =
  | ButtonMenuOption
  | LinkMenuOption

export type MenuStructureItem =
  | MenuOption
  | "separator"

export interface DropdownMenuActionDescriptor extends BaseActionDescriptor {
  type: "dropdown"
  menuStructure: MenuStructureItem[]
  href?: never
  onClick?: never
}

export type ActionDescriptor = 
  | ButtonActionDescriptor 
  | LinkActionDescriptor
  | DropdownMenuActionDescriptor

// ─── Title Types ───────────────────────────────────────────────────────────

export type TitleDescriptor =
  | { variant: "page"; label: string; icon?: string }
  | { variant: "spread"; name: string | undefined; nameFallback: string; count: number; countUnit?: "card" | "position"; badge?: string }

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
