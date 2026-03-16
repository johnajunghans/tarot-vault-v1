'use client'

import { ArrowUp01Icon } from 'hugeicons-react'

interface OffscreenPointer {
    index: number
    x: number
    y: number
    rotation: number
    label: string
}

interface CanvasPointerOverlayProps {
    pointers: OffscreenPointer[]
    iconSize: number
}

export default function CanvasPointerOverlay({
    pointers,
    iconSize,
}: CanvasPointerOverlayProps) {
    if (pointers.length === 0) return null

    return (
        <div className="pointer-events-none absolute inset-0 z-[1]">
            {pointers.map((pointer) => (
                <div
                    key={pointer.index}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-muted-foreground/60"
                    style={{ left: pointer.x, top: pointer.y }}
                    aria-hidden="true"
                    title={pointer.label}
                >
                    <ArrowUp01Icon
                        className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]"
                        size={iconSize}
                        strokeWidth={2.15}
                        style={{ transform: `rotate(${pointer.rotation}deg)` }}
                    />
                </div>
            ))}
        </div>
    )
}

export type { OffscreenPointer }
