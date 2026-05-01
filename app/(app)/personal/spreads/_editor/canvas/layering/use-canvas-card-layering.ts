'use client'

import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import type { CanvasCard } from '../types'

interface UseCardLayeringArgs {
    effectiveCards: CanvasCard[]
    selectedCardIndex: number | null
    draggingIndex: number | null
}

// Build the stable render order from persisted z-index first, then fall back to
// original array order so ties remain deterministic.
function getBaseSortedCards(effectiveCards: CanvasCard[]) {
    return effectiveCards
        .map((card, index) => ({ card, index }))
        .sort((a, b) => {
            if (a.card.z !== b.card.z) return a.card.z - b.card.z
            return a.index - b.index
        })
}

// Promote the actively dragged card to the top of the visual stack without
// mutating the underlying card data. Selection alone does not override layers.
function getLayeredCardIndices(
    baseSortedCards: Array<{ card: CanvasCard; index: number }>,
    _selectedCardIndex: number | null,
    draggingIndex: number | null
) {
    return baseSortedCards
        .map(({ index }) => index)
        .sort((a, b) => {
            const aDragging = draggingIndex === a ? 1 : 0
            const bDragging = draggingIndex === b ? 1 : 0

            if (aDragging !== bDragging) return aDragging - bDragging
            return 0
        })
}

// Keeps SVG card groups stacked in the right visual order. The base order comes
// from card z-values, then DOM order is adjusted so a dragged card is visually
// on top while interacting.
export function useCanvasCardLayering({
    effectiveCards,
    selectedCardIndex,
    draggingIndex,
}: UseCardLayeringArgs) {
    // ------------ DOM REFS ------------ //

    // The layer ref points at the shared `<g>` container that owns all cards.
    const cardsLayerRef = useRef<SVGGElement>(null)

    // Each rendered card registers its SVG group here so the hook can reorder
    // the actual DOM nodes after React renders them.
    const cardGroupRefs = useRef<Map<number, SVGGElement>>(new Map())

    // Register or unregister a rendered card group by its current card index.
    const registerCardRef = useCallback((index: number, el: SVGGElement | null) => {
        if (el) {
            cardGroupRefs.current.set(index, el)
            return
        }

        cardGroupRefs.current.delete(index)
    }, [])

    // ------------ DERIVED ORDER ------------ //

    // Start from persisted z-order plus original array position.
    const baseSortedCards = useMemo(
        () => getBaseSortedCards(effectiveCards),
        [effectiveCards]
    )

    // Then compute the temporary interactive stacking order for this frame.
    const layeredCardIndices = useMemo(
        () =>
            getLayeredCardIndices(
                baseSortedCards,
                selectedCardIndex,
                draggingIndex
            ),
        [baseSortedCards, draggingIndex, selectedCardIndex]
    )

    // ------------ DOM LAYER SYNC ------------ //

    // Re-append card groups in the desired order so the SVG DOM stacking matches
    // the current interaction state.
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

    // ------------ PUBLIC API ------------ //

    return {
        cardsLayerRef,
        registerCardRef,
        baseSortedCards,
    }
}

export { getBaseSortedCards, getLayeredCardIndices }
