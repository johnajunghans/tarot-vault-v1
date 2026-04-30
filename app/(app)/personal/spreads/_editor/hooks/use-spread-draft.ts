"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/routes"
import type { DeepPartial, UseFormReturn } from "react-hook-form"
import type { SpreadForm } from "@/types/spreads"
import type { SpreadCanvasViewportRequest } from "../canvas/types"
import {
    getSpreadBounds,
    normalizeCardsToCanvasCenter,
    createDraftTimestamp,
    DRAFT_KEY_PREFIX,
} from "../lib"

interface UseSpreadDraftOptions {
    form: UseFormReturn<SpreadForm>
    loadedDraftDate: number | undefined
    emptyCanvasViewportRequest: SpreadCanvasViewportRequest
    setViewportRequest: (request: SpreadCanvasViewportRequest) => void
    setShowDiscardDialog: (open: boolean) => void
    watchedValues: DeepPartial<SpreadForm> | undefined
    clearHistory: () => void
}

// Manages draft persistence for the create-spread screen. Handles loading a
// draft from localStorage on mount, auto-saving as the form changes, and
// discarding drafts when the user navigates away.
export function useSpreadDraft({
    form,
    loadedDraftDate,
    emptyCanvasViewportRequest,
    setViewportRequest,
    setShowDiscardDialog,
    watchedValues,
    clearHistory,
}: UseSpreadDraftOptions) {
    const router = useRouter()

    const [draftDate] = useState(() => loadedDraftDate ?? createDraftTimestamp())
    const draftKey = draftDate ? `${DRAFT_KEY_PREFIX}${draftDate}` : ""
    const isDiscardingRef = useRef(false)

    // ------------ LOAD DRAFT ------------ //

    useLayoutEffect(() => {
        let nextViewportRequest = emptyCanvasViewportRequest

        if (!loadedDraftDate) {
            const frame = window.requestAnimationFrame(() => {
                setViewportRequest(emptyCanvasViewportRequest)
            })

            return () => window.cancelAnimationFrame(frame)
        }

        const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${loadedDraftDate}`)
        if (!raw) {
            const frame = window.requestAnimationFrame(() => {
                setViewportRequest(emptyCanvasViewportRequest)
            })

            return () => window.cancelAnimationFrame(frame)
        }

        try {
            const draft = JSON.parse(raw) as SpreadForm & { date?: number; numberOfCards?: number }
            const normalizedPositions = normalizeCardsToCanvasCenter(
                (draft.positions ?? []).map(
                    ({ name, description, allowReverse, x, y, r, z }) => ({
                        name, description, allowReverse, x, y, r, z,
                    })
                )
            )
            form.reset({
                name: draft.name ?? "",
                description: draft.description ?? "",
                positions: normalizedPositions,
            })
            clearHistory()

            const bounds = getSpreadBounds(normalizedPositions)
            nextViewportRequest = bounds
                ? {
                      key: `draft-${loadedDraftDate}-${normalizedPositions.length}`,
                      type: "fit-spread",
                      bounds,
                      maxZoom: 1,
                  }
                : emptyCanvasViewportRequest
        } catch {
            clearHistory()
        }

        const frame = window.requestAnimationFrame(() => {
            setViewportRequest(nextViewportRequest)
        })

        return () => window.cancelAnimationFrame(frame)
    }, [clearHistory, emptyCanvasViewportRequest, form, loadedDraftDate, setViewportRequest])

    // ------------ AUTO-SAVE DRAFT ------------ //

    useEffect(() => {
        if (isDiscardingRef.current) return
        if (!watchedValues) return
        if (form.formState.isDirty) {
            localStorage.setItem(draftKey, JSON.stringify({
                ...watchedValues,
                date: draftDate,
                positions: watchedValues.positions?.map((p, i) => ({ ...p, position: i + 1 })),
                numberOfCards: watchedValues.positions?.length
            }))
        }
    }, [watchedValues, form.formState.isDirty, draftDate, draftKey])

    // ------------ DISCARD ------------ //

    const handleDiscard = useCallback(() => {
        if (!form.formState.isDirty && !loadedDraftDate) {
            localStorage.removeItem(draftKey)
            router.push(routes.personal.spreads.root)
            return
        }
        setShowDiscardDialog(true)
    }, [form.formState.isDirty, router, loadedDraftDate, draftKey, setShowDiscardDialog])

    const handleConfirmDiscard = useCallback(() => {
        isDiscardingRef.current = true
        localStorage.removeItem(draftKey)
        form.reset()
        clearHistory()
        setShowDiscardDialog(false)
        router.push(routes.personal.spreads.root)
    }, [clearHistory, form, router, draftKey, setShowDiscardDialog])

    return {
        draftKey,
        handleDiscard,
        handleConfirmDiscard,
    }
}
