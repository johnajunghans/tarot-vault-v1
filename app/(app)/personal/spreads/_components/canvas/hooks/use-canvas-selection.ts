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
    const [marquee, setMarquee] = useState<{
        startX: number
        startY: number
        currentX: number
        currentY: number
    } | null>(null)

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
            const dx = endPt.x - marqueeStartRef.current.x
            const dy = endPt.y - marqueeStartRef.current.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < 5) {
                updateGroupSelection(new Set())
                onCardSelect(null)
            } else {
                const left = Math.min(marqueeStartRef.current.x, endPt.x)
                const right = Math.max(marqueeStartRef.current.x, endPt.x)
                const top = Math.min(marqueeStartRef.current.y, endPt.y)
                const bottom = Math.max(marqueeStartRef.current.y, endPt.y)
                const selectionRect = { left, right, top, bottom }
                const selected = new Set<number>()

                effectiveCardsRef.current.forEach((card, index) => {
                    if (
                        rectsIntersect(
                            getRect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT),
                            selectionRect
                        )
                    ) {
                        selected.add(index)
                    }
                })

                updateGroupSelection(selected)
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
        if (!marquee) return null
        return {
            x: Math.min(marquee.startX, marquee.currentX),
            y: Math.min(marquee.startY, marquee.currentY),
            width: Math.abs(marquee.currentX - marquee.startX),
            height: Math.abs(marquee.currentY - marquee.startY),
        }
    }, [marquee])

    return {
        groupSelectedIndices,
        handleBackgroundMouseDown,
        handleCardClick,
        marqueeRect,
    }
}
