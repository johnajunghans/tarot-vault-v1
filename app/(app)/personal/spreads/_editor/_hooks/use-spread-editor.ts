"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import type { PanelImperativeHandle } from "react-resizable-panels"
import { useIsMobile } from "@/hooks/use-mobile"
import { CANVAS_CENTER } from "../_lib"
import { useValidationErrorHandler } from "./use-validation-error-handler"
import type { SpreadCanvasViewportRequest } from "../canvas/types"
import type { UseSpreadFormReturn } from "./use-spread-form"

interface UseSpreadEditorOptions {
    /** Unique key for the empty-canvas viewport request (e.g. "new-spread-empty"). */
    requestKey: string
    /** Return value of useSpreadForm(). */
    spreadForm: UseSpreadFormReturn
}

// Shared stateful plumbing for both the create and edit spread screens.
// Owns viewport requests, mobile sheet state, saving state, zoom callbacks,
// validation error handling, and the discard dialog flag.
export function useSpreadEditor({ requestKey, spreadForm }: UseSpreadEditorOptions) {
    const { canvasRef } = spreadForm
    const isMobile = useIsMobile()

    // ------------ VIEWPORT ------------ //

    const emptyCanvasViewportRequest = useMemo<SpreadCanvasViewportRequest>(
        () => ({
            key: requestKey,
            type: "center-canvas-point",
            point: CANVAS_CENTER,
            zoom: 1,
        }),
        [requestKey]
    )

    const [viewportRequest, setViewportRequest] =
        useState<SpreadCanvasViewportRequest | null>(null)

    // ------------ MOBILE SHEET ------------ //

    const [spreadSheetOpen, setSpreadSheetOpen] = useState(false)

    // ------------ SAVING ------------ //

    const [isSaving, setIsSaving] = useState(false)
    const spreadSettingsPanelRef = useRef<PanelImperativeHandle | null>(null)

    const onInvalid = useValidationErrorHandler(
        isMobile,
        setSpreadSheetOpen,
        spreadSettingsPanelRef,
    )

    // ------------ DISCARD DIALOG ------------ //

    const [showDiscardDialog, setShowDiscardDialog] = useState(false)

    // ------------ ZOOM CALLBACKS ------------ //

    const zoomIn = useCallback(() => canvasRef.current?.zoomIn(), [canvasRef])
    const zoomOut = useCallback(() => canvasRef.current?.zoomOut(), [canvasRef])
    const resetZoom = useCallback(() => canvasRef.current?.resetZoom(), [canvasRef])

    return {
        isMobile,
        emptyCanvasViewportRequest,
        viewportRequest,
        setViewportRequest,
        spreadSheetOpen,
        setSpreadSheetOpen,
        isSaving,
        setIsSaving,
        spreadSettingsPanelRef,
        onInvalid,
        showDiscardDialog,
        setShowDiscardDialog,
        zoomIn,
        zoomOut,
        resetZoom,
    }
}

export type UseSpreadEditorReturn = ReturnType<typeof useSpreadEditor>
