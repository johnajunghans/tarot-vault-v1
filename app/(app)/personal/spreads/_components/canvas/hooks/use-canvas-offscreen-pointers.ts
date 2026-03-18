'use client'

import { useMemo } from 'react'
import type { CanvasCard, OffscreenPointer } from '../types'
import {
    getRect,
    getRectCenter,
    isRectFullyOutsideRect,
    projectVectorToEdge,
} from '../helpers/geometry'
import { getCanvasViewportRect } from '../helpers/viewport'
import { CARD_HEIGHT, CARD_WIDTH } from '../../../_helpers/layout'

const POINTER_EDGE_PADDING = 18

interface UseCanvasOffscreenPointersArgs {
    effectiveCards: CanvasCard[]
    pan: { x: number; y: number }
    containerSize: { width: number; height: number }
    zoom: number
}

// Build edge pointers for cards that are completely outside the current
// viewport. The overlay helps the user orient themselves when cards are off
// screen after panning or zooming.
export function useCanvasOffscreenPointers({
    effectiveCards,
    pan,
    containerSize,
    zoom,
}: UseCanvasOffscreenPointersArgs) {
    return useMemo<OffscreenPointer[]>(() => {
        // Skip pointer work until the canvas container has real dimensions.
        if (containerSize.width <= 0 || containerSize.height <= 0) {
            return []
        }

        // Translate the current pan/zoom state into the visible rectangle within
        // canvas coordinates.
        const viewport = getCanvasViewportRect({
            panX: pan.x,
            panY: pan.y,
            clientWidth: containerSize.width,
            clientHeight: containerSize.height,
            zoom,
        })

        const overlayCenterX = containerSize.width / 2
        const overlayCenterY = containerSize.height / 2
        const maxOffsetX = Math.max(overlayCenterX - POINTER_EDGE_PADDING, 0)
        const maxOffsetY = Math.max(overlayCenterY - POINTER_EDGE_PADDING, 0)

        // If the overlay has no safe interior space, there is nowhere useful to
        // place pointers.
        if (maxOffsetX === 0 || maxOffsetY === 0) return []

        return effectiveCards.flatMap((card, index) => {
            const cardRect = getRect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT)

            // Only fully offscreen cards get a pointer. Partially visible cards
            // are already discoverable in the canvas itself.
            if (!isRectFullyOutsideRect(cardRect, viewport)) return []

            const cardCenter = getRectCenter(cardRect)

            // Project the vector from viewport center to card center onto the
            // overlay edge so the pointer sits on the correct side.
            const pointerPosition = projectVectorToEdge(
                cardCenter.x - viewport.centerX,
                cardCenter.y - viewport.centerY,
                overlayCenterX,
                overlayCenterY,
                maxOffsetX,
                maxOffsetY
            )

            if (!pointerPosition) return []

            // Rotate the pointer glyph to match the edge it was projected onto.
            return [
                {
                    index,
                    x: pointerPosition.x,
                    y: pointerPosition.y,
                    rotation:
                        pointerPosition.edge === 'top'
                            ? 0
                            : pointerPosition.edge === 'right'
                              ? 90
                              : pointerPosition.edge === 'bottom'
                                ? 180
                                : -90,
                    label: card.name?.trim() || `Card ${index + 1}`,
                },
            ]
        })
    }, [containerSize, effectiveCards, pan, zoom])
}
