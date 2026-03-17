'use client'

import { CARD_WIDTH, CARD_HEIGHT } from '../../../spread-layout'

const CORNER_R = 8

interface CardBackProps {
    selected: boolean
    groupSelected: boolean
}

export function CardBack({ selected, groupSelected }: CardBackProps) {
    const isHighlighted = selected || groupSelected
    const borderColor = isHighlighted ? 'var(--gold)' : 'var(--gold-muted)'
    const borderOpacity = isHighlighted ? 0.9 : 0.5
    const fillOpacity = isHighlighted ? 0.18 : 0.1
    const accentOpacity = isHighlighted ? 0.5 : 0.2
    const cx = CARD_WIDTH / 2
    const cy = CARD_HEIGHT / 2

    return (
        <>
            <rect
                x={0}
                y={0}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                rx={CORNER_R}
                fill="var(--card)"
                stroke={borderColor}
                strokeWidth={1.5}
                strokeOpacity={borderOpacity}
            />
            <rect
                x={5}
                y={5}
                width={CARD_WIDTH - 10}
                height={CARD_HEIGHT - 10}
                rx={4}
                fill="none"
                stroke={borderColor}
                strokeWidth={0.5}
                strokeOpacity={accentOpacity}
            />
            <rect
                x={8}
                y={8}
                width={CARD_WIDTH - 16}
                height={CARD_HEIGHT - 16}
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
            <line
                x1={cx}
                y1={14}
                x2={cx}
                y2={CARD_HEIGHT - 14}
                stroke={borderColor}
                strokeWidth={0.4}
                strokeOpacity={accentOpacity * 0.6}
            />
            <line
                x1={14}
                y1={cy}
                x2={CARD_WIDTH - 14}
                y2={cy}
                stroke={borderColor}
                strokeWidth={0.4}
                strokeOpacity={accentOpacity * 0.6}
            />
            <line
                x1={14}
                y1={14}
                x2={CARD_WIDTH - 14}
                y2={CARD_HEIGHT - 14}
                stroke={borderColor}
                strokeWidth={0.3}
                strokeOpacity={accentOpacity * 0.5}
            />
            <line
                x1={CARD_WIDTH - 14}
                y1={14}
                x2={14}
                y2={CARD_HEIGHT - 14}
                stroke={borderColor}
                strokeWidth={0.3}
                strokeOpacity={accentOpacity * 0.5}
            />
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
        </>
    )
}
