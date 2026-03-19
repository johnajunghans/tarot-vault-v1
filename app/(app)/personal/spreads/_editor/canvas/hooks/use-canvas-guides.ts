'use client'

import { useMemo } from 'react'
import { getRect } from '../helpers/geometry'
import type { CanvasCard, CanvasGuide } from '../types'
import { CARD_HEIGHT, CARD_WIDTH } from '../../lib'

interface CanvasDragState {
    index: number
    x: number
    y: number
}

interface UseCanvasGuidesArgs {
    effectiveCards: CanvasCard[]
    dragging: CanvasDragState | null
    groupSelectedIndices: ReadonlySet<number>
    isViewMode: boolean
}

// Derive the temporary alignment guides shown while dragging a single card.
// Guides are only shown in edit mode and are suppressed for multi-card drags
// because the group movement already communicates the interaction clearly.
export function useCanvasGuides({
    effectiveCards,
    dragging,
    groupSelectedIndices,
    isViewMode,
}: UseCanvasGuidesArgs) {
    return useMemo<CanvasGuide[]>(() => {
        // No guides while viewing or when nothing is actively being dragged.
        if (isViewMode || !dragging) return []

        // Group drags intentionally skip guides to avoid noisy overlays.
        if (
            groupSelectedIndices.size > 1 &&
            groupSelectedIndices.has(dragging.index)
        ) {
            return []
        }

        // Measure the dragged card and compare its outer edges against every
        // other card to find exact horizontal or vertical alignments.
        const draggedRect = getRect(
            dragging.x,
            dragging.y,
            CARD_WIDTH,
            CARD_HEIGHT
        )
        const lines: CanvasGuide[] = []

        effectiveCards.forEach((card, index) => {
            if (index === dragging.index) return

            const otherRect = getRect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT)

            for (const draggedEdge of [draggedRect.left, draggedRect.right]) {
                for (const otherEdge of [otherRect.left, otherRect.right]) {
                    if (draggedEdge === otherEdge) {
                        lines.push({ axis: 'v', pos: draggedEdge })
                    }
                }
            }

            for (const draggedEdge of [draggedRect.top, draggedRect.bottom]) {
                for (const otherEdge of [otherRect.top, otherRect.bottom]) {
                    if (draggedEdge === otherEdge) {
                        lines.push({ axis: 'h', pos: draggedEdge })
                    }
                }
            }
        })

        // Different cards can yield the same guide, so collapse duplicates
        // before rendering the overlay.
        const seen = new Set<string>()

        return lines.filter((line) => {
            const key = `${line.axis}-${line.pos}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
    }, [effectiveCards, dragging, groupSelectedIndices, isViewMode])
}
