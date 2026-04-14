'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { memo, useCallback, useRef, useState } from 'react'
import { CARD_WIDTH, CARD_HEIGHT } from '../../../lib'
import { getNextKeyAngle, normalizeRotationForStorage } from '../../../lib/rotation'
import CardButtonGroup from '../../card/button-panel/card-button-group'

const BUTTON_R = 14
const BUTTON_ICON_SIZE = 14
const BUTTON_SIZE = BUTTON_R * 2
const TOOLTIP_DELAY = 1000
const ROTATION_SENSITIVITY = 1.2
/** 1 = full 1/zoom compensation; lower = softer (less shrink at max zoom, less growth at min zoom). */
const BUTTON_ZOOM_COMPENSATION = 0.72
const PANEL_COLS = 3
const PANEL_ROWS = 2
const PANEL_WIDTH = BUTTON_SIZE * PANEL_COLS
const PANEL_HEIGHT = BUTTON_SIZE * PANEL_ROWS

interface CardButtonPanelProps {
    cardIndex: number
    rotation: number
    zoom: number
    totalCards: number
    onRotateStep: (index: number, direction: 1 | -1) => void
    onRotationChange: (index: number, value: number) => void
    onBringToFront: (index: number) => void
    onSendToBack: (index: number) => void
    onDeleteCard: (index: number) => void
    isAtFront: boolean
    isAtBack: boolean
}

function CardButtonPanel({
    cardIndex,
    rotation,
    zoom,
    totalCards,
    onRotateStep,
    onRotationChange,
    onBringToFront,
    onSendToBack,
    onDeleteCard,
    isAtFront,
    isAtBack,
}: CardButtonPanelProps) {
    const [isDraggingRotation, setIsDraggingRotation] = useState(false)
    const [tooltipAngle, setTooltipAngle] = useState<number | null>(null)

    const dragStartRef = useRef<{ x: number; y: number; startAngle: number } | null>(null)
    const accumulatedAngleRef = useRef(0)
    const stepTooltipTimeoutRef = useRef<number | null>(null)

    const handleContinuousPointerDown = useCallback(
        (e: ReactPointerEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            e.preventDefault()
            e.currentTarget.setPointerCapture(e.pointerId)
            dragStartRef.current = { x: e.clientX, y: e.clientY, startAngle: rotation }
            accumulatedAngleRef.current = 0
            setIsDraggingRotation(true)
            setTooltipAngle(rotation)
        },
        [rotation]
    )

    const handleContinuousPointerMove = useCallback(
        (e: ReactPointerEvent<HTMLButtonElement>) => {
            if (!dragStartRef.current) return
            e.stopPropagation()

            const deltaX = e.clientX - dragStartRef.current.x
            const deltaY = e.clientY - dragStartRef.current.y
            const rawDelta = (-deltaX + -deltaY) * ROTATION_SENSITIVITY
            const rawAngle = dragStartRef.current.startAngle + rawDelta
            const normalized = normalizeRotationForStorage(rawAngle)

            accumulatedAngleRef.current = rawDelta
            setTooltipAngle(normalized)
            onRotationChange(cardIndex, normalized)
        },
        [cardIndex, onRotationChange]
    )

    const handleContinuousPointerUp = useCallback(
        (e: ReactPointerEvent<HTMLButtonElement>) => {
            if (!dragStartRef.current) return
            e.stopPropagation()
            e.currentTarget.releasePointerCapture(e.pointerId)

            const currentAngle = normalizeRotationForStorage(
                dragStartRef.current.startAngle + accumulatedAngleRef.current * ROTATION_SENSITIVITY
            )
            onRotationChange(cardIndex, currentAngle)

            dragStartRef.current = null
            accumulatedAngleRef.current = 0
            setIsDraggingRotation(false)
            setTooltipAngle(null)
        },
        [cardIndex, onRotationChange]
    )

    const STEP_TOOLTIP_DURATION = 800

    const handleStepRotate = useCallback(
        (direction: 1 | -1) => {
            // Show the resulting angle in the tooltip briefly
            const nextAngle = getNextKeyAngle(rotation, direction)
            setTooltipAngle(nextAngle)

            if (stepTooltipTimeoutRef.current !== null) {
                window.clearTimeout(stepTooltipTimeoutRef.current)
            }
            stepTooltipTimeoutRef.current = window.setTimeout(() => {
                setTooltipAngle(null)
                stepTooltipTimeoutRef.current = null
            }, STEP_TOOLTIP_DURATION)

            onRotateStep(cardIndex, direction)
        },
        [rotation, cardIndex, onRotateStep]
    )

    const scale = zoom ** -BUTTON_ZOOM_COMPENSATION
    const centerX = CARD_WIDTH / 2
    const centerY = CARD_HEIGHT / 2
    const canReorderCards = totalCards > 1

    return (
        <g style={{ pointerEvents: 'none' }}>
            <g
                data-btn
                transform={`translate(${centerX}, ${centerY}) scale(${scale})`}
            >
                <CardButtonGroup
                    x={-PANEL_WIDTH / 2}
                    y={-PANEL_HEIGHT / 2}
                    tooltipAngle={tooltipAngle}
                    isDraggingRotation={isDraggingRotation}
                    canReorderCards={canReorderCards}
                    isAtBack={isAtBack}
                    isAtFront={isAtFront}
                    onRotateCCW={() => handleStepRotate(-1)}
                    onRotateDragStart={handleContinuousPointerDown}
                    onRotateDragMove={handleContinuousPointerMove}
                    onRotateDragEnd={handleContinuousPointerUp}
                    onRotateCW={() => handleStepRotate(1)}
                    onSendToBack={() => onSendToBack(cardIndex)}
                    onBringToFront={() => onBringToFront(cardIndex)}
                    onDelete={() => onDeleteCard(cardIndex)}
                />
            </g>
        </g>
    )
}

export default memo(CardButtonPanel)