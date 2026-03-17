'use client'

const DEFAULT_ZOOM = 1
const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.5
const ZOOM_STEP = 0.1
const ZOOM_STEP_EPSILON = 0.005

function clampZoom(value: number, min = ZOOM_MIN, max = ZOOM_MAX) {
    return Math.max(min, Math.min(max, value))
}

function normalizeZoom(value: number, min = ZOOM_MIN, max = ZOOM_MAX) {
    const clampedZoom = clampZoom(Number(value.toFixed(4)), min, max)
    const nearestStepZoom = Math.round(clampedZoom / ZOOM_STEP) * ZOOM_STEP

    if (Math.abs(clampedZoom - nearestStepZoom) < ZOOM_STEP_EPSILON) {
        return clampZoom(nearestStepZoom, min, max)
    }

    return clampedZoom
}

function getSteppedZoom(
    value: number,
    direction: 'in' | 'out',
    min = ZOOM_MIN,
    max = ZOOM_MAX
) {
    const normalizedZoom = normalizeZoom(value, min, max)
    const stepIndex = normalizedZoom / ZOOM_STEP
    const nearestStep = Math.round(stepIndex)
    const isStepAligned = normalizedZoom === nearestStep * ZOOM_STEP

    if (direction === 'in') {
        const nextStep = isStepAligned ? nearestStep + 1 : Math.ceil(stepIndex)
        return clampZoom(nextStep * ZOOM_STEP, min, max)
    }

    const nextStep = isStepAligned ? nearestStep - 1 : Math.floor(stepIndex)
    return clampZoom(nextStep * ZOOM_STEP, min, max)
}

export {
    DEFAULT_ZOOM,
    ZOOM_MIN,
    ZOOM_MAX,
    ZOOM_STEP,
    ZOOM_STEP_EPSILON,
    clampZoom,
    getSteppedZoom,
    normalizeZoom,
}
