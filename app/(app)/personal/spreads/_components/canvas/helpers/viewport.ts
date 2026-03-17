'use client'

import { DEFAULT_ZOOM, ZOOM_MAX, ZOOM_MIN, normalizeZoom } from './zoom'

interface CanvasViewportInput {
    panX: number
    panY: number
    clientWidth: number
    clientHeight: number
    zoom: number
}

interface CanvasPointInput {
    panX: number
    panY: number
    viewportX: number
    viewportY: number
    zoom: number
}

interface CanvasPoint {
    x: number
    y: number
}

interface CanvasViewportRect {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
    centerX: number
    centerY: number
}

function getCanvasPointAtViewportPoint({
    panX,
    panY,
    viewportX,
    viewportY,
    zoom,
}: CanvasPointInput): CanvasPoint {
    const normalizedZoom = normalizeZoom(zoom || DEFAULT_ZOOM)

    return {
        x: panX + viewportX / normalizedZoom,
        y: panY + viewportY / normalizedZoom,
    }
}

function getPanForCanvasPoint({
    contentX,
    contentY,
    viewportX,
    viewportY,
    zoom,
}: {
    contentX: number
    contentY: number
    viewportX: number
    viewportY: number
    zoom: number
}) {
    const normalizedZoom = normalizeZoom(zoom || DEFAULT_ZOOM)

    return {
        x: contentX - viewportX / normalizedZoom,
        y: contentY - viewportY / normalizedZoom,
    }
}

function clampPan({
    panX,
    panY,
    canvasWidth,
    canvasHeight,
    viewportWidth,
    viewportHeight,
}: {
    panX: number
    panY: number
    canvasWidth: number
    canvasHeight: number
    viewportWidth: number
    viewportHeight: number
}) {
    const maxPanX = Math.max(canvasWidth - viewportWidth, 0)
    const maxPanY = Math.max(canvasHeight - viewportHeight, 0)

    return {
        x: Math.max(0, Math.min(maxPanX, panX)),
        y: Math.max(0, Math.min(maxPanY, panY)),
    }
}

function getMinZoomForViewport({
    canvasWidth,
    canvasHeight,
    clientWidth,
    clientHeight,
}: {
    canvasWidth: number
    canvasHeight: number
    clientWidth: number
    clientHeight: number
}) {
    const widthZoom = canvasWidth > 0 ? clientWidth / canvasWidth : 0
    const heightZoom = canvasHeight > 0 ? clientHeight / canvasHeight : 0

    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, widthZoom, heightZoom))
}

function getClampedPanForZoomAnchor({
    panX,
    panY,
    anchorViewportX,
    anchorViewportY,
    targetViewportX = anchorViewportX,
    targetViewportY = anchorViewportY,
    fromZoom,
    toZoom,
    clientWidth,
    clientHeight,
    canvasWidth,
    canvasHeight,
}: {
    panX: number
    panY: number
    anchorViewportX: number
    anchorViewportY: number
    targetViewportX?: number
    targetViewportY?: number
    fromZoom: number
    toZoom: number
    clientWidth: number
    clientHeight: number
    canvasWidth: number
    canvasHeight: number
}) {
    const normalizedToZoom = normalizeZoom(toZoom || DEFAULT_ZOOM)

    const { x: contentX, y: contentY } = getCanvasPointAtViewportPoint({
        panX,
        panY,
        viewportX: anchorViewportX,
        viewportY: anchorViewportY,
        zoom: fromZoom,
    })

    const newPan = getPanForCanvasPoint({
        contentX,
        contentY,
        viewportX: targetViewportX,
        viewportY: targetViewportY,
        zoom: toZoom,
    })

    return clampPan({
        panX: newPan.x,
        panY: newPan.y,
        canvasWidth,
        canvasHeight,
        viewportWidth: clientWidth / normalizedToZoom,
        viewportHeight: clientHeight / normalizedToZoom,
    })
}

function getCanvasViewportRect({
    panX,
    panY,
    clientWidth,
    clientHeight,
    zoom,
}: CanvasViewportInput): CanvasViewportRect {
    const normalizedZoom = normalizeZoom(zoom || DEFAULT_ZOOM)
    const width = clientWidth / normalizedZoom
    const height = clientHeight / normalizedZoom

    return {
        left: panX,
        top: panY,
        right: panX + width,
        bottom: panY + height,
        width,
        height,
        centerX: panX + width / 2,
        centerY: panY + height / 2,
    }
}

export {
    clampPan,
    getClampedPanForZoomAnchor,
    getCanvasPointAtViewportPoint,
    getMinZoomForViewport,
    getPanForCanvasPoint,
    getCanvasViewportRect,
}
