'use client'

import { ArrowUp01Icon } from 'hugeicons-react'
import type { OffscreenPointer } from '../types'

const POINTER_ICON_SIZE = 16

interface CanvasPointerOverlayProps {
    pointers: OffscreenPointer[]
}

export default function CanvasPointerOverlay({
    pointers,
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
                        size={POINTER_ICON_SIZE}
                        strokeWidth={2.15}
                        style={{ transform: `rotate(${pointer.rotation}deg)` }}
                    />
                </div>
            ))}
        </div>
    )
}
