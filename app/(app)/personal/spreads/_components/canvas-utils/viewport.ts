'use client'

import { DEFAULT_ZOOM, normalizeZoom } from './zoom'

interface CanvasViewportInput {
    scrollLeft: number
    scrollTop: number
    clientWidth: number
    clientHeight: number
    zoom: number
}

interface CanvasPointInput {
    scrollLeft: number
    scrollTop: number
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
    scrollLeft,
    scrollTop,
    viewportX,
    viewportY,
    zoom,
}: CanvasPointInput): CanvasPoint {
    const normalizedZoom = normalizeZoom(zoom || DEFAULT_ZOOM)

    return {
        x: (scrollLeft + viewportX) / normalizedZoom,
        y: (scrollTop + viewportY) / normalizedZoom,
    }
}

function getViewportScrollForCanvasPoint({
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
        left: contentX * normalizedZoom - viewportX,
        top: contentY * normalizedZoom - viewportY,
    }
}

function getCanvasViewportRect({
    scrollLeft,
    scrollTop,
    clientWidth,
    clientHeight,
    zoom,
}: CanvasViewportInput): CanvasViewportRect {
    const normalizedZoom = normalizeZoom(zoom || DEFAULT_ZOOM)
    const left = scrollLeft / normalizedZoom
    const top = scrollTop / normalizedZoom
    const width = clientWidth / normalizedZoom
    const height = clientHeight / normalizedZoom

    return {
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
        centerX: left + width / 2,
        centerY: top + height / 2,
    }
}

export {
    getCanvasPointAtViewportPoint,
    getViewportScrollForCanvasPoint,
    getCanvasViewportRect,
}
