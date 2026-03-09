"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { ActionDescriptor } from "@/types/layout"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { ACTION_CONFIG, type ActionTone } from "./actions/config"
import { getActionClickHandler, isActionDisabled } from "./actions/helpers"
import NewXButton from "./new-x-button"

const TOPBAR_TONE_STYLES: Record<
  Exclude<ActionTone, "danger"> | "dangerGhost",
  { variant: "default" | "ghost"; className?: string }
> = {
  primary: {
    variant: "default",
    className: "bg-gold hover:bg-gold/90 text-background font-semibold",
  },
  neutral: {
    variant: "ghost",
  },
  dangerGhost: {
    variant: "ghost",
    className: "text-muted-foreground hover:text-destructive",
  },
}

function getTopbarButtonStyle(action: ActionDescriptor, tone: ActionTone) {
  if (action.type === "discard") {
    return { variant: "destructive" as const, className: undefined }
  }

  if (tone === "danger") {
    return TOPBAR_TONE_STYLES.dangerGhost
  }

  return TOPBAR_TONE_STYLES[tone]
}

// ─── Topbar Buttons ────────────────────────────────────────────────────────

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
        const config = ACTION_CONFIG[action.type]
        const { variant, className } = getTopbarButtonStyle(action, config.tone)
        const disabled = isActionDisabled(action)
        const isLastButton = index === actions.length - 1
        const abridgedLabel = isLastButton && isMobile ? action.label.split(" ")[0] : undefined
        const handleClick = getActionClickHandler(action)

        return (
          <Button
            key={action.type}
            type={action.href ? undefined : "button"}
            variant={variant}
            size={isMobile && !isLastButton ? "icon" : "default"}
            disabled={action.href ? undefined : disabled}
            nativeButton={action.href ? false : undefined}
            onClick={handleClick}
            render={action.href ? <Link href={action.href} /> : undefined}
            className={cn(action.href && disabled && "pointer-events-none opacity-50", className)}
          >
            {action.loading && <Spinner />}
            {isMobile && !action.loading && (
              <HugeiconsIcon icon={config.icon} strokeWidth={config.strokeWidth} />
            )}
            {(!isMobile || isLastButton) && <span className="text-xs lg:text-sm">{abridgedLabel ?? action.label}</span>}
          
          </Button>
        )
      })}
    </>
  )
}
