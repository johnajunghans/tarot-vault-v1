import { describe, expect, it } from 'vitest'
import {
    areCanonicalLayerValues,
    clampLayer,
    getLayersWithBackCard,
    getLayersWithFrontCard,
    isUniqueHighestLayer,
    isUniqueLowestLayer,
    moveCardToLayer,
    normalizeCardLayers,
    normalizeLayerValues,
} from '.'

describe('clampLayer', () => {
    it('rounds to the nearest integer within the 1-based layer range', () => {
        expect(clampLayer(1.4, 10)).toBe(1)
        expect(clampLayer(1.6, 10)).toBe(2)
        expect(clampLayer(-1, 10)).toBe(1)
        expect(clampLayer(100, 10)).toBe(10)
    })

    it('returns 0 when no layer options exist', () => {
        expect(clampLayer(1, 0)).toBe(0)
    })
})

describe('normalizeLayerValues', () => {
    it('converts 0-based layers to 1-based ranks', () => {
        expect(normalizeLayerValues([0, 1, 2])).toEqual([1, 2, 3])
    })

    it('preserves current render order for duplicate and gapped layers', () => {
        expect(normalizeLayerValues([10, 0, 10, 5])).toEqual([3, 1, 4, 2])
    })

    it('keeps tied layers in stable index order', () => {
        expect(normalizeLayerValues([0, 0, 0])).toEqual([1, 2, 3])
    })
})

describe('normalizeCardLayers', () => {
    it('returns cards with canonical layer ranks', () => {
        expect(
            normalizeCardLayers([
                { name: 'Front A', z: 10 },
                { name: 'Back', z: 0 },
                { name: 'Front B', z: 10 },
            ])
        ).toEqual([
            { name: 'Front A', z: 2 },
            { name: 'Back', z: 1 },
            { name: 'Front B', z: 3 },
        ])
    })
})

describe('areCanonicalLayerValues', () => {
    it('accepts exactly the integer set 1..N', () => {
        expect(areCanonicalLayerValues([1, 2, 3])).toBe(true)
        expect(areCanonicalLayerValues([3, 1, 2])).toBe(true)
    })

    it('rejects 0, duplicates, gaps, out-of-range values, and non-integers', () => {
        expect(areCanonicalLayerValues([0, 1, 2])).toBe(false)
        expect(areCanonicalLayerValues([1, 1, 2])).toBe(false)
        expect(areCanonicalLayerValues([1, 3, 4])).toBe(false)
        expect(areCanonicalLayerValues([1, 2, 4])).toBe(false)
        expect(areCanonicalLayerValues([1, 2.5, 3])).toBe(false)
    })
})

describe('moveCardToLayer', () => {
    it('moves a card up and shifts the intervening range down', () => {
        expect(moveCardToLayer([1, 2, 3, 4], 0, 3)).toEqual([3, 1, 2, 4])
    })

    it('moves a card down and shifts the intervening range up', () => {
        expect(moveCardToLayer([1, 2, 3, 4], 3, 2)).toEqual([1, 3, 4, 2])
    })

    it('normalizes legacy layers before moving', () => {
        expect(moveCardToLayer([0, 0, 5], 2, 1)).toEqual([2, 3, 1])
    })

    it('clamps target layers to the available range', () => {
        expect(moveCardToLayer([1, 2, 3], 0, 99)).toEqual([3, 1, 2])
        expect(moveCardToLayer([1, 2, 3], 2, -99)).toEqual([2, 3, 1])
    })
})

describe('front and back helpers', () => {
    it('moves selected card to the highest layer', () => {
        expect(getLayersWithFrontCard([1, 2, 3], 0)).toEqual([3, 1, 2])
    })

    it('moves selected card to the lowest layer', () => {
        expect(getLayersWithBackCard([1, 2, 3], 2)).toEqual([2, 3, 1])
    })

    it('always returns canonical 1..N layers', () => {
        expect(getLayersWithFrontCard([0, 10, 10], 0)).toEqual([3, 1, 2])
        expect(getLayersWithBackCard([0, 10, 10], 2)).toEqual([2, 3, 1])
    })
})

describe('layer boundary checks', () => {
    it('identifies the highest and lowest layer after normalization', () => {
        expect(isUniqueHighestLayer([0, 0, 0], 2)).toBe(true)
        expect(isUniqueHighestLayer([0, 0, 0], 1)).toBe(false)
        expect(isUniqueLowestLayer([0, 0, 0], 0)).toBe(true)
        expect(isUniqueLowestLayer([0, 0, 0], 1)).toBe(false)
    })
})
