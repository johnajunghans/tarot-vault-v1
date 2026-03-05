"use client"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  Cancel01Icon,
  Delete02Icon,
  FloppyDiskIcon,
  MultiplicationSignIcon,
  PencilEdit02Icon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react"
import type { ActionDescriptor, ActionType } from "@/types/layout"

// ─── Type → icon map ──────────────────────────────────────────────────────────

const ACTION_ICONS: Record<ActionType, IconSvgElement> = {
  save:    FloppyDiskIcon,
  edit:    PencilEdit02Icon,
  delete:  Delete02Icon,
  discard: Delete02Icon,
  cancel:  Cancel01Icon,
  close:   MultiplicationSignIcon,
}

// ─── Type → button variant ────────────────────────────────────────────────────

const ACTION_VARIANTS: Record<ActionType, string> = {
  save:    "hover:bg-gold/10 [&_svg]:text-gold",
  edit:    "hover:bg-gold/10 [&_svg]:text-gold",
  delete:  "hover:bg-descructive/10 [&_svg]:text-destructive",
  discard: "hover:bg-destructive/10 [&_svg]:text-destructive",
  cancel:  "[&_svg]:text-muted-foreground",
  close:   "[&_svg]:text-muted-foreground",
}

// ─── Single action button ──────────────────────────────────────────────────────

interface SidebarActionButtonProps {
  action: ActionDescriptor
  className?: string
}

export function SidebarActionButton({ action, className }: SidebarActionButtonProps) {

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={action.label}
        onClick={action.onClick}
        disabled={action.disabled || action.loading}
        className={cn(ACTION_VARIANTS[action.type], className, "disabled:opacity-50")}
      >
        {action.loading
          ? <Spinner className="shrink-0" />
          : <HugeiconsIcon icon={ACTION_ICONS[action.type]} strokeWidth={action.type === "save" || action.type === "edit" ? 2 : 1.5} />
        }
        <span className="group-data-[collapsible=icon]:scale-0 duration-150">{action.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// ─── Action list renderer ──────────────────────────────────────────────────────

interface SidebarActionsProps {
  actions: ActionDescriptor[]
}

export function SidebarActions({ actions }: SidebarActionsProps) {
  return (
    <SidebarMenu className="gap-1">
      {actions.map((action) => (
        <SidebarActionButton key={action.type} action={action} />
      ))}
    </SidebarMenu>
  )
}
