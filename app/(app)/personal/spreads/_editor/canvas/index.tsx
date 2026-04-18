'use client'

import {
    forwardRef,
    memo,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef,
} from 'react'
import SpreadCard from './card'
import CanvasGuides from './guide-lines'
import { useCanvasSelection, CanvasMarquee } from './multi-select'
import { useCanvasDrag } from './drag'
import { OffscreenPointers, useCanvasOffscreenPointers } from './offscreen-pointers'
import { useCardLayering } from './hooks/use-canvas-card-layering'
import { 
    useCanvasViewport,
    CanvasScrollbars 
} from './viewport'
import type {
    CanvasCard,
    SpreadCanvasHandle,
    SpreadCanvasPositionUpdate,
    SpreadCanvasViewportRequest,
} from './types'
import { useTheme } from 'next-themes'
import { useIsMobile } from '@/hooks/use-mobile'
import {
    getCenteredCardPlacement,
} from './lib/geometry'
import {
    CANVAS_BOUNDS,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    CARD_HEIGHT,
    CARD_WIDTH,
    GRID_SIZE,
    CANVAS_CENTER
} from '../lib'
import { useCanvasCardButtonActions } from './hooks/use-canvas-card-button-actions'

interface SpreadCanvasProps {
    cards: CanvasCard[]
    cardKeys?: string[]
    rotationAngles?: number[]
    selectedCardIndex: number | null
    onCardSelect: (index: number | null) => void
    onCanvasDoubleClick?: (x: number, y: number) => void
    onPositionsCommit?: (updates: SpreadCanvasPositionUpdate[]) => void
    onRotationChange?: (index: number, value: number) => void
    onLayerChange?: (updates: { index: number; z: number }[]) => void
    onDeleteCard?: (index: number) => void
    onZoomDisplayChange?: (zoom: number) => void
    onZoomBoundsChange?: (minZoom: number) => void
    isViewMode?: boolean
    viewportRequest?: SpreadCanvasViewportRequest | null
}

// Main SVG canvas for viewing and editing a spread. This component coordinates
// the specialized canvas hooks, then renders the background, cards, overlays,
// and scrollbars from their combined state.
function SpreadCanvasComponent(
    {
        cards,
        cardKeys,
        rotationAngles,
        selectedCardIndex,
        onCardSelect,
        onCanvasDoubleClick,
        onPositionsCommit,
        onRotationChange,
        onLayerChange,
        onDeleteCard,
        onZoomDisplayChange,
        onZoomBoundsChange,
        isViewMode = false,
        viewportRequest,
    }: SpreadCanvasProps,
    ref: React.ForwardedRef<SpreadCanvasHandle>
) {
    // ------------ CORE REFS AND THEME ------------ //

    // The raw SVG element is needed to convert pointer coordinates into the
    // current SVG coordinate space.
    const svgRef = useRef<SVGSVGElement>(null)
    const isMobile = useIsMobile()
    const { resolvedTheme } = useTheme()

    // Theme values are collected in one memoized object so child components can
    // consume a small, stable styling contract.
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

    // Convert browser client coordinates into the transformed SVG coordinate
    // system so drag, select, and add-card interactions line up visually.
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

    // ------------ DRAG ------------ //

    // Owns drag state and produces the "effective" card positions while a drag
    // is in progress before changes are committed back to the form.
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

    // Selection state also needs to update the drag hook so multi-select drags
    // move the same set of cards.
    const updateGroupSelection = useCallback((next: Set<number>) => {
        updateDragSelection(next)
    }, [updateDragSelection])

    // ------------ VIEWPORT AND MULTI-SELECT ------------ //

    // Shared mutable flag used by viewport and selection logic while marquee
    // selection is active.
    const isMarqueeActive = useRef(false)

    // Owns pan/zoom, viewport fitting, scrollbar state, and the imperative API
    // used by the external zoom controls.
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
        isMarqueeActiveRef: isMarqueeActive,
    })

    // Handles click selection, marquee selection, and background deselection.
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

    // Determines DOM/card stacking order and keeps refs to rendered card groups
    // for effects that depend on the actual SVG elements.
    const { cardsLayerRef, registerCardRef, baseSortedCards } = useCardLayering({
        effectiveCards,
        selectedCardIndex,
        draggingIndex: dragging?.index ?? null,
    })

    // Expose the viewport's imperative methods to the parent via `ref`.
    useImperativeHandle(ref, () => imperativeHandle, [imperativeHandle])

    // Double-clicking the background creates a new card centered at the click
    // position, snapped and clamped within canvas bounds.
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

    // Show the onboarding prompt only when editing an empty spread.
    const showEmptyPrompt = !isViewMode && cards.length === 0

    // Compute edge pointers for cards that are currently offscreen.
    const offscreenPointers = useCanvasOffscreenPointers({
        effectiveCards,
        pan,
        containerSize,
        zoom,
    })

    // ------------ CARD BUTTON ACTIONS ------------ //

    const {
        layers,
        layerBounds,
        handleRotateStep,
        handleButtonRotationChange,
        handleBringToFront,
        handleSendToBack
    } = useCanvasCardButtonActions(
        effectiveCards,
        onRotationChange,
        rotationAngles,
        onLayerChange
    )

    // ------------ RENDER ------------ //

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
                        {/* SVG defs and reusable background layer. */}
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

                        {/* Transparent interaction layer for selection and add-card gestures. */}
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
                            <CanvasEmptyPrompt
                                strokeOpacity={
                                    themeBasedStyles.ghostCardStrokeOpacity
                                }
                            />
                        )}

                        {/* Drag-time overlays rendered behind the cards. */}
                        <CanvasGuides
                            effectiveCards={effectiveCards}
                            dragging={dragging}
                            groupSelectedIndices={groupSelectedIndices}
                            isViewMode={isViewMode}
                            svgWidth={svgWidth}
                            svgHeight={svgHeight}
                        />

                        {/* Main card layer. Order comes from the layering hook. */}
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
                                        zoom={zoom}
                                        totalCards={effectiveCards.length}
                                        isAtFront={
                                            (layers[index] ?? 0) >= layerBounds.max
                                        }
                                        isAtBack={
                                            (layers[index] ?? 0) <= layerBounds.min
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
                                        isMobile={isMobile}
                                        disableHeavyEffects={isZoomInteractionActive}
                                        onRotateStep={handleRotateStep}
                                        onRotationChange={handleButtonRotationChange}
                                        onBringToFront={handleBringToFront}
                                        onSendToBack={handleSendToBack}
                                        onDeleteCard={onDeleteCard ?? (() => {})}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        onDrag={handleDrag}
                                        onClick={handleCardClick}
                                        registerRef={registerCardRef}
                                    />
                                )
                            })}
                        </g>

                        {/* Marquee rectangle sits above the card/content layers. */}
                        <CanvasMarquee rect={marqueeRect} />
                </svg>
            </div>

            {/* UI overlays positioned outside the SVG so they can ignore clipping. */}
            <OffscreenPointers
                pointers={offscreenPointers}
            />

            {/* Custom scrollbars mirror viewport pan across the virtual canvas. */}
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

// Memoization keeps the canvas from rerendering when parent props retain the
// same identity, which matters because the component coordinates many hooks.
const SpreadCanvas = memo(forwardRef(SpreadCanvasComponent))

SpreadCanvas.displayName = 'SpreadCanvas'

export default SpreadCanvas
export { default as ZoomControls } from './viewport/zoom/zoom-controls'
export { UndoRedoControls } from './undo-redo'
export type {
    CanvasCard,
    SpreadCanvasHandle,
    SpreadCanvasPositionUpdate,
    SpreadCanvasViewportRequest,
} from './types'

// ================== COMPONENT FUNCTIONS ==================

interface CanvasEmptyPromptProps {
    strokeOpacity: string
}

function CanvasEmptyPrompt({
    strokeOpacity,
}: CanvasEmptyPromptProps) {
    return (
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
                strokeOpacity={strokeOpacity}
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
    )
}

interface CanvasBackgroundProps {
    svgWidth: number
    svgHeight: number
    gridSize: number
    isViewMode: boolean
    dragGridFill: string
    dragGridFillOpacity: string
}

function CanvasBackground({
    svgWidth,
    svgHeight,
    gridSize,
    isViewMode,
    dragGridFill,
    dragGridFillOpacity,
}: CanvasBackgroundProps) {
    return (
        <>
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

                <pattern
                    id="drag-grid"
                    width={gridSize * 2}
                    height={gridSize * 2}
                    patternUnits="userSpaceOnUse"
                >
                    <circle
                        cx={gridSize}
                        cy={gridSize}
                        r={0.6}
                        fill={dragGridFill}
                        fillOpacity={dragGridFillOpacity}
                    />
                </pattern>

                <radialGradient id="canvas-vignette" cx="50%" cy="40%" r="55%">
                    <stop
                        offset="0%"
                        stopColor="var(--gold)"
                        stopOpacity="0.02"
                    />
                    <stop
                        offset="100%"
                        stopColor="transparent"
                        stopOpacity="0"
                    />
                </radialGradient>
            </defs>

            <rect
                width={svgWidth}
                height={svgHeight}
                fill="url(#stone-texture)"
            />

            <rect
                width={svgWidth}
                height={svgHeight}
                fill="url(#canvas-vignette)"
            />

            {!isViewMode && (
                <rect
                    width={svgWidth}
                    height={svgHeight}
                    fill="url(#drag-grid)"
                    style={{
                        opacity: 1,
                        transition: 'opacity 200ms ease',
                    }}
                    pointerEvents="none"
                />
            )}

            <line
                x1={svgWidth - 1}
                y1={0}
                x2={svgWidth - 1}
                y2={svgHeight}
                stroke="var(--border)"
                strokeOpacity={0.85}
                strokeWidth={2}
                pointerEvents="none"
            />
            <line
                x1={0}
                y1={svgHeight - 1}
                x2={svgWidth}
                y2={svgHeight - 1}
                stroke="var(--border)"
                strokeOpacity={0.85}
                strokeWidth={2}
                pointerEvents="none"
            />
        </>
    )
}


