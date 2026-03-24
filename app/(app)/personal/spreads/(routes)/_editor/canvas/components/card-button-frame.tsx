'use client'

import type { ComponentType, PointerEvent as ReactPointerEvent } from 'react'
import { memo, useCallback, useRef, useState } from 'react'
import {
    Rotate01Icon,
    LayerSendToBackIcon,
    LayerBringToFrontIcon,
    RotateTopLeftIcon,
    RotateTopRightIcon,
    Delete02Icon,
} from 'hugeicons-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CARD_WIDTH, CARD_HEIGHT } from '../../lib'
import { snapToKeyAngle, normalizeRotationForStorage } from '../../lib/rotation'
import type { CanvasCard } from '../types'

const BUTTON_R = 14
const BUTTON_ICON_SIZE = 14
const BUTTON_SIZE = BUTTON_R * 2
const BUTTON_OFFSET = 10
const TOOLTIP_DELAY = 1000
const ROTATION_SENSITIVITY = 1.2
/** 1 = full 1/zoom compensation; lower = softer (less shrink at max zoom, less growth at min zoom). */
const BUTTON_ZOOM_COMPENSATION = 0.72

interface CardButtonFrameProps {
    card: CanvasCard
    cardIndex: number
    zoom: number
    totalCards: number
    onRotateStep: (index: number, direction: 1 | -1) => void
    onRotationChange: (index: number, value: number) => void
    onBringToFront: (index: number) => void
    onSendToBack: (index: number) => void
    onDeleteCard: (index: number) => void
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
                        'bg-background/25 shadow-sm backdrop-blur-xs',
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

function BottomButtonGroup({
    x,
    y,
    onSendToBack,
    onBringToFront,
    onDelete,
    isAtBack,
    isAtFront,
    showLayerButtons,
}: {
    x: number
    y: number
    onSendToBack: () => void
    onBringToFront: () => void
    onDelete: () => void
    isAtBack: boolean
    isAtFront: boolean
    showLayerButtons: boolean
}) {
    const buttonCount = showLayerButtons ? 3 : 1

    return (
        <foreignObject
            x={x}
            y={y}
            width={BUTTON_SIZE * buttonCount}
            height={BUTTON_SIZE}
            style={{ pointerEvents: 'auto', overflow: 'visible' }}
        >
            <div className="flex size-full items-center justify-center">
                <TooltipProvider delay={TOOLTIP_DELAY}>
                <ButtonGroup>
                    {showLayerButtons && (
                        <>
                            <TooltipRoot>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            aria-label="Send to back"
                                            disabled={isAtBack}
                                            className="bg-background/25 shadow-sm backdrop-blur-xs"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onSendToBack()
                                            }}
                                        >
                                            <LayerSendToBackIcon size={BUTTON_ICON_SIZE} className="opacity-80" />
                                        </Button>
                                    }
                                />
                                <TooltipContent side="bottom">Send to back</TooltipContent>
                            </TooltipRoot>
                            <TooltipRoot>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            aria-label="Bring to front"
                                            disabled={isAtFront}
                                            className="bg-background/25 shadow-sm backdrop-blur-xs"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onBringToFront()
                                            }}
                                        >
                                            <LayerBringToFrontIcon size={BUTTON_ICON_SIZE} className="opacity-80" />
                                        </Button>
                                    }
                                />
                                <TooltipContent side="bottom">Bring to front</TooltipContent>
                            </TooltipRoot>
                        </>
                    )}
                    <TooltipRoot>
                        <TooltipTrigger
                            render={
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label="Delete card"
                                    className="bg-background/25 shadow-sm backdrop-blur-xs text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete()
                                    }}
                                >
                                    <Delete02Icon size={BUTTON_ICON_SIZE} className="opacity-80" />
                                </Button>
                            }
                        />
                        <TooltipContent side="bottom">Remove position</TooltipContent>
                    </TooltipRoot>
                </ButtonGroup>
                </TooltipProvider>
            </div>
        </foreignObject>
    )
}

function RotationButtonGroup({
    x,
    y,
    isDraggingRotation,
    onRotateCCW,
    onRotateCW,
    onPointerDown,
    onPointerMove,
    onPointerUp,
}: {
    x: number
    y: number
    isDraggingRotation: boolean
    onRotateCCW: () => void
    onRotateCW: () => void
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void
}) {
    return (
        <foreignObject
            x={x}
            y={y}
            width={BUTTON_SIZE * 3}
            height={BUTTON_SIZE}
            style={{ pointerEvents: 'auto', overflow: 'visible' }}
        >
            <div className="flex size-full items-center justify-center">
                <TooltipProvider delay={TOOLTIP_DELAY}>
                <ButtonGroup>
                        <TooltipRoot>
                            <TooltipTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        aria-label="Rotate counter-clockwise"
                                        className="bg-background/25 shadow-sm backdrop-blur-xs"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onRotateCCW()
                                        }}
                                    >
                                        <RotateTopLeftIcon size={BUTTON_ICON_SIZE} className="opacity-80" />
                                    </Button>
                                }
                            />
                            <TooltipContent side="top">Rotate left</TooltipContent>
                        </TooltipRoot>
                        <TooltipRoot>
                            <TooltipTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        aria-label="Drag to rotate"
                                        className={cn(
                                            'bg-background/25 shadow-sm backdrop-blur-xs',
                                            isDraggingRotation && 'border-gold text-foreground'
                                        )}
                                        style={{ cursor: isDraggingRotation ? 'grabbing' : 'grab' }}
                                        onPointerDown={onPointerDown}
                                        onPointerMove={onPointerMove}
                                        onPointerUp={onPointerUp}
                                    >
                                        <Rotate01Icon size={BUTTON_ICON_SIZE} className="opacity-80" />
                                    </Button>
                                }
                            />
                            <TooltipContent side="top">Drag to rotate</TooltipContent>
                        </TooltipRoot>
                        <TooltipRoot>
                            <TooltipTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        aria-label="Rotate clockwise"
                                        className="bg-background/25 shadow-sm backdrop-blur-xs"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onRotateCW()
                                        }}
                                    >
                                        <RotateTopRightIcon size={BUTTON_ICON_SIZE} className="opacity-80" />
                                    </Button>
                                }
                            />
                            <TooltipContent side="top">Rotate right</TooltipContent>
                        </TooltipRoot>
                </ButtonGroup>
                </TooltipProvider>
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
    onDeleteCard,
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

    // useGSAP(
    //     () => {
    //         if (!rootRef.current) return
    //         const buttons = rootRef.current.querySelectorAll('[data-btn]')
    //         gsap.from(buttons, {
    //             // scale: 0.7,
    //             opacity: 0,
    //             duration: 0.12,
    //             // stagger: 0.02,
    //             ease: 'power2.out',
    //             overwrite: true,
    //         })
    //     },
    //     { scope: rootRef, dependencies: [cardIndex] }
    // )

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

    const scale = zoom ** -BUTTON_ZOOM_COMPENSATION
    const showLayerButtons = totalCards > 1

    const topY = -BUTTON_OFFSET
    const bottomY = CARD_HEIGHT + BUTTON_OFFSET
    const centerX = CARD_WIDTH / 2

    return (
        <g
            ref={rootRef}
            transform={`translate(${card.x}, ${card.y})`}
            style={{ pointerEvents: 'none' }}
            onMouseEnter={onFrameMouseEnter}
            onMouseLeave={onFrameMouseLeave}
        >
            {/* Top-center: Rotation button group */}
            <g data-btn transform={`translate(${centerX}, ${topY}) scale(${scale})`}>
                <RotationButtonGroup
                    x={-(BUTTON_SIZE * 3) / 2}
                    y={-BUTTON_R}
                    isDraggingRotation={isDraggingRotation}
                    onRotateCCW={() => onRotateStep(cardIndex, -1)}
                    onRotateCW={() => onRotateStep(cardIndex, 1)}
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

            {/* Bottom-center: Layer controls + delete */}
            <g data-btn transform={`translate(${centerX}, ${bottomY}) scale(${scale})`}>
                <BottomButtonGroup
                    x={-(BUTTON_SIZE * (showLayerButtons ? 3 : 1)) / 2}
                    y={-BUTTON_R}
                    onSendToBack={() => onSendToBack(cardIndex)}
                    onBringToFront={() => onBringToFront(cardIndex)}
                    onDelete={() => onDeleteCard(cardIndex)}
                    isAtBack={isAtBack}
                    isAtFront={isAtFront}
                    showLayerButtons={showLayerButtons}
                />
            </g>
        </g>
    )
}

export default memo(CardButtonFrame)
