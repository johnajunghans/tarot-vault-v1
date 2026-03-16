"use client"

import { useCallback } from "react"
import type { FieldErrors } from "react-hook-form"
import { toast } from "sonner"
import type { PanelImperativeHandle } from "react-resizable-panels"
import type { SpreadForm } from "@/types/spreads"

/**
 * Hook for shared save validation error handling (toast + panel expand).
 */
export function useValidationErrorHandler(
    isMobile: boolean,
    setSpreadSheetOpen: (open: boolean) => void,
    spreadSettingsPanelRef: React.RefObject<PanelImperativeHandle | null>,
) {
    return useCallback(
        (errors: FieldErrors<SpreadForm>) => {
            if (errors.name) {
                toast.error("Give your spread a name", {
                    description: errors.name.message,
                })
            }
            if (errors.description) {
                toast.error("Invalid description", {
                    description: errors.description.message,
                })
            }
            if (errors.positions) {
                toast.error("Card issues", {
                    description: "One or more cards need attention.",
                })
            }

            if (errors.name || errors.description) {
                if (isMobile) {
                    setSpreadSheetOpen(true)
                } else {
                    const panel = spreadSettingsPanelRef.current
                    if (panel?.isCollapsed()) {
                        panel.expand()
                    }
                }
            }
        },
        [isMobile, setSpreadSheetOpen, spreadSettingsPanelRef]
    )
}
