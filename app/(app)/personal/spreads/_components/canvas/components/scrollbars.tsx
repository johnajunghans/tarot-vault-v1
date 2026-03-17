'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'

const TRACK_MARGIN = 4
const TRACK_THICKNESS = 6
const TRACK_THICKNESS_HOVER = 8
const THUMB_MIN_LENGTH = 24
const CORNER_GAP = 14

interface CanvasScrollbarsProps {
    panX: number
    panY: number
    viewportWidth: number
    viewportHeight: number
    canvasWidth: number
    canvasHeight: number
    isActive: boolean
    onPan: (pan: { x: number; y: number }) => void
}

function CanvasScrollbarsComponent({
    panX,
    panY,
    viewportWidth,
    viewportHeight,
    canvasWidth,
    canvasHeight,
    isActive,
    onPan,
}: CanvasScrollbarsProps) {
    const [isDragging, setIsDragging] = useState<'h' | 'v' | null>(null)
    const [isHovered, setIsHovered] = useState<'h' | 'v' | null>(null)
    const dragRef = useRef<{
        axis: 'h' | 'v'
        startMouse: number
        startPanX: number
        startPanY: number
        trackLength: number
    } | null>(null)
    const hTrackRef = useRef<HTMLDivElement>(null)
    const vTrackRef = useRef<HTMLDivElement>(null)
    const onPanRef = useRef(onPan)

    useEffect(() => {
        onPanRef.current = onPan
    }, [onPan])

    const hRatio = canvasWidth > 0 ? viewportWidth / canvasWidth : 1
    const vRatio = canvasHeight > 0 ? viewportHeight / canvasHeight : 1

    const showH = hRatio < 1
    const showV = vRatio < 1

    const maxPanX = Math.max(canvasWidth - viewportWidth, 0)
    const maxPanY = Math.max(canvasHeight - viewportHeight, 0)

    const hThumbFraction = Math.min(1, hRatio)
    const vThumbFraction = Math.min(1, vRatio)

    const hScrollFraction = maxPanX > 0 ? panX / maxPanX : 0
    const vScrollFraction = maxPanY > 0 ? panY / maxPanY : 0

    const visible = isActive || isDragging !== null || isHovered !== null

    const handleMouseDown = useCallback(
        (axis: 'h' | 'v', e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            const trackEl = axis === 'h' ? hTrackRef.current : vTrackRef.current
            if (!trackEl) return

            const trackRect = trackEl.getBoundingClientRect()
            const trackLength =
                axis === 'h' ? trackRect.width : trackRect.height

            dragRef.current = {
                axis,
                startMouse: axis === 'h' ? e.clientX : e.clientY,
                startPanX: panX,
                startPanY: panY,
                trackLength,
            }
            setIsDragging(axis)
        },
        [panX, panY]
    )

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: MouseEvent) => {
            const drag = dragRef.current
            if (!drag) return

            const mouseDelta =
                drag.axis === 'h'
                    ? e.clientX - drag.startMouse
                    : e.clientY - drag.startMouse

            const thumbFraction =
                drag.axis === 'h' ? hThumbFraction : vThumbFraction
            const scrollableTrack = drag.trackLength * (1 - thumbFraction)

            if (scrollableTrack <= 0) return

            const panDelta =
                drag.axis === 'h'
                    ? (mouseDelta / scrollableTrack) * maxPanX
                    : (mouseDelta / scrollableTrack) * maxPanY

            const nextPan = {
                x: drag.axis === 'h'
                    ? Math.max(0, Math.min(maxPanX, drag.startPanX + panDelta))
                    : drag.startPanX,
                y: drag.axis === 'v'
                    ? Math.max(0, Math.min(maxPanY, drag.startPanY + panDelta))
                    : drag.startPanY,
            }

            onPanRef.current(nextPan)
        }

        const handleMouseUp = () => {
            dragRef.current = null
            setIsDragging(null)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, hThumbFraction, vThumbFraction, maxPanX, maxPanY])

    if (!showH && !showV) return null

    const thickness = isHovered || isDragging ? TRACK_THICKNESS_HOVER : TRACK_THICKNESS

    return (
        <div
            className="pointer-events-none absolute inset-0 z-[2]"
            aria-hidden="true"
        >
            {/* Horizontal scrollbar */}
            {showH && (
                <div
                    ref={hTrackRef}
                    className="absolute"
                    style={{
                        left: TRACK_MARGIN,
                        right: TRACK_MARGIN + (showV ? CORNER_GAP : 0),
                        bottom: TRACK_MARGIN,
                        height: thickness,
                        transition: 'height 150ms ease',
                    }}
                >
                    <div
                        className="pointer-events-auto absolute rounded-full bg-[var(--scrollbar)] cursor-pointer"
                        style={{
                            left: `${hScrollFraction * (1 - hThumbFraction) * 100}%`,
                            width: `${hThumbFraction * 100}%`,
                            minWidth: THUMB_MIN_LENGTH,
                            top: 0,
                            bottom: 0,
                            opacity: visible ? 1 : 0,
                            transition: 'opacity 300ms ease',
                        }}
                        onMouseDown={(e) => handleMouseDown('h', e)}
                        onMouseEnter={() => setIsHovered('h')}
                        onMouseLeave={() => setIsHovered(null)}
                    />
                </div>
            )}

            {/* Vertical scrollbar */}
            {showV && (
                <div
                    ref={vTrackRef}
                    className="absolute"
                    style={{
                        top: TRACK_MARGIN,
                        bottom: TRACK_MARGIN + (showH ? CORNER_GAP : 0),
                        right: TRACK_MARGIN,
                        width: thickness,
                        transition: 'width 150ms ease',
                    }}
                >
                    <div
                        className="pointer-events-auto absolute rounded-full bg-[var(--scrollbar)] cursor-pointer"
                        style={{
                            top: `${vScrollFraction * (1 - vThumbFraction) * 100}%`,
                            height: `${vThumbFraction * 100}%`,
                            minHeight: THUMB_MIN_LENGTH,
                            left: 0,
                            right: 0,
                            opacity: visible ? 1 : 0,
                            transition: 'opacity 300ms ease',
                        }}
                        onMouseDown={(e) => handleMouseDown('v', e)}
                        onMouseEnter={() => setIsHovered('v')}
                        onMouseLeave={() => setIsHovered(null)}
                    />
                </div>
            )}
        </div>
    )
}

const CanvasScrollbars = memo(CanvasScrollbarsComponent)

CanvasScrollbars.displayName = 'CanvasScrollbars'

export default CanvasScrollbars
