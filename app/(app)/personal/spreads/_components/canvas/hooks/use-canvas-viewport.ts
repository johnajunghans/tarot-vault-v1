'use client'

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    DEFAULT_ZOOM,
    clampZoom,
    getSteppedZoom,
    normalizeZoom,
} from '../helpers/zoom'
import {
    getCanvasViewportRect,
    getClampedPanForZoomAnchor,
    getMinZoomForViewport,
    getPanForCanvasPoint,
    clampPan,
} from '../helpers/viewport'
import { useLatestRef } from '@/hooks/use-latest-ref'
import { CANVAS_CENTER } from '../../../_helpers/layout'
import type {
    SpreadCanvasHandle,
    SpreadCanvasViewportRequest,
} from '../types'

const WHEEL_DELTA_LINE_PX = 16
const WHEEL_ZOOM_SENSITIVITY = 0.005
const VIEWPORT_FIT_PADDING = 48
const ZOOM_INTERACTION_IDLE_MS = 120
const CARD_SELECTION_SUPPRESS_MS = 250
const SCROLLBAR_IDLE_MS = 1500
const CARD_INTERACTION_SELECTOR = '[data-spread-card-interactive="true"]'

interface WebKitGestureEvent extends Event {
    scale?: number
    clientX?: number
    clientY?: number
}

interface UseCanvasViewportArgs {
    svgWidth: number
    svgHeight: number
    viewportRequest?: SpreadCanvasViewportRequest | null
    onZoomDisplayChange?: (zoom: number) => void
    onZoomBoundsChange?: (minZoom: number) => void
    isMarqueeActiveRef: { current: boolean }
}

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
    let nextZoom = DEFAULT_ZOOM
    let contentX = CANVAS_CENTER.x
    let contentY = CANVAS_CENTER.y

    if (viewportRequest.type === 'fit-spread') {
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

export function useCanvasViewport({
    svgWidth,
    svgHeight,
    viewportRequest,
    onZoomDisplayChange,
    onZoomBoundsChange,
    isMarqueeActiveRef,
}: UseCanvasViewportArgs) {
    const containerRef = useRef<HTMLDivElement>(null)

    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
    const [zoom, setZoom] = useState(DEFAULT_ZOOM)
    const [isZoomInteractionActive, setIsZoomInteractionActive] = useState(false)
    const [isScrollbarActive, setIsScrollbarActive] = useState(false)

    const containerSizeRef = useRef({ width: 0, height: 0 })
    const renderedZoomRef = useRef(DEFAULT_ZOOM)
    const targetZoomRef = useRef(DEFAULT_ZOOM)
    const targetPanRef = useRef({ x: 0, y: 0 })
    const pendingViewportCommitRef = useRef<{
        zoom: number
        pan: { x: number; y: number }
        shouldFlagInteraction: boolean
        viewportRequestKey: string | null
    } | null>(null)
    const panFrameRef = useRef(0)
    const viewportFrameRef = useRef(0)
    const panRef = useRef({ x: 0, y: 0 })
    const zoomInteractionTimeoutRef = useRef<number | null>(null)
    const appliedViewportRequestKeyRef = useRef<string | null>(null)
    const scheduledViewportRequestKeyRef = useRef<string | null>(null)
    const onZoomDisplayChangeRef = useLatestRef(onZoomDisplayChange)
    const onZoomBoundsChangeRef = useLatestRef(onZoomBoundsChange)
    const reportedMinZoomRef = useRef<number | null>(null)
    const suppressCardSelectionUntilRef = useRef(0)
    const scrollbarIdleTimeoutRef = useRef<number | null>(null)
    const pinchStateRef = useRef<{
        distance: number
        midpointX: number
        midpointY: number
    } | null>(null)
    const safariGestureStateRef = useRef<{
        startZoom: number
        clientX: number
        clientY: number
    } | null>(null)
    const isSpaceHeld = useRef(false)
    const isPanning = useRef(false)
    const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

    const isCardInteractionTarget = useCallback((target: EventTarget | null) => {
        return target instanceof Element
            ? target.closest(CARD_INTERACTION_SELECTOR) !== null
            : false
    }, [])

    const syncContainerSize = useCallback(() => {
        const container = containerRef.current
        if (!container) return
        const { clientWidth, clientHeight } = container
        containerSizeRef.current = { width: clientWidth, height: clientHeight }
        setContainerSize((prev) =>
            prev.width === clientWidth && prev.height === clientHeight
                ? prev
                : { width: clientWidth, height: clientHeight }
        )
    }, [])

    const setZoomInteractionActiveForFrame = useCallback(() => {
        setIsZoomInteractionActive(true)

        if (zoomInteractionTimeoutRef.current !== null) {
            window.clearTimeout(zoomInteractionTimeoutRef.current)
        }

        zoomInteractionTimeoutRef.current = window.setTimeout(() => {
            setIsZoomInteractionActive(false)
            zoomInteractionTimeoutRef.current = null
        }, ZOOM_INTERACTION_IDLE_MS)
    }, [])

    const setScrollbarActiveForFrame = useCallback(() => {
        setIsScrollbarActive(true)

        if (scrollbarIdleTimeoutRef.current !== null) {
            window.clearTimeout(scrollbarIdleTimeoutRef.current)
        }

        scrollbarIdleTimeoutRef.current = window.setTimeout(() => {
            setIsScrollbarActive(false)
            scrollbarIdleTimeoutRef.current = null
        }, SCROLLBAR_IDLE_MS)
    }, [])

    const suppressCardSelection = useCallback(() => {
        suppressCardSelectionUntilRef.current =
            Date.now() + CARD_SELECTION_SUPPRESS_MS
    }, [])

    useEffect(() => {
        return () => {
            if (viewportFrameRef.current !== 0) {
                window.cancelAnimationFrame(viewportFrameRef.current)
            }
            if (panFrameRef.current !== 0) {
                window.cancelAnimationFrame(panFrameRef.current)
            }
            if (zoomInteractionTimeoutRef.current !== null) {
                window.clearTimeout(zoomInteractionTimeoutRef.current)
            }
            if (scrollbarIdleTimeoutRef.current !== null) {
                window.clearTimeout(scrollbarIdleTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let frame = 0

        const scheduleSync = () => {
            if (frame !== 0) return

            frame = window.requestAnimationFrame(() => {
                frame = 0
                syncContainerSize()
            })
        }

        scheduleSync()

        const observer = new ResizeObserver(scheduleSync)
        observer.observe(container)

        return () => {
            observer.disconnect()
            if (frame !== 0) {
                window.cancelAnimationFrame(frame)
            }
        }
    }, [syncContainerSize])

    const getViewportSnapshot = useCallback(() => {
        const size = containerSizeRef.current

        if (
            pendingViewportCommitRef.current ||
            targetZoomRef.current !== renderedZoomRef.current
        ) {
            return {
                panX: targetPanRef.current.x,
                panY: targetPanRef.current.y,
                zoom: targetZoomRef.current,
                clientWidth: size.width,
                clientHeight: size.height,
            }
        }

        return {
            panX: panRef.current.x,
            panY: panRef.current.y,
            zoom: renderedZoomRef.current,
            clientWidth: size.width,
            clientHeight: size.height,
        }
    }, [])

    const getMinimumZoom = useCallback(
        (width = containerSizeRef.current.width, height = containerSizeRef.current.height) =>
            getMinZoomForViewport({
                canvasWidth: svgWidth,
                canvasHeight: svgHeight,
                clientWidth: width,
                clientHeight: height,
            }),
        [svgHeight, svgWidth]
    )

    useEffect(() => {
        if (containerSize.width <= 0 || containerSize.height <= 0) return

        const minZoom = getMinimumZoom(containerSize.width, containerSize.height)
        if (reportedMinZoomRef.current === minZoom) return

        reportedMinZoomRef.current = minZoom
        onZoomBoundsChangeRef.current?.(minZoom)
    }, [
        containerSize.height,
        containerSize.width,
        getMinimumZoom,
        onZoomBoundsChangeRef,
    ])

    const flushViewportCommit = useCallback(() => {
        viewportFrameRef.current = 0
        const pending = pendingViewportCommitRef.current
        pendingViewportCommitRef.current = null
        if (!pending) return

        if (pending.shouldFlagInteraction) {
            setZoomInteractionActiveForFrame()
        }

        panRef.current = pending.pan
        targetPanRef.current = pending.pan
        targetZoomRef.current = pending.zoom
        renderedZoomRef.current = pending.zoom

        if (pending.viewportRequestKey) {
            appliedViewportRequestKeyRef.current = pending.viewportRequestKey
            scheduledViewportRequestKeyRef.current = null
        }

        setPan(pending.pan)
        setZoom(pending.zoom)
        onZoomDisplayChangeRef.current?.(pending.zoom)
        setScrollbarActiveForFrame()
    }, [
        onZoomDisplayChangeRef,
        setScrollbarActiveForFrame,
        setZoomInteractionActiveForFrame,
    ])

    const scheduleViewportCommit = useCallback(
        (
            nextZoom: number,
            nextPan: { x: number; y: number },
            shouldFlagInteraction: boolean,
            viewportRequestKey: string | null = null
        ) => {
            targetZoomRef.current = nextZoom
            targetPanRef.current = nextPan
            if (viewportRequestKey) {
                scheduledViewportRequestKeyRef.current = viewportRequestKey
            } else if (pendingViewportCommitRef.current?.viewportRequestKey) {
                scheduledViewportRequestKeyRef.current = null
            }
            pendingViewportCommitRef.current = {
                zoom: nextZoom,
                pan: nextPan,
                shouldFlagInteraction,
                viewportRequestKey,
            }

            if (viewportFrameRef.current !== 0) return

            viewportFrameRef.current = window.requestAnimationFrame(
                flushViewportCommit
            )
        },
        [flushViewportCommit]
    )

    const setZoomAroundViewportPoint = useCallback(
        ({
            nextZoom,
            anchorViewportX,
            anchorViewportY,
            targetViewportX = anchorViewportX,
            targetViewportY = anchorViewportY,
            shouldFlagInteraction,
        }: {
            nextZoom: number
            anchorViewportX: number
            anchorViewportY: number
            targetViewportX?: number
            targetViewportY?: number
            shouldFlagInteraction: boolean
        }) => {
            const currentViewport = getViewportSnapshot()
            const minimumZoom = getMinimumZoom(
                currentViewport.clientWidth,
                currentViewport.clientHeight
            )
            const normalizedZoom = normalizeZoom(nextZoom, minimumZoom)

            const nextPan = getClampedPanForZoomAnchor({
                panX: currentViewport.panX,
                panY: currentViewport.panY,
                anchorViewportX,
                anchorViewportY,
                targetViewportX,
                targetViewportY,
                fromZoom: currentViewport.zoom,
                toZoom: normalizedZoom,
                clientWidth: currentViewport.clientWidth,
                clientHeight: currentViewport.clientHeight,
                canvasWidth: svgWidth,
                canvasHeight: svgHeight,
            })

            if (
                normalizedZoom === currentViewport.zoom &&
                nextPan.x === currentViewport.panX &&
                nextPan.y === currentViewport.panY
            ) {
                return
            }

            scheduleViewportCommit(normalizedZoom, nextPan, shouldFlagInteraction)
        },
        [getMinimumZoom, getViewportSnapshot, scheduleViewportCommit, svgHeight, svgWidth]
    )

    useLayoutEffect(() => {
        renderedZoomRef.current = zoom
        panRef.current = pan
    }, [zoom, pan])

    useEffect(() => {
        if (!viewportRequest) return
        const { width: clientWidth, height: clientHeight } = containerSizeRef.current

        if (clientWidth <= 0 || clientHeight <= 0) return
        const minimumZoom = getMinimumZoom(clientWidth, clientHeight)

        if (
            !shouldApplyViewportRequest(
                viewportRequest,
                appliedViewportRequestKeyRef.current,
                scheduledViewportRequestKeyRef.current
            )
        ) {
            return
        }

        const resolvedViewport = resolveViewportRequest({
            viewportRequest,
            clientWidth,
            clientHeight,
            svgWidth,
            svgHeight,
            minimumZoom,
        })

        scheduleViewportCommit(
            resolvedViewport.zoom,
            resolvedViewport.pan,
            false,
            viewportRequest.key
        )
    }, [
        containerSize.height,
        containerSize.width,
        getMinimumZoom,
        scheduleViewportCommit,
        svgHeight,
        svgWidth,
        viewportRequest,
    ])

    useEffect(() => {
        const { width, height } = containerSizeRef.current
        if (width <= 0 || height <= 0) return

        const currentViewport = getViewportSnapshot()
        const minimumZoom = getMinimumZoom(width, height)
        const reconciledViewport = reconcileViewportBounds({
            panX: currentViewport.panX,
            panY: currentViewport.panY,
            zoom: currentViewport.zoom,
            clientWidth: width,
            clientHeight: height,
            svgWidth,
            svgHeight,
            minimumZoom,
        })

        if (
            reconciledViewport.zoom === currentViewport.zoom &&
            reconciledViewport.pan.x === currentViewport.panX &&
            reconciledViewport.pan.y === currentViewport.panY
        ) {
            return
        }

        scheduleViewportCommit(
            reconciledViewport.zoom,
            reconciledViewport.pan,
            false
        )
    }, [
        containerSize.height,
        containerSize.width,
        getMinimumZoom,
        getViewportSnapshot,
        scheduleViewportCommit,
        svgHeight,
        svgWidth,
    ])

    const schedulePanUpdate = useCallback(
        (nextPan: { x: number; y: number }) => {
            panRef.current = nextPan
            targetPanRef.current = nextPan
            setScrollbarActiveForFrame()
            if (panFrameRef.current !== 0) return
            panFrameRef.current = window.requestAnimationFrame(() => {
                panFrameRef.current = 0
                setPan({ ...panRef.current })
            })
        },
        [setScrollbarActiveForFrame]
    )

    const getClampedPan = useCallback(
        (rawX: number, rawY: number) => {
            const size = containerSizeRef.current
            const currentZoom = Math.max(
                targetZoomRef.current,
                getMinimumZoom(size.width, size.height)
            )
            return clampPan({
                panX: rawX,
                panY: rawY,
                canvasWidth: svgWidth,
                canvasHeight: svgHeight,
                viewportWidth: size.width / currentZoom,
                viewportHeight: size.height / currentZoom,
            })
        },
        [getMinimumZoom, svgHeight, svgWidth]
    )

    const viewportDimensions = useMemo(
        () => ({
            width: containerSize.width > 0 ? containerSize.width / zoom : svgWidth,
            height: containerSize.height > 0 ? containerSize.height / zoom : svgHeight,
        }),
        [containerSize.height, containerSize.width, svgHeight, svgWidth, zoom]
    )

    const handleScrollbarPan = useCallback(
        (nextPan: { x: number; y: number }) => {
            const clamped = getClampedPan(nextPan.x, nextPan.y)
            schedulePanUpdate(clamped)
        },
        [getClampedPan, schedulePanUpdate]
    )

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let touchPanState: { x: number; y: number; panX: number; panY: number } | null =
            null

        const normalizeWheelDelta = (e: WheelEvent) => {
            if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
                return e.deltaY * WHEEL_DELTA_LINE_PX
            }
            if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
                return e.deltaY * containerSizeRef.current.height
            }
            return e.deltaY
        }

        const normalizeWheelDeltaX = (e: WheelEvent) => {
            if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
                return e.deltaX * WHEEL_DELTA_LINE_PX
            }
            if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
                return e.deltaX * containerSizeRef.current.width
            }
            return e.deltaX
        }

        const handleWheel = (e: WheelEvent) => {
            if (safariGestureStateRef.current) return

            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                const rect = container.getBoundingClientRect()
                const delta = normalizeWheelDelta(e)
                const scaleFactor = Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY)

                setZoomAroundViewportPoint({
                    nextZoom: targetZoomRef.current * scaleFactor,
                    anchorViewportX: e.clientX - rect.left,
                    anchorViewportY: e.clientY - rect.top,
                    shouldFlagInteraction: true,
                })
            } else {
                e.preventDefault()
                const currentZoom = targetZoomRef.current
                const dx = normalizeWheelDeltaX(e) / currentZoom
                const dy = normalizeWheelDelta(e) / currentZoom
                const current = panRef.current
                const next = getClampedPan(current.x + dx, current.y + dy)
                schedulePanUpdate(next)
            }
        }

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
                    shouldFlagInteraction: true,
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

        const clearTouchState = () => {
            if (pinchStateRef.current) {
                suppressCardSelection()
            }
            pinchStateRef.current = null
            touchPanState = null
        }

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
                shouldFlagInteraction: true,
            })

            safariGestureStateRef.current = {
                ...gesture,
                clientX,
                clientY,
            }
        }

        const clearSafariGestureState = () => {
            suppressCardSelection()
            safariGestureStateRef.current = null
        }

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
            container.removeEventListener('wheel', handleWheel)
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', clearTouchState)
            container.removeEventListener('touchcancel', clearTouchState)
            container.removeEventListener('gesturestart', handleSafariGestureStart)
            container.removeEventListener(
                'gesturechange',
                handleSafariGestureChange
            )
            container.removeEventListener('gestureend', clearSafariGestureState)
        }
    }, [
        getClampedPan,
        isCardInteractionTarget,
        isMarqueeActiveRef,
        schedulePanUpdate,
        setZoomAroundViewportPoint,
        suppressCardSelection,
    ])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code !== 'Space') return
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
            e.preventDefault()
            isSpaceHeld.current = true
            container.style.cursor = 'grab'
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code !== 'Space') return
            isSpaceHeld.current = false
            isPanning.current = false
            container.style.cursor = ''
        }

        const handleMouseDown = (e: MouseEvent) => {
            if (!isSpaceHeld.current) return
            isPanning.current = true
            container.style.cursor = 'grabbing'
            panStart.current = {
                x: e.clientX,
                y: e.clientY,
                panX: panRef.current.x,
                panY: panRef.current.y,
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanning.current) return
            const currentZoom = targetZoomRef.current
            const dx = (e.clientX - panStart.current.x) / currentZoom
            const dy = (e.clientY - panStart.current.y) / currentZoom
            const next = getClampedPan(
                panStart.current.panX - dx,
                panStart.current.panY - dy
            )
            schedulePanUpdate(next)
        }

        const handleMouseUp = () => {
            if (!isPanning.current) return
            isPanning.current = false
            container.style.cursor = isSpaceHeld.current ? 'grab' : ''
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        container.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            container.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [getClampedPan, schedulePanUpdate])

    const imperativeHandle = useMemo<SpreadCanvasHandle>(
        () => ({
            getZoom: () => targetZoomRef.current,
            resetZoom: () => {
                const size = containerSizeRef.current
                setZoomAroundViewportPoint({
                    nextZoom: DEFAULT_ZOOM,
                    anchorViewportX: size.width / 2,
                    anchorViewportY: size.height / 2,
                    shouldFlagInteraction: true,
                })
            },
            setZoom: (nextZoom: number) => {
                const size = containerSizeRef.current
                setZoomAroundViewportPoint({
                    nextZoom,
                    anchorViewportX: size.width / 2,
                    anchorViewportY: size.height / 2,
                    shouldFlagInteraction: true,
                })
            },
            zoomIn: () => {
                const size = containerSizeRef.current
                setZoomAroundViewportPoint({
                    nextZoom: getSteppedZoom(
                        targetZoomRef.current,
                        'in',
                        getMinimumZoom(size.width, size.height)
                    ),
                    anchorViewportX: size.width / 2,
                    anchorViewportY: size.height / 2,
                    shouldFlagInteraction: true,
                })
            },
            zoomOut: () => {
                const size = containerSizeRef.current
                setZoomAroundViewportPoint({
                    nextZoom: getSteppedZoom(
                        targetZoomRef.current,
                        'out',
                        getMinimumZoom(size.width, size.height)
                    ),
                    anchorViewportX: size.width / 2,
                    anchorViewportY: size.height / 2,
                    shouldFlagInteraction: true,
                })
            },
        }),
        [getMinimumZoom, setZoomAroundViewportPoint]
    )

    const isCardSelectionSuppressed = useCallback(
        () =>
            pinchStateRef.current !== null ||
            safariGestureStateRef.current !== null ||
            Date.now() < suppressCardSelectionUntilRef.current,
        []
    )

    const viewBox = useMemo(
        () =>
            `${pan.x} ${pan.y} ${
                containerSize.width > 0 ? containerSize.width / zoom : svgWidth
            } ${
                containerSize.height > 0 ? containerSize.height / zoom : svgHeight
            }`,
        [containerSize.height, containerSize.width, pan.x, pan.y, svgHeight, svgWidth, zoom]
    )

    return {
        containerRef,
        containerSize,
        pan,
        zoom,
        viewBox,
        viewportDimensions,
        isZoomInteractionActive,
        isScrollbarActive,
        handleScrollbarPan,
        imperativeHandle,
        isCardSelectionSuppressed,
        isSpaceHeldRef: isSpaceHeld,
    }
}

export {
    reconcileViewportBounds,
    resolveViewportRequest,
    shouldApplyViewportRequest,
}
