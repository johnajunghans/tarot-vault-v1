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
import type { ActionDescriptor, ActionVariant } from "@/types/layout"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { getActionClickHandler, isActionDisabled } from "./actions/helpers"
import { NewXDropdown } from "./new-x-button"
import Link from "next/link"

const SIDEBAR_VARIANT_STYLES: Record<ActionVariant, string> = {
  default: "hover:bg-gold/10 [&_svg]:text-gold",
  primaryOutline: "hover:bg-gold/10 [&_svg]:text-gold",
  destructive: "hover:bg-destructive/10 [&_svg]:text-destructive",
  ghost: "[&_svg]:text-muted-foreground",
  outline: "[&_svg]:text-muted-foreground",
  secondary: "[&_svg]:text-muted-foreground",
  link: "[&_svg]:text-muted-foreground",
  text: "[&_svg]:text-muted-foreground",
}

// ─── Single action button ──────────────────────────────────────────────────────

interface SidebarActionButtonProps {
  action: ActionDescriptor
  className?: string
}

export function SidebarActionButton({ action, className }: SidebarActionButtonProps) {
  if (action.type === "dropdown") {
    return <SidebarDropdownAction action={action} className={className} />
  }

  const disabled = isActionDisabled(action)
  const renderAsLink = action.type === "link"
  const handleClick = getActionClickHandler(action)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={action.label}
        render={renderAsLink ? <Link href={action.href} /> : undefined}
        onClick={handleClick}
        disabled={disabled}
        className={cn(SIDEBAR_VARIANT_STYLES[action.variant], className, "disabled:opacity-50")}
        suppressTooltipOnPress={renderAsLink}
      >
        {action.loading
          ? <Spinner className="shrink-0" />
          : <HugeiconsIcon icon={action.icon} strokeWidth={action.iconStrokeWidth} />
        }
        <span className="group-data-[collapsible=icon]:scale-0 duration-150">{action.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// ─── Dropdown action ───────────────────────────────────────────────────────────

function SidebarDropdownAction({ action, className }: { action: Extract<ActionDescriptor, { type: "dropdown" }>; className?: string }) {
  const { state, isMobile } = useSidebar()
  const disabled = isActionDisabled(action)

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <SidebarMenuButton
          render={<DropdownMenuTrigger />}
          disabled={disabled}
          suppressTooltipOnPress
          tooltip={{
            children: action.label,
            side: "right",
            align: "center",
            hidden: state !== "collapsed" || isMobile,
          }}
          className={cn(SIDEBAR_VARIANT_STYLES[action.variant], className, "disabled:opacity-50")}
        >
          <HugeiconsIcon icon={action.icon} strokeWidth={action.iconStrokeWidth} />
          <span className="group-data-[collapsible=icon]:scale-0 duration-150">{action.label}</span>
        </SidebarMenuButton>
        <DropdownMenuContent
          side={state === "collapsed" ? "right" : "bottom"}
          align="start"
          sideOffset={state === "collapsed" ? 8 : 4}
        >
          {action.menuStructure.map((item, index) => {
            if (item === "separator") {
              return <DropdownMenuSeparator key={`sep-${index}`} />
            }

            if (item.type === "link") {
              return (
                <DropdownMenuItem
                  key={item.label}
                  variant={item.variant}
                  render={<Link href={item.href} />}
                  disabled={item.disabled}
                >
                  {item.icon && <HugeiconsIcon icon={item.icon} strokeWidth={1.5} />}
                  <span>{item.label}</span>
                </DropdownMenuItem>
              )
            }

            return (
              <DropdownMenuItem
                key={item.label}
                variant={item.variant}
                onClick={item.onClick}
                disabled={item.disabled}
              >
                {item.icon && <HugeiconsIcon icon={item.icon} strokeWidth={1.5} />}
                <span>{item.label}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
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
      {actions.map((action, index) => (
        <SidebarActionButton key={`${action.type}-${action.label}-${index}`} action={action} />
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
