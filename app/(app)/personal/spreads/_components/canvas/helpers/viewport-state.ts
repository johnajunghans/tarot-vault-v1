'use client'

import {
    clampPan,
    getCanvasViewportRect,
    getPanForCanvasPoint,
} from './viewport'
import { normalizeZoom } from './zoom'

// ------------ VIEWPORT RECONCILIATION ------------ //

// Normalize zoom and clamp pan so the viewport always stays within the canvas
// bounds after resize or other external geometry changes.
function reconcileViewportBounds({
    panX,
    panY,
    zoom,
    clientWidth,
    clientHeight,
    svgWidth,
    svgHeight,
    minimumZoom,
}: {
    panX: number
    panY: number
    zoom: number
    clientWidth: number
    clientHeight: number
    svgWidth: number
    svgHeight: number
    minimumZoom: number
}) {
    // First clamp the viewport using the requested zoom level or the minimum
    // zoom required by the current container size.
    const nextZoom = normalizeZoom(zoom, minimumZoom)
    let nextPan = clampPan({
        panX,
        panY,
        canvasWidth: svgWidth,
        canvasHeight: svgHeight,
        viewportWidth: clientWidth / nextZoom,
        viewportHeight: clientHeight / nextZoom,
    })

    if (nextZoom !== zoom) {
        // When zoom must change, preserve the previous viewport center rather
        // than jumping to the top-left corner of the clamped range.
        const viewportRect = getCanvasViewportRect({
            panX,
            panY,
            clientWidth,
            clientHeight,
            zoom,
        })
        const centeredPan = getPanForCanvasPoint({
            contentX: viewportRect.centerX,
            contentY: viewportRect.centerY,
            viewportX: clientWidth / 2,
            viewportY: clientHeight / 2,
            zoom: nextZoom,
        })

        nextPan = clampPan({
            panX: centeredPan.x,
            panY: centeredPan.y,
            canvasWidth: svgWidth,
            canvasHeight: svgHeight,
            viewportWidth: clientWidth / nextZoom,
            viewportHeight: clientHeight / nextZoom,
        })
    }

    return {
        zoom: nextZoom,
        pan: nextPan,
    }
}

export { reconcileViewportBounds }
