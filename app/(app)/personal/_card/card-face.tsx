'use client'

import { type Ref } from 'react'
import { CARD_WIDTH, CARD_HEIGHT } from './constants'
import {
    getCardNameFontSize,
    splitCardNameIntoLines,
    normalizeRotationForDisplay,
} from './card-helpers'

const CORNER_R = 8
const FULL_ROTATION = 360
const BUTTON_HOVER_STROKE_OPACITY_BOOST = 0.18

export interface CardProps {
    index: number
    name: string
    renderRotation: number
    selected: boolean
    groupSelected?: boolean
    isButtonHoverActive?: boolean
    badgeRef?: Ref<SVGGElement>
}

export function Card({
    index,
    name,
    renderRotation,
    selected,
    groupSelected = false,
    isButtonHoverActive = false,
    badgeRef,
}: CardProps) {
    const isHighlighted = selected || groupSelected
    const badgeColor = isHighlighted ? 'var(--gold)' : 'var(--gold-muted)'

    // --- card back ---
    const borderColor = isHighlighted ? 'var(--gold)' : 'var(--gold-muted)'
    const borderOpacity = isHighlighted ? 0.9 : 0.5
    const outerStrokeOpacity = Math.min(
        1,
        borderOpacity + (isButtonHoverActive ? BUTTON_HOVER_STROKE_OPACITY_BOOST : 0)
    )
    const fillOpacity = isHighlighted ? 0.18 : 0.1
    const accentOpacity = isHighlighted ? 0.5 : 0.2
    const cx = CARD_WIDTH / 2
    const cy = CARD_HEIGHT / 2

    // --- card name ---
    const cardName = name.trim()
    const hasCardName = cardName.length > 0
    const displayName = hasCardName ? cardName : 'Untitled'
    const cardNameFontSize = getCardNameFontSize(displayName)
    const cardNameLines = splitCardNameIntoLines(displayName)
    const normalizedRenderRotation = normalizeRotationForDisplay(renderRotation, FULL_ROTATION)
    const shouldFlipCardName = normalizedRenderRotation > 90 && normalizedRenderRotation < 270
    const cardNameLineHeight = cardNameFontSize * 1.05
    const cardNameBaseY = CARD_HEIGHT - (cardNameLines.length === 1 ? 24 : 31)
    const cardNameCenterY =
        cardNameBaseY + ((cardNameLines.length - 1) * cardNameLineHeight) / 2
    const cardNameTransform = shouldFlipCardName
        ? `rotate(180 ${CARD_WIDTH / 2} ${cardNameCenterY})`
        : undefined

    return (
        <>
            {/* focus ring */}
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

            {/* selection ring */}
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

            {/* card back artwork */}
            <rect
                x={0} y={0}
                width={CARD_WIDTH} height={CARD_HEIGHT}
                rx={CORNER_R}
                fill="var(--card)"
                stroke={borderColor}
                strokeWidth={1.5}
                strokeOpacity={outerStrokeOpacity}
            />
            <rect
                x={5} y={5}
                width={CARD_WIDTH - 10} height={CARD_HEIGHT - 10}
                rx={4}
                fill="none"
                stroke={borderColor}
                strokeWidth={0.5}
                strokeOpacity={accentOpacity}
            />
            <rect
                x={8} y={8}
                width={CARD_WIDTH - 16} height={CARD_HEIGHT - 16}
                rx={3}
                fill="var(--gold)"
                fillOpacity={fillOpacity}
                stroke="none"
            />
            <polygon
                points={`${cx},${cy - 22} ${cx + 15},${cy} ${cx},${cy + 22} ${cx - 15},${cy}`}
                fill="none"
                stroke={borderColor}
                strokeWidth={0.75}
                strokeOpacity={accentOpacity * 1.4}
            />
            <polygon
                points={`${cx},${cy - 12} ${cx + 8},${cy} ${cx},${cy + 12} ${cx - 8},${cy}`}
                fill="var(--gold)"
                fillOpacity={fillOpacity * 1.5}
                stroke="none"
            />
            <line x1={cx} y1={14} x2={cx} y2={CARD_HEIGHT - 14}
                stroke={borderColor} strokeWidth={0.4} strokeOpacity={accentOpacity * 0.6} />
            <line x1={14} y1={cy} x2={CARD_WIDTH - 14} y2={cy}
                stroke={borderColor} strokeWidth={0.4} strokeOpacity={accentOpacity * 0.6} />
            <line x1={14} y1={14} x2={CARD_WIDTH - 14} y2={CARD_HEIGHT - 14}
                stroke={borderColor} strokeWidth={0.3} strokeOpacity={accentOpacity * 0.5} />
            <line x1={CARD_WIDTH - 14} y1={14} x2={14} y2={CARD_HEIGHT - 14}
                stroke={borderColor} strokeWidth={0.3} strokeOpacity={accentOpacity * 0.5} />
            {[
                { x: 14, y: 14 },
                { x: CARD_WIDTH - 14, y: 14 },
                { x: 14, y: CARD_HEIGHT - 14 },
                { x: CARD_WIDTH - 14, y: CARD_HEIGHT - 14 },
            ].map((pos, i) => (
                <polygon
                    key={i}
                    points={`${pos.x},${pos.y - 4} ${pos.x + 3},${pos.y} ${pos.x},${pos.y + 4} ${pos.x - 3},${pos.y}`}
                    fill={borderColor}
                    fillOpacity={accentOpacity * 1.2}
                    stroke="none"
                />
            ))}

            {/* badge */}
            <g ref={badgeRef}>
                <circle
                    cx={16} cy={16} r={10}
                    fill={badgeColor}
                    fillOpacity={isButtonHoverActive || isHighlighted ? 0.9 : 0.7}
                />
                <text
                    x={15.75} y={19.75}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--background)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                    className="font-bold font-mono"
                >
                    {index + 1}
                </text>
            </g>

            {/* card name */}
            {cardNameLines.length > 0 && (
                <g transform={cardNameTransform}>
                    {cardNameLines.map((line, lineIndex) => (
                        <text
                            key={`${index}-name-${lineIndex}`}
                            x={CARD_WIDTH / 2}
                            y={
                                cardNameCenterY +
                                (lineIndex - (cardNameLines.length - 1) / 2) *
                                    cardNameLineHeight
                            }
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="var(--foreground)"
                            fillOpacity={
                                hasCardName
                                    ? isButtonHoverActive || isHighlighted ? 0.9 : 0.7
                                    : 0.5
                            }
                            fontSize={cardNameFontSize}
                            fontStyle={hasCardName ? undefined : 'italic'}
                            fontWeight={hasCardName ? 600 : 500}
                            style={{
                                pointerEvents: 'none',
                                userSelect: 'none',
                                fontFamily: 'var(--font-philosopher)',
                            }}
                        >
                            {line}
                        </text>
                    ))}
                </g>
            )}
        </>
    )
}
