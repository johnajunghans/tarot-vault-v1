'use client'

import {
    forwardRef,
    memo,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import SpreadCard, { type CanvasCard } from './components/card'
import CanvasBackground from './components/background'
import CanvasGuides, { type CanvasGuide } from './components/guides'
import CanvasPointerOverlay from './components/pointer-overlay'
import { useTheme } from 'next-themes'
import {
    DEFAULT_ZOOM,
    clampZoom,
    getSteppedZoom,
    normalizeZoom,
} from './helpers/zoom'
import {
    getCenteredCardPlacement,
    getRect,
    getRectCenter,
    getSnappedClampedPosition,
    isRectFullyOutsideRect,
    projectVectorToEdge,
    rectsIntersect,
} from './helpers/geometry'
import {
    getCanvasViewportRect,
    getClampedPanForZoomAnchor,
    getPanForCanvasPoint,
    clampPan,
} from './helpers/viewport'
import {
    CANVAS_BOUNDS,
    CANVAS_CENTER,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    CARD_HEIGHT,
    CARD_WIDTH,
    GRID_SIZE,
    type SpreadBounds,
} from '../../spread-layout'

const WHEEL_DELTA_LINE_PX = 16
const WHEEL_ZOOM_SENSITIVITY = 0.005
const POINTER_EDGE_PADDING = 18
const POINTER_ICON_SIZE = 16
const VIEWPORT_FIT_PADDING = 48
const ZOOM_INTERACTION_IDLE_MS = 120
const CARD_INTERACTION_SELECTOR = '[data-spread-card-interactive="true"]'
const CARD_SELECTION_SUPPRESS_MS = 250

export type SpreadCanvasViewportRequest =
    | {
          key: string
          type: 'center-canvas-point'
          point: { x: number; y: number }
          zoom?: number
      }
    | {
          key: string
          type: 'fit-spread'
          bounds: SpreadBounds
          maxZoom?: number
          padding?: number
      }

export interface SpreadCanvasPositionUpdate {
    index: number
    x: number
    y: number
}

export interface SpreadCanvasHandle {
    getZoom: () => number
    resetZoom: () => void
    setZoom: (zoom: number) => void
    zoomIn: () => void
    zoomOut: () => void
}

interface SpreadCanvasProps {
    cards: CanvasCard[]
    cardKeys?: string[]
    rotationAngles?: number[]
    selectedCardIndex: number | null
    onCardSelect: (index: number | null) => void
    onCanvasDoubleClick?: (x: number, y: number) => void
    onPositionsCommit?: (updates: SpreadCanvasPositionUpdate[]) => void
    onZoomDisplayChange?: (zoom: number) => void
    isViewMode?: boolean
    viewportRequest?: SpreadCanvasViewportRequest | null
}

interface Point {
    x: number
    y: number
}

interface WebKitGestureEvent extends Event {
    scale?: number
    clientX?: number
    clientY?: number
}

type TransientPositions = Record<number, Point>

function areTransientPositionsEqual(
    prev: TransientPositions,
    next: TransientPositions
) {
    const prevKeys = Object.keys(prev)
    const nextKeys = Object.keys(next)

    if (prevKeys.length !== nextKeys.length) return false

    return nextKeys.every((key) => {
        const index = Number(key)
        return prev[index]?.x === next[index]?.x && prev[index]?.y === next[index]?.y
    })
}

function SpreadCanvasComponent(
    {
        cards,
        cardKeys,
        rotationAngles,
        selectedCardIndex,
        onCardSelect,
        onCanvasDoubleClick,
        onPositionsCommit,
        onZoomDisplayChange,
        isViewMode = false,
        viewportRequest,
    }: SpreadCanvasProps,
    ref: React.ForwardedRef<SpreadCanvasHandle>
) {
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const cardsLayerRef = useRef<SVGGElement>(null)
    const { resolvedTheme } = useTheme()

    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
    const [zoom, setZoom] = useState(DEFAULT_ZOOM)
    const [isZoomInteractionActive, setIsZoomInteractionActive] = useState(false)
    const [dragging, setDragging] = useState<{
        index: number
        x: number
        y: number
    } | null>(null)
    const [groupSelectedIndices, setGroupSelectedIndices] = useState<
        Set<number>
    >(new Set())
    const [marquee, setMarquee] = useState<{
        startX: number
        startY: number
        currentX: number
        currentY: number
    } | null>(null)
    const [transientPositions, setTransientPositions] = useState<TransientPositions>(
        {}
    )

    const themeBasedStyles = useMemo(
        () => ({
            containerBg: 'bg-[var(--canvas-bg)]',
            dragGridFill:
                resolvedTheme === 'dark' ? 'var(--gold)' : 'var(--foreground)',
            dragGridFillOpacity: resolvedTheme === 'dark' ? '0.3' : '0.7',
            ghostCardStrokeOpacity: resolvedTheme === 'dark' ? '0.4' : '0.8',
        }),
        [resolvedTheme]
    )

    const svgWidth = CANVAS_WIDTH
    const svgHeight = CANVAS_HEIGHT

    const transientPositionsRef = useRef<TransientPositions>({})
    const pendingTransientPositionsRef = useRef<TransientPositions | null>(null)
    const transientFrameRef = useRef(0)
    const effectiveCardsRef = useRef(cards)
    const draggingRef = useRef<{ index: number; x: number; y: number } | null>(null)
    const dragStartPos = useRef<Point | null>(null)
    const groupSelectedRef = useRef<Set<number>>(new Set())
    const groupDragOrigins = useRef<Map<number, Point>>(new Map())
    const cardGroupRefs = useRef<Map<number, SVGGElement>>(new Map())
    const isMarqueeActive = useRef(false)
    const marqueeStart = useRef({ x: 0, y: 0 })
    const isSpaceHeld = useRef(false)
    const isPanning = useRef(false)
    const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
    const panRef = useRef({ x: 0, y: 0 })
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
    const zoomInteractionTimeoutRef = useRef<number | null>(null)
    const appliedViewportRequestKeyRef = useRef<string | null>(null)
    const scheduledViewportRequestKeyRef = useRef<string | null>(null)
    const onZoomDisplayChangeRef = useRef(onZoomDisplayChange)
    const suppressCardSelectionUntilRef = useRef(0)
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

    const updateGroupSelection = useCallback((next: Set<number>) => {
        groupSelectedRef.current = next
        setGroupSelectedIndices(next)
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

    const effectiveCards = useMemo(
        () =>
            cards.map((card, index) => {
                const nextPosition = transientPositions[index]
                return nextPosition
                    ? { ...card, x: nextPosition.x, y: nextPosition.y }
                    : card
            }),
        [cards, transientPositions]
    )

    useEffect(() => {
        effectiveCardsRef.current = effectiveCards
    }, [effectiveCards])

    useEffect(() => {
        onZoomDisplayChangeRef.current = onZoomDisplayChange
    }, [onZoomDisplayChange])

    useEffect(() => {
        if (draggingRef.current) return
        if (Object.keys(transientPositionsRef.current).length === 0) return

        transientPositionsRef.current = {}
        pendingTransientPositionsRef.current = null
        const frame = window.requestAnimationFrame(() => {
            setTransientPositions({})
        })

        return () => {
            window.cancelAnimationFrame(frame)
        }
    }, [cards])

    useEffect(() => {
        return () => {
            if (transientFrameRef.current !== 0) {
                window.cancelAnimationFrame(transientFrameRef.current)
            }
            if (viewportFrameRef.current !== 0) {
                window.cancelAnimationFrame(viewportFrameRef.current)
            }
            if (panFrameRef.current !== 0) {
                window.cancelAnimationFrame(panFrameRef.current)
            }
            if (zoomInteractionTimeoutRef.current !== null) {
                window.clearTimeout(zoomInteractionTimeoutRef.current)
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

    const clientToSVG = useCallback((clientX: number, clientY: number) => {
        const svg = svgRef.current
        if (!svg) return { x: clientX, y: clientY }
        const ctm = svg.getScreenCTM()
        if (!ctm) return { x: clientX, y: clientY }
        const inv = ctm.inverse()
        return {
            x: clientX * inv.a + clientY * inv.c + inv.e,
            y: clientX * inv.b + clientY * inv.d + inv.f,
        }
    }, [])

    const registerCardRef = useCallback((index: number, el: SVGGElement | null) => {
        if (el) {
            cardGroupRefs.current.set(index, el)
            return
        }

        cardGroupRefs.current.delete(index)
    }, [])

    const suppressCardSelection = useCallback(() => {
        suppressCardSelectionUntilRef.current =
            Date.now() + CARD_SELECTION_SUPPRESS_MS
    }, [])

    const isCardInteractionTarget = useCallback((target: EventTarget | null) => {
        return target instanceof Element
            ? target.closest(CARD_INTERACTION_SELECTOR) !== null
            : false
    }, [])

    const baseSortedCards = useMemo(
        () =>
            effectiveCards
                .map((card, index) => ({ card, index }))
                .sort((a, b) => {
                    if (a.card.z !== b.card.z) return a.card.z - b.card.z
                    return a.index - b.index
                }),
        [effectiveCards]
    )

    const layeredCardIndices = useMemo(
        () =>
            baseSortedCards
                .map(({ index }) => index)
                .sort((a, b) => {
                    const aSelected = a === selectedCardIndex ? 1 : 0
                    const bSelected = b === selectedCardIndex ? 1 : 0
                    const aDragging = dragging?.index === a ? 1 : 0
                    const bDragging = dragging?.index === b ? 1 : 0

                    if (aDragging !== bDragging) return aDragging - bDragging
                    if (aSelected !== bSelected) return aSelected - bSelected
                    return 0
                }),
        [baseSortedCards, dragging?.index, selectedCardIndex]
    )

    useLayoutEffect(() => {
        const cardsLayer = cardsLayerRef.current
        if (!cardsLayer) return

        for (const index of layeredCardIndices) {
            const el = cardGroupRefs.current.get(index)
            if (el && el.parentNode === cardsLayer) {
                cardsLayer.appendChild(el)
            }
        }
    }, [layeredCardIndices])

    const flushTransientPositions = useCallback(() => {
        transientFrameRef.current = 0
        const next = pendingTransientPositionsRef.current
        pendingTransientPositionsRef.current = null
        if (!next) return

        transientPositionsRef.current = next
        setTransientPositions((prev) =>
            areTransientPositionsEqual(prev, next) ? prev : next
        )
    }, [])

    const scheduleTransientPositions = useCallback(
        (updates: TransientPositions) => {
            const base =
                pendingTransientPositionsRef.current ?? transientPositionsRef.current
            const next = { ...base }
            let hasChanged = false

            for (const [key, value] of Object.entries(updates)) {
                const index = Number(key)
                if (next[index]?.x === value.x && next[index]?.y === value.y) {
                    continue
                }

                next[index] = value
                hasChanged = true
            }

            if (!hasChanged) return

            pendingTransientPositionsRef.current = next

            if (transientFrameRef.current !== 0) return

            transientFrameRef.current = window.requestAnimationFrame(
                flushTransientPositions
            )
        },
        [flushTransientPositions]
    )

    const buildDragUpdates = useCallback(
        (index: number, x: number, y: number) => {
            const updates: TransientPositions = {
                [index]: { x, y },
            }

            if (groupDragOrigins.current.size > 0 && dragStartPos.current) {
                const dx = x - dragStartPos.current.x
                const dy = y - dragStartPos.current.y

                for (const [groupIndex, origin] of groupDragOrigins.current) {
                    const { x: clampedX, y: clampedY } =
                        getSnappedClampedPosition(
                            origin.x + dx,
                            origin.y + dy,
                            CANVAS_BOUNDS,
                            GRID_SIZE
                        )

                    updates[groupIndex] = { x: clampedX, y: clampedY }
                }
            }

            return updates
        },
        []
    )

    const commitTransientPositions = useCallback((updates: TransientPositions) => {
        if (transientFrameRef.current !== 0) {
            window.cancelAnimationFrame(transientFrameRef.current)
            transientFrameRef.current = 0
        }

        pendingTransientPositionsRef.current = null
        const next = { ...transientPositionsRef.current, ...updates }
        transientPositionsRef.current = next
        setTransientPositions((prev) =>
            areTransientPositionsEqual(prev, next) ? prev : next
        )
    }, [])

    const guides = useMemo<CanvasGuide[]>(() => {
        if (isViewMode || !dragging) return []

        if (
            groupSelectedIndices.size > 1 &&
            groupSelectedIndices.has(dragging.index)
        ) {
            return []
        }

        const draggedRect = getRect(
            dragging.x,
            dragging.y,
            CARD_WIDTH,
            CARD_HEIGHT
        )
        const lines: CanvasGuide[] = []

        effectiveCards.forEach((card, index) => {
            if (index === dragging.index) return
            const otherRect = getRect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT)

            for (const draggedEdge of [draggedRect.left, draggedRect.right]) {
                for (const otherEdge of [otherRect.left, otherRect.right]) {
                    if (draggedEdge === otherEdge) {
                        lines.push({ axis: 'v', pos: draggedEdge })
                    }
                }
            }

            for (const draggedEdge of [draggedRect.top, draggedRect.bottom]) {
                for (const otherEdge of [otherRect.top, otherRect.bottom]) {
                    if (draggedEdge === otherEdge) {
                        lines.push({ axis: 'h', pos: draggedEdge })
                    }
                }
            }
        })

        const seen = new Set<string>()
        return lines.filter((line) => {
            const key = `${line.axis}-${line.pos}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
    }, [effectiveCards, dragging, groupSelectedIndices, isViewMode])

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
    }, [setZoomInteractionActiveForFrame])

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
            const normalizedZoom = normalizeZoom(nextZoom)
            const currentViewport = getViewportSnapshot()

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
        [getViewportSnapshot, scheduleViewportCommit, svgHeight, svgWidth]
    )

    useLayoutEffect(() => {
        renderedZoomRef.current = zoom
        panRef.current = pan
    }, [zoom, pan])

    useEffect(() => {
        if (!viewportRequest) return
        const { width: clientWidth, height: clientHeight } = containerSizeRef.current

        // New spreads can dispatch their initial viewport request before the
        // container has measurable size. Retry once sizing settles.
        if (clientWidth <= 0 || clientHeight <= 0) return

        let nextZoom = renderedZoomRef.current || DEFAULT_ZOOM
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
                Math.min(viewportRequest.maxZoom ?? DEFAULT_ZOOM, fitZoom)
            )
            contentX = viewportRequest.bounds.centerX
            contentY = viewportRequest.bounds.centerY
        } else {
            nextZoom = normalizeZoom(viewportRequest.zoom ?? DEFAULT_ZOOM)
            contentX = viewportRequest.point.x
            contentY = viewportRequest.point.y
        }

        const normalizedNextZoom = normalizeZoom(nextZoom)
        const rawPan = getPanForCanvasPoint({
            contentX,
            contentY,
            viewportX: clientWidth / 2,
            viewportY: clientHeight / 2,
            zoom: normalizedNextZoom,
        })
        const nextPan = clampPan({
            panX: rawPan.x,
            panY: rawPan.y,
            canvasWidth: svgWidth,
            canvasHeight: svgHeight,
            viewportWidth: clientWidth / normalizedNextZoom,
            viewportHeight: clientHeight / normalizedNextZoom,
        })

        if (appliedViewportRequestKeyRef.current === viewportRequest.key) return
        if (scheduledViewportRequestKeyRef.current === viewportRequest.key) return

        scheduleViewportCommit(normalizedNextZoom, nextPan, false, viewportRequest.key)
    }, [
        scheduleViewportCommit,
        svgHeight,
        svgWidth,
        viewportRequest,
        containerSize.width,
        containerSize.height,
    ])

    const schedulePanUpdate = useCallback(
        (nextPan: { x: number; y: number }) => {
            panRef.current = nextPan
            targetPanRef.current = nextPan
            if (panFrameRef.current !== 0) return
            panFrameRef.current = window.requestAnimationFrame(() => {
                panFrameRef.current = 0
                setPan({ ...panRef.current })
            })
        },
        []
    )

    const getClampedPan = useCallback(
        (rawX: number, rawY: number) => {
            const size = containerSizeRef.current
            const currentZoom = targetZoomRef.current
            return clampPan({
                panX: rawX,
                panY: rawY,
                canvasWidth: svgWidth,
                canvasHeight: svgHeight,
                viewportWidth: size.width / currentZoom,
                viewportHeight: size.height / currentZoom,
            })
        },
        [svgWidth, svgHeight]
    )

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let touchPanState: { x: number; y: number; panX: number; panY: number } | null = null

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
                // Zoom
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
                // Pan
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
                // Pinch zoom
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
                !isMarqueeActive.current &&
                !isCardInteractionTarget(e.target)
            ) {
                // Single-finger touch pan
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
                // Pinch zoom
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
                // Single-finger touch pan
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
        schedulePanUpdate,
        setZoomAroundViewportPoint,
        suppressCardSelection,
    ])

    useImperativeHandle(
        ref,
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
                    nextZoom: getSteppedZoom(targetZoomRef.current, 'in'),
                    anchorViewportX: size.width / 2,
                    anchorViewportY: size.height / 2,
                    shouldFlagInteraction: true,
                })
            },
            zoomOut: () => {
                const size = containerSizeRef.current
                setZoomAroundViewportPoint({
                    nextZoom: getSteppedZoom(targetZoomRef.current, 'out'),
                    anchorViewportX: size.width / 2,
                    anchorViewportY: size.height / 2,
                    shouldFlagInteraction: true,
                })
            },
        }),
        [setZoomAroundViewportPoint]
    )

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
    }, [schedulePanUpdate, getClampedPan])

    const handleDragStart = useCallback(
        (index: number, x: number, y: number) => {
            setDragging({ index, x, y })
            draggingRef.current = { index, x, y }

            const currentCard = effectiveCardsRef.current[index]
            dragStartPos.current = currentCard
                ? { x: currentCard.x, y: currentCard.y }
                : { x, y }

            if (
                groupSelectedRef.current.has(index) &&
                groupSelectedRef.current.size > 1
            ) {
                const origins = new Map<number, Point>()
                for (const groupIndex of groupSelectedRef.current) {
                    if (groupIndex === index) continue
                    const groupCard = effectiveCardsRef.current[groupIndex]
                    if (groupCard) {
                        origins.set(groupIndex, {
                            x: groupCard.x,
                            y: groupCard.y,
                        })
                    }
                }
                groupDragOrigins.current = origins
                return
            }

            groupDragOrigins.current = new Map()
        },
        []
    )

    const handleDrag = useCallback(
        (index: number, x: number, y: number) => {
            setDragging({ index, x, y })
            draggingRef.current = { index, x, y }
            scheduleTransientPositions(buildDragUpdates(index, x, y))
        },
        [buildDragUpdates, scheduleTransientPositions]
    )

    const handleDragEnd = useCallback(
        (index: number, x: number, y: number) => {
            const nextPositions = buildDragUpdates(index, x, y)
            commitTransientPositions(nextPositions)

            onPositionsCommit?.(
                Object.entries(nextPositions).map(([key, value]) => ({
                    index: Number(key),
                    x: value.x,
                    y: value.y,
                }))
            )

            groupDragOrigins.current = new Map()
            dragStartPos.current = null
            draggingRef.current = null
            setDragging(null)
        },
        [buildDragUpdates, commitTransientPositions, onPositionsCommit]
    )

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isMarqueeActive.current) return
            const pt = clientToSVG(e.clientX, e.clientY)
            setMarquee((prev) =>
                prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null
            )
        }

        const handleMouseUp = (e: MouseEvent) => {
            if (!isMarqueeActive.current) return
            isMarqueeActive.current = false

            const endPt = clientToSVG(e.clientX, e.clientY)
            const dx = endPt.x - marqueeStart.current.x
            const dy = endPt.y - marqueeStart.current.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < 5) {
                updateGroupSelection(new Set())
                onCardSelect(null)
            } else {
                const left = Math.min(marqueeStart.current.x, endPt.x)
                const right = Math.max(marqueeStart.current.x, endPt.x)
                const top = Math.min(marqueeStart.current.y, endPt.y)
                const bottom = Math.max(marqueeStart.current.y, endPt.y)
                const selectionRect = { left, right, top, bottom }
                const selected = new Set<number>()

                effectiveCardsRef.current.forEach((card, index) => {
                    if (
                        rectsIntersect(
                            getRect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT),
                            selectionRect
                        )
                    ) {
                        selected.add(index)
                    }
                })

                updateGroupSelection(selected)
            }

            setMarquee(null)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [clientToSVG, onCardSelect, updateGroupSelection])

    const handleBackgroundMouseDown = useCallback(
        (e: React.MouseEvent<SVGRectElement>) => {
            if (isSpaceHeld.current) return
            const pt = clientToSVG(e.clientX, e.clientY)
            isMarqueeActive.current = true
            marqueeStart.current = { x: pt.x, y: pt.y }
            setMarquee({
                startX: pt.x,
                startY: pt.y,
                currentX: pt.x,
                currentY: pt.y,
            })
        },
        [clientToSVG]
    )

    const handleBackgroundDoubleClick = useCallback(
        (e: React.MouseEvent<SVGRectElement>) => {
            if (isViewMode || !onCanvasDoubleClick) return
            const pt = clientToSVG(e.clientX, e.clientY)
            const { x, y } = getCenteredCardPlacement(
                pt.x,
                pt.y,
                CARD_WIDTH,
                CARD_HEIGHT,
                CANVAS_BOUNDS,
                GRID_SIZE
            )
            onCanvasDoubleClick(x, y)
        },
        [clientToSVG, isViewMode, onCanvasDoubleClick]
    )

    const handleCardClick = useCallback(
        (index: number) => {
            if (
                pinchStateRef.current ||
                safariGestureStateRef.current ||
                Date.now() < suppressCardSelectionUntilRef.current
            ) {
                return
            }
            updateGroupSelection(new Set())
            onCardSelect(index)
        },
        [onCardSelect, updateGroupSelection]
    )

    const marqueeRect = useMemo(() => {
        if (!marquee) return null
        return {
            x: Math.min(marquee.startX, marquee.currentX),
            y: Math.min(marquee.startY, marquee.currentY),
            width: Math.abs(marquee.currentX - marquee.startX),
            height: Math.abs(marquee.currentY - marquee.startY),
        }
    }, [marquee])

    const showEmptyPrompt = !isViewMode && cards.length === 0

    const offscreenPointers = useMemo(() => {
        if (containerSize.width <= 0 || containerSize.height <= 0) {
            return []
        }

        const viewport = getCanvasViewportRect({
            panX: pan.x,
            panY: pan.y,
            clientWidth: containerSize.width,
            clientHeight: containerSize.height,
            zoom,
        })

        const overlayCenterX = containerSize.width / 2
        const overlayCenterY = containerSize.height / 2
        const maxOffsetX = Math.max(overlayCenterX - POINTER_EDGE_PADDING, 0)
        const maxOffsetY = Math.max(overlayCenterY - POINTER_EDGE_PADDING, 0)

        if (maxOffsetX === 0 || maxOffsetY === 0) return []

        return effectiveCards.flatMap((card, index) => {
            const cardRect = getRect(card.x, card.y, CARD_WIDTH, CARD_HEIGHT)

            if (!isRectFullyOutsideRect(cardRect, viewport)) return []

            const cardCenter = getRectCenter(cardRect)
            const pointerPosition = projectVectorToEdge(
                cardCenter.x - viewport.centerX,
                cardCenter.y - viewport.centerY,
                overlayCenterX,
                overlayCenterY,
                maxOffsetX,
                maxOffsetY
            )

            if (!pointerPosition) return []

            return [
                {
                    index,
                    x: pointerPosition.x,
                    y: pointerPosition.y,
                    rotation:
                        pointerPosition.edge === 'top'
                            ? 0
                            : pointerPosition.edge === 'right'
                              ? 90
                              : pointerPosition.edge === 'bottom'
                                ? 180
                                : -90,
                    label: card.name?.trim() || `Card ${index + 1}`,
                },
            ]
        })
    }, [effectiveCards, pan, containerSize, zoom])

    const viewBox = `${pan.x} ${pan.y} ${containerSize.width > 0 ? containerSize.width / zoom : svgWidth} ${containerSize.height > 0 ? containerSize.height / zoom : svgHeight}`

    return (
        <div className="relative h-full w-full">
            <div
                ref={containerRef}
                className={`h-full w-full overflow-hidden ${themeBasedStyles.containerBg}`}
                style={{ touchAction: 'none' }}
            >
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    viewBox={viewBox}
                    xmlns="http://www.w3.org/2000/svg"
                    className="select-none"
                >
                        <defs>
                            <filter
                                id="canvas-card-shadow-active"
                                x="-25%"
                                y="-25%"
                                width="150%"
                                height="150%"
                            >
                                <feDropShadow
                                    dx={0}
                                    dy={5}
                                    stdDeviation={6}
                                    floodColor="black"
                                    floodOpacity={0.24}
                                />
                            </filter>
                        </defs>

                        <CanvasBackground
                            svgWidth={svgWidth}
                            svgHeight={svgHeight}
                            gridSize={GRID_SIZE}
                            isViewMode={isViewMode}
                            dragGridFill={themeBasedStyles.dragGridFill}
                            dragGridFillOpacity={
                                themeBasedStyles.dragGridFillOpacity
                            }
                        />

                        <rect
                            width={svgWidth}
                            height={svgHeight}
                            fill="transparent"
                            onMouseDown={
                                isViewMode
                                    ? () => onCardSelect(null)
                                    : handleBackgroundMouseDown
                            }
                            onDoubleClick={handleBackgroundDoubleClick}
                        />

                        {showEmptyPrompt && (
                            <g pointerEvents="none">
                                <rect
                                    x={CANVAS_CENTER.x - CARD_WIDTH / 2}
                                    y={CANVAS_CENTER.y - CARD_HEIGHT / 2}
                                    width={CARD_WIDTH}
                                    height={CARD_HEIGHT}
                                    rx={8}
                                    fill="none"
                                    stroke="var(--gold)"
                                    strokeWidth={1}
                                    strokeOpacity={
                                        themeBasedStyles.ghostCardStrokeOpacity
                                    }
                                    strokeDasharray="6 4"
                                    className="animate-gentle-pulse"
                                />
                                <text
                                    x={CANVAS_CENTER.x}
                                    y={CANVAS_CENTER.y + CARD_HEIGHT / 2 + 34}
                                    textAnchor="middle"
                                    fontSize={13}
                                    fill="var(--muted-foreground)"
                                    fillOpacity={0.6}
                                    fontFamily="var(--font-nunito), sans-serif"
                                >
                                    Double-click to place your first position
                                </text>
                            </g>
                        )}

                        <CanvasGuides
                            guides={guides}
                            svgWidth={svgWidth}
                            svgHeight={svgHeight}
                        />

                        <g ref={cardsLayerRef}>
                            {baseSortedCards.map(({ card, index }) => {
                                const isDraggingInGroup =
                                    dragging !== null &&
                                    groupSelectedIndices.size > 1 &&
                                    groupSelectedIndices.has(dragging.index) &&
                                    groupSelectedIndices.has(index)

                                return (
                                    <SpreadCard
                                        key={cardKeys?.[index] ?? String(index)}
                                        card={card}
                                        index={index}
                                        renderRotation={
                                            rotationAngles?.[index] ?? card.r
                                        }
                                        selected={index === selectedCardIndex}
                                        groupSelected={
                                            isViewMode
                                                ? false
                                                : groupSelectedIndices.has(index)
                                        }
                                        isDraggingInGroup={
                                            isViewMode ? false : isDraggingInGroup
                                        }
                                        isViewMode={isViewMode}
                                        disableHeavyEffects={isZoomInteractionActive}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        onDrag={handleDrag}
                                        onClick={handleCardClick}
                                        registerRef={registerCardRef}
                                    />
                                )
                            })}
                        </g>

                        {marqueeRect && (
                            <rect
                                x={marqueeRect.x}
                                y={marqueeRect.y}
                                width={marqueeRect.width}
                                height={marqueeRect.height}
                                fill="var(--gold)"
                                fillOpacity={0.08}
                                stroke="var(--gold)"
                                strokeOpacity={0.3}
                                strokeWidth={1}
                                strokeDasharray="4 3"
                                pointerEvents="none"
                            />
                        )}
                </svg>
            </div>

            <CanvasPointerOverlay
                pointers={offscreenPointers}
                iconSize={POINTER_ICON_SIZE}
            />
        </div>
    )
}

const SpreadCanvas = memo(forwardRef(SpreadCanvasComponent))

SpreadCanvas.displayName = 'SpreadCanvas'

export default SpreadCanvas
export type { CanvasCard }
