"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { ActionDescriptor } from "@/types/layout"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { getActionClickHandler, isActionDisabled } from "./actions/helpers"
import NewXButton from "./new-x-button"

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
