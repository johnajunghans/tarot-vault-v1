"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ActionDescriptor } from "@/types/layout"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { buttonVariants } from "@/components/ui/button"
import { CREATE_MENU_ITEMS } from "../shared/create-menu-items"
import {
  isActionDisabled,
  getActionClickHandler,
  ActionDropdownContent,
  TOPBAR_ICON_SIZE,
  iconStyle,
} from "../shared/base-actions"

// ─── Topbar: Dropdown ─────────────────────────────────────────────────────────

function TopbarDropdownAction({
  action,
  isMobile,
}: {
  action: Extract<ActionDescriptor, { type: "dropdown" }>
  isMobile: boolean
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const disabled = isActionDisabled(action)
  const renderIconOnly = isMobile || action.topbarIconOnly

  if (!renderIconOnly) {
    return (
      <ResponsiveMenu
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <Button
          type="button"
          variant={action.variant}
          disabled={disabled}
          render={<ResponsiveMenuTrigger />}
          className={cn(
            "data-[popup-open]:[&_svg]:rotate-180",
            action.className,
          )}
        >
          {action.loading && <Spinner />}
          <span className="text-xs lg:text-sm">{action.label}</span>
          {!action.loading && (
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="h-5 w-5 duration-100 sm:h-4 sm:w-4"
            />
          )}
        </Button>
        <ActionDropdownContent title={action.label} items={action.menuStructure} />
      </ResponsiveMenu>
    )
  }

  return (
    <ResponsiveMenu
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
            <ResponsiveMenuTrigger
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
      <ActionDropdownContent title={action.label} items={action.menuStructure} />
    </ResponsiveMenu>
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

// ─── Topbar: Default "Create" Button ──────────────────────────────────────────

function TopbarCreateButton() {
  const itemClassName = "min-h-11 justify-between gap-4 px-3 py-2 text-base sm:min-h-0 sm:gap-8 sm:px-1.5 sm:py-1 sm:text-sm"
  const iconClassName = "h-5 w-5 text-muted-foreground sm:h-4 sm:w-4"

  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: "default", size: "default" }),
          "max-sm:h-11 max-sm:px-3",
          "data-[popup-open]:[&_svg]:rotate-180",
        )}
      >
        <span className="text-base font-normal md:text-base">New</span>
        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="h-5 w-5 duration-100 sm:h-4 sm:w-4" />
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent
        title="Create"
        align="end"
        sideOffset={8}
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
    return <TopbarCreateButton />
  }

  return (
    <>
      {[...actions].reverse().map((action, index) => {
        const key = `${action.type}-${action.label}-${index}`

        if (action.type === "dropdown") {
          return <TopbarDropdownAction key={key} action={action} isMobile={isMobile} />
        }

        if (action.topbarIconOnly) {
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
