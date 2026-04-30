'use client'

import { memo, useEffect, useState, type KeyboardEvent } from 'react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import {
    CARD_HEIGHT,
    CARD_HOVER_HIT_PADDING_X,
    CARD_HOVER_HIT_PADDING_Y,
    CARD_WIDTH,
} from '../../lib'

gsap.registerPlugin(Draggable)

import { CardBack } from './card-back'
// import CardButtonPanel from './button-panel'
import type { CanvasCard } from '../types'
import useCanvasCardTransform from './use-canvas-card-transform'
import { getCardNameFontSize, normalizeRotationForDisplay, splitCardNameIntoLines } from './card-helpers'

const CORNER_R = 8
const FULL_ROTATION = 360

interface CanvasCardProps {
    card: CanvasCard
    index: number
    renderRotation: number
    selected: boolean
    groupSelected: boolean
    isDraggingInGroup: boolean
    isViewMode: boolean
    isMobile: boolean
    disableHeavyEffects: boolean
    onDragStart: (index: number, x: number, y: number) => void
    onDragEnd: (index: number, x: number, y: number) => void
    onDrag: (index: number, x: number, y: number) => void
    onClick: (index: number) => void
    registerRef: (index: number, el: SVGGElement | null) => void

    // --- Button panel only props ---
    // zoom: number
    // totalCards: number
    // isAtFront: boolean
    // isAtBack: boolean
    // onRotateStep: (index: number, direction: 1 | -1) => void
    // onRotationChange: (index: number, value: number) => void
    // onBringToFront: (index: number) => void
    // onSendToBack: (index: number) => void
    // onDeleteCard: (index: number) => void
}

function CanvasCard({
    card,
    index,
    renderRotation,
    selected,
    groupSelected,
    isDraggingInGroup,
    isViewMode,
    isMobile,
    disableHeavyEffects,
    onDragStart,
    onDragEnd,
    onDrag,
    onClick,
    registerRef,

    // zoom,
    // totalCards,
    // isAtFront,
    // isAtBack,
    // onRotateStep,
    // onRotationChange,
    // onBringToFront,
    // onSendToBack,
    // onDeleteCard
}: CanvasCardProps) {

    const [isHovered, setIsHovered] = useState(false)

    // Invocation of card drag and rotation stateful logic
    const {
        groupRef,
        rotationRef,
        badgeRef,
        isDraggingState,
        // setDisableDrag // button panel only
    } = useCanvasCardTransform(
        card,
        index,
        renderRotation,
        isViewMode,
        onDragStart,
        onDragEnd,
        onDrag
    )

    // Register cards with use-canvas-card-layering hook 
    useEffect(() => {
        registerRef(index, groupRef.current)
        return () => registerRef(index, null)
    }, [index, registerRef])

    const isActiveDrag = isDraggingState || isDraggingInGroup
    const showButtonFrame =
        !isViewMode && !isMobile && !isActiveDrag && isHovered
    const isHighlighted = selected || groupSelected
    const badgeColor = isHighlighted ? 'var(--gold)' : 'var(--gold-muted)'
    const cardName = card.name?.trim() ?? ''
    const hasCardName = cardName.length > 0
    const displayName = hasCardName ? cardName : 'Untitled'
    const cardNameFontSize = getCardNameFontSize(displayName)
    const cardNameLines = splitCardNameIntoLines(displayName)
    const normalizedRenderRotation = normalizeRotationForDisplay(renderRotation, FULL_ROTATION)
    const shouldFlipCardName =
        normalizedRenderRotation > 90 && normalizedRenderRotation < 270
    const cardNameLineHeight = cardNameFontSize * 1.05
    const cardNameBaseY =
        CARD_HEIGHT - (cardNameLines.length === 1 ? 24 : 31)
    const cardNameCenterY =
        cardNameBaseY + ((cardNameLines.length - 1) * cardNameLineHeight) / 2
    const cardNameTransform = shouldFlipCardName
        ? `rotate(180 ${CARD_WIDTH / 2} ${cardNameCenterY})`
        : undefined
    const shadowFilter = disableHeavyEffects
        ? undefined
        : isActiveDrag
          ? 'url(#canvas-card-shadow-active)'
          : undefined

    function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
        if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') {
            return
        }

        event.preventDefault()
        onClick(index)
    }

    return (
        <g
            ref={groupRef}
            data-spread-card-interactive="true"
            tabIndex={0}
            focusable="true"
            role="button"
            aria-label={`Select card ${index + 1}: ${displayName}`}
            onClick={() => onClick(index)}
            onKeyDown={handleKeyDown}
            onPointerEnter={
                !isViewMode && !isMobile
                    ? () => setIsHovered(true)
                    : undefined
            }
            onPointerLeave={
                !isViewMode && !isMobile
                    ? () => setIsHovered(false)
                    : undefined
            }
            className="outline-none focus-visible:[&_[data-focus-ring]]:opacity-100"
            style={{ cursor: 'pointer' }}
        >
            {!isViewMode && !isMobile && (
                <rect
                    aria-hidden
                    x={-CARD_HOVER_HIT_PADDING_X}
                    y={-CARD_HOVER_HIT_PADDING_Y}
                    width={CARD_WIDTH + 2 * CARD_HOVER_HIT_PADDING_X}
                    height={CARD_HEIGHT + 2 * CARD_HOVER_HIT_PADDING_Y}
                    rx={CORNER_R + CARD_HOVER_HIT_PADDING_X}
                    ry={CORNER_R + CARD_HOVER_HIT_PADDING_Y}
                    fill="none"
                    pointerEvents="all"
                />
            )}
            <g
                filter={shadowFilter}
                style={{
                    transition: isActiveDrag ? 'none' : 'filter 300ms ease',
                    transform: isActiveDrag ? 'scale(1.03)' : 'scale(1)',
                    transformOrigin: `${CARD_WIDTH / 2}px ${CARD_HEIGHT / 2}px`,
                }}
            >
                <g ref={rotationRef}>
                    <rect
                        data-focus-ring
                        x={-8}
                        y={-8}
                        width={CARD_WIDTH + 16}
                        height={CARD_HEIGHT + 16}
                        rx={CORNER_R + 8}
                        fill="none"
                        stroke="var(--gold)"
                        strokeOpacity={0.55}
                        strokeWidth={3}
                        className="pointer-events-none opacity-0 transition-opacity duration-150"
                    />

                    {selected && !groupSelected && (
                        <rect
                            x={-4}
                            y={-4}
                            width={CARD_WIDTH + 8}
                            height={CARD_HEIGHT + 8}
                            rx={CORNER_R + 4}
                            fill="none"
                            stroke="var(--gold)"
                            strokeOpacity={0.3}
                            strokeWidth={6}
                            style={{ pointerEvents: 'none' }}
                        />
                    )}

                    <CardBack
                        selected={selected}
                        groupSelected={groupSelected}
                        isButtonHoverActive={showButtonFrame}
                    />

                    <g ref={badgeRef}>
                        <circle
                            cx={16}
                            cy={16}
                            r={10}
                            fill={badgeColor}
                            fillOpacity={showButtonFrame || isHighlighted ? 0.9 : 0.7}
                        />
                        <text
                            x={15.75}
                            y={19.75}
                            textAnchor="middle"
                            fontSize={10}
                            fill="var(--background)"
                            style={{
                                pointerEvents: 'none',
                                userSelect: 'none',
                            }}
                            className="font-bold font-mono"
                        >
                            {index + 1}
                        </text>
                    </g>

                    {cardNameLines.length > 0 && (
                        <g transform={cardNameTransform}>
                            {cardNameLines.map((line, lineIndex) => (
                                <text
                                    key={`${index}-name-${lineIndex}`}
                                    x={CARD_WIDTH / 2}
                                    y={
                                        cardNameCenterY +
                                        (lineIndex -
                                            (cardNameLines.length - 1) / 2) *
                                            cardNameLineHeight
                                    }
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="var(--foreground)"
                                    fillOpacity={hasCardName ? (showButtonFrame || isHighlighted ? 0.9 : 0.7) : 0.5}
                                    fontSize={cardNameFontSize}
                                    fontStyle={hasCardName ? undefined : 'italic'}
                                    fontWeight={hasCardName ? 600 : 500}
                                    style={{
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                        fontFamily: 'var(--font-philosopher)'
                                    }}
                                >
                                    {line}
                                </text>
                            ))}
                        </g>
                    )}
                </g>
            </g>
            {/* {showButtonFrame && (
                <CardButtonPanel
                    cardIndex={index}
                    rotation={renderRotation}
                    zoom={zoom}
                    totalCards={totalCards}
                    onRotateStep={onRotateStep}
                    onRotationChange={onRotationChange}
                    onBringToFront={onBringToFront}
                    onSendToBack={onSendToBack}
                    onDeleteCard={onDeleteCard}
                    isAtFront={isAtFront}
                    isAtBack={isAtBack}
                    setDisableDrag={setDisableDrag}
                />
            )} */}
        </g>
    )
}

function arePropsEqual(prev: CanvasCardProps, next: CanvasCardProps): boolean {
    return (
        prev.card === next.card &&
        prev.index === next.index &&
        prev.renderRotation === next.renderRotation &&
        prev.selected === next.selected &&
        prev.groupSelected === next.groupSelected &&
        prev.isDraggingInGroup === next.isDraggingInGroup &&
        prev.isViewMode === next.isViewMode &&
        prev.isMobile === next.isMobile &&
        prev.disableHeavyEffects === next.disableHeavyEffects &&
        prev.onDragStart === next.onDragStart &&
        prev.onDragEnd === next.onDragEnd &&
        prev.onDrag === next.onDrag &&
        prev.onClick === next.onClick &&
        prev.registerRef === next.registerRef

        // prev.zoom === next.zoom &&
        // prev.totalCards === next.totalCards &&
        // prev.isAtFront === next.isAtFront &&
        // prev.isAtBack === next.isAtBack &&
        // prev.onRotateStep === next.onRotateStep &&
        // prev.onRotationChange === next.onRotationChange &&
        // prev.onBringToFront === next.onBringToFront &&
        // prev.onSendToBack === next.onSendToBack &&
        // prev.onDeleteCard === next.onDeleteCard &&
    )
}

export default memo(CanvasCard, arePropsEqual)
