import type { ActionDescriptor } from "@/types/layout"
import type { MouseEventHandler } from "react"

export function isActionDisabled(action: ActionDescriptor) {
  return Boolean(action.disabled || action.loading)
}

export function getActionClickHandler(action: ActionDescriptor): MouseEventHandler<HTMLElement> | undefined {
  const disabled = isActionDisabled(action)

  if (!action.href) {
    return action.onClick
  }

  return (event) => {
    if (disabled) {
      event.preventDefault()
      return
    }

    action.onClick?.()
  }
}
