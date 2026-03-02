"use client"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
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
import type { ActionDescriptor, ActionType } from "@/components/providers/layout-actions-provider"

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
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Avoid SidebarMenuButton's `tooltip` prop — it renders the button as a Base
  // UI TooltipTrigger via useRender, which merges TooltipTrigger's event
  // handlers with the button's onClick and breaks Next.js experimental view
  // transitions. Instead, wrap in a separate TooltipTrigger element so the
  // button's click fires independently (same pattern as DefaultNewActions where
  // navigation happens on DropdownMenuItem, not on the trigger itself).
  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger render={<div />}>
          <SidebarMenuButton
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
        </TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={!isCollapsed || isMobile}>
          {action.label}
        </TooltipContent>
      </Tooltip>
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
