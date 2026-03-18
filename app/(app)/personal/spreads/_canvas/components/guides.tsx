'use client'

import type { CanvasGuide } from '../types'

interface CanvasGuidesProps {
    guides: CanvasGuide[]
    svgWidth: number
    svgHeight: number
}

export default function CanvasGuides({
    guides,
    svgWidth,
    svgHeight,
}: CanvasGuidesProps) {
    return (
        <>
            {guides.map((guide) =>
                guide.axis === 'v' ? (
                    <line
                        key={`v-${guide.pos}`}
                        x1={guide.pos}
                        y1={0}
                        x2={guide.pos}
                        y2={svgHeight}
                        stroke="var(--gold)"
                        strokeOpacity={0.35}
                        strokeWidth={0.75}
                        strokeDasharray="4 4"
                        pointerEvents="none"
                    />
                ) : (
                    <line
                        key={`h-${guide.pos}`}
                        x1={0}
                        y1={guide.pos}
                        x2={svgWidth}
                        y2={guide.pos}
                        stroke="var(--gold)"
                        strokeOpacity={0.35}
                        strokeWidth={0.75}
                        strokeDasharray="4 4"
                        pointerEvents="none"
                    />
                )
            )}
        </>
    )
}
