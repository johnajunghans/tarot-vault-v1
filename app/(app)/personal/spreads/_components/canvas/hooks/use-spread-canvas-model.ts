'use client'

import type { SpreadForm } from '@/types/spreads'
import type { UseFormReturn } from 'react-hook-form'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
    CanvasCard,
    SpreadCanvasHandle,
    SpreadCanvasPositionUpdate,
} from '..'
import {
    normalizeRotationForStorage,
    reconcileContinuousRotations,
    resolveContinuousRotation,
} from '../../../rotation'

interface UseSpreadCanvasModelArgs {
    cards: ReadonlyArray<{ id: string }>
    form: UseFormReturn<SpreadForm>
    watchedPositions:
        | Array<Partial<NonNullable<SpreadForm['positions']>[number]>>
        | undefined
}

export function useSpreadCanvasModel({
    cards,
    form,
    watchedPositions,
}: UseSpreadCanvasModelArgs) {
    const canvasRef = useRef<SpreadCanvasHandle>(null)
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
    const [zoomDisplay, setZoomDisplay] = useState(1)
    const [cardRotations, setCardRotations] = useState<Record<string, number>>({})
    const cardRotationsRef = useRef<Record<string, number>>({})

    const cardKeys = useMemo(() => cards.map(({ id }) => id), [cards])

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

    const canvasRotationAngles = useMemo(
        () =>
            cards.map(
                ({ id }, index) => cardRotations[id] ?? canvasCards[index]?.r ?? 0
            ),
        [canvasCards, cardRotations, cards]
    )

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

    const handleCardRotationChange = useCallback(
        (index: number, nextValue: number) => {
            const cardId = cards[index]?.id
            if (!cardId) return

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
        [cards, form]
    )

    const handleCanvasPositionsCommit = useCallback(
        (updates: SpreadCanvasPositionUpdate[]) => {
            updates.forEach(({ index, x, y }) => {
                form.setValue(`positions.${index}.x`, x, { shouldDirty: true })
                form.setValue(`positions.${index}.y`, y, { shouldDirty: true })
            })
        },
        [form]
    )

    return {
        canvasRef,
        cardKeys,
        canvasCards,
        canvasRotationAngles,
        selectedCardIndex,
        setSelectedCardIndex,
        zoomDisplay,
        setZoomDisplay,
        handleCardRotationChange,
        handleCanvasPositionsCommit,
    }
}
