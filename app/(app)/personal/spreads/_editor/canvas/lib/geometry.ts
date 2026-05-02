'use client'

import type { CanvasRect } from '@personal/_viewport/lib/geometry'

export {
    getRect,
    getRectCenter,
    isRectFullyOutsideRect,
    projectVectorToEdge,
} from '@personal/_viewport/lib/geometry'

interface CanvasBounds {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

function snapToGrid(value: number, gridSize: number) {
    return Math.round(value / gridSize) * gridSize
}

function clampToRange(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

function getSnappedClampedPosition(
    x: number,
    y: number,
    bounds: CanvasBounds,
    gridSize: number
) {
    return {
        x: clampToRange(snapToGrid(x, gridSize), bounds.minX, bounds.maxX),
        y: clampToRange(snapToGrid(y, gridSize), bounds.minY, bounds.maxY),
    }
}

function getCenteredCardPlacement(
    x: number,
    y: number,
    cardWidth: number,
    cardHeight: number,
    bounds: CanvasBounds,
    gridSize: number
) {
    const snappedX = snapToGrid(x, gridSize)
    const snappedY = snapToGrid(y, gridSize)
    const clampedX = clampToRange(
        snappedX - cardWidth / 2,
        bounds.minX,
        bounds.maxX
    )
    const clampedY = clampToRange(
        snappedY - cardHeight / 2,
        bounds.minY,
        bounds.maxY
    )

    return {
        x: snapToGrid(clampedX, gridSize),
        y: snapToGrid(clampedY, gridSize),
    }
}

function rectsIntersect(a: CanvasRect, b: CanvasRect) {
    return (
        a.right > b.left &&
        a.left < b.right &&
        a.bottom > b.top &&
        a.top < b.bottom
    )
}

export {
    clampToRange,
    getCenteredCardPlacement,
    getSnappedClampedPosition,
    rectsIntersect,
    snapToGrid,
}
