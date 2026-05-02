'use client'

export interface CanvasRect {
    left: number
    top: number
    right: number
    bottom: number
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
    getRect,
    getRectCenter,
    isRectFullyOutsideRect,
    projectVectorToEdge,
}
