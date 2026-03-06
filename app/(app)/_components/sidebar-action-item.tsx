"use client"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  Cancel01Icon,
  Delete02Icon,
  FloppyDiskIcon,
  MultiplicationSignIcon,
  PencilEdit02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react"
import type { ActionDescriptor, ActionType } from "@/types/layout"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NewXDropdown } from "./new-x-button"
import Link from "next/link"
import type { MouseEventHandler } from "react"

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
  const isDisabled = action.disabled || action.loading
  const renderAsLink = action.href !== undefined
  const handleClick: MouseEventHandler<HTMLElement> | undefined = action.href
    ? (event) => {
        if (isDisabled) {
          event.preventDefault()
          return
        }
        action.onClick?.()
      }
    : action.onClick

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={action.label}
        render={renderAsLink ? <Link href={action.href} /> : undefined}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(ACTION_VARIANTS[action.type], className, "disabled:opacity-50")}
        suppressTooltipOnPress={renderAsLink}
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
