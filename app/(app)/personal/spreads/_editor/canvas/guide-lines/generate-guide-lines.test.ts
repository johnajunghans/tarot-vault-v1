import { describe, expect, it } from 'vitest'
import { generateGuideLines } from './generate-guide-lines'
import type { CanvasCard, CanvasDragState } from '../types'
import { CARD_HEIGHT, CARD_WIDTH } from '../../lib'

function makeCard(overrides: Partial<CanvasCard> = {}): CanvasCard {
    return {
        name: 'Card',
        x: 0,
        y: 0,
        r: 0,
        z: 0,
        ...overrides,
    }
}

function makeDrag(overrides: Partial<CanvasDragState> = {}): CanvasDragState {
    return {
        index: 0,
        x: 100,
        y: 200,
        ...overrides,
    }
}

describe('generateGuideLines', () => {
    it('returns no guides when no other card shares an edge', () => {
        const dragging = makeDrag()

        expect(
            generateGuideLines(
                [
                    makeCard({ x: dragging.x, y: dragging.y }),
                    makeCard({
                        x: dragging.x + CARD_WIDTH + 25,
                        y: dragging.y + CARD_HEIGHT + 25,
                    }),
                ],
                dragging
            )
        ).toEqual([])
    })

    it('ignores the dragged card itself when checking alignments', () => {
        const dragging = makeDrag()

        expect(
            generateGuideLines(
                [makeCard({ x: dragging.x, y: dragging.y })],
                dragging
            )
        ).toEqual([])
    })

    it('returns each vertical guide at most once when multiple cards align', () => {
        const dragging = makeDrag()

        expect(
            generateGuideLines(
                [
                    makeCard({ x: dragging.x, y: dragging.y }),
                    makeCard({ x: dragging.x - CARD_WIDTH, y: dragging.y + 10 }),
                    makeCard({ x: dragging.x - CARD_WIDTH, y: dragging.y + 30 }),
                    makeCard({ x: dragging.x + CARD_WIDTH, y: dragging.y + 20 }),
                ],
                dragging
            )
        ).toEqual([
            { axis: 'v', pos: dragging.x },
            { axis: 'v', pos: dragging.x + CARD_WIDTH },
        ])
    })

    it('returns each horizontal guide at most once when multiple cards align', () => {
        const dragging = makeDrag()

        expect(
            generateGuideLines(
                [
                    makeCard({ x: dragging.x, y: dragging.y }),
                    makeCard({
                        x: dragging.x + CARD_WIDTH + 20,
                        y: dragging.y - CARD_HEIGHT,
                    }),
                    makeCard({
                        x: dragging.x + CARD_WIDTH + 40,
                        y: dragging.y - CARD_HEIGHT,
                    }),
                    makeCard({
                        x: dragging.x + CARD_WIDTH + 60,
                        y: dragging.y + CARD_HEIGHT,
                    }),
                ],
                dragging
            )
        ).toEqual([
            { axis: 'h', pos: dragging.y },
            { axis: 'h', pos: dragging.y + CARD_HEIGHT },
        ])
    })

    it('returns all matching guides in left-right-top-bottom order', () => {
        const dragging = makeDrag()

        expect(
            generateGuideLines(
                [
                    makeCard({ x: dragging.x, y: dragging.y }),
                    makeCard({ x: dragging.x - CARD_WIDTH, y: dragging.y + 10 }),
                    makeCard({ x: dragging.x + CARD_WIDTH, y: dragging.y + 20 }),
                    makeCard({
                        x: dragging.x + CARD_WIDTH + 20,
                        y: dragging.y - CARD_HEIGHT,
                    }),
                    makeCard({
                        x: dragging.x + CARD_WIDTH + 40,
                        y: dragging.y + CARD_HEIGHT,
                    }),
                ],
                dragging
            )
        ).toEqual([
            { axis: 'v', pos: dragging.x },
            { axis: 'v', pos: dragging.x + CARD_WIDTH },
            { axis: 'h', pos: dragging.y },
            { axis: 'h', pos: dragging.y + CARD_HEIGHT },
        ])
    })
})
