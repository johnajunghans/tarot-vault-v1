'use client'

import { useMemo } from 'react'
import type { CanvasCard } from '../components/card'
import type { OffscreenPointer } from '../components/pointer-overlay'
import {
    getRect,
    getRectCenter,
    isRectFullyOutsideRect,
    projectVectorToEdge,
} from '../helpers/geometry'
import { getCanvasViewportRect } from '../helpers/viewport'
import { CARD_HEIGHT, CARD_WIDTH } from '../../../spread-layout'

const POINTER_EDGE_PADDING = 18

interface UseCanvasOffscreenPointersArgs {
    effectiveCards: CanvasCard[]
    pan: { x: number; y: number }
    containerSize: { width: number; height: number }
    zoom: number
}

export function useCanvasOffscreenPointers({
    effectiveCards,
    pan,
    containerSize,
    zoom,
}: UseCanvasOffscreenPointersArgs) {
    return useMemo<OffscreenPointer[]>(() => {
        if (containerSize.width <= 0 || containerSize.height <= 0) {
            return []
        }

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

        if (maxOffsetX === 0 || maxOffsetY === 0) return []

        return effectiveCards.flatMap((card, index) => {
            const cardRect = getRect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT)

            if (!isRectFullyOutsideRect(cardRect, viewport)) return []

            const cardCenter = getRectCenter(cardRect)
            const pointerPosition = projectVectorToEdge(
                cardCenter.x - viewport.centerX,
                cardCenter.y - viewport.centerY,
                overlayCenterX,
                overlayCenterY,
                maxOffsetX,
                maxOffsetY
            )

            if (!pointerPosition) return []

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
