'use client'

interface CanvasMarqueeProps {
    rect: {
        x: number
        y: number
        width: number
        height: number
    } | null
}

export default function CanvasMarquee({ rect }: CanvasMarqueeProps) {
    if (!rect) return null

    return (
        <rect
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="var(--gold)"
            fillOpacity={0.08}
            stroke="var(--gold)"
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="4 3"
            pointerEvents="none"
        />
    )
}
