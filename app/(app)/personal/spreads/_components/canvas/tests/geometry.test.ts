import { describe, expect, it } from 'vitest'
import {
    clampToRange,
    getCenteredCardPlacement,
    getRect,
    isRectFullyOutsideRect,
    projectVectorToEdge,
    rectsIntersect,
    snapToGrid,
} from '../helpers/geometry'

describe('geometry helpers', () => {
    it('snaps values to the configured grid size', () => {
        expect(snapToGrid(22, 15)).toBe(15)
        expect(snapToGrid(23, 15)).toBe(30)
        expect(snapToGrid(-8, 15)).toBe(-15)
    })

    it('clamps values into the configured range', () => {
        expect(clampToRange(-20, 0, 100)).toBe(0)
        expect(clampToRange(40, 0, 100)).toBe(40)
        expect(clampToRange(140, 0, 100)).toBe(100)
    })

    it('computes centered card placement within canvas bounds', () => {
        expect(
            getCenteredCardPlacement(
                118,
                202,
                90,
                150,
                { minX: 0, minY: 0, maxX: 300, maxY: 300 },
                15
            )
        ).toEqual({
            x: 75,
            y: 120,
        })

        expect(
            getCenteredCardPlacement(
                10,
                10,
                90,
                150,
                { minX: 0, minY: 0, maxX: 300, maxY: 300 },
                15
            )
        ).toEqual({
            x: 0,
            y: 0,
        })
    })

    it('detects rect intersection and full rect exclusion correctly', () => {
        const baseRect = getRect(100, 100, 90, 150)
        const overlappingRect = getRect(160, 220, 90, 150)
        const separateRect = getRect(300, 300, 90, 150)

        expect(rectsIntersect(baseRect, overlappingRect)).toBe(true)
        expect(rectsIntersect(baseRect, separateRect)).toBe(false)
        expect(isRectFullyOutsideRect(baseRect, overlappingRect)).toBe(false)
        expect(isRectFullyOutsideRect(baseRect, separateRect)).toBe(true)
    })

    it('projects vectors onto the nearest overlay edge', () => {
        expect(
            projectVectorToEdge(160, 40, 100, 100, 80, 60)
        ).toEqual({
            x: 180,
            y: 120,
            edge: 'right',
        })

        expect(
            projectVectorToEdge(-30, -120, 100, 100, 80, 60)
        ).toEqual({
            x: 85,
            y: 40,
            edge: 'top',
        })

        expect(projectVectorToEdge(0, 0, 100, 100, 80, 60)).toBeNull()
    })
})
