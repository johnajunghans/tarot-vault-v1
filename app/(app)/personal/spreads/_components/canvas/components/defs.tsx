'use client'

export default function CanvasDefs() {
    return (
        <defs>
            <filter
                id="canvas-card-shadow-active"
                x="-25%"
                y="-25%"
                width="150%"
                height="150%"
            >
                <feDropShadow
                    dx={0}
                    dy={5}
                    stdDeviation={6}
                    floodColor="black"
                    floodOpacity={0.24}
                />
            </filter>
        </defs>
    )
}
