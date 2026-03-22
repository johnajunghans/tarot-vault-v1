'use client'

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
import { CARD_WIDTH, CARD_HEIGHT } from '../../lib'
import { snapToKeyAngle, normalizeRotationForStorage } from '../../lib/rotation'
import type { CanvasCard } from '../types'

const BUTTON_R = 14
const BUTTON_ICON_SIZE = 14
const BUTTON_OFFSET = 10
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
}

function SvgIconButton({
    cx,
    cy,
    icon: Icon,
    onClick,
    disabled,
    label,
}: {
    cx: number
    cy: number
    icon: React.ComponentType<{ size?: number; className?: string }>
    onClick: () => void
    disabled?: boolean
    label: string
}) {
    return (
        <g
            style={{
                cursor: disabled ? 'default' : 'pointer',
                pointerEvents: 'auto',
            }}
            onClick={(e) => {
                e.stopPropagation()
                if (!disabled) onClick()
            }}
            role="button"
            aria-label={label}
            aria-disabled={disabled || undefined}
        >
            <circle
                cx={cx}
                cy={cy}
                r={BUTTON_R}
                fill="var(--background)"
                fillOpacity={0.92}
                stroke="var(--border)"
                strokeWidth={1}
            />
            <foreignObject
                x={cx - BUTTON_ICON_SIZE / 2}
                y={cy - BUTTON_ICON_SIZE / 2}
                width={BUTTON_ICON_SIZE}
                height={BUTTON_ICON_SIZE}
                style={{ pointerEvents: 'none', overflow: 'visible' }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        opacity: disabled ? 0.35 : 0.8,
                    }}
                >
                    <Icon size={BUTTON_ICON_SIZE} />
                </div>
            </foreignObject>
        </g>
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
        (e: React.PointerEvent) => {
            e.stopPropagation()
            e.preventDefault()
            ;(e.target as Element).setPointerCapture(e.pointerId)
            dragStartRef.current = { x: e.clientX, y: e.clientY, startAngle: card.r }
            accumulatedAngleRef.current = 0
            setIsDraggingRotation(true)
            setTooltipAngle(card.r)
        },
        [card.r]
    )

    const handleContinuousPointerMove = useCallback(
        (e: React.PointerEvent) => {
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
        (e: React.PointerEvent) => {
            if (!dragStartRef.current) return
            e.stopPropagation()
            ;(e.target as Element).releasePointerCapture(e.pointerId)

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
        >
            {/* Top-left: Rotate CCW */}
            <g data-btn transform={`translate(${leftX}, ${topY}) scale(${scale})`}>
                <SvgIconButton
                    cx={0}
                    cy={0}
                    icon={RotateLeft01Icon}
                    onClick={() => onRotateStep(cardIndex, -1)}
                    label="Rotate counter-clockwise"
                />
            </g>

            {/* Top-center: Continuous rotation drag handle */}
            <g data-btn transform={`translate(${centerX}, ${topY}) scale(${scale})`}>
                <g
                    style={{
                        cursor: isDraggingRotation ? 'grabbing' : 'grab',
                        pointerEvents: 'auto',
                    }}
                    onPointerDown={handleContinuousPointerDown}
                    onPointerMove={handleContinuousPointerMove}
                    onPointerUp={handleContinuousPointerUp}
                    role="button"
                    aria-label="Drag to rotate"
                >
                    <circle
                        cx={0}
                        cy={0}
                        r={BUTTON_R}
                        fill="var(--background)"
                        fillOpacity={0.92}
                        stroke={isDraggingRotation ? 'var(--gold)' : 'var(--border)'}
                        strokeWidth={isDraggingRotation ? 1.5 : 1}
                    />
                    <foreignObject
                        x={-BUTTON_ICON_SIZE / 2}
                        y={-BUTTON_ICON_SIZE / 2}
                        width={BUTTON_ICON_SIZE}
                        height={BUTTON_ICON_SIZE}
                        style={{ pointerEvents: 'none', overflow: 'visible' }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                                opacity: 0.8,
                            }}
                        >
                            <Rotate01Icon size={BUTTON_ICON_SIZE} />
                        </div>
                    </foreignObject>
                </g>

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
                <SvgIconButton
                    cx={0}
                    cy={0}
                    icon={RotateRight01Icon}
                    onClick={() => onRotateStep(cardIndex, 1)}
                    label="Rotate clockwise"
                />
            </g>

            {/* Bottom-center: Layer controls */}
            {showLayerButtons && (
                <g data-btn transform={`translate(${centerX}, ${bottomY}) scale(${scale})`}>
                    <SvgIconButton
                        cx={-BUTTON_R - 1}
                        cy={0}
                        icon={LayerSendToBackIcon}
                        onClick={() => onSendToBack(cardIndex)}
                        disabled={isAtBack}
                        label="Send to back"
                    />
                    <SvgIconButton
                        cx={BUTTON_R + 1}
                        cy={0}
                        icon={LayerBringToFrontIcon}
                        onClick={() => onBringToFront(cardIndex)}
                        disabled={isAtFront}
                        label="Bring to front"
                    />
                </g>
            )}
        </g>
    )
}

export default memo(CardButtonFrame)
