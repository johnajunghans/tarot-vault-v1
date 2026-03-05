"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { ActionDescriptor, ActionType } from "@/types/layout"
import {
  Cancel01Icon,
  Delete02Icon,
  FloppyDiskIcon,
  PencilEdit02Icon,
} from "hugeicons-react"
import NewXButton from "./new-x-button"

// ─── Action type → button config map ───────────────────────────────────────

interface ActionButtonConfig {
  variant: "default" | "ghost" | "destructive"
  className?: string
  icon: typeof Cancel01Icon
}

const ACTION_BUTTON_CONFIG: Record<ActionType, ActionButtonConfig> = {
  save: {
    variant: "default",
    className: "bg-gold hover:bg-gold/90 text-background font-semibold",
    icon: FloppyDiskIcon,
  },
  edit: {
    variant: "default",
    className: "bg-gold hover:bg-gold/90 text-background font-semibold",
    icon: PencilEdit02Icon,
  },
  delete: {
    variant: "ghost",
    className: "text-muted-foreground hover:text-destructive",
    icon: Delete02Icon,
  },
  discard: {
    variant: "destructive",
    icon: Delete02Icon,
  },
  cancel: {
    variant: "ghost",
    icon: Cancel01Icon,
  },
  close: {
    variant: "ghost",
    icon: Cancel01Icon,
  },
}

// ─── Topbar Buttons ────────────────────────────────────────────────────────

interface TopbarButtonsProps {
  actions: ActionDescriptor[] | null
  isMobile: boolean
}

export default function TopbarButtons({ actions, isMobile }: TopbarButtonsProps) {
  if (!actions) {
    return <NewXButton />
  }

  return (
    <>
      {[...actions].reverse().map((action) => {
        const config = ACTION_BUTTON_CONFIG[action.type]
        const Icon = config.icon

        return (
          <Button
            key={action.type}
            type="button"
            variant={config.variant}
            size={isMobile ? "icon" : "default"}
            disabled={action.disabled || action.loading}
            onClick={action.onClick}
            className={config.className}
          >
            {action.loading && <Spinner />}
            {isMobile ? (
              !action.loading && <Icon />
            ) : (
              <span className="text-xs lg:text-sm">{action.label}</span>
            )}
          </Button>
        )
      })}
    </>
  )
}
