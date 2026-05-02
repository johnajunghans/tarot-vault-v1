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

// import CardButtonPanel from './button-panel'
import type { CanvasCard } from '../types'
import useCanvasCardTransform from './use-canvas-card-transform'
import { Card } from '@personal/_card'

const CORNER_R = 8

interface CanvasCardProps {
    card: CanvasCard
    index: number
    renderRotation: number
    selected: boolean
    groupSelected: boolean
    isDraggingInGroup: boolean
    isViewMode: boolean
    isMobile: boolean
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
        onDrag,
        onClick
    )

    // Register cards with use-canvas-card-layering hook
    useEffect(() => {
        registerRef(index, groupRef.current)
        return () => registerRef(index, null)
    }, [groupRef, index, registerRef])

    const isActiveDrag = isDraggingState || isDraggingInGroup
    const showButtonFrame =
        !isViewMode && !isMobile && !isActiveDrag && isHovered
    // Drop shadow only while dragging (not tied to viewport zoom).
    const shadowFilter = isActiveDrag
        ? 'url(#canvas-card-shadow-active)'
        : undefined
    const cardLabel = card.name?.trim() || 'Untitled'

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
            aria-label={`Select card ${index + 1}: ${cardLabel}`}
            onClick={() => isViewMode && onClick(index)}
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
                    <Card
                        index={index}
                        name={card.name ?? ''}
                        renderRotation={renderRotation}
                        selected={selected}
                        groupSelected={groupSelected}
                        isButtonHoverActive={showButtonFrame}
                        badgeRef={badgeRef}
                    />
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
