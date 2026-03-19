import { describe, expect, it } from 'vitest'
import {
    buildDragUpdates,
    getEffectiveCards,
    toPositionUpdates,
} from '../use-canvas-drag'
import type { CanvasCard } from '../../types'

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

describe('useCanvasDrag', () => {
    it('overlays transient positions onto committed card positions in effectiveCards', () => {
        const cards = [
            makeCard({ name: 'A', x: 30, y: 45 }),
            makeCard({ name: 'B', x: 150, y: 195 }),
        ]

        expect(
            getEffectiveCards(cards, {
                1: { x: 210, y: 255 },
            })
        ).toEqual([
            cards[0],
            { ...cards[1], x: 210, y: 255 },
        ])
    })

    it('emits the correct single-card position payload on drag end', () => {
        expect(
            toPositionUpdates(
                buildDragUpdates(2, 330, 495, new Map(), null)
            )
        ).toEqual([
            {
                index: 2,
                x: 330,
                y: 495,
            },
        ])
    })

    it('moves the full selected group while preserving card offsets during group drag', () => {
        const updates = buildDragUpdates(
            0,
            180,
            225,
            new Map([
                [1, { x: 240, y: 330 }],
                [2, { x: 360, y: 450 }],
            ]),
            { x: 120, y: 150 }
        )

        expect(updates).toEqual({
            0: { x: 180, y: 225 },
            1: { x: 300, y: 405 },
            2: { x: 420, y: 525 },
        })
    })

    it('clamps and snaps grouped cards while preserving the dragged card position', () => {
        const updates = buildDragUpdates(
            0,
            2300,
            1700,
            new Map([[1, { x: 2290, y: 1660 }]]),
            { x: 2200, y: 1600 }
        )

        expect(updates).toEqual({
            0: { x: 2300, y: 1700 },
            1: { x: 2310, y: 1650 },
        })
    })

    it.todo('clears transient positions after drag end')
    it.todo('clears stale transient positions when the source cards prop changes after dragging')
})
