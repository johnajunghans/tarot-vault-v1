'use client'

import {
    forwardRef,
    memo,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef,
} from 'react'
import SpreadCard from './components/card'
import CardButtonFrame from './components/card-button-frame'
import CanvasBackground from './components/background'
import CanvasDefs from './components/defs'
import CanvasEmptyPrompt from './components/empty-prompt'
import CanvasGuides from './components/guides'
import CanvasMarquee from './components/marquee'
import CanvasPointerOverlay from './components/pointer-overlay'
import CanvasScrollbars from './components/scrollbars'
import { useCanvasDrag } from './hooks/use-canvas-drag'
import { useCanvasGuides } from './hooks/use-canvas-guides'
import { useCanvasOffscreenPointers } from './hooks/use-canvas-offscreen-pointers'
import { useCardLayering } from './hooks/use-canvas-card-layering'
import { useCanvasCardButtons } from './hooks/use-canvas-card-buttons'
import { useCanvasSelection } from './hooks/use-canvas-selection'
import { useCanvasViewport } from './hooks/use-canvas-viewport'
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
} from '../lib'

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

    // Shared mutable flag used by viewport and selection logic while marquee
    // selection is active.
    const isMarqueeActive = useRef(false)

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

    // ------------ VIEWPORT AND INPUT HOOKS ------------ //

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

    // Derive alignment guides for the currently dragged card.
    const guides = useCanvasGuides({
        effectiveCards,
        dragging,
        groupSelectedIndices,
        isViewMode,
    })

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

    // ------------ CARD BUTTON FRAME ------------ //

    const {
        hoveredCard,
        hoveredCardIndex,
        showButtonFrame,
        buttonFrameLayerInfo,
        handleCardMouseEnter,
        handleCardMouseLeave,
        handleButtonFrameMouseEnter,
        handleButtonFrameMouseLeave,
        handleRotateStep,
        handleButtonRotationChange,
        handleBringToFront,
        handleSendToBack,
    } = useCanvasCardButtons({
        effectiveCards,
        rotationAngles,
        draggingIndex: dragging?.index ?? null,
        isMobile,
        isViewMode,
        onRotationChange,
        onLayerChange,
    })

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
                        <CanvasDefs />

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
                            guides={guides}
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
                                        onMouseEnter={
                                            !isMobile && !isViewMode
                                                ? handleCardMouseEnter
                                                : undefined
                                        }
                                        onMouseLeave={
                                            !isMobile && !isViewMode
                                                ? handleCardMouseLeave
                                                : undefined
                                        }
                                        registerRef={registerCardRef}
                                    />
                                )
                            })}
                        </g>

                        {/* Button frame overlay — always above all cards. */}
                        {showButtonFrame && hoveredCard && hoveredCardIndex !== null && (
                            <CardButtonFrame
                                card={hoveredCard}
                                cardIndex={hoveredCardIndex}
                                zoom={zoom}
                                totalCards={effectiveCards.length}
                                onRotateStep={handleRotateStep}
                                onRotationChange={handleButtonRotationChange}
                                onBringToFront={handleBringToFront}
                                onSendToBack={handleSendToBack}
                                isAtFront={buttonFrameLayerInfo.isAtFront}
                                isAtBack={buttonFrameLayerInfo.isAtBack}
                                onFrameMouseEnter={handleButtonFrameMouseEnter}
                                onFrameMouseLeave={handleButtonFrameMouseLeave}
                            />
                        )}

                        {/* Marquee rectangle sits above the card/content layers. */}
                        <CanvasMarquee rect={marqueeRect} />
                </svg>
            </div>

            {/* UI overlays positioned outside the SVG so they can ignore clipping. */}
            <CanvasPointerOverlay
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
export { default as ZoomControls } from './components/zoom-controls'
export type {
    CanvasCard,
    SpreadCanvasHandle,
    SpreadCanvasPositionUpdate,
    SpreadCanvasViewportRequest,
} from './types'
