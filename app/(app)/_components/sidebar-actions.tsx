"use client"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ActionDescriptor } from "@/types/layout"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ACTION_CONFIG, type ActionTone } from "./actions/config"
import { getActionClickHandler, isActionDisabled } from "./actions/helpers"
import { NewXDropdown } from "./new-x-button"
import Link from "next/link"

const SIDEBAR_TONE_STYLES: Record<ActionTone, string> = {
  primary: "hover:bg-gold/10 [&_svg]:text-gold",
  danger: "hover:bg-destructive/10 [&_svg]:text-destructive",
  neutral: "[&_svg]:text-muted-foreground",
}

// ─── Single action button ──────────────────────────────────────────────────────

interface SidebarActionButtonProps {
  action: ActionDescriptor
  className?: string
}

export function SidebarActionButton({ action, className }: SidebarActionButtonProps) {
  const config = ACTION_CONFIG[action.type]
  const disabled = isActionDisabled(action)
  const renderAsLink = action.href !== undefined
  const handleClick = getActionClickHandler(action)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={action.label}
        render={renderAsLink ? <Link href={action.href} /> : undefined}
        onClick={handleClick}
        disabled={disabled}
        className={cn(SIDEBAR_TONE_STYLES[config.tone], className, "disabled:opacity-50")}
        suppressTooltipOnPress={renderAsLink}
      >
        {action.loading
          ? <Spinner className="shrink-0" />
          : <HugeiconsIcon icon={config.icon} strokeWidth={config.strokeWidth} />
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

export function SidebarActionsSkeleton() {
  return (
    <SidebarMenu className="gap-1">
      <SidebarMenuItem>
        <div className="flex h-8 items-center gap-2 rounded-md px-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 w-20 rounded-sm group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// ─── Default "create" action (shown when no contextual actions exist) ──────────

export function DefaultSidebarActions() {
  const { state, isMobile } = useSidebar()

  return (
    <NewXDropdown>
      <SidebarMenu className="gap-1">
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<DropdownMenuTrigger />}
            suppressTooltipOnPress
            tooltip={{
              children: "Create",
              side: "right",
              align: "center",
              hidden: state !== "collapsed" || isMobile,
            }}
            className="hover:bg-gold/10 [&_svg]:text-gold"
          >
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            <span className="group-data-[collapsible=icon]:scale-0 duration-150">Create</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </NewXDropdown>
  )
}
