import {
  Cancel01Icon,
  Delete02Icon,
  FloppyDiskIcon,
  MultiplicationSignIcon,
  PencilEdit02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import type { ActionType } from "@/types/layout"

export type ActionTone = "primary" | "danger" | "neutral"

interface ActionConfig {
  icon: IconSvgElement
  tone: ActionTone
  strokeWidth: number
}

export const ACTION_CONFIG: Record<ActionType, ActionConfig> = {
  new: {
    icon: PlusSignIcon,
    tone: "primary",
    strokeWidth: 2,
  },
  save: {
    icon: FloppyDiskIcon,
    tone: "primary",
    strokeWidth: 2,
  },
  edit: {
    icon: PencilEdit02Icon,
    tone: "primary",
    strokeWidth: 2,
  },
  delete: {
    icon: Delete02Icon,
    tone: "danger",
    strokeWidth: 1.5,
  },
  discard: {
    icon: Delete02Icon,
    tone: "danger",
    strokeWidth: 1.5,
  },
  cancel: {
    icon: Cancel01Icon,
    tone: "neutral",
    strokeWidth: 1.5,
  },
  close: {
    icon: MultiplicationSignIcon,
    tone: "neutral",
    strokeWidth: 1.5,
  },
}
