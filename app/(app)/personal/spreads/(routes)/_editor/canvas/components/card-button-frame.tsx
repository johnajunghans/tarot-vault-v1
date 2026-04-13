'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { memo, useCallback, useRef, useState } from 'react'
import {
    Delete02Icon,
    LayerBringToFrontIcon,
    LayerSendToBackIcon,
    Rotate01Icon,
    RotateTopLeftIcon,
    RotateTopRightIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CARD_WIDTH, CARD_HEIGHT } from '../../lib'
import { getNextKeyAngle, normalizeRotationForStorage } from '../../lib/rotation'
import type { CanvasCard } from '../types'

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

interface ToolbarButtonProps {
    label: string
    icon: typeof Delete02Icon
    onClick?: () => void
    disabled?: boolean
    tone?: 'default' | 'danger'
    edgeClassName?: string
    className?: string
    style?: React.CSSProperties
    onPointerDown?: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onPointerMove?: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onPointerUp?: (e: ReactPointerEvent<HTMLButtonElement>) => void
}

function ToolbarButton({
    label,
    icon,
    onClick,
    disabled = false,
    tone = 'default',
    edgeClassName,
    className,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp,
}: ToolbarButtonProps) {
    return (
        <TooltipRoot>
            <TooltipTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={label}
                        disabled={disabled}
                        className={cn(
                            'size-7 rounded-none border-border/60 bg-background/70 text-foreground shadow-sm backdrop-blur-md transition-colors',
                            'hover:bg-background/85',
                            'disabled:border-border/35 disabled:bg-background/35 disabled:text-muted-foreground/70',
                            tone === 'danger' &&
                                'text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:text-destructive/55',
                            edgeClassName,
                            className
                        )}
                        style={style}
                        onClick={(e) => {
                            e.stopPropagation()
                            onClick?.()
                        }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                    >
                        <HugeiconsIcon
                            icon={icon}
                            size={BUTTON_ICON_SIZE}
                            className="opacity-85"
                        />
                    </Button>
                }
            />
            <TooltipContent side="top">{label}</TooltipContent>
        </TooltipRoot>
    )
}

function CenteredButtonPanel({
    x,
    y,
    tooltipAngle,
    isDraggingRotation,
    canReorderCards,
    isAtBack,
    isAtFront,
    onRotateCCW,
    onRotateDragStart,
    onRotateDragMove,
    onRotateDragEnd,
    onRotateCW,
    onSendToBack,
    onBringToFront,
    onDelete,
}: {
    x: number
    y: number
    tooltipAngle: number | null
    isDraggingRotation: boolean
    canReorderCards: boolean
    isAtBack: boolean
    isAtFront: boolean
    onRotateCCW: () => void
    onRotateDragStart: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onRotateDragMove: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onRotateDragEnd: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onRotateCW: () => void
    onSendToBack: () => void
    onBringToFront: () => void
    onDelete: () => void
}) {
    return (
        <foreignObject
            x={x}
            y={y}
            width={PANEL_WIDTH}
            height={PANEL_HEIGHT}
            style={{ pointerEvents: 'auto', overflow: 'visible' }}
        >
            <div className="relative flex size-full items-center justify-center">
                <TooltipProvider delay={TOOLTIP_DELAY}>
                    {tooltipAngle !== null && (
                        <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2">
                            <div className="flex h-5 w-11 items-center justify-center rounded-full border border-white/15 bg-foreground/88 px-2 shadow-md">
                                <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-background">
                                    {tooltipAngle}&deg;
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="grid size-full grid-cols-3 gap-0">
                        <ToolbarButton
                            label="Rotate left"
                            icon={RotateTopLeftIcon}
                            edgeClassName="rounded-tl-[12px]"
                            onClick={onRotateCCW}
                        />
                        <ToolbarButton
                            label="Drag to rotate"
                            icon={Rotate01Icon}
                            className={cn(
                                isDraggingRotation &&
                                    'border-gold/70 bg-gold/12 text-foreground shadow-md'
                            )}
                            style={{
                                cursor: isDraggingRotation ? 'grabbing' : 'grab',
                            }}
                            onPointerDown={onRotateDragStart}
                            onPointerMove={onRotateDragMove}
                            onPointerUp={onRotateDragEnd}
                        />
                        <ToolbarButton
                            label="Rotate right"
                            icon={RotateTopRightIcon}
                            edgeClassName="rounded-tr-[12px]"
                            onClick={onRotateCW}
                        />
                        <ToolbarButton
                            label="Send to back"
                            icon={LayerSendToBackIcon}
                            edgeClassName="rounded-bl-[12px]"
                            disabled={!canReorderCards || isAtBack}
                            onClick={onSendToBack}
                        />
                        <ToolbarButton
                            label="Bring to front"
                            icon={LayerBringToFrontIcon}
                            disabled={!canReorderCards || isAtFront}
                            onClick={onBringToFront}
                        />
                        <ToolbarButton
                            label="Remove position"
                            icon={Delete02Icon}
                            tone="danger"
                            edgeClassName="rounded-br-[12px]"
                            onClick={onDelete}
                        />
                    </div>
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
            const nextAngle = getNextKeyAngle(card.r, direction)
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
        [card.r, cardIndex, onRotateStep]
    )

    const scale = zoom ** -BUTTON_ZOOM_COMPENSATION
    const centerX = CARD_WIDTH / 2
    const centerY = CARD_HEIGHT / 2
    const canReorderCards = totalCards > 1

    return (
        <g
            transform={`translate(${card.x}, ${card.y})`}
            style={{ pointerEvents: 'none' }}
            onMouseEnter={onFrameMouseEnter}
            onMouseLeave={onFrameMouseLeave}
        >
            <g
                data-btn
                transform={`translate(${centerX}, ${centerY}) scale(${scale})`}
            >
                <CenteredButtonPanel
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

export default memo(CardButtonFrame)
