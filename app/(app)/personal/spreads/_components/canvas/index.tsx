'use client'

import {
    forwardRef,
    memo,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import SpreadCard, { type CanvasCard } from './components/card'
import CanvasBackground from './components/background'
import CanvasGuides, { type CanvasGuide } from './components/guides'
import CanvasPointerOverlay from './components/pointer-overlay'
import CanvasScrollbars from './components/scrollbars'
import { useCardLayering } from './hooks/use-card-layering'
import { useCanvasViewport } from './hooks/use-canvas-viewport'
import { useTheme } from 'next-themes'
import {
    getCenteredCardPlacement,
    getRect,
    getRectCenter,
    getSnappedClampedPosition,
    isRectFullyOutsideRect,
    projectVectorToEdge,
    rectsIntersect,
} from './helpers/geometry'
import { getCanvasViewportRect } from './helpers/viewport'
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

const POINTER_EDGE_PADDING = 18
const POINTER_ICON_SIZE = 16
const CARD_INTERACTION_SELECTOR = '[data-spread-card-interactive="true"]'

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
    onZoomBoundsChange?: (minZoom: number) => void
    isViewMode?: boolean
    viewportRequest?: SpreadCanvasViewportRequest | null
}

interface Point {
    x: number
    y: number
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
        onZoomBoundsChange,
        isViewMode = false,
        viewportRequest,
    }: SpreadCanvasProps,
    ref: React.ForwardedRef<SpreadCanvasHandle>
) {
    const svgRef = useRef<SVGSVGElement>(null)
    const { resolvedTheme } = useTheme()

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
    const isMarqueeActive = useRef(false)
    const marqueeStart = useRef({ x: 0, y: 0 })

    const updateGroupSelection = useCallback((next: Set<number>) => {
        groupSelectedRef.current = next
        setGroupSelectedIndices(next)
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

    const isCardInteractionTarget = useCallback((target: EventTarget | null) => {
        return target instanceof Element
            ? target.closest(CARD_INTERACTION_SELECTOR) !== null
            : false
    }, [])

    const {
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
    } = useCanvasViewport({
        svgWidth,
        svgHeight,
        viewportRequest,
        onZoomDisplayChange,
        onZoomBoundsChange,
        isCardInteractionTarget,
        isMarqueeActiveRef: isMarqueeActive,
    })

    const { cardsLayerRef, registerCardRef, baseSortedCards } = useCardLayering({
        effectiveCards,
        selectedCardIndex,
        draggingIndex: dragging?.index ?? null,
    })

    useImperativeHandle(ref, () => imperativeHandle, [imperativeHandle])

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
            if (isSpaceHeldRef.current) return
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
        [clientToSVG, isSpaceHeldRef]
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
            if (isCardSelectionSuppressed()) {
                return
            }
            updateGroupSelection(new Set())
            onCardSelect(index)
        },
        [isCardSelectionSuppressed, onCardSelect, updateGroupSelection]
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

            <CanvasScrollbars
                panX={pan.x}
                panY={pan.y}
                viewportWidth={viewportDimensions.width}
                viewportHeight={viewportDimensions.height}
                canvasWidth={svgWidth}
                canvasHeight={svgHeight}
                isActive={isScrollbarActive}
                onPan={handleScrollbarPan}
            />
        </div>
    )
}

const SpreadCanvas = memo(forwardRef(SpreadCanvasComponent))

SpreadCanvas.displayName = 'SpreadCanvas'

export default SpreadCanvas
export type { CanvasCard }
