'use client'

const DEFAULT_ZOOM = 1
const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.5
const ZOOM_STEP = 0.1
const ZOOM_STEP_EPSILON = 0.005

function clampZoom(value: number) {
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value))
}

function normalizeZoom(value: number) {
    const clampedZoom = clampZoom(Number(value.toFixed(4)))
    const nearestStepZoom = Math.round(clampedZoom / ZOOM_STEP) * ZOOM_STEP

    if (Math.abs(clampedZoom - nearestStepZoom) < ZOOM_STEP_EPSILON) {
        return clampZoom(nearestStepZoom)
    }

    return clampedZoom
}

export {
    DEFAULT_ZOOM,
    ZOOM_MIN,
    ZOOM_MAX,
    ZOOM_STEP,
    ZOOM_STEP_EPSILON,
    clampZoom,
    normalizeZoom,
}
