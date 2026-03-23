'use client'

import type { ComponentType, PointerEvent as ReactPointerEvent } from 'react'
import { memo, useCallback, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import {
    RotateLeft01Icon,
    RotateRight01Icon,
    Rotate01Icon,
    LayerSendToBackIcon,
    LayerBringToFrontIcon,
} from 'hugeicons-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { cn } from '@/lib/utils'
import { CARD_WIDTH, CARD_HEIGHT } from '../../lib'
import { snapToKeyAngle, normalizeRotationForStorage } from '../../lib/rotation'
import type { CanvasCard } from '../types'

const BUTTON_R = 14
const BUTTON_ICON_SIZE = 14
const BUTTON_SIZE = BUTTON_R * 2
const BUTTON_OFFSET = 5
const ROTATION_SENSITIVITY = 1.2

interface CardButtonFrameProps {
    card: CanvasCard
    cardIndex: number
    zoom: number
    totalCards: number
    onRotateStep: (index: number, direction: 1 | -1) => void
    onRotationChange: (index: number, value: number) => void
    onBringToFront: (index: number) => void
    onSendToBack: (index: number) => void
    isAtFront: boolean
    isAtBack: boolean
    onFrameMouseEnter: () => void
    onFrameMouseLeave: () => void
}

function HtmlIconButton({
    x,
    y,
    icon: Icon,
    onClick,
    disabled,
    label,
    isActive = false,
}: {
    x: number
    y: number
    icon: ComponentType<{ size?: number; className?: string }>
    onClick: () => void
    disabled?: boolean
    label: string
    isActive?: boolean
}) {
    return (
        <foreignObject
            x={x}
            y={y}
            width={BUTTON_SIZE}
            height={BUTTON_SIZE}
            style={{ pointerEvents: 'auto', overflow: 'visible' }}
        >
            <div className="flex size-full items-center justify-center">
                <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={label}
                    disabled={disabled}
                    className={cn(
                        'bg-background/90 shadow-sm backdrop-blur-sm',
                        isActive && 'border-gold text-foreground'
                    )}
                    onClick={(e) => {
                        e.stopPropagation()
                        onClick()
                    }}
                >
                    <Icon size={BUTTON_ICON_SIZE} className="opacity-80" />
                </Button>
            </div>
        </foreignObject>
    )
}

function LayerButtonGroup({
    x,
    y,
    onSendToBack,
    onBringToFront,
    isAtBack,
    isAtFront,
}: {
    x: number
    y: number
    onSendToBack: () => void
    onBringToFront: () => void
    isAtBack: boolean
    isAtFront: boolean
}) {
    return (
        <foreignObject
            x={x}
            y={y}
            width={BUTTON_SIZE * 2}
            height={BUTTON_SIZE}
            style={{ pointerEvents: 'auto', overflow: 'visible' }}
        >
            <div className="flex size-full items-center justify-center">
                <ButtonGroup>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Send to back"
                        disabled={isAtBack}
                        className="bg-background/90 shadow-sm backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            onSendToBack()
                        }}
                    >
                        <LayerSendToBackIcon size={BUTTON_ICON_SIZE} className="opacity-80" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Bring to front"
                        disabled={isAtFront}
                        className="bg-background/90 shadow-sm backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            onBringToFront()
                        }}
                    >
                        <LayerBringToFrontIcon size={BUTTON_ICON_SIZE} className="opacity-80" />
                    </Button>
                </ButtonGroup>
            </div>
        </foreignObject>
    )
}

function RotationDragButton({
    isDraggingRotation,
    onPointerDown,
    onPointerMove,
    onPointerUp,
}: {
    isDraggingRotation: boolean
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void
}) {
    return (
        <foreignObject
            x={-BUTTON_R}
            y={-BUTTON_R}
            width={BUTTON_SIZE}
            height={BUTTON_SIZE}
            style={{ pointerEvents: 'auto', overflow: 'visible' }}
        >
            <div className="flex size-full items-center justify-center">
                <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Drag to rotate"
                    className={cn(
                        'h-7 w-7 rounded-full bg-background/90 shadow-sm backdrop-blur-sm',
                        isDraggingRotation && 'border-gold text-foreground'
                    )}
                    style={{
                        cursor: isDraggingRotation ? 'grabbing' : 'grab',
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                >
                    <Rotate01Icon size={BUTTON_ICON_SIZE} className="opacity-80" />
                </Button>
            </div>
        </foreignObject>
    )
}

function CardButtonFrame({
    card,
    cardIndex,
    zoom,
    totalCards,
    onRotateStep,
    onRotationChange,
    onBringToFront,
    onSendToBack,
    isAtFront,
    isAtBack,
    onFrameMouseEnter,
    onFrameMouseLeave,
}: CardButtonFrameProps) {
    const rootRef = useRef<SVGGElement>(null)
    const tooltipRef = useRef<SVGGElement>(null)
    const [isDraggingRotation, setIsDraggingRotation] = useState(false)
    const [tooltipAngle, setTooltipAngle] = useState<number | null>(null)

    const dragStartRef = useRef<{ x: number; y: number; startAngle: number } | null>(null)
    const accumulatedAngleRef = useRef(0)

    useGSAP(
        () => {
            if (!rootRef.current) return
            const buttons = rootRef.current.querySelectorAll('[data-btn]')
            gsap.from(buttons, {
                scale: 0.7,
                opacity: 0,
                duration: 0.12,
                stagger: 0.02,
                ease: 'power2.out',
                overwrite: true,
            })
        },
        { scope: rootRef, dependencies: [cardIndex] }
    )

    const handleContinuousPointerDown = useCallback(
        (e: ReactPointerEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            e.preventDefault()
            e.currentTarget.setPointerCapture(e.pointerId)
            dragStartRef.current = { x: e.clientX, y: e.clientY, startAngle: card.r }
            accumulatedAngleRef.current = 0
            setIsDraggingRotation(true)
            setTooltipAngle(card.r)
        },
        [card.r]
    )

    const handleContinuousPointerMove = useCallback(
        (e: ReactPointerEvent<HTMLButtonElement>) => {
            if (!dragStartRef.current) return
            e.stopPropagation()

            const deltaX = e.clientX - dragStartRef.current.x
            const deltaY = e.clientY - dragStartRef.current.y
            const rawDelta = (-deltaX + -deltaY) * ROTATION_SENSITIVITY
            const rawAngle = dragStartRef.current.startAngle + rawDelta
            const snapped = snapToKeyAngle(rawAngle)

            accumulatedAngleRef.current = rawDelta
            setTooltipAngle(snapped)
            onRotationChange(cardIndex, snapped)
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
            onRotationChange(cardIndex, snapToKeyAngle(currentAngle))

            dragStartRef.current = null
            accumulatedAngleRef.current = 0
            setIsDraggingRotation(false)
            setTooltipAngle(null)
        },
        [cardIndex, onRotationChange]
    )

    const scale = 1 / zoom
    const showLayerButtons = totalCards > 1

    const topY = -BUTTON_OFFSET
    const bottomY = CARD_HEIGHT + BUTTON_OFFSET
    const leftX = -BUTTON_OFFSET
    const rightX = CARD_WIDTH + BUTTON_OFFSET
    const centerX = CARD_WIDTH / 2

    return (
        <g
            ref={rootRef}
            transform={`translate(${card.x}, ${card.y})`}
            style={{ pointerEvents: 'none' }}
            onMouseEnter={onFrameMouseEnter}
            onMouseLeave={onFrameMouseLeave}
        >
            {/* Top-left: Rotate CCW */}
            <g data-btn transform={`translate(${leftX}, ${topY}) scale(${scale})`}>
                <HtmlIconButton
                    x={-BUTTON_R}
                    y={-BUTTON_R}
                    icon={RotateLeft01Icon}
                    onClick={() => onRotateStep(cardIndex, -1)}
                    label="Rotate counter-clockwise"
                />
            </g>

            {/* Top-center: Continuous rotation drag handle */}
            <g data-btn transform={`translate(${centerX}, ${topY}) scale(${scale})`}>
                <RotationDragButton
                    isDraggingRotation={isDraggingRotation}
                    onPointerDown={handleContinuousPointerDown}
                    onPointerMove={handleContinuousPointerMove}
                    onPointerUp={handleContinuousPointerUp}
                />

                {/* Angle tooltip during continuous rotation */}
                {isDraggingRotation && tooltipAngle !== null && (
                    <g ref={tooltipRef}>
                        <rect
                            x={-20}
                            y={-BUTTON_R - 22}
                            width={40}
                            height={18}
                            rx={4}
                            fill="var(--foreground)"
                            fillOpacity={0.85}
                        />
                        <text
                            x={0}
                            y={-BUTTON_R - 10}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight={500}
                            fill="var(--background)"
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                            className="font-mono"
                        >
                            {tooltipAngle}&deg;
                        </text>
                    </g>
                )}
            </g>

            {/* Top-right: Rotate CW */}
            <g data-btn transform={`translate(${rightX}, ${topY}) scale(${scale})`}>
                <HtmlIconButton
                    x={-BUTTON_R}
                    y={-BUTTON_R}
                    icon={RotateRight01Icon}
                    onClick={() => onRotateStep(cardIndex, 1)}
                    label="Rotate clockwise"
                />
            </g>

            {/* Bottom-center: Layer controls */}
            {showLayerButtons && (
                <g data-btn transform={`translate(${centerX}, ${bottomY}) scale(${scale})`}>
                    <LayerButtonGroup
                        x={-BUTTON_SIZE}
                        y={-BUTTON_R}
                        onSendToBack={() => onSendToBack(cardIndex)}
                        onBringToFront={() => onBringToFront(cardIndex)}
                        isAtBack={isAtBack}
                        isAtFront={isAtFront}
                    />
                </g>
            )}
        </g>
    )
}

export default memo(CardButtonFrame)
