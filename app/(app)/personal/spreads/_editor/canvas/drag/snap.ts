'use client'

import { CANVAS_BOUNDS, GRID_SIZE } from '../../_lib'
import {
    clampToRange,
    getSnappedClampedPosition,
    snapToGrid,
} from '../_lib/geometry'
import type { CanvasPoint } from '../types'

// Snap + clamp helpers used by every drag surface (GSAP liveSnap on the card
// view and the commit-time updates produced by `useCanvasDrag`). Both sides
// must agree exactly, otherwise a card will visually jitter against the
// committed value, so they share one source of truth here.

// Snap + clamp a single axis value. Shaped to plug directly into GSAP
// `Draggable` `liveSnap` callbacks, which receive one axis at a time.
function snapClampAxis(
    value: number,
    axis: 'x' | 'y',
    bounds = CANVAS_BOUNDS,
    gridSize = GRID_SIZE
) {
    const snapped = snapToGrid(value, gridSize)
    return axis === 'x'
        ? clampToRange(snapped, bounds.minX, bounds.maxX)
        : clampToRange(snapped, bounds.minY, bounds.maxY)
}

// Snap + clamp a full (x, y) drag point. Used by `useCanvasDrag` at drag end
// and for group members that move relative to the dragged card.
function snapClampDragPoint(
    x: number,
    y: number,
    bounds = CANVAS_BOUNDS,
    gridSize = GRID_SIZE
): CanvasPoint {
    return getSnappedClampedPosition(x, y, bounds, gridSize)
}

export { snapClampAxis, snapClampDragPoint }
