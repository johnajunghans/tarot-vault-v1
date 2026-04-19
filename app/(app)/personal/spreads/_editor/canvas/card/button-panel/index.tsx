'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { memo, useCallback, useRef, useState } from 'react'
import { CARD_WIDTH, CARD_HEIGHT } from '../../../_lib'
import { getNextKeyAngle, normalizeRotationForStorage } from '../../../_lib/rotation'
import CardButtonGroup from './card-button-group'
import {
    BUTTON_ZOOM_COMPENSATION,
    PANEL_HEIGHT,
    PANEL_WIDTH,
    ROTATION_SENSITIVITY,
} from './button-panel-constants'

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
    setDisableDrag: (value: boolean) => void
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
    setDisableDrag
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
            setDisableDrag(true)
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
            setDisableDrag(false)
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