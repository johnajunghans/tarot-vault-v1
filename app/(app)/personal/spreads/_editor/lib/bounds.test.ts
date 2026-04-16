import { describe, expect, it } from 'vitest'
import type { CardDB } from '@/types/spreads'
import { calcSpreadDimensions, getSpreadBounds } from './bounds'
import { CARD_HEIGHT, CARD_WIDTH } from './constants'

const mockEmptyCardArray: CardDB[] = []

const mockSingleCard: CardDB[] = [
    {
        position: 1,
        name: 'Card 1',
        x: 15,
        y: 15,
        r: 0,
        z: 0
    }
]

const mockRotatedSingleCard: CardDB[] = [
    {
        position: 1,
        name: 'Card 1',
        x: 15,
        y: 15,
        r: 90,
        z: 0
    }
]

const mockMultipleCards: CardDB[] = [
    {
        position: 1,
        name: 'Card 1',
        x: 15,
        y: 165,
        r: 0,
        z: 0
    },
    {
        position: 2,
        name: 'Card 2',
        x: 330,
        y: 45,
        r: 0,
        z: 1
    },
    {
        position: 3,
        name: 'Card 3',
        x: 60,
        y: 420,
        r: 0,
        z: 2
    }
]

const mockMultipleRotatedCards: CardDB[] = [
    {
        position: 1,
        name: 'Card 1',
        x: 0,
        y: 0,
        r: 45,
        z: 0
    },
    {
        position: 2,
        name: 'Card 2',
        x: 100,
        y: 100,
        r: 90,
        z: 1
    },
    {
        position: 3,
        name: 'Card 3',
        x: 200,
        y: 50,
        r: 135,
        z: 2
    }
]

describe('getSpreadBounds', () => {
    it('returns null for an empty spread', () => {
        expect(getSpreadBounds(mockEmptyCardArray)).toBe(null)
    })

    it('returns correct output for single card', () => {
        expect(getSpreadBounds(mockSingleCard)).toEqual({
            left: 15,
            top: 15,
            right: CARD_WIDTH + 15,
            bottom: CARD_HEIGHT + 15,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            centerX: CARD_WIDTH / 2 + 15,
            centerY: CARD_HEIGHT / 2 + 15,
        })
    })

    it('returns correct output for a single card rotated 90 degrees', () => {
        const bounds = getSpreadBounds(mockRotatedSingleCard)

        expect(bounds).not.toBe(null)
        expect(bounds?.left).toBeCloseTo(-15, 5)
        expect(bounds?.top).toBeCloseTo(45, 5)
        expect(bounds?.right).toBeCloseTo(135, 5)
        expect(bounds?.bottom).toBeCloseTo(135, 5)
        expect(bounds?.width).toBeCloseTo(CARD_HEIGHT, 5)
        expect(bounds?.height).toBeCloseTo(CARD_WIDTH, 5)
        expect(bounds?.centerX).toBeCloseTo(60, 5)
        expect(bounds?.centerY).toBeCloseTo(90, 5)
    })

    it('returns correct output for multiple cards', () => {
        expect(getSpreadBounds(mockMultipleCards)).toEqual({
            left: 15,
            top: 45,
            right: CARD_WIDTH + 330,
            bottom: CARD_HEIGHT + 420,
            width: CARD_WIDTH + 315,
            height: CARD_HEIGHT + 375,
            centerX: (15 + (330 + CARD_WIDTH)) / 2,
            centerY: (45 + (420 + CARD_HEIGHT)) / 2,
        })
    })

    it('returns correct output for multiple rotated cards', () => {
        const bounds = getSpreadBounds(mockMultipleRotatedCards)

        expect(bounds).not.toBe(null)
        expect(bounds?.left).toBeCloseTo(-39.8528, 4)
        expect(bounds?.top).toBeCloseTo(-9.8528, 4)
        expect(bounds?.right).toBeCloseTo(329.8528, 4)
        expect(bounds?.bottom).toBeCloseTo(220, 5)
        expect(bounds?.width).toBeCloseTo(369.7056, 4)
        expect(bounds?.height).toBeCloseTo(229.8528, 4)
        expect(bounds?.centerX).toBeCloseTo(145, 5)
        expect(bounds?.centerY).toBeCloseTo(105.0736, 4)
    })
})

describe('calcSpreadDimensions', () => {
    it('returns default dimensions for an empty spread', () => {
        expect(calcSpreadDimensions(mockEmptyCardArray)).toEqual({
            xMin: 0,
            xMax: CARD_WIDTH,
            yMin: 0,
            yMax: CARD_HEIGHT,
        })
    })

    it('returns correct dimensions for a single card', () => {
        expect(calcSpreadDimensions(mockSingleCard)).toEqual({
            xMin: 15,
            xMax: CARD_WIDTH + 15,
            yMin: 15,
            yMax: CARD_HEIGHT + 15,
        })
    })

    it('returns correct dimensions for a rotated single card', () => {
        const dimensions = calcSpreadDimensions(mockRotatedSingleCard)

        expect(dimensions.xMin).toBeCloseTo(-15, 5)
        expect(dimensions.xMax).toBeCloseTo(135, 5)
        expect(dimensions.yMin).toBeCloseTo(45, 5)
        expect(dimensions.yMax).toBeCloseTo(135, 5)
    })

    it('returns correct dimensions for multiple cards', () => {
        expect(calcSpreadDimensions(mockMultipleCards)).toEqual({
            xMin: 15,
            xMax: CARD_WIDTH + 330,
            yMin: 45,
            yMax: CARD_HEIGHT + 420,
        })
    })

    it('returns correct dimensions for multiple rotated cards', () => {
        const dimensions = calcSpreadDimensions(mockMultipleRotatedCards)

        expect(dimensions.xMin).toBeCloseTo(-39.8528, 4)
        expect(dimensions.xMax).toBeCloseTo(329.8528, 4)
        expect(dimensions.yMin).toBeCloseTo(-9.8528, 4)
        expect(dimensions.yMax).toBeCloseTo(220, 5)
    })

    it('matches the min and max edges from getSpreadBounds when cards exist', () => {
        const bounds = getSpreadBounds(mockMultipleRotatedCards)
        const dimensions = calcSpreadDimensions(mockMultipleRotatedCards)

        expect(bounds).not.toBe(null)
        expect(dimensions).toEqual({
            xMin: bounds!.left,
            xMax: bounds!.right,
            yMin: bounds!.top,
            yMax: bounds!.bottom,
        })
    })
})
