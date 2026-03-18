'use client'

import { useEffect, useRef } from 'react'

interface UseCanvasSpacePanArgs {
    containerRef: { current: HTMLDivElement | null }
    targetZoomRef: { current: number }
    panRef: { current: { x: number; y: number } }
    getClampedPan: (rawX: number, rawY: number) => { x: number; y: number }
    schedulePanUpdate: (nextPan: { x: number; y: number }) => void
}

// Manage spacebar + mouse drag panning and the related cursor states. This
// keeps pointer-panning behavior separate from wheel/touch gesture handling.
export function useCanvasSpacePan({
    containerRef,
    targetZoomRef,
    panRef,
    getClampedPan,
    schedulePanUpdate,
}: UseCanvasSpacePanArgs) {
    // ------------ INTERACTION REFS ------------ //

    // These refs track the current keyboard/pan gesture without forcing rerenders
    // during mouse movement.
    const isSpaceHeldRef = useRef(false)
    const isPanningRef = useRef(false)
    const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

    // ------------ EVENT LIFECYCLE ------------ //

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // Holding space arms the canvas for grab-to-pan, except while typing in
        // form controls.
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code !== 'Space') return
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
            e.preventDefault()
            isSpaceHeldRef.current = true
            container.style.cursor = 'grab'
        }

        // Releasing space always exits panning and restores the default cursor.
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code !== 'Space') return
            isSpaceHeldRef.current = false
            isPanningRef.current = false
            container.style.cursor = ''
        }

        // Capture the mouse origin and current pan so drag deltas can be applied
        // relative to the viewport state at drag start.
        const handleMouseDown = (e: MouseEvent) => {
            if (!isSpaceHeldRef.current) return
            isPanningRef.current = true
            container.style.cursor = 'grabbing'
            panStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                panX: panRef.current.x,
                panY: panRef.current.y,
            }
        }

        // Convert screen-space movement into canvas-space panning using the
        // current zoom level, then clamp through the shared viewport helpers.
        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return
            const currentZoom = targetZoomRef.current
            const dx = (e.clientX - panStartRef.current.x) / currentZoom
            const dy = (e.clientY - panStartRef.current.y) / currentZoom
            const next = getClampedPan(
                panStartRef.current.panX - dx,
                panStartRef.current.panY - dy
            )
            schedulePanUpdate(next)
        }

        // Ending the drag keeps the "grab" cursor only if space is still held.
        const handleMouseUp = () => {
            if (!isPanningRef.current) return
            isPanningRef.current = false
            container.style.cursor = isSpaceHeldRef.current ? 'grab' : ''
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        container.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            container.style.cursor = ''
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            container.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [containerRef, getClampedPan, panRef, schedulePanUpdate, targetZoomRef])

    // ------------ PUBLIC API ------------ //

    return {
        isSpaceHeldRef,
    }
}
