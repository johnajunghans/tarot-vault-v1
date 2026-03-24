"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// ─── Arrow SVG halves ────────────────────────────────────────────────────────
// These two curved arrows form the diamond when joined, and serve as the
// stylized "A" (up) and "V" (down) when the sidebar is expanded.
// viewBox aspect ratio is 17:10 — rendered at matching proportions.

const TRI_W = 17 // rendered width in px
const TRI_H = 10 // rendered height in px
const STROKE_WIDTH = 1.5

function UpArrow({
  className,
  style,
  filled,
}: {
  className?: string
  style?: React.CSSProperties
  filled: boolean
}) {
  return (
    <svg
      viewBox="4 2 17 10"
      width={TRI_W}
      height={TRI_H}
      className={className}
      style={style}
      aria-hidden
      overflow="visible"
    >
      <path
        d="M 4 12 C 4 10.5959 4.98633 9.4087 6.959 7.03438 L 8.04435 5.72804 C 10.1093 3.24268 11.1417 2 12.5 2 C 13.8583 2 14.8907 3.24268 16.9556 5.72803 L 18.041 7.03437 C 20.0137 9.4087 21 10.5959 21 12"
        fill={filled ? "var(--gold)" : "none"}
        stroke="var(--gold)"
        strokeWidth={STROKE_WIDTH}
      />
    </svg>
  )
}

function DownArrow({
  className,
  style,
  filled,
}: {
  className?: string
  style?: React.CSSProperties
  filled: boolean
}) {
  return (
    <svg
      viewBox="4 12 17 10"
      width={TRI_W}
      height={TRI_H}
      className={className}
      style={style}
      aria-hidden
      overflow="visible"
    >
      <path
        d="M 21 12 C 21 13.4041 20.0137 14.5913 18.041 16.9656 L 16.9557 18.272 C 14.8907 20.7573 13.8583 22 12.5 22 C 11.1417 22 10.1093 20.7573 8.04435 18.272 L 6.95901 16.9656 C 4.98634 14.5913 4 13.4041 4 12"
        fill={filled ? "var(--gold)" : "none"}
        stroke="var(--gold)"
        strokeWidth={STROKE_WIDTH}
      />
    </svg>
  )
}

// ─── Animated logo ───────────────────────────────────────────────────────────
// Collapsed: arrows join to form a gold diamond
// Expanded:  arrows separate into T▲ROT / ▼AULT rows

// When collapsed, each row collapses to TRI_H. The arrows are centered
// in their rows, so the gap between arrow edges equals TRI_H (one row
// height). Each arrow translates half that distance to close the gap.
const COLLAPSE_Y = 0

export function SidebarLogo() {
  const { open } = useSidebar()

  const textBase = "font-display font-bold text-base leading-none tracking-widest overflow-hidden whitespace-nowrap transition-all duration-300 select-none"
  const arrowBase = "shrink-0 transition-all duration-300"

  return (
    <div
      className="flex flex-col transition-all duration-300"
      style={{ gap: open ? 2 : 0 }}
    >
      {/* Row 1: T ▲ ROT */}
      <div
        className="flex items-center transition-all duration-300"
        style={{ height: open ? 22 : TRI_H }}
      >
        <span
          className={cn(
            textBase,
            open ? "max-w-[20px] opacity-100 pr-0.5" : "max-w-0 opacity-0 pr-0",
          )}
        >
          T
        </span>
        <UpArrow
          filled={!open}
          className={cn(arrowBase, 
            // !open && "drop-shadow-[0_0_4px_var(--gold-muted)]"
          )}
          style={{
            transform: open ? "translateY(0)" : `translateY(${COLLAPSE_Y}px)`,
          }}
        />
        <span
          className={cn(
            textBase,
            open ? "max-w-[60px] opacity-100 pl-0.5" : "max-w-0 opacity-0 pl-0",
          )}
        >
          ROT
        </span>
      </div>

      {/* Row 2: ▼ AULT */}
      <div
        className="flex items-center transition-all duration-300 translate-x-0"
        style={{ height: open ? 22 : TRI_H }}
      >
        <DownArrow
          filled={!open}
          className={cn(arrowBase, 
            // !open && "drop-shadow-[0_0_4px_var(--gold-muted)]"
          )}
          style={{
            transform: open ? "translateY(0)" : `translateY(-${COLLAPSE_Y}px)`,
          }}
        />
        <span
          className={cn(
            textBase,
            open ? "max-w-[80px] opacity-100 pl-0.5" : "max-w-0 opacity-0 pl-0",
          )}
        >
          AULT
        </span>
      </div>
    </div>
  )
}
