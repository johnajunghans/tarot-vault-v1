'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { useGSAP } from '@gsap/react'
import {
    CANVAS_BOUNDS,
    CARD_HEIGHT,
    CARD_HOVER_HIT_PADDING_X,
    CARD_HOVER_HIT_PADDING_Y,
    CARD_WIDTH,
    GRID_SIZE,
} from '../../lib'

gsap.registerPlugin(Draggable)

export { CARD_WIDTH, CARD_HEIGHT } from '../../lib'
import { CardBack } from './card-back'

const CORNER_R = 8
const FULL_ROTATION = 360

function getCardNameFontSize(name: string): number {
    const length = name.trim().length

    if (length <= 12) return 14
    if (length <= 20) return 12.5
    if (length <= 30) return 11
    return 9.5
}

function splitCardNameIntoLines(name: string): string[] {
    const trimmed = name.trim()
    if (!trimmed) return []

    const words = trimmed.split(/\s+/)
    const lines: string[] = []
    const maxCharsPerLine =
        trimmed.length <= 18 ? 12 : trimmed.length <= 30 ? 14 : 16

    let currentLine = ''

    const pushCurrentLine = () => {
        if (currentLine) {
            lines.push(currentLine)
            currentLine = ''
        }
    }

    for (const word of words) {
        if (lines.length === 2) break

        const nextLine = currentLine ? `${currentLine} ${word}` : word
        if (nextLine.length <= maxCharsPerLine) {
            currentLine = nextLine
            continue
        }

        if (!currentLine) {
            lines.push(word.slice(0, maxCharsPerLine))
            continue
        }

        pushCurrentLine()
        currentLine = word
    }

    pushCurrentLine()

    if (lines.length > 2) {
        return lines.slice(0, 2)
    }

    if (lines.length === 2) {
        const consumed = lines.join(' ').length
        if (consumed < trimmed.length) {
            lines[1] = `${lines[1].slice(0, Math.max(lines[1].length - 1, 0))}…`
        }
    }

    if (lines.length === 1 && lines[0].length < trimmed.length) {
        lines[0] = `${lines[0].slice(0, Math.max(lines[0].length - 1, 0))}…`
    }

    return lines
}

function normalizeRotationForDisplay(rotation: number): number {
    return ((rotation % FULL_ROTATION) + FULL_ROTATION) % FULL_ROTATION
}

import type { CanvasCard } from '../types'

interface CanvasCardProps {
    card: CanvasCard
    index: number
    renderRotation: number
    isButtonHoverActive: boolean
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
}

function CanvasCard({
    card,
    index,
    renderRotation,
    isButtonHoverActive,
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
}: CanvasCardProps) {
    const [isDraggingState, setIsDraggingState] = useState(false)

    const groupRef = useRef<SVGGElement>(null)
    const rotationRef = useRef<SVGGElement>(null)
    const badgeRef = useRef<SVGGElement>(null)
    const draggableRef = useRef<Draggable | null>(null)
    const isDraggingRef = useRef(false)

    useGSAP(
        () => {
            const group = groupRef.current
            if (!group) return

            gsap.set(group, { x: card.x, y: card.y })
            if (rotationRef.current) {
                gsap.set(rotationRef.current, {
                    rotation: renderRotation,
                    svgOrigin: `${CARD_WIDTH / 2} ${CARD_HEIGHT / 2}`,
                })
            }
            if (badgeRef.current) {
                gsap.set(badgeRef.current, {
                    rotation: -renderRotation,
                    svgOrigin: '15 15',
                })
            }
            if (isViewMode) return

            const [instance] = Draggable.create(group, {
                type: 'x,y',
                liveSnap: {
                    x: (value) => {
                        const snapped = Math.round(value / GRID_SIZE) * GRID_SIZE
                        return Math.max(
                            CANVAS_BOUNDS.minX,
                            Math.min(CANVAS_BOUNDS.maxX, snapped)
                        )
                    },
                    y: (value) => {
                        const snapped = Math.round(value / GRID_SIZE) * GRID_SIZE
                        return Math.max(
                            CANVAS_BOUNDS.minY,
                            Math.min(CANVAS_BOUNDS.maxY, snapped)
                        )
                    },
                },
                onDragStart: function () {
                    isDraggingRef.current = true
                    setIsDraggingState(true)
                    onDragStart(index, this.x, this.y)
                },
                onDrag: function () {
                    onDrag(index, this.x, this.y)
                },
                onDragEnd: function () {
                    isDraggingRef.current = false
                    setIsDraggingState(false)
                    onDragEnd(index, this.x, this.y)
                },
                onClick: function () {
                    onClick(index)
                },
                cursor: 'pointer',
                activeCursor: 'grabbing',
            })

            draggableRef.current = instance

            return () => {
                instance.kill()
            }
        },
        {
            dependencies: [
                index,
                isViewMode,
                onDragStart,
                onDragEnd,
                onDrag,
                onClick,
            ],
        }
    )

    useEffect(() => {
        if (!groupRef.current || isDraggingRef.current) return
        gsap.set(groupRef.current, { x: card.x, y: card.y })
        draggableRef.current?.update()
    }, [card.x, card.y])

    useEffect(() => {
        const duration = isDraggingRef.current ? 0 : 0.18

        if (rotationRef.current) {
            gsap.to(rotationRef.current, {
                rotation: renderRotation,
                svgOrigin: `${CARD_WIDTH / 2} ${CARD_HEIGHT / 2}`,
                duration,
                ease: 'power2.out',
                overwrite: true,
            })
        }
        if (badgeRef.current) {
            gsap.to(badgeRef.current, {
                rotation: -renderRotation,
                svgOrigin: '15 15',
                duration,
                ease: 'power2.out',
                overwrite: true,
            })
        }
    }, [renderRotation])

    useEffect(() => {
        registerRef(index, groupRef.current)
        return () => registerRef(index, null)
    }, [index, registerRef])

    const isActiveDrag = isDraggingState || isDraggingInGroup
    const isHighlighted = selected || groupSelected
    const badgeColor = isHighlighted ? 'var(--gold)' : 'var(--gold-muted)'
    const cardName = card.name?.trim() ?? ''
    const hasCardName = cardName.length > 0
    const displayName = hasCardName ? cardName : 'Untitled'
    const cardNameFontSize = getCardNameFontSize(displayName)
    const cardNameLines = splitCardNameIntoLines(displayName)
    const normalizedRenderRotation = normalizeRotationForDisplay(renderRotation)
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

    return (
        <g
            ref={groupRef}
            data-spread-card-interactive="true"
            onClick={isViewMode ? () => onClick(index) : undefined}
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
                        isButtonHoverActive={isButtonHoverActive}
                    />

                    <g ref={badgeRef}>
                        <circle
                            cx={16}
                            cy={16}
                            r={10}
                            fill={badgeColor}
                            fillOpacity={isButtonHoverActive || isHighlighted ? 0.9 : 0.7}
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
                                    fillOpacity={hasCardName ? (isButtonHoverActive || isHighlighted ? 0.9 : 0.7) : 0.5}
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
        </g>
    )
}

function arePropsEqual(prev: CanvasCardProps, next: CanvasCardProps): boolean {
    return (
        prev.card === next.card &&
        prev.index === next.index &&
        prev.renderRotation === next.renderRotation &&
        prev.isButtonHoverActive === next.isButtonHoverActive &&
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
    )
}

export default memo(CanvasCard, arePropsEqual)
