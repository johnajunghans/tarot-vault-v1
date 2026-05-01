import { describe, expect, it } from 'vitest'
import { mapPositionsForApi } from './map-positions-for-api'

describe('mapPositionsForApi', () => {
    it('assigns 1-based position indices', () => {
        const positions = [
            { name: 'Past', description: '', allowReverse: true, x: 0, y: 0, r: 0, z: 1 },
            { name: 'Present', description: '', allowReverse: false, x: 100, y: 0, r: 45, z: 2 },
        ]

        const result = mapPositionsForApi(positions)

        expect(result[0].position).toBe(1)
        expect(result[1].position).toBe(2)
    })

    it('maps all card fields to the API shape', () => {
        const positions = [
            { name: 'Outcome', description: 'Final card', allowReverse: true, x: 50, y: 75, r: 90, z: 2 },
        ]

        const [card] = mapPositionsForApi(positions)

        expect(card).toEqual({
            position: 1,
            name: 'Outcome',
            description: 'Final card',
            allowReverse: true,
            x: 50,
            y: 75,
            r: 90,
            z: 1,
        })
    })

    it('normalizes legacy layers before saving', () => {
        const positions = [
            { name: 'Top A', description: '', allowReverse: true, x: 0, y: 0, r: 0, z: 10 },
            { name: 'Back', description: '', allowReverse: true, x: 0, y: 0, r: 0, z: 0 },
            { name: 'Top B', description: '', allowReverse: true, x: 0, y: 0, r: 0, z: 10 },
        ]

        expect(mapPositionsForApi(positions).map((position) => position.z)).toEqual([2, 1, 3])
    })

    it('returns an empty array for empty input', () => {
        expect(mapPositionsForApi([])).toEqual([])
    })
})
