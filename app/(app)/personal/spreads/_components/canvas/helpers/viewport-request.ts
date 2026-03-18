'use client'

import { DEFAULT_ZOOM, clampZoom, normalizeZoom } from './zoom'
import { CANVAS_CENTER } from '../../../_helpers/layout'
import type { SpreadCanvasViewportRequest } from '../types'
import { clampPan, getPanForCanvasPoint } from './viewport'

const VIEWPORT_FIT_PADDING = 48

// ------------ REQUEST DEDUPE ------------ //

// Ignore viewport requests that have already been applied or are already queued
// for the next animation-frame commit.
function shouldApplyViewportRequest(
    viewportRequest: SpreadCanvasViewportRequest | null | undefined,
    appliedViewportRequestKey: string | null,
    scheduledViewportRequestKey: string | null
) {
    if (!viewportRequest) return false
    if (appliedViewportRequestKey === viewportRequest.key) return false
    if (scheduledViewportRequestKey === viewportRequest.key) return false
    return true
}

// ------------ REQUEST RESOLUTION ------------ //

// Convert a declarative viewport request into the concrete zoom and pan values
// needed by the canvas viewport state machine.
function resolveViewportRequest({
    viewportRequest,
    clientWidth,
    clientHeight,
    svgWidth,
    svgHeight,
    minimumZoom,
}: {
    viewportRequest: SpreadCanvasViewportRequest
    clientWidth: number
    clientHeight: number
    svgWidth: number
    svgHeight: number
    minimumZoom: number
}) {
    // Default to the canvas center unless the request provides a more specific
    // zoom target.
    let nextZoom = DEFAULT_ZOOM
    let contentX = CANVAS_CENTER.x
    let contentY = CANVAS_CENTER.y

    if (viewportRequest.type === 'fit-spread') {
        // Fit the spread bounds into the viewport while respecting optional
        // padding and a caller-provided max zoom cap.
        const padding = viewportRequest.padding ?? VIEWPORT_FIT_PADDING
        const availableWidth = Math.max(clientWidth - padding * 2, 1)
        const availableHeight = Math.max(clientHeight - padding * 2, 1)
        const fitZoom = clampZoom(
            Math.min(
                availableWidth / Math.max(viewportRequest.bounds.width, 1),
                availableHeight / Math.max(viewportRequest.bounds.height, 1)
            )
        )

        nextZoom = normalizeZoom(
            Math.min(viewportRequest.maxZoom ?? DEFAULT_ZOOM, fitZoom),
            minimumZoom
        )
        contentX = viewportRequest.bounds.centerX
        contentY = viewportRequest.bounds.centerY
    } else {
        nextZoom = normalizeZoom(viewportRequest.zoom ?? DEFAULT_ZOOM, minimumZoom)
        contentX = viewportRequest.point.x
        contentY = viewportRequest.point.y
    }

    // Convert the resolved zoom target into a centered pan value, then clamp so
    // the viewport stays inside the virtual canvas.
    const normalizedNextZoom = normalizeZoom(nextZoom, minimumZoom)
    const rawPan = getPanForCanvasPoint({
        contentX,
        contentY,
        viewportX: clientWidth / 2,
        viewportY: clientHeight / 2,
        zoom: normalizedNextZoom,
    })

    return {
        zoom: normalizedNextZoom,
        pan: clampPan({
            panX: rawPan.x,
            panY: rawPan.y,
            canvasWidth: svgWidth,
            canvasHeight: svgHeight,
            viewportWidth: clientWidth / normalizedNextZoom,
            viewportHeight: clientHeight / normalizedNextZoom,
        }),
    }
}

export { resolveViewportRequest, shouldApplyViewportRequest }
