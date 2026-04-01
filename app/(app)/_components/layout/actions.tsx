"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { NewXDropdown } from "./new-x-button"
import NewXButton from "./new-x-button"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActionDisabled(action: ActionDescriptor) {
  return Boolean(action.disabled || action.loading)
}

function getActionClickHandler(
  action: ActionDescriptor,
): React.MouseEventHandler<HTMLElement> | undefined {
  if (action.type === "button") return action.onClick
  if (action.type === "dropdown") return undefined
  if (!isActionDisabled(action)) return undefined
  return (e) => e.preventDefault()
}

// ─── Shared: Dropdown Menu Content ────────────────────────────────────────────

function ActionMenuItems({
  items,
}: {
  items: Extract<ActionDescriptor, { type: "dropdown" }>["menuStructure"]
}) {
  return (
    <>
      {items.map((item, index) => {
        if (item === "separator") {
          return <DropdownMenuSeparator key={`sep-${index}`} />
        }

        return (
          <DropdownMenuItem
            key={item.label}
            variant={item.variant}
            disabled={item.disabled}
            onClick={item.type === "button" ? item.onClick : undefined}
            render={item.type === "link" ? <Link href={item.href} /> : undefined}
          >
            {item.icon && (
              <HugeiconsIcon icon={item.icon} strokeWidth={1.5} />
            )}
            <span>{item.label}</span>
          </DropdownMenuItem>
        )
      })}
    </>
  )
}

// ─── Shared: Action Dropdown ──────────────────────────────────────────────────

type ActionDropdownContentProps = {
  items: Extract<ActionDescriptor, { type: "dropdown" }>["menuStructure"]
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
}

function ActionDropdownContent({
  items,
  side = "bottom",
  align = "end",
  sideOffset = 8,
}: ActionDropdownContentProps) {
  return (
    <DropdownMenuContent
      side={side}
      align={align}
      sideOffset={sideOffset}
      className="min-w-56"
    >
      <ActionMenuItems items={items} />
    </DropdownMenuContent>
  )
}

// ─── Shared: Icon Defaults ────────────────────────────────────────────────────

const TOPBAR_ICON_SIZE = 20  // size-4.5
const SIDEBAR_ICON_SIZE = 24 // size-6 (matches SidebarMenuButton's [&_svg] rule)

function iconStyle(size: number) {
  return { width: size, height: size }
}

/** Wraps a sidebar icon in a fixed container so sub-24px icons stay centered.
 *  Inline style on HugeiconsIcon naturally overrides SidebarMenuButton's
 *  [&_svg]:size-6 utility since inline styles beat non-important Tailwind. */
function SidebarIconSlot({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center">
      {children}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TOPBAR
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Topbar: Dropdown ─────────────────────────────────────────────────────────

function TopbarDropdownAction({
  action,
}: {
  action: Extract<ActionDescriptor, { type: "dropdown" }>
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const disabled = isActionDisabled(action)

  return (
    <DropdownMenu
      open={dropdownOpen}
      onOpenChange={(open) => {
        setDropdownOpen(open)
        if (open) setTooltipOpen(false)
      }}
    >
      <Tooltip
        open={tooltipOpen}
        onOpenChange={(open) => {
          if (!dropdownOpen) setTooltipOpen(open)
        }}
      >
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                "hover:bg-muted hover:text-foreground",
                "size-8 cursor-pointer disabled:pointer-events-none disabled:opacity-50",
                action.className,
              )}
              disabled={disabled}
            />
          }
        >
          {action.loading ? (
            <Spinner />
          ) : (
            <HugeiconsIcon
              icon={action.icon}
              strokeWidth={action.iconStrokeWidth}
              style={iconStyle(action.topbarIconSize ?? TOPBAR_ICON_SIZE)}
            />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">{action.label}</TooltipContent>
      </Tooltip>
      <ActionDropdownContent items={action.menuStructure} />
    </DropdownMenu>
  )
}

// ─── Topbar: Icon-Only Action ─────────────────────────────────────────────────

function TopbarIconAction({ action }: { action: ActionDescriptor }) {
  const disabled = isActionDisabled(action)
  const handleClick = getActionClickHandler(action)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type={action.type === "button" ? "button" : undefined}
            variant={action.variant}
            size="icon"
            disabled={action.type === "button" ? disabled : undefined}
            nativeButton={action.type === "link" ? false : undefined}
            onClick={handleClick}
            render={
              action.type === "link" ? <Link href={action.href} /> : undefined
            }
            className={cn(
              "size-8",
              action.type === "link" &&
                disabled &&
                "pointer-events-none opacity-50",
              action.className,
            )}
          />
        }
      >
        {action.loading ? (
          <Spinner />
        ) : (
          <HugeiconsIcon
            icon={action.icon}
            strokeWidth={action.iconStrokeWidth}
            style={iconStyle(action.topbarIconSize ?? TOPBAR_ICON_SIZE)}
          />
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">{action.label}</TooltipContent>
    </Tooltip>
  )
}

// ─── Topbar: Standard Button ──────────────────────────────────────────────────

function TopbarButtonAction({
  action,
  isMobile,
  isLastButton,
}: {
  action: Exclude<ActionDescriptor, { type: "dropdown" }>
  isMobile: boolean
  isLastButton: boolean
}) {
  const disabled = isActionDisabled(action)
  const handleClick = getActionClickHandler(action)
  const abridgedLabel =
    isLastButton && isMobile ? action.label.split(" ")[0] : undefined

  return (
    <Button
      type={action.type === "button" ? "button" : undefined}
      variant={action.variant}
      size={isMobile && !isLastButton ? "icon" : "default"}
      disabled={action.type === "button" ? disabled : undefined}
      nativeButton={action.type === "link" ? false : undefined}
      onClick={handleClick}
      render={
        action.type === "link" ? <Link href={action.href} /> : undefined
      }
      className={cn(
        action.type === "link" && disabled && "pointer-events-none opacity-50",
        action.className,
      )}
    >
      {action.loading && <Spinner />}
      {isMobile && !action.loading && (
        <HugeiconsIcon
          icon={action.icon}
          strokeWidth={action.iconStrokeWidth}
          style={iconStyle(action.topbarIconSize ?? TOPBAR_ICON_SIZE)}
        />
      )}
      {(!isMobile || isLastButton) && (
        <span className="text-xs lg:text-sm">
          {abridgedLabel ?? action.label}
        </span>
      )}
    </Button>
  )
}

// ─── Topbar: Entry Point ──────────────────────────────────────────────────────

interface TopbarActionsProps {
  actions: ActionDescriptor[] | null | undefined
  isMobile: boolean
}

export function TopbarActions({ actions, isMobile }: TopbarActionsProps) {
  if (actions === undefined) {
    return (
      <Skeleton
        className={cn("rounded-md", isMobile ? "size-9" : "h-9 w-24")}
      />
    )
  }

  if (actions === null) {
    return <NewXButton />
  }

  return (
    <>
      {[...actions].reverse().map((action, index) => {
        const key = `${action.type}-${action.label}-${index}`

        if (action.type === "dropdown") {
          return <TopbarDropdownAction key={key} action={action} />
        }

        if (action.titleIconOnly) {
          return <TopbarIconAction key={key} action={action} />
        }

        return (
          <TopbarButtonAction
            key={key}
            action={action}
            isMobile={isMobile}
            isLastButton={index === actions.length - 1}
          />
        )
      })}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

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
          items={action.menuStructure}
          side={state === "collapsed" ? "right" : "bottom"}
          align="start"
          sideOffset={state === "collapsed" ? 8 : 4}
        />
      </DropdownMenu>
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
            <span className="group-data-[collapsible=icon]:scale-0 duration-150">
              Create
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </NewXDropdown>
  )
}
