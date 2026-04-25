"use client"

import Link from "next/link"
import {
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
} from "@/components/ui/responsive-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ActionDescriptor } from "@/types/layout"

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isActionDisabled(action: ActionDescriptor) {
  return Boolean(action.disabled || action.loading)
}

export function getActionClickHandler(
  action: ActionDescriptor,
): React.MouseEventHandler<HTMLElement> | undefined {
  if (action.type === "button") return action.onClick
  if (action.type === "dropdown") return undefined
  if (!isActionDisabled(action)) return undefined
  return (e) => e.preventDefault()
}

// ─── Shared: Dropdown Menu Content ────────────────────────────────────────────

export function ActionMenuItems({
  items,
}: {
  items: Extract<ActionDescriptor, { type: "dropdown" }>["menuStructure"]
}) {
  return (
    <>
      {items.map((item, index) => {
        if (item === "separator") {
          return <ResponsiveMenuSeparator key={`sep-${index}`} />
        }

        return (
          <ResponsiveMenuItem
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
          </ResponsiveMenuItem>
        )
      })}
    </>
  )
}

// ─── Shared: Action Dropdown ──────────────────────────────────────────────────

type ActionDropdownContentProps = {
  items: Extract<ActionDescriptor, { type: "dropdown" }>["menuStructure"]
  title: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
}

export function ActionDropdownContent({
  items,
  title,
  side = "bottom",
  align = "end",
  sideOffset = 8,
}: ActionDropdownContentProps) {
  return (
    <ResponsiveMenuContent
      title={title}
      side={side}
      align={align}
      sideOffset={sideOffset}
      className="min-w-56"
    >
      <ActionMenuItems items={items} />
    </ResponsiveMenuContent>
  )
}

// ─── Shared: Icon Defaults ────────────────────────────────────────────────────

export const TOPBAR_ICON_SIZE = 20  // size-4.5
export const SIDEBAR_ICON_SIZE = 24 // size-6 (matches SidebarMenuButton's [&_svg] rule)

export function iconStyle(size: number) {
  return { width: size, height: size }
}

/** Wraps a sidebar icon in a fixed container so sub-24px icons stay centered.
 *  Inline style on HugeiconsIcon naturally overrides SidebarMenuButton's
 *  [&_svg]:size-6 utility since inline styles beat non-important Tailwind. */
export function SidebarIconSlot({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center">
      {children}
    </span>
  )
}
