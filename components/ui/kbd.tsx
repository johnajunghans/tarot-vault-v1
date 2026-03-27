import * as React from "react"
import { cn } from "@/lib/utils"

const KEY_LABELS: Record<string, string> = {
  "⌘": "Command",
  "⌃": "Control",
  "⌥": "Option",
  "⇧": "Shift",
  "↵": "Enter",
  "⏎": "Enter",
  "⌫": "Delete",
  "⌦": "Forward Delete",
  "⎋": "Escape",
  "Esc": "Escape",
  "↹": "Tab",
  "⇥": "Tab",
  "⇪": "Caps Lock",
  "↑": "Up Arrow",
  "↓": "Down Arrow",
  "←": "Left Arrow",
  "→": "Right Arrow",
  "Ctrl": "Control",
  "Cmd": "Command",
  "Return": "Enter",
}

function extractShortcutText(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children)
  }

  if (Array.isArray(children)) {
    return children.map(extractShortcutText).join(" ")
  }

  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<{ children?: React.ReactNode }>
    return extractShortcutText(element.props.children)
  }

  return ""
}

function getAccessibleShortcutLabel(children: React.ReactNode): string | undefined {
  const text = extractShortcutText(children).replace(/\s+/g, " ").trim()

  if (!text) return undefined

  const separator = text.includes("+") ? " plus " : " "
  const tokens = text
    .split(/\s*\+\s*|\s+/)
    .filter(Boolean)
    .map((token) => KEY_LABELS[token] ?? token)

  const label = tokens.join(separator).trim()

  return label !== text ? label : undefined
}

function Kbd({
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      aria-label={ariaLabel ?? getAccessibleShortcutLabel(children)}
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
