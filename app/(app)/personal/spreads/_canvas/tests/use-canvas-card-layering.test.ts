import { describe, expect, it } from 'vitest'
import {
    getBaseSortedCards,
    getLayeredCardIndices,
} from '../hooks/use-canvas-card-layering'
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

function getBaseOrder(cards: CanvasCard[]) {
    return getBaseSortedCards(cards).map(({ index }) => index)
}

describe('useCardLayering', () => {
    it('sorts cards by base z order before any selection or drag promotion', () => {
        expect(
            getBaseOrder([
                makeCard({ name: 'Top', z: 30 }),
                makeCard({ name: 'Bottom', z: 10 }),
                makeCard({ name: 'Middle', z: 20 }),
            ])
        ).toEqual([1, 2, 0])
    })

    it('promotes the selected card above non-selected cards', () => {
        const baseSortedCards = getBaseSortedCards([
            makeCard({ name: 'Bottom', z: 10 }),
            makeCard({ name: 'Middle', z: 20 }),
            makeCard({ name: 'Top', z: 30 }),
        ])

        expect(getLayeredCardIndices(baseSortedCards, 1, null)).toEqual([0, 2, 1])
    })

    it('promotes the actively dragged card above the selected card', () => {
        const baseSortedCards = getBaseSortedCards([
            makeCard({ name: 'Bottom', z: 10 }),
            makeCard({ name: 'Middle', z: 20 }),
            makeCard({ name: 'Top', z: 30 }),
        ])

        expect(getLayeredCardIndices(baseSortedCards, 1, 0)).toEqual([2, 1, 0])
    })

    it('keeps equal-z cards in stable index order', () => {
        expect(
            getBaseOrder([
                makeCard({ name: 'A', z: 10 }),
                makeCard({ name: 'B', z: 10 }),
                makeCard({ name: 'C', z: 10 }),
            ])
        ).toEqual([0, 1, 2])
    })

    it.todo('reorders mounted card groups to match the computed layered order')
})
