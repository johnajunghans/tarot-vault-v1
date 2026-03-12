'use client'

interface CanvasBounds {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

interface CanvasRect {
    left: number
    top: number
    right: number
    bottom: number
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

function getRect(
    x: number,
    y: number,
    width: number,
    height: number
): CanvasRect {
    return {
        left: x,
        top: y,
        right: x + width,
        bottom: y + height,
    }
}

function getRectCenter(rect: CanvasRect) {
    return {
        x: (rect.left + rect.right) / 2,
        y: (rect.top + rect.bottom) / 2,
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

function isRectFullyOutsideRect(a: CanvasRect, b: CanvasRect) {
    return (
        a.right <= b.left ||
        a.left >= b.right ||
        a.bottom <= b.top ||
        a.top >= b.bottom
    )
}

function projectVectorToEdge(
    dx: number,
    dy: number,
    centerX: number,
    centerY: number,
    maxOffsetX: number,
    maxOffsetY: number
) {
    const horizontalRatio = Math.abs(dx) / maxOffsetX
    const verticalRatio = Math.abs(dy) / maxOffsetY
    const useHorizontalEdge = horizontalRatio >= verticalRatio
    const limitingRatio = useHorizontalEdge ? horizontalRatio : verticalRatio

    if (!Number.isFinite(limitingRatio) || limitingRatio <= 0) return null

    const edge = useHorizontalEdge
        ? dx >= 0
            ? 'right'
            : 'left'
        : dy >= 0
          ? 'bottom'
          : 'top'

    return {
        x: centerX + dx / limitingRatio,
        y: centerY + dy / limitingRatio,
        edge,
    }
}

export {
    clampToRange,
    getCenteredCardPlacement,
    getRect,
    getRectCenter,
    getSnappedClampedPosition,
    isRectFullyOutsideRect,
    projectVectorToEdge,
    rectsIntersect,
    snapToGrid,
}
