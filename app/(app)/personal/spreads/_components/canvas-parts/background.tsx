'use client'

interface CanvasBackgroundProps {
    svgWidth: number
    svgHeight: number
    gridSize: number
    isViewMode: boolean
    dragGridFill: string
    dragGridFillOpacity: string
}

export default function CanvasBackground({
    svgWidth,
    svgHeight,
    gridSize,
    isViewMode,
    dragGridFill,
    dragGridFillOpacity,
}: CanvasBackgroundProps) {
    return (
        <>
            <defs>
                <pattern
                    id="stone-texture"
                    width="120"
                    height="120"
                    patternUnits="userSpaceOnUse"
                >
                    {/* <rect width="120" height="120" fill="var(--canvas-bg)" fillOpacity={themeBasedStyles.stoneTextureFillOpacity} /> */}
                    {/* Stone grain lines */}
                    {/* <line x1="0" y1="30" x2="120" y2="35" stroke="var(--canvas-stone)" strokeWidth="0.5" strokeOpacity="0.3" />
            <line x1="0" y1="70" x2="80" y2="72" stroke="var(--canvas-stone)" strokeWidth="0.3" strokeOpacity="0.2" />
            <line x1="40" y1="0" x2="42" y2="120" stroke="var(--canvas-stone)" strokeWidth="0.3" strokeOpacity="0.15" />
            <line x1="90" y1="0" x2="95" y2="90" stroke="var(--canvas-stone)" strokeWidth="0.4" strokeOpacity="0.2" /> */}
                    {/* Faint gold vein fragment */}
                    {/* <line x1="60" y1="50" x2="85" y2="48" stroke="var(--canvas-vein)" strokeWidth="0.5" strokeOpacity="0.12" /> */}
                </pattern>

                <pattern
                    id="drag-grid"
                    width={gridSize * 2}
                    height={gridSize * 2}
                    patternUnits="userSpaceOnUse"
                >
                    <circle
                        cx={gridSize}
                        cy={gridSize}
                        r={0.6}
                        fill={dragGridFill}
                        fillOpacity={dragGridFillOpacity}
                    />
                </pattern>

                <radialGradient id="canvas-vignette" cx="50%" cy="40%" r="55%">
                    <stop
                        offset="0%"
                        stopColor="var(--gold)"
                        stopOpacity="0.02"
                    />
                    <stop
                        offset="100%"
                        stopColor="transparent"
                        stopOpacity="0"
                    />
                </radialGradient>
            </defs>

            <rect
                width={svgWidth}
                height={svgHeight}
                fill="url(#stone-texture)"
            />

            <rect
                width={svgWidth}
                height={svgHeight}
                fill="url(#canvas-vignette)"
            />

            {!isViewMode && (
                <rect
                    width={svgWidth}
                    height={svgHeight}
                    fill="url(#drag-grid)"
                    style={{
                        opacity: 1,
                        transition: 'opacity 200ms ease',
                    }}
                    pointerEvents="none"
                />
            )}

            <line
                x1={svgWidth - 1}
                y1={0}
                x2={svgWidth - 1}
                y2={svgHeight}
                stroke="var(--border)"
                strokeOpacity={0.85}
                strokeWidth={2}
                pointerEvents="none"
            />
            <line
                x1={0}
                y1={svgHeight - 1}
                x2={svgWidth}
                y2={svgHeight - 1}
                stroke="var(--border)"
                strokeOpacity={0.85}
                strokeWidth={2}
                pointerEvents="none"
            />
        </>
    )
}
