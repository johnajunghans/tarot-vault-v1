'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLatestRef } from '@/hooks/use-latest-ref'
import { getSnappedClampedPosition } from '../lib/geometry'
import { CANVAS_BOUNDS, GRID_SIZE } from '../../lib'
import type { CanvasCard } from '../types'
import type { CanvasPoint, SpreadCanvasPositionUpdate } from '../types'

type TransientPositions = Record<number, CanvasPoint>

// Compare two transient position maps so we can avoid redundant state updates
// during drag frames.
function areTransientPositionsEqual(
    prev: TransientPositions,
    next: TransientPositions
) {
    const prevKeys = Object.keys(prev)
    const nextKeys = Object.keys(next)

    if (prevKeys.length !== nextKeys.length) return false

    return nextKeys.every((key) => {
        const index = Number(key)
        return prev[index]?.x === next[index]?.x && prev[index]?.y === next[index]?.y
    })
}

// Overlay temporary drag positions onto the persisted card list so the canvas
// can render "live" movement before the final positions are committed.
function getEffectiveCards(
    cards: CanvasCard[],
    transientPositions: TransientPositions
) {
    return cards.map((card, index) => {
        const nextPosition = transientPositions[index]
        return nextPosition
            ? { ...card, x: nextPosition.x, y: nextPosition.y }
            : card
    })
}

// Build the next drag frame for the active card and any other cards moving as a
// selected group. Group members preserve their offset from the dragged card
// while still snapping and clamping to canvas bounds.
function buildDragUpdates(
    index: number,
    x: number,
    y: number,
    groupDragOrigins: Map<number, CanvasPoint>,
    dragStartPos: CanvasPoint | null,
    bounds = CANVAS_BOUNDS,
    gridSize = GRID_SIZE
) {
    const updates: TransientPositions = {
        [index]: { x, y },
    }

    if (groupDragOrigins.size > 0 && dragStartPos) {
        const dx = x - dragStartPos.x
        const dy = y - dragStartPos.y

        for (const [groupIndex, origin] of groupDragOrigins) {
            const { x: clampedX, y: clampedY } = getSnappedClampedPosition(
                origin.x + dx,
                origin.y + dy,
                bounds,
                gridSize
            )

            updates[groupIndex] = { x: clampedX, y: clampedY }
        }
    }

    return updates
}

// Convert the internal transient position map into the array shape expected by
// the form write-back callback.
function toPositionUpdates(updates: TransientPositions): SpreadCanvasPositionUpdate[] {
    return Object.entries(updates).map(([key, value]) => ({
        index: Number(key),
        x: value.x,
        y: value.y,
    }))
}

interface UseCanvasDragArgs {
    cards: CanvasCard[]
    onPositionsCommit?: (updates: SpreadCanvasPositionUpdate[]) => void
}

// Manages drag interactions for one card or a selected group. The hook keeps
// transient positions in local state for smooth rendering, then commits the
// final snapped positions back to the caller when the drag ends.
export function useCanvasDrag({
    cards,
    onPositionsCommit,
}: UseCanvasDragArgs) {
    // ------------ DRAG STATE ------------ //

    // `dragging` drives UI that depends on the active drag target.
    const [dragging, setDragging] = useState<{
        index: number
        x: number
        y: number
    } | null>(null)

    // Transient positions represent in-progress drag coordinates that have not
    // yet been written back to the form/source of truth.
    const [transientPositions, setTransientPositions] = useState<TransientPositions>(
        {}
    )

    // Refs mirror drag state so animation-frame updates can read/write the
    // latest values without stale closures or extra rerenders.
    const transientPositionsRef = useRef<TransientPositions>({})
    const pendingTransientPositionsRef = useRef<TransientPositions | null>(null)
    const transientFrameRef = useRef(0)
    const draggingRef = useRef<{ index: number; x: number; y: number } | null>(null)
    const dragStartPos = useRef<CanvasPoint | null>(null)
    const groupSelectedRef = useRef<Set<number>>(new Set())
    const groupDragOrigins = useRef<Map<number, CanvasPoint>>(new Map())

    // ------------ DERIVED CARDS ------------ //

    // Consumers render `effectiveCards` so drag motion appears immediately.
    const effectiveCards = useMemo(
        () => getEffectiveCards(cards, transientPositions),
        [cards, transientPositions]
    )

    // Read the freshest card positions inside drag callbacks.
    const latestEffectiveCardsRef = useLatestRef(effectiveCards)

    // If the source cards change outside an active drag, clear any stale
    // transient positions so the hook resyncs to the new canonical state.
    useEffect(() => {
        if (draggingRef.current) return
        if (Object.keys(transientPositionsRef.current).length === 0) return

        transientPositionsRef.current = {}
        pendingTransientPositionsRef.current = null
        const frame = window.requestAnimationFrame(() => {
            setTransientPositions({})
        })

        return () => {
            window.cancelAnimationFrame(frame)
        }
    }, [cards])

    // Clean up any queued animation frame when the hook unmounts.
    useEffect(() => {
        return () => {
            if (transientFrameRef.current !== 0) {
                window.cancelAnimationFrame(transientFrameRef.current)
            }
        }
    }, [])

    // ------------ SELECTION SYNC ------------ //

    // Selection lives in a sibling hook, so drag stores only the latest set it
    // needs to decide whether a drag should move one card or many.
    const updateGroupSelection = useCallback((next: Set<number>) => {
        groupSelectedRef.current = next
    }, [])

    // ------------ TRANSIENT POSITION BUFFERING ------------ //

    // Flush the most recent queued drag frame into React state once per
    // animation frame.
    const flushTransientPositions = useCallback(() => {
        transientFrameRef.current = 0
        const next = pendingTransientPositionsRef.current
        pendingTransientPositionsRef.current = null
        if (!next) return

        transientPositionsRef.current = next
        setTransientPositions((prev) =>
            areTransientPositionsEqual(prev, next) ? prev : next
        )
    }, [])

    // Batch drag updates into a single animation-frame commit so frequent GSAP
    // drag events do not force React state updates on every pointer movement.
    const scheduleTransientPositions = useCallback(
        (updates: TransientPositions) => {
            const base =
                pendingTransientPositionsRef.current ?? transientPositionsRef.current
            const next = { ...base }
            let hasChanged = false

            for (const [key, value] of Object.entries(updates)) {
                const index = Number(key)
                if (next[index]?.x === value.x && next[index]?.y === value.y) {
                    continue
                }

                next[index] = value
                hasChanged = true
            }

            if (!hasChanged) return

            pendingTransientPositionsRef.current = next

            if (transientFrameRef.current !== 0) return

            transientFrameRef.current = window.requestAnimationFrame(
                flushTransientPositions
            )
        },
        [flushTransientPositions]
    )

    // Capture the current drag snapshot using the latest group state and drag
    // origin refs.
    const buildCurrentDragUpdates = useCallback(
        (index: number, x: number, y: number) =>
            buildDragUpdates(
                index,
                x,
                y,
                groupDragOrigins.current,
                dragStartPos.current
            ),
        []
    )

    // Immediately apply the final transient state at drag end so the last frame
    // is visible before the caller persists the positions.
    const commitTransientPositions = useCallback((updates: TransientPositions) => {
        if (transientFrameRef.current !== 0) {
            window.cancelAnimationFrame(transientFrameRef.current)
            transientFrameRef.current = 0
        }

        pendingTransientPositionsRef.current = null
        const next = { ...transientPositionsRef.current, ...updates }
        transientPositionsRef.current = next
        setTransientPositions((prev) =>
            areTransientPositionsEqual(prev, next) ? prev : next
        )
    }, [])

    // ------------ DRAG LIFECYCLE ------------ //

    // Initialize drag bookkeeping and capture the original positions for any
    // group-selected cards that need to move relative to the dragged card.
    const handleDragStart = useCallback((index: number, x: number, y: number) => {
        setDragging({ index, x, y })
        draggingRef.current = { index, x, y }

        const currentCard = latestEffectiveCardsRef.current[index]
        dragStartPos.current = currentCard
            ? { x: currentCard.x, y: currentCard.y }
            : { x, y }

        if (
            groupSelectedRef.current.has(index) &&
            groupSelectedRef.current.size > 1
        ) {
            const origins = new Map<number, CanvasPoint>()
            for (const groupIndex of groupSelectedRef.current) {
                if (groupIndex === index) continue
                const groupCard = latestEffectiveCardsRef.current[groupIndex]
                if (groupCard) {
                    origins.set(groupIndex, {
                        x: groupCard.x,
                        y: groupCard.y,
                    })
                }
            }
            groupDragOrigins.current = origins
            return
        }

        groupDragOrigins.current = new Map()
    }, [latestEffectiveCardsRef])

    // Update the active drag target and queue the next transient render frame.
    const handleDrag = useCallback(
        (index: number, x: number, y: number) => {
            setDragging({ index, x, y })
            draggingRef.current = { index, x, y }
            scheduleTransientPositions(buildCurrentDragUpdates(index, x, y))
        },
        [buildCurrentDragUpdates, scheduleTransientPositions]
    )

    // Finalize the drag, emit committed positions to the parent, and reset all
    // drag-specific refs.
    const handleDragEnd = useCallback(
        (index: number, x: number, y: number) => {
            const nextPositions = buildCurrentDragUpdates(index, x, y)
            commitTransientPositions(nextPositions)

            onPositionsCommit?.(toPositionUpdates(nextPositions))

            groupDragOrigins.current = new Map()
            dragStartPos.current = null
            draggingRef.current = null
            setDragging(null)
        },
        [buildCurrentDragUpdates, commitTransientPositions, onPositionsCommit]
    )

    // ------------ PUBLIC API ------------ //

    return {
        dragging,
        effectiveCards,
        updateGroupSelection,
        handleDragStart,
        handleDrag,
        handleDragEnd,
    }
}

export {
    areTransientPositionsEqual,
    buildDragUpdates,
    getEffectiveCards,
    toPositionUpdates,
}
