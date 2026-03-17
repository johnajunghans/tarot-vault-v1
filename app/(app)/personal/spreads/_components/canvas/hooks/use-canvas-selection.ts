'use client'

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent as ReactMouseEvent,
} from 'react'
import { useLatestRef } from '@/hooks/use-latest-ref'
import type { CanvasCard } from '../types'
import { getRect, rectsIntersect } from '../helpers/geometry'
import { CARD_HEIGHT, CARD_WIDTH } from '../../../spread-layout'
import type { CanvasPoint } from '../types'

interface UseCanvasSelectionArgs {
    effectiveCards: CanvasCard[]
    onCardSelect: (index: number | null) => void
    syncGroupSelection: (next: Set<number>) => void
    clientToSVG: (clientX: number, clientY: number) => CanvasPoint
    isCardSelectionSuppressed: () => boolean
    isSpaceHeldRef: { current: boolean }
    isMarqueeActiveRef: { current: boolean }
}

interface CanvasMarqueeState {
    startX: number
    startY: number
    currentX: number
    currentY: number
}

function getMarqueeSelectionRect(start: CanvasPoint, end: CanvasPoint) {
    return {
        left: Math.min(start.x, end.x),
        right: Math.max(start.x, end.x),
        top: Math.min(start.y, end.y),
        bottom: Math.max(start.y, end.y),
    }
}

function isClickLikeMarqueeDrag(
    start: CanvasPoint,
    end: CanvasPoint,
    threshold = 5
) {
    const dx = end.x - start.x
    const dy = end.y - start.y
    return Math.sqrt(dx * dx + dy * dy) < threshold
}

function getMarqueeSelectedIndices(
    effectiveCards: CanvasCard[],
    start: CanvasPoint,
    end: CanvasPoint
) {
    const selectionRect = getMarqueeSelectionRect(start, end)
    const selected = new Set<number>()

    effectiveCards.forEach((card, index) => {
        if (
            rectsIntersect(
                getRect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT),
                selectionRect
            )
        ) {
            selected.add(index)
        }
    })

    return selected
}

function getMarqueeRect(marquee: CanvasMarqueeState | null) {
    if (!marquee) return null

    return {
        x: Math.min(marquee.startX, marquee.currentX),
        y: Math.min(marquee.startY, marquee.currentY),
        width: Math.abs(marquee.currentX - marquee.startX),
        height: Math.abs(marquee.currentY - marquee.startY),
    }
}

export function useCanvasSelection({
    effectiveCards,
    onCardSelect,
    syncGroupSelection,
    clientToSVG,
    isCardSelectionSuppressed,
    isSpaceHeldRef,
    isMarqueeActiveRef,
}: UseCanvasSelectionArgs) {
    const [groupSelectedIndices, setGroupSelectedIndices] = useState<Set<number>>(
        new Set()
    )
    const [marquee, setMarquee] = useState<CanvasMarqueeState | null>(null)

    const effectiveCardsRef = useLatestRef(effectiveCards)
    const marqueeStartRef = useRef<CanvasPoint>({ x: 0, y: 0 })

    const updateGroupSelection = useCallback(
        (next: Set<number>) => {
            syncGroupSelection(next)
            setGroupSelectedIndices(next)
        },
        [syncGroupSelection]
    )

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isMarqueeActiveRef.current) return
            const pt = clientToSVG(e.clientX, e.clientY)
            setMarquee((prev) =>
                prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null
            )
        }

        const handleMouseUp = (e: MouseEvent) => {
            if (!isMarqueeActiveRef.current) return
            isMarqueeActiveRef.current = false

            const endPt = clientToSVG(e.clientX, e.clientY)

            if (isClickLikeMarqueeDrag(marqueeStartRef.current, endPt)) {
                updateGroupSelection(new Set())
                onCardSelect(null)
            } else {
                updateGroupSelection(
                    getMarqueeSelectedIndices(
                        effectiveCardsRef.current,
                        marqueeStartRef.current,
                        endPt
                    )
                )
            }

            setMarquee(null)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [
        clientToSVG,
        effectiveCardsRef,
        isMarqueeActiveRef,
        onCardSelect,
        updateGroupSelection,
    ])

    const handleBackgroundMouseDown = useCallback(
        (e: ReactMouseEvent<SVGRectElement>) => {
            if (isSpaceHeldRef.current) return
            const pt = clientToSVG(e.clientX, e.clientY)
            isMarqueeActiveRef.current = true
            marqueeStartRef.current = { x: pt.x, y: pt.y }
            setMarquee({
                startX: pt.x,
                startY: pt.y,
                currentX: pt.x,
                currentY: pt.y,
            })
        },
        [clientToSVG, isMarqueeActiveRef, isSpaceHeldRef]
    )

    const handleCardClick = useCallback(
        (index: number) => {
            if (isCardSelectionSuppressed()) {
                return
            }
            updateGroupSelection(new Set())
            onCardSelect(index)
        },
        [isCardSelectionSuppressed, onCardSelect, updateGroupSelection]
    )

    const marqueeRect = useMemo(() => {
        return getMarqueeRect(marquee)
    }, [marquee])

    return {
        groupSelectedIndices,
        handleBackgroundMouseDown,
        handleCardClick,
        marqueeRect,
    }
}

export {
    getMarqueeRect,
    getMarqueeSelectedIndices,
    getMarqueeSelectionRect,
    isClickLikeMarqueeDrag,
}
