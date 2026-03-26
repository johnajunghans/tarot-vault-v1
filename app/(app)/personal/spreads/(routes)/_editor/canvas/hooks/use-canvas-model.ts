'use client'

import type { SpreadForm } from '@/types/spreads'
import type { UseFormReturn } from 'react-hook-form'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CanvasCard } from '../types'
import type {
    SpreadCanvasHandle,
    SpreadCanvasPositionUpdate,
} from '../types'
import { ZOOM_MIN } from '../lib/zoom'
import {
    reconcileContinuousRotations,
    resolveContinuousRotation,
} from '../lib/continuous-rotation'
import {
    normalizeRotationForStorage,
} from '../../lib/rotation'
import { useCanvasHistory } from './use-canvas-history'

interface UseSpreadCanvasModelArgs {
    cards: ReadonlyArray<{ id: string }>
    form: UseFormReturn<SpreadForm>
    watchedPositions:
        | Array<Partial<NonNullable<SpreadForm['positions']>[number]>>
        | undefined
    enabled?: boolean
}

// Keeps canvas-specific UI state in sync with the spread form. The form remains
// the source of truth for persisted values, while this hook handles selection,
// zoom display, and rotation behavior needed for smooth canvas interactions.
export function useSpreadCanvasModel({
    cards,
    form,
    watchedPositions,
    enabled = true,
}: UseSpreadCanvasModelArgs) {
    // ------------ UI STATE ------------ //

    // Imperative canvas methods are exposed through this ref so wrapper
    // components can trigger zoom and reset actions from external controls.
    const canvasRef = useRef<SpreadCanvasHandle>(null)

    // Selection and zoom display live outside the form because they are view
    // concerns rather than persisted spread data.
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
    const [zoomDisplay, setZoomDisplay] = useState(1)
    const [minZoomDisplay, setMinZoomDisplay] = useState(ZOOM_MIN)

    // Rotations are tracked by field-array id so a card keeps its continuous
    // visual rotation even if cards are reordered or removed.
    const [cardRotations, setCardRotations] = useState<Record<string, number>>({})
    const cardRotationsRef = useRef<Record<string, number>>({})

    // ------------ UNDO / REDO ------------ //

    const {
        canUndo,
        canRedo,
        pushSnapshot,
        undo,
        redo,
    } = useCanvasHistory({ form, cards, enabled })

    // ------------ DERIVED CANVAS DATA ------------ //

    // Stable keys from `useFieldArray` preserve card identity for React and GSAP
    // as cards move through the list.
    const cardKeys = useMemo(() => cards.map(({ id }) => id), [cards])

    // Convert partially watched form values into the simpler shape expected by
    // the canvas render layer.
    const canvasCards = useMemo<CanvasCard[]>(
        () =>
            (watchedPositions ?? []).map((card) => ({
                name: card.name ?? '',
                description: card.description,
                allowReverse: card.allowReverse,
                x: card.x ?? 0,
                y: card.y ?? 0,
                r: card.r ?? 0,
                z: card.z ?? 0,
            })),
        [watchedPositions]
    )

    // Map id-based rotation state back into render order so each canvas card
    // receives the right angle for its current index.
    const canvasRotationAngles = useMemo(
        () =>
            cards.map(
                ({ id }, index) => cardRotations[id] ?? canvasCards[index]?.r ?? 0
            ),
        [canvasCards, cardRotations, cards]
    )

    // ------------ EFFECTS ------------ //

    // Reconcile stored rotations with the id-based rotation cache. This keeps
    // rotation animation continuous across reorders while still storing a
    // normalized angle in the form.
    useEffect(() => {
        const nextRotations = reconcileContinuousRotations(
            cardKeys,
            (watchedPositions ?? []).map((card) => card.r ?? 0),
            cardRotationsRef.current
        )

        const hasChanged =
            Object.keys(nextRotations).length !==
                Object.keys(cardRotationsRef.current).length ||
            Object.entries(nextRotations).some(
                ([cardId, rotation]) =>
                    cardRotationsRef.current[cardId] !== rotation
            )

        if (!hasChanged) return

        cardRotationsRef.current = nextRotations
        setCardRotations(nextRotations)
    }, [cardKeys, watchedPositions])

    // If a selected card is removed, clamp the selection to the new list size
    // on the next frame so dependent UI never points past the end of the array.
    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            setSelectedCardIndex((prev) => {
                if (prev === null) return prev
                if (prev < cards.length) return prev
                return cards.length > 0 ? cards.length - 1 : null
            })
        })

        return () => {
            window.cancelAnimationFrame(frame)
        }
    }, [cards.length])

    // ------------ FORM WRITE-BACKS ------------ //

    // Update rotation from the card settings UI. We store a normalized 0-359
    // value in the form, but keep a continuous angle in local state so repeated
    // turns animate in the expected direction instead of snapping backward.
    const handleCardRotationChange = useCallback(
        (index: number, nextValue: number) => {
            const cardId = cards[index]?.id
            if (!cardId) return

            pushSnapshot()
            const currentStoredRotation = form.getValues(`positions.${index}.r`) ?? 0
            const previousActualRotation =
                cardRotationsRef.current[cardId] ??
                normalizeRotationForStorage(currentStoredRotation)
            const nextActualRotation = resolveContinuousRotation(
                nextValue,
                previousActualRotation
            )
            const nextStoredRotation = normalizeRotationForStorage(nextValue)
            const nextRotations = {
                ...cardRotationsRef.current,
                [cardId]: nextActualRotation,
            }

            cardRotationsRef.current = nextRotations
            setCardRotations(nextRotations)
            form.setValue(`positions.${index}.r`, nextStoredRotation, {
                shouldDirty: true,
            })
        },
        [cards, form, pushSnapshot]
    )

    // Commit drag results back into the form after the canvas finishes moving
    // one or more cards.
    const handleCanvasPositionsCommit = useCallback(
        (updates: SpreadCanvasPositionUpdate[]) => {
            pushSnapshot()
            updates.forEach(({ index, x, y }) => {
                form.setValue(`positions.${index}.x`, x, { shouldDirty: true })
                form.setValue(`positions.${index}.y`, y, { shouldDirty: true })
            })
        },
        [form, pushSnapshot]
    )

    // Update z-index from layer changes (bring to front / send to back).
    const handleCanvasLayerChange = useCallback(
        (updates: { index: number; z: number }[]) => {
            pushSnapshot()
            updates.forEach(({ index, z }) => {
                form.setValue(`positions.${index}.z`, z, { shouldDirty: true })
            })
        },
        [form, pushSnapshot]
    )

    // ------------ PUBLIC API ------------ //

    return {
        canvasRef,
        cardKeys,
        canvasCards,
        canvasRotationAngles,
        selectedCardIndex,
        setSelectedCardIndex,
        zoomDisplay,
        setZoomDisplay,
        minZoomDisplay,
        setMinZoomDisplay,
        handleCardRotationChange,
        handleCanvasPositionsCommit,
        handleCanvasLayerChange,
        canUndo,
        canRedo,
        undo,
        redo,
    }
}
