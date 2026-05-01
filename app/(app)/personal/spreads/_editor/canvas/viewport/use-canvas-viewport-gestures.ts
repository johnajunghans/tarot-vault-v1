'use client'

import { useEffect } from 'react'

const WHEEL_DELTA_LINE_PX = 16
const WHEEL_ZOOM_SENSITIVITY = 0.005
const CARD_INTERACTION_SELECTOR = '[data-spread-card-interactive="true"]'

interface WebKitGestureEvent extends Event {
    scale?: number
    clientX?: number
    clientY?: number
}

interface PinchState {
    distance: number
    midpointX: number
    midpointY: number
}

interface SafariGestureState {
    startZoom: number
    clientX: number
    clientY: number
}

interface UseCanvasViewportGesturesArgs {
    containerRef: { current: HTMLDivElement | null }
    containerSizeRef: { current: { width: number; height: number } }
    targetZoomRef: { current: number }
    panRef: { current: { x: number; y: number } }
    isMarqueeActiveRef: { current: boolean }
    pinchStateRef: { current: PinchState | null }
    safariGestureStateRef: { current: SafariGestureState | null }
    getClampedPan: (rawX: number, rawY: number) => { x: number; y: number }
    schedulePanUpdate: (nextPan: { x: number; y: number }) => void
    setZoomAroundViewportPoint: (args: {
        nextZoom: number
        anchorViewportX: number
        anchorViewportY: number
        targetViewportX?: number
        targetViewportY?: number
    }) => void
    suppressCardSelection: () => void
}

// Ignore wheel/touch panning when the pointer is interacting with a draggable
// card element instead of the canvas background.
function isCardInteractionTarget(target: EventTarget | null) {
    return target instanceof Element
        ? target.closest(CARD_INTERACTION_SELECTOR) !== null
        : false
}

// Normalize browser wheel deltas into pixels so zooming and panning behave
// consistently across delta modes.
function normalizeWheelDelta(
    e: WheelEvent,
    containerSizeRef: { current: { width: number; height: number } }
) {
    if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        return e.deltaY * WHEEL_DELTA_LINE_PX
    }
    if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        return e.deltaY * containerSizeRef.current.height
    }
    return e.deltaY
}

// Horizontal wheel deltas need the same normalization logic as vertical ones.
function normalizeWheelDeltaX(
    e: WheelEvent,
    containerSizeRef: { current: { width: number; height: number } }
) {
    if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        return e.deltaX * WHEEL_DELTA_LINE_PX
    }
    if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        return e.deltaX * containerSizeRef.current.width
    }
    return e.deltaX
}

// Attach wheel, touch, pinch, and Safari gesture listeners that drive viewport
// pan/zoom through the parent hook's shared commit pipeline.
export function useCanvasViewportGestures({
    containerRef,
    containerSizeRef,
    targetZoomRef,
    panRef,
    isMarqueeActiveRef,
    pinchStateRef,
    safariGestureStateRef,
    getClampedPan,
    schedulePanUpdate,
    setZoomAroundViewportPoint,
    suppressCardSelection,
}: UseCanvasViewportGesturesArgs) {
    // ------------ EVENT LIFECYCLE ------------ //

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // Single-touch panning is local to this effect, while pinch state lives
        // in refs shared with the parent hook for selection suppression.
        let touchPanState: { x: number; y: number; panX: number; panY: number } | null =
            null

        // Ctrl/cmd + wheel zooms around the pointer. Plain wheel input pans the
        // viewport in canvas coordinates.
        const handleWheel = (e: WheelEvent) => {
            if (safariGestureStateRef.current) return

            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                const rect = container.getBoundingClientRect()
                const delta = normalizeWheelDelta(e, containerSizeRef)
                const scaleFactor = Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY)

                setZoomAroundViewportPoint({
                    nextZoom: targetZoomRef.current * scaleFactor,
                    anchorViewportX: e.clientX - rect.left,
                    anchorViewportY: e.clientY - rect.top,
                })
            } else {
                e.preventDefault()
                const currentZoom = targetZoomRef.current
                const dx = normalizeWheelDeltaX(e, containerSizeRef) / currentZoom
                const dy = normalizeWheelDelta(e, containerSizeRef) / currentZoom
                const current = panRef.current
                const next = getClampedPan(current.x + dx, current.y + dy)
                schedulePanUpdate(next)
            }
        }

        // Two-finger touch starts a pinch gesture. One-finger touch starts
        // background panning only when not drawing a marquee or touching a card.
        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault()
                suppressCardSelection()
                touchPanState = null
                const touchA = e.touches[0]
                const touchB = e.touches[1]
                pinchStateRef.current = {
                    distance: Math.hypot(
                        touchA.clientX - touchB.clientX,
                        touchA.clientY - touchB.clientY
                    ),
                    midpointX: (touchA.clientX + touchB.clientX) / 2,
                    midpointY: (touchA.clientY + touchB.clientY) / 2,
                }
            } else if (
                e.touches.length === 1 &&
                !isMarqueeActiveRef.current &&
                !isCardInteractionTarget(e.target)
            ) {
                const touch = e.touches[0]
                touchPanState = {
                    x: touch.clientX,
                    y: touch.clientY,
                    panX: panRef.current.x,
                    panY: panRef.current.y,
                }
            }
        }

        // Pinch updates both zoom and midpoint anchoring. Single-touch movement
        // pans the viewport relative to the drag start snapshot.
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && pinchStateRef.current) {
                e.preventDefault()
                suppressCardSelection()
                touchPanState = null
                const touchA = e.touches[0]
                const touchB = e.touches[1]
                const distance = Math.hypot(
                    touchA.clientX - touchB.clientX,
                    touchA.clientY - touchB.clientY
                )
                const midpointX = (touchA.clientX + touchB.clientX) / 2
                const midpointY = (touchA.clientY + touchB.clientY) / 2
                const previousPinch = pinchStateRef.current
                const rect = container.getBoundingClientRect()
                const scale =
                    previousPinch.distance === 0
                        ? 1
                        : distance / previousPinch.distance

                setZoomAroundViewportPoint({
                    nextZoom: targetZoomRef.current * scale,
                    anchorViewportX: previousPinch.midpointX - rect.left,
                    anchorViewportY: previousPinch.midpointY - rect.top,
                    targetViewportX: midpointX - rect.left,
                    targetViewportY: midpointY - rect.top,
                })

                pinchStateRef.current = {
                    distance,
                    midpointX,
                    midpointY,
                }
            } else if (e.touches.length === 1 && touchPanState) {
                e.preventDefault()
                const touch = e.touches[0]
                const currentZoom = targetZoomRef.current
                const dx = (touch.clientX - touchPanState.x) / currentZoom
                const dy = (touch.clientY - touchPanState.y) / currentZoom
                const next = getClampedPan(
                    touchPanState.panX - dx,
                    touchPanState.panY - dy
                )
                schedulePanUpdate(next)
            }
        }

        // Ending touch or pinch clears the gesture bookkeeping and keeps card
        // selection suppressed briefly after pinch interactions.
        const clearTouchState = () => {
            if (pinchStateRef.current) {
                suppressCardSelection()
            }
            pinchStateRef.current = null
            touchPanState = null
        }

        // Safari exposes pinch gestures through its own non-standard gesture
        // events, so we translate them into the same viewport update pipeline.
        const handleSafariGestureStart = (event: Event) => {
            const e = event as WebKitGestureEvent
            e.preventDefault()
            suppressCardSelection()

            const rect = container.getBoundingClientRect()
            safariGestureStateRef.current = {
                startZoom: targetZoomRef.current,
                clientX: e.clientX ?? rect.left + rect.width / 2,
                clientY: e.clientY ?? rect.top + rect.height / 2,
            }
        }

        const handleSafariGestureChange = (event: Event) => {
            const e = event as WebKitGestureEvent
            const gesture = safariGestureStateRef.current
            if (!gesture) return
            if (!e.scale || e.scale <= 0) return
            e.preventDefault()
            suppressCardSelection()

            const rect = container.getBoundingClientRect()
            const clientX = e.clientX ?? gesture.clientX
            const clientY = e.clientY ?? gesture.clientY

            setZoomAroundViewportPoint({
                nextZoom: gesture.startZoom * e.scale,
                anchorViewportX: gesture.clientX - rect.left,
                anchorViewportY: gesture.clientY - rect.top,
                targetViewportX: clientX - rect.left,
                targetViewportY: clientY - rect.top,
            })

            safariGestureStateRef.current = {
                ...gesture,
                clientX,
                clientY,
            }
        }

        // Clearing the Safari gesture mirrors the touch-pinch cleanup behavior.
        const clearSafariGestureState = () => {
            suppressCardSelection()
            safariGestureStateRef.current = null
        }

        // Attach raw DOM listeners directly to the container because these
        // gestures are easier to manage outside React's synthetic event layer.
        container.addEventListener('wheel', handleWheel, { passive: false })
        container.addEventListener('touchstart', handleTouchStart, {
            passive: false,
        })
        container.addEventListener('touchmove', handleTouchMove, {
            passive: false,
        })
        container.addEventListener('touchend', clearTouchState)
        container.addEventListener('touchcancel', clearTouchState)
        container.addEventListener('gesturestart', handleSafariGestureStart)
        container.addEventListener('gesturechange', handleSafariGestureChange)
        container.addEventListener('gestureend', clearSafariGestureState)

        return () => {
            // Tear down every native listener when dependencies or the container
            // instance change.
            container.removeEventListener('wheel', handleWheel)
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', clearTouchState)
            container.removeEventListener('touchcancel', clearTouchState)
            container.removeEventListener('gesturestart', handleSafariGestureStart)
            container.removeEventListener('gesturechange', handleSafariGestureChange)
            container.removeEventListener('gestureend', clearSafariGestureState)
        }
    }, [
        containerRef,
        containerSizeRef,
        getClampedPan,
        isMarqueeActiveRef,
        panRef,
        pinchStateRef,
        safariGestureStateRef,
        schedulePanUpdate,
        setZoomAroundViewportPoint,
        suppressCardSelection,
        targetZoomRef,
    ])
}
