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
import { getRect, rectsIntersect } from '../lib/geometry'
import { CARD_HEIGHT, CARD_WIDTH } from '../../lib'
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

// Convert two SVG points into a normalized selection rectangle regardless of
// drag direction.
function getMarqueeSelectionRect(start: CanvasPoint, end: CanvasPoint) {
    return {
        left: Math.min(start.x, end.x),
        right: Math.max(start.x, end.x),
        top: Math.min(start.y, end.y),
        bottom: Math.max(start.y, end.y),
    }
}

// Treat very small marquee drags as simple background clicks so the user can
// deselect without accidentally creating a tiny selection box.
function isClickLikeMarqueeDrag(
    start: CanvasPoint,
    end: CanvasPoint,
    threshold = 5
) {
    const dx = end.x - start.x
    const dy = end.y - start.y
    return Math.sqrt(dx * dx + dy * dy) < threshold
}

// Select every card whose bounding rectangle intersects the marquee area.
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

// Convert the marquee drag state into the rectangle shape expected by the
// overlay component.
function getMarqueeRect(marquee: CanvasMarqueeState | null) {
    if (!marquee) return null

    return {
        x: Math.min(marquee.startX, marquee.currentX),
        y: Math.min(marquee.startY, marquee.currentY),
        width: Math.abs(marquee.currentX - marquee.startX),
        height: Math.abs(marquee.currentY - marquee.startY),
    }
}

// Coordinates single-card selection, background deselection, and marquee-based
// multi-selection. Selection state is shared back to the drag hook so group
// drags know which cards should move together.
export function useCanvasSelection({
    effectiveCards,
    onCardSelect,
    syncGroupSelection,
    clientToSVG,
    isCardSelectionSuppressed,
    isSpaceHeldRef,
    isMarqueeActiveRef,
}: UseCanvasSelectionArgs) {
    // ------------ LOCAL SELECTION STATE ------------ //

    // Tracks the current marquee/group selection set used by canvas overlays and
    // drag coordination.
    const [groupSelectedIndices, setGroupSelectedIndices] = useState<Set<number>>(
        new Set()
    )

    // Holds the live marquee box while the user is dragging across the
    // background.
    const [marquee, setMarquee] = useState<CanvasMarqueeState | null>(null)

    // Refs provide the freshest card positions and marquee start point to the
    // global mouse listeners.
    const effectiveCardsRef = useLatestRef(effectiveCards)
    const marqueeStartRef = useRef<CanvasPoint>({ x: 0, y: 0 })

    // Keep local state and the sibling drag hook synchronized with the same set
    // of group-selected indices.
    const updateGroupSelection = useCallback(
        (next: Set<number>) => {
            syncGroupSelection(next)
            setGroupSelectedIndices(next)
        },
        [syncGroupSelection]
    )

    // ------------ GLOBAL MARQUEE LISTENERS ------------ //

    // Listen on `window` so marquee selection continues working even if the
    // pointer leaves the SVG while dragging.
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

            // A click-like drag clears selection; a real marquee drag selects
            // every intersecting card.
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

    // ------------ EVENT HANDLERS ------------ //

    // Start marquee selection from the background unless the viewport hook is
    // currently using space-drag panning.
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

    // Card clicks collapse any existing group selection and promote one card to
    // the focused selection, unless another interaction temporarily suppresses
    // click-to-select.
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

    // Derive the rendered marquee overlay rectangle from the live drag state.
    const marqueeRect = useMemo(() => {
        return getMarqueeRect(marquee)
    }, [marquee])

    // ------------ PUBLIC API ------------ //

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
