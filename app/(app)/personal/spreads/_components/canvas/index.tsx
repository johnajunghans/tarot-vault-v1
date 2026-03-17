'use client'

import {
    forwardRef,
    memo,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef,
} from 'react'
import SpreadCard, { type CanvasCard } from './components/card'
import CanvasBackground from './components/background'
import CanvasGuides, { type CanvasGuide } from './components/guides'
import CanvasPointerOverlay from './components/pointer-overlay'
import CanvasScrollbars from './components/scrollbars'
import { useCanvasDrag } from './hooks/use-canvas-drag'
import { useCanvasOffscreenPointers } from './hooks/use-canvas-offscreen-pointers'
import { useCardLayering } from './hooks/use-canvas-card-layering'
import { useCanvasSelection } from './hooks/use-canvas-selection'
import { useCanvasViewport } from './hooks/use-canvas-viewport'
import { useTheme } from 'next-themes'
import {
    getCenteredCardPlacement,
    getRect,
} from './helpers/geometry'
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

    const isMarqueeActive = useRef(false)

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

    const {
        dragging,
        effectiveCards,
        updateGroupSelection: updateDragSelection,
        handleDragStart,
        handleDrag,
        handleDragEnd,
    } = useCanvasDrag({
        cards,
        onPositionsCommit,
    })

    const updateGroupSelection = useCallback((next: Set<number>) => {
        updateDragSelection(next)
    }, [updateDragSelection])

    const {
        groupSelectedIndices,
        handleBackgroundMouseDown,
        handleCardClick,
        marqueeRect,
    } = useCanvasSelection({
        effectiveCards,
        onCardSelect,
        syncGroupSelection: updateGroupSelection,
        clientToSVG,
        isCardSelectionSuppressed,
        isSpaceHeldRef,
        isMarqueeActiveRef: isMarqueeActive,
    })

    const { cardsLayerRef, registerCardRef, baseSortedCards } = useCardLayering({
        effectiveCards,
        selectedCardIndex,
        draggingIndex: dragging?.index ?? null,
    })

    useImperativeHandle(ref, () => imperativeHandle, [imperativeHandle])

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

    const showEmptyPrompt = !isViewMode && cards.length === 0

    const offscreenPointers = useCanvasOffscreenPointers({
        effectiveCards,
        pan,
        containerSize,
        zoom,
    })

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
