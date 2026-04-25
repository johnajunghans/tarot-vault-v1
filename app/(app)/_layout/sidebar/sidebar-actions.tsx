"use client"

import Link from "next/link"
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { ActionDescriptor, ActionVariant } from "@/types/layout"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { CREATE_MENU_ITEMS } from "../shared/create-menu-items"
import {
  isActionDisabled,
  getActionClickHandler,
  ActionDropdownContent,
  SIDEBAR_ICON_SIZE,
  iconStyle,
  SidebarIconSlot,
} from "../shared/base-actions"

// ─── Sidebar: Variant Styles ──────────────────────────────────────────────────

const SIDEBAR_VARIANT_STYLES: Record<ActionVariant, string> = {
  default: "hover:bg-gold/10 [&_svg]:text-gold",
  primary: "hover:bg-gold/10 [&_svg]:text-gold",
  primaryOutline: "hover:bg-gold/10 [&_svg]:text-gold",
  destructive: "hover:bg-destructive/10 [&_svg]:text-destructive",
  ghost: "[&_svg]:text-foreground/80",
  outline: "[&_svg]:text-muted-foreground",
  secondary: "[&_svg]:text-muted-foreground",
  link: "[&_svg]:text-muted-foreground",
  text: "[&_svg]:text-muted-foreground",
}

// ─── Sidebar: Dropdown ────────────────────────────────────────────────────────

function SidebarDropdownAction({
  action,
  className,
}: {
  action: Extract<ActionDescriptor, { type: "dropdown" }>
  className?: string
}) {
  const { state, isMobile } = useSidebar()
  const disabled = isActionDisabled(action)

  return (
    <SidebarMenuItem>
      <ResponsiveMenu>
        <SidebarMenuButton
          render={<ResponsiveMenuTrigger />}
          disabled={disabled}
          suppressTooltipOnPress
          tooltip={{
            children: action.label,
            side: "right",
            align: "center",
            hidden: state !== "collapsed" || isMobile,
          }}
          className={cn(
            SIDEBAR_VARIANT_STYLES[action.variant],
            "cursor-pointer disabled:opacity-50",
            className,
          )}
        >
          <SidebarIconSlot>
            <HugeiconsIcon
              icon={action.icon}
              strokeWidth={action.iconStrokeWidth}
              style={iconStyle(action.sidebarIconSize ?? SIDEBAR_ICON_SIZE)}
            />
          </SidebarIconSlot>
          <span className="group-data-[collapsible=icon]:scale-0 duration-150">
            {action.label}
          </span>
        </SidebarMenuButton>
        <ActionDropdownContent
          title={action.label}
          items={action.menuStructure}
          side={state === "collapsed" ? "right" : "bottom"}
          align="start"
          sideOffset={state === "collapsed" ? 8 : 4}
        />
      </ResponsiveMenu>
    </SidebarMenuItem>
  )
}

// ─── Sidebar: Single Action ───────────────────────────────────────────────────

export function SidebarActionButton({
  action,
  className,
}: {
  action: ActionDescriptor
  className?: string
}) {
  if (action.type === "dropdown") {
    return <SidebarDropdownAction action={action} className={className} />
  }

  const disabled = isActionDisabled(action)
  const handleClick = getActionClickHandler(action)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={action.label}
        render={
          action.type === "link" ? <Link href={action.href} /> : undefined
        }
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          SIDEBAR_VARIANT_STYLES[action.variant],
          "disabled:opacity-50",
          className,
        )}
        suppressTooltipOnPress={action.type === "link"}
      >
        <SidebarIconSlot>
          {action.loading ? (
            <Spinner className="shrink-0" />
          ) : (
            <HugeiconsIcon
              icon={action.icon}
              strokeWidth={action.iconStrokeWidth}
              style={iconStyle(action.sidebarIconSize ?? SIDEBAR_ICON_SIZE)}
            />
          )}
        </SidebarIconSlot>
        <span className="group-data-[collapsible=icon]:scale-0 duration-150">
          {action.label}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// ─── Sidebar: Action List ─────────────────────────────────────────────────────

export function SidebarActions({ actions }: { actions: ActionDescriptor[] }) {
  return (
    <SidebarMenu className="gap-1">
      {actions.map((action, index) => (
        <SidebarActionButton
          key={`${action.type}-${action.label}-${index}`}
          action={action}
        />
      ))}
    </SidebarMenu>
  )
}

// ─── Sidebar: Skeleton ────────────────────────────────────────────────────────

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

// ─── Sidebar: Default "Create" Action ─────────────────────────────────────────

export function DefaultSidebarActions() {
  const { state, isMobile } = useSidebar()
  const itemClassName = "min-h-11 justify-between gap-4 px-3 py-2 text-base sm:min-h-0 sm:gap-8 sm:px-1.5 sm:py-1 sm:text-sm"
  const iconClassName = "h-5 w-5 text-muted-foreground sm:h-4 sm:w-4"

  return (
    <ResponsiveMenu>
      <SidebarMenu className="gap-1">
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<ResponsiveMenuTrigger />}
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
            <span className="group-data-[collapsible=icon]:scale-0 duration-150">
              Create
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <ResponsiveMenuContent
        title="Create"
        side={state === "collapsed" ? "right" : "bottom"}
        align="start"
        sideOffset={state === "collapsed" ? 8 : 4}
        className="w-[min(18rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] sm:w-auto"
      >
        {CREATE_MENU_ITEMS.map((item) => (
          <ResponsiveMenuItem
            key={item.id}
            render={<Link href={item.href} />}
            className={itemClassName}
            disabled={item.disabled}
          >
            <span>{item.label}</span>
            <HugeiconsIcon icon={item.icon} strokeWidth={1.25} className={iconClassName} />
          </ResponsiveMenuItem>
        ))}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  )
}
