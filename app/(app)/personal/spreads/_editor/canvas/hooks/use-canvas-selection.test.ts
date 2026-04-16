import { describe, expect, it } from 'vitest'
import {
    getMarqueeRect,
    getMarqueeSelectedIndices,
    getMarqueeSelectionRect,
    isClickLikeMarqueeDrag,
} from './use-canvas-selection'
import type { CanvasCard } from '../types'

function makeCard(overrides: Partial<CanvasCard>): CanvasCard {
    return {
        name: 'Card',
        x: 0,
        y: 0,
        r: 0,
        z: 0,
        ...overrides,
    }
}

describe('useCanvasSelection', () => {
    it.todo('selects a clicked card and clears group selection when appropriate')
    it.todo('ignores card clicks while selection is suppressed after a gesture')
    it.todo('starts marquee selection from a background pointer down event')

    it('computes the selected indices for cards intersecting the marquee rectangle', () => {
        const cards = [
            makeCard({ name: 'A', x: 30, y: 45 }),
            makeCard({ name: 'B', x: 150, y: 90 }),
            makeCard({ name: 'C', x: 420, y: 360 }),
        ]

        expect(
            getMarqueeSelectedIndices(
                cards,
                { x: 20, y: 30 },
                { x: 260, y: 260 }
            )
        ).toEqual(new Set([0, 1]))
    })

    it('treats a click-like marquee drag as a clear-selection action instead of a box select', () => {
        expect(
            isClickLikeMarqueeDrag({ x: 100, y: 100 }, { x: 103, y: 103 })
        ).toBe(true)

        expect(
            isClickLikeMarqueeDrag({ x: 100, y: 100 }, { x: 104, y: 104 })
        ).toBe(false)
    })

    it('derives marqueeRect geometry from marquee drag state', () => {
        expect(
            getMarqueeRect({
                startX: 220,
                startY: 180,
                currentX: 100,
                currentY: 60,
            })
        ).toEqual({
            x: 100,
            y: 60,
            width: 120,
            height: 120,
        })

        expect(getMarqueeRect(null)).toBeNull()
    })

    it('normalizes marquee selection bounds regardless of drag direction', () => {
        expect(
            getMarqueeSelectionRect(
                { x: 220, y: 180 },
                { x: 100, y: 60 }
            )
        ).toEqual({
            left: 100,
            right: 220,
            top: 60,
            bottom: 180,
        })
    })
})
