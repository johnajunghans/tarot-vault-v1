'use client'

import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import type { CanvasCard } from '../components/card'

interface UseCardLayeringArgs {
    effectiveCards: CanvasCard[]
    selectedCardIndex: number | null
    draggingIndex: number | null
}

export function useCardLayering({
    effectiveCards,
    selectedCardIndex,
    draggingIndex,
}: UseCardLayeringArgs) {
    const cardsLayerRef = useRef<SVGGElement>(null)
    const cardGroupRefs = useRef<Map<number, SVGGElement>>(new Map())

    const registerCardRef = useCallback((index: number, el: SVGGElement | null) => {
        if (el) {
            cardGroupRefs.current.set(index, el)
            return
        }

        cardGroupRefs.current.delete(index)
    }, [])

    const baseSortedCards = useMemo(
        () =>
            effectiveCards
                .map((card, index) => ({ card, index }))
                .sort((a, b) => {
                    if (a.card.z !== b.card.z) return a.card.z - b.card.z
                    return a.index - b.index
                }),
        [effectiveCards]
    )

    const layeredCardIndices = useMemo(
        () =>
            baseSortedCards
                .map(({ index }) => index)
                .sort((a, b) => {
                    const aSelected = a === selectedCardIndex ? 1 : 0
                    const bSelected = b === selectedCardIndex ? 1 : 0
                    const aDragging = draggingIndex === a ? 1 : 0
                    const bDragging = draggingIndex === b ? 1 : 0

                    if (aDragging !== bDragging) return aDragging - bDragging
                    if (aSelected !== bSelected) return aSelected - bSelected
                    return 0
                }),
        [baseSortedCards, draggingIndex, selectedCardIndex]
    )

    useLayoutEffect(() => {
        const cardsLayer = cardsLayerRef.current
        if (!cardsLayer) return

        for (const index of layeredCardIndices) {
            const el = cardGroupRefs.current.get(index)
            if (el && el.parentNode === cardsLayer) {
                cardsLayer.appendChild(el)
            }
        }
    }, [layeredCardIndices])

    return {
        cardsLayerRef,
        registerCardRef,
        baseSortedCards,
    }
}
