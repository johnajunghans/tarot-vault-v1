'use client'

import { useMemo } from 'react'
import { CanvasCard, CanvasDragState } from '../types'
import { CanvasGuide, generateGuideLines } from './generate-guide-lines'

interface CanvasGuidesProps {
    effectiveCards: CanvasCard[]
    dragging: CanvasDragState | null
    groupSelectedIndices: ReadonlySet<number>
    isViewMode: boolean
    svgWidth: number
    svgHeight: number
}

export default function CanvasGuides({
    effectiveCards,
    dragging,
    groupSelectedIndices,
    isViewMode,
    svgWidth,
    svgHeight,
}: CanvasGuidesProps) {

    const guides = useMemo<CanvasGuide[]>(() => {
        // No guides while viewing or when nothing is actively being dragged.
        if (isViewMode || !dragging) return []

        // Group drags intentionally skip guides to avoid noisy overlays.
        if (
            groupSelectedIndices.size > 1 &&
            groupSelectedIndices.has(dragging.index)
        ) {
            return []
        }

        return generateGuideLines(effectiveCards, dragging)
    }, [effectiveCards, dragging, groupSelectedIndices, isViewMode])

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
