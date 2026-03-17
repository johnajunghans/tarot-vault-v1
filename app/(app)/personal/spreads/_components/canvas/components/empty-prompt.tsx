'use client'

import {
    CANVAS_CENTER,
    CARD_HEIGHT,
    CARD_WIDTH,
} from '../../../spread-layout'

interface CanvasEmptyPromptProps {
    strokeOpacity: string
}

export default function CanvasEmptyPrompt({
    strokeOpacity,
}: CanvasEmptyPromptProps) {
    return (
        <g pointerEvents="none">
            <rect
                x={CANVAS_CENTER.x - CARD_WIDTH / 2}
                y={CANVAS_CENTER.y - CARD_HEIGHT / 2}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                rx={8}
                fill="none"
                stroke="var(--gold)"
                strokeWidth={1}
                strokeOpacity={strokeOpacity}
                strokeDasharray="6 4"
                className="animate-gentle-pulse"
            />
            <text
                x={CANVAS_CENTER.x}
                y={CANVAS_CENTER.y + CARD_HEIGHT / 2 + 34}
                textAnchor="middle"
                fontSize={13}
                fill="var(--muted-foreground)"
                fillOpacity={0.6}
                fontFamily="var(--font-nunito), sans-serif"
            >
                Double-click to place your first position
            </text>
        </g>
    )
}
