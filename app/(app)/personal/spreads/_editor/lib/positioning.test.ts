import { describe, expect, it } from 'vitest'
import {
    generateCardAt,
    getGeneratedCardPosition,
    normalizeCardsToCanvasCenter,
    snapToGrid,
    translateCards,
    CANVAS_CENTER, 
    CARD_SPACING_X, 
    CARD_SPACING_Y, 
    GRID_SIZE
} from '.'

describe('snapToGrid', () => {
    it('snaps to the nearest grid line', () => {
        expect(snapToGrid(22)).toBe(15)
        expect(snapToGrid(23)).toBe(30)
        expect(snapToGrid(0)).toBe(0)
    })

    it('snaps negative values', () => {
        expect(snapToGrid(-8)).toBe(-15)
        expect(snapToGrid(-1)).toBe(-0)
    })
})

describe('translateCards', () => {
    it('shifts all cards by the given delta', () => {
        const cards = [
            { x: 10, y: 20 },
            { x: 50, y: 60 },
        ]

        const result = translateCards(cards, 100, -10)

        expect(result).toEqual([
            { x: 110, y: 10 },
            { x: 150, y: 50 },
        ])
    })

    it('preserves extra properties on each card', () => {
        const cards = [{ x: 0, y: 0, r: 90, name: 'Test' }]
        const [card] = translateCards(cards, 5, 5)

        expect(card.r).toBe(90)
        expect(card.name).toBe('Test')
    })
})

describe('generateCardAt', () => {
    it('creates a blank card at the given coordinates', () => {
        const card = generateCardAt(100, 200)

        expect(card).toEqual({
            name: '',
            description: '',
            allowReverse: true,
            x: 100,
            y: 200,
            r: 0,
            z: 1,
        })
    })

    it('uses the provided layer value', () => {
        expect(generateCardAt(100, 200, 4).z).toBe(4)
    })
})

describe('getGeneratedCardPosition', () => {
    it('places the first card at one grid unit from the origin', () => {
        const pos = getGeneratedCardPosition(0)
        expect(pos.x).toBe(GRID_SIZE)
        expect(pos.y).toBe(GRID_SIZE)
    })

    it('spaces cards horizontally by CARD_SPACING_X', () => {
        const first = getGeneratedCardPosition(0)
        const second = getGeneratedCardPosition(1)
        expect(second.x - first.x).toBe(CARD_SPACING_X)
        expect(second.y).toBe(first.y)
    })

    it('wraps to the next row after 10 cards', () => {
        const pos = getGeneratedCardPosition(10)
        expect(pos.x).toBe(GRID_SIZE)
        expect(pos.y).toBe(GRID_SIZE + CARD_SPACING_Y)
    })
})

describe('normalizeCardsToCanvasCenter', () => {
    it('returns empty input unchanged', () => {
        expect(normalizeCardsToCanvasCenter([])).toEqual([])
    })

    it('centers a single card on the canvas center', () => {
        const cards = [{ x: 0, y: 0, r: 0 }]
        const [centered] = normalizeCardsToCanvasCenter(cards)

        // The card's center should be close to CANVAS_CENTER
        // (within grid snapping tolerance)
        expect(Math.abs(centered.x - (CANVAS_CENTER.x - 45))).toBeLessThanOrEqual(GRID_SIZE)
        expect(Math.abs(centered.y - (CANVAS_CENTER.y - 75))).toBeLessThanOrEqual(GRID_SIZE)
    })
})
