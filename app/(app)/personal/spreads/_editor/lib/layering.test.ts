import { describe, expect, it } from 'vitest'
import { clampLayer, getLayersWithFrontCard, getLayersWithBackCard } from '.'

describe('clampLayer', () => {
    it('rounds to the nearest integer', () => {
        expect(clampLayer(1.4)).toBe(1)
        expect(clampLayer(1.6)).toBe(2)
    })

    it('clamps negative values to 0', () => {
        expect(clampLayer(-1)).toBe(0)
        expect(clampLayer(-100)).toBe(0)
    })

    it('passes through non-negative integers unchanged', () => {
        expect(clampLayer(0)).toBe(0)
        expect(clampLayer(5)).toBe(5)
    })
})

describe('getLayersWithFrontCard', () => {
    it('sets selected card to max + 1', () => {
        expect(getLayersWithFrontCard([0, 1, 2], 0)).toEqual([3, 1, 2])
    })

    it('works when selected card is already at front', () => {
        expect(getLayersWithFrontCard([0, 1, 2], 2)).toEqual([0, 1, 3])
    })

    it('handles single card', () => {
        expect(getLayersWithFrontCard([0], 0)).toEqual([1])
    })
})

describe('getLayersWithBackCard', () => {
    it('sets selected card to min - 1 when min > 0', () => {
        expect(getLayersWithBackCard([1, 2, 3], 2)).toEqual([1, 2, 0])
    })

    it('shifts all other cards up when min is 0', () => {
        expect(getLayersWithBackCard([0, 1, 2], 2)).toEqual([1, 2, 0])
    })

    it('returns unchanged for empty array', () => {
        expect(getLayersWithBackCard([], 0)).toEqual([])
    })

    it('handles single card at 0', () => {
        expect(getLayersWithBackCard([0], 0)).toEqual([0])
    })
})
