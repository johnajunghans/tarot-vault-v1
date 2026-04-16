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
    getSteppedZoom,
    normalizeZoom,
} from './zoom/zoom'
import {
    getClampedPanForZoomAnchor,
    getMinZoomForViewport,
    clampPan,
} from './viewport'
import {
    resolveViewportRequest,
    shouldApplyViewportRequest,
} from './viewport-request'
import { reconcileViewportBounds } from './viewport-state'
import { useLatestRef } from '@/hooks/use-latest-ref'
import { useCanvasSpacePan } from './use-canvas-space-pan'
import { useCanvasViewportGestures } from './use-canvas-viewport-gestures'
import type {
    SpreadCanvasHandle,
    SpreadCanvasViewportRequest,
} from '../types'

const ZOOM_INTERACTION_IDLE_MS = 120
const CARD_SELECTION_SUPPRESS_MS = 250
const SCROLLBAR_IDLE_MS = 1500

interface UseCanvasViewportArgs {
    svgWidth: number
    svgHeight: number
    viewportRequest?: SpreadCanvasViewportRequest | null
    onZoomDisplayChange?: (zoom: number) => void
    onZoomBoundsChange?: (minZoom: number) => void
    isMarqueeActiveRef: { current: boolean }
}

// Owns the canvas viewport state machine: pan/zoom state, container sizing,
// viewport request application, and the imperative controls used by the canvas
// toolbar. Lower-level input handling is delegated to focused sub-hooks.
export function useCanvasViewport({
    svgWidth,
    svgHeight,
    viewportRequest,
    onZoomDisplayChange,
    onZoomBoundsChange,
    isMarqueeActiveRef,
}: UseCanvasViewportArgs) {
    // ------------ STATE AND REFS ------------ //

    // The container ref anchors all viewport measurements and raw DOM listeners.
    const containerRef = useRef<HTMLDivElement>(null)

    // React state drives rendering and viewport-adjacent UI.
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
    const [zoom, setZoom] = useState(DEFAULT_ZOOM)
    const [isZoomInteractionActive, setIsZoomInteractionActive] = useState(false)
    const [isScrollbarActive, setIsScrollbarActive] = useState(false)

    // Refs hold the current and target viewport values plus transient gesture
    // metadata without rerendering on every frame.
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

    // ------------ CONTAINER METRICS ------------ //

    // Read the current container dimensions into both a ref and state so the
    // viewport engine and render layer can consume them efficiently.
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

    // Zoom-heavy interactions temporarily disable expensive card effects so the
    // canvas stays responsive.
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

    // Scrollbars remain visible briefly after any viewport movement.
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

    // Pinch and gesture zooms should suppress click selection briefly so the
    // end of the gesture is not mistaken for a card click.
    const suppressCardSelection = useCallback(() => {
        suppressCardSelectionUntilRef.current =
            Date.now() + CARD_SELECTION_SUPPRESS_MS
    }, [])

    // Clean up any queued animation frames or timers when the hook unmounts.
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

    // Track live container size changes so min zoom, bounds reconciliation, and
    // viewBox calculations stay correct.
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

    // ------------ VIEWPORT CORE ------------ //

    // Read a consistent snapshot of the viewport, preferring queued/target
    // values when a commit is already in flight.
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

    // The minimum zoom depends on canvas size and the measured container.
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

    // Notify the outer UI whenever the effective minimum zoom changes.
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

    // Apply the latest queued viewport commit once per animation frame.
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

    // Queue a pan/zoom update into the shared viewport commit pipeline.
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

    // Zoom around a specific viewport point while keeping that point anchored to
    // the same canvas content whenever possible.
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

    // Keep the render-time refs synchronized with committed React state.
    useLayoutEffect(() => {
        renderedZoomRef.current = zoom
        panRef.current = pan
    }, [zoom, pan])

    // ------------ EXTERNAL VIEWPORT SYNC ------------ //

    // Apply declarative viewport requests from parent components, such as
    // fitting a loaded spread or centering the empty canvas.
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

    // Reconcile the viewport whenever container geometry changes so pan/zoom
    // remains valid after resize.
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

    // ------------ PAN HELPERS ------------ //

    // Scrollbar and gesture panning use a lightweight RAF path that only
    // updates `pan`, not the full viewport commit pipeline.
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

    // Clamp arbitrary pan values against the current container size and minimum
    // zoom constraints.
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

    // The visible canvas dimensions in canvas-space coordinates.
    const viewportDimensions = useMemo(
        () => ({
            width: containerSize.width > 0 ? containerSize.width / zoom : svgWidth,
            height: containerSize.height > 0 ? containerSize.height / zoom : svgHeight,
        }),
        [containerSize.height, containerSize.width, svgHeight, svgWidth, zoom]
    )

    // Scrollbar drags feed through the same clamped pan update path as other
    // viewport movement.
    const handleScrollbarPan = useCallback(
        (nextPan: { x: number; y: number }) => {
            const clamped = getClampedPan(nextPan.x, nextPan.y)
            schedulePanUpdate(clamped)
        },
        [getClampedPan, schedulePanUpdate]
    )

    // ------------ INPUT SUB-HOOKS ------------ //

    // Native wheel/touch/pinch gestures update the shared viewport engine
    // through this extracted hook.
    useCanvasViewportGestures({
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
    })

    // Spacebar + mouse drag panning stays separate from gesture handling.
    const { isSpaceHeldRef } = useCanvasSpacePan({
        containerRef,
        targetZoomRef,
        panRef,
        getClampedPan,
        schedulePanUpdate,
    })

    // ------------ IMPERATIVE CONTROLS ------------ //

    // The canvas toolbar controls talk to the viewport through this imperative
    // handle, which always zooms relative to the current viewport center.
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

    // Selection hooks use this to ignore click selection while zoom gestures are
    // active or immediately after they end.
    const isCardSelectionSuppressed = useCallback(
        () =>
            pinchStateRef.current !== null ||
            safariGestureStateRef.current !== null ||
            Date.now() < suppressCardSelectionUntilRef.current,
        []
    )

    // SVG `viewBox` derived from the committed pan/zoom state.
    const viewBox = useMemo(
        () =>
            `${pan.x} ${pan.y} ${
                containerSize.width > 0 ? containerSize.width / zoom : svgWidth
            } ${
                containerSize.height > 0 ? containerSize.height / zoom : svgHeight
            }`,
        [containerSize.height, containerSize.width, pan.x, pan.y, svgHeight, svgWidth, zoom]
    )

    // ------------ PUBLIC API ------------ //

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
        isSpaceHeldRef,
    }
}
