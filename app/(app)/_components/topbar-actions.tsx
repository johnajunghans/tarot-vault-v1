"use client"

import { useState } from "react"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ActionDescriptor } from "@/types/layout"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { getActionClickHandler, isActionDisabled } from "./actions/helpers"
import NewXButton from "./new-x-button"

// ─── Dropdown Action ──────────────────────────────────────────────────────

function TopbarDropdownAction({ action }: { action: Extract<ActionDescriptor, { type: "dropdown" }> }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const disabled = isActionDisabled(action)

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={(open) => {
      setDropdownOpen(open)
      if (open) setTooltipOpen(false)
    }}>
      <Tooltip open={tooltipOpen} onOpenChange={(open) => {
        if (!dropdownOpen) setTooltipOpen(open)
      }}>
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
          <HugeiconsIcon icon={action.icon} strokeWidth={action.iconStrokeWidth} className="size-5" />
        </TooltipTrigger>
        <TooltipContent side="bottom">{action.label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
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
  )
}

// ─── Icon-Only Action with Tooltip ────────────────────────────────────────

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
            render={action.type === "link" ? <Link href={action.href} /> : undefined}
            className={cn("size-8", action.type === "link" && disabled && "pointer-events-none opacity-50", action.className)}
          />
        }
      >
        {action.loading && <Spinner />}
        {!action.loading && <HugeiconsIcon icon={action.icon} strokeWidth={action.iconStrokeWidth} className="size-5" />}
      </TooltipTrigger>
      <TooltipContent side="bottom">{action.label}</TooltipContent>
    </Tooltip>
  )
}

// ─── Topbar Buttons ───────────────────────────────────────────────────────

interface TopbarButtonsProps {
  actions: ActionDescriptor[] | null | undefined
  isMobile: boolean
}

export default function TopbarButtons({ actions, isMobile }: TopbarButtonsProps) {
  if (actions === undefined) {
    return (
      <Skeleton
        className={cn(
          "rounded-md",
          isMobile ? "size-9" : "h-9 w-24",
        )}
      />
    )
  }

  if (actions === null) {
    return <NewXButton />
  }

  return (
    <>
      {[...actions].reverse().map((action, index) => {
        // Dropdown actions always render as dropdown
        if (action.type === "dropdown") {
          return <TopbarDropdownAction key={`${action.type}-${action.label}-${index}`} action={action} />
        }

        // Icon-only actions render with tooltip
        if (action.titleIconOnly) {
          return <TopbarIconAction key={`${action.type}-${action.label}-${index}`} action={action} />
        }

        // Standard button/link actions
        const disabled = isActionDisabled(action)
        const isLastButton = index === actions.length - 1
        const abridgedLabel = isLastButton && isMobile ? action.label.split(" ")[0] : undefined
        const handleClick = getActionClickHandler(action)

        return (
          <Button
            key={`${action.type}-${action.label}-${index}`}
            type={action.type === "button" ? "button" : undefined}
            variant={action.variant}
            size={isMobile && !isLastButton ? "icon" : "default"}
            disabled={action.type === "button" ? disabled : undefined}
            nativeButton={action.type === "link" ? false : undefined}
            onClick={handleClick}
            render={action.type === "link" ? <Link href={action.href} /> : undefined}
            className={cn(action.type === "link" && disabled && "pointer-events-none opacity-50", action.className)}
          >
            {action.loading && <Spinner />}
            {isMobile && !action.loading && (
              <HugeiconsIcon icon={action.icon} strokeWidth={action.iconStrokeWidth} />
            )}
            {(!isMobile || isLastButton) && <span className="text-xs lg:text-sm">{abridgedLabel ?? action.label}</span>}

          </Button>
        )
      })}
    </>
  )
}
