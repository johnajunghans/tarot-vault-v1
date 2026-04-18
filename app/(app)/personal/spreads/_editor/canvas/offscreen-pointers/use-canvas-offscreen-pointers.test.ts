import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OffscreenPointer, useCanvasOffscreenPointers } from './use-canvas-offscreen-pointers'
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

function getPointers(effectiveCards: CanvasCard[]) {
    function TestHarness() {
        const pointers = useCanvasOffscreenPointers({
            effectiveCards,
            pan: { x: 100, y: 50 },
            containerSize: { width: 400, height: 200 },
            zoom: 1,
        })

        return createElement('div', {
            'data-pointers': JSON.stringify(pointers),
        })
    }

    const markup = renderToStaticMarkup(createElement(TestHarness))
    const serializedPointers = markup.match(/data-pointers="([^"]*)"/)?.[1]

    if (!serializedPointers) {
        throw new Error('Failed to serialize offscreen pointers from hook harness.')
    }

    return JSON.parse(serializedPointers.replaceAll('&quot;', '"')) as OffscreenPointer[]
}

describe('useCanvasOffscreenPointers', () => {
    it('returns no pointers when every card is visible inside the viewport', () => {
        expect(
            getPointers([
                makeCard({ name: 'Visible A', x: 120, y: 60 }),
                makeCard({ name: 'Visible B', x: 300, y: 80 }),
            ])
        ).toEqual([])
    })

    it('projects left offscreen cards to the left overlay edge with the expected rotation', () => {
        expect(getPointers([makeCard({ name: 'Left Card', x: 0, y: 100 })])).toEqual([
            expect.objectContaining({
                index: 0,
                x: 18,
                rotation: -90,
                label: 'Left Card',
            }),
        ])

        expect(getPointers([makeCard({ name: 'Left Card', x: 0, y: 100 })])[0]?.y).toBeCloseTo(
            117.84,
            1
        )
    })

    it('projects right offscreen cards to the right overlay edge with the expected rotation', () => {
        expect(
            getPointers([makeCard({ name: 'Right Card', x: 600, y: 100 })])
        ).toEqual([
            expect.objectContaining({
                index: 0,
                x: 382,
                rotation: 90,
                label: 'Right Card',
            }),
        ])

        expect(
            getPointers([makeCard({ name: 'Right Card', x: 600, y: 100 })])[0]?.y
        ).toBeCloseTo(113.2, 1)
    })

    it('projects top and bottom offscreen cards to the correct overlay edges', () => {
        const pointers = getPointers([
            makeCard({ name: 'Top Card', x: 250, y: -200 }),
            makeCard({ name: 'Bottom Card', x: 250, y: 400 }),
        ])

        expect(pointers).toHaveLength(2)
        expect(pointers[0]).toEqual(
            expect.objectContaining({
                index: 0,
                y: 18,
                rotation: 0,
                label: 'Top Card',
            })
        )
        expect(pointers[0]?.x).toBeCloseTo(198.5, 1)

        expect(pointers[1]).toEqual(
            expect.objectContaining({
                index: 1,
                y: 182,
                rotation: 180,
                label: 'Bottom Card',
            })
        )
        expect(pointers[1]?.x).toBeCloseTo(198.7, 1)
    })

    it('falls back to Card N labels when a card has no display name', () => {
        const pointers = getPointers([
            makeCard({ name: 'Visible A', x: 120, y: 60 }),
            makeCard({ name: '   ', x: 600, y: 100 }),
        ])

        expect(pointers).toEqual([
            expect.objectContaining({
                index: 1,
                label: 'Card 2',
            }),
        ])
    })
})
