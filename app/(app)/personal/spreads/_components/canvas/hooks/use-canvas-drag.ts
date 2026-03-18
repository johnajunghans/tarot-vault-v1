'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLatestRef } from '@/hooks/use-latest-ref'
import { getSnappedClampedPosition } from '../helpers/geometry'
import { CANVAS_BOUNDS, GRID_SIZE } from '../../../_helpers/layout'
import type { CanvasCard } from '../types'
import type { CanvasPoint, SpreadCanvasPositionUpdate } from '../types'

type TransientPositions = Record<number, CanvasPoint>

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

export function useCanvasDrag({
    cards,
    onPositionsCommit,
}: UseCanvasDragArgs) {
    const [dragging, setDragging] = useState<{
        index: number
        x: number
        y: number
    } | null>(null)
    const [transientPositions, setTransientPositions] = useState<TransientPositions>(
        {}
    )

    const transientPositionsRef = useRef<TransientPositions>({})
    const pendingTransientPositionsRef = useRef<TransientPositions | null>(null)
    const transientFrameRef = useRef(0)
    const draggingRef = useRef<{ index: number; x: number; y: number } | null>(null)
    const dragStartPos = useRef<CanvasPoint | null>(null)
    const groupSelectedRef = useRef<Set<number>>(new Set())
    const groupDragOrigins = useRef<Map<number, CanvasPoint>>(new Map())

    const effectiveCards = useMemo(
        () => getEffectiveCards(cards, transientPositions),
        [cards, transientPositions]
    )

    const latestEffectiveCardsRef = useLatestRef(effectiveCards)

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

    useEffect(() => {
        return () => {
            if (transientFrameRef.current !== 0) {
                window.cancelAnimationFrame(transientFrameRef.current)
            }
        }
    }, [])

    const updateGroupSelection = useCallback((next: Set<number>) => {
        groupSelectedRef.current = next
    }, [])

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

    const handleDrag = useCallback(
        (index: number, x: number, y: number) => {
            setDragging({ index, x, y })
            draggingRef.current = { index, x, y }
            scheduleTransientPositions(buildCurrentDragUpdates(index, x, y))
        },
        [buildCurrentDragUpdates, scheduleTransientPositions]
    )

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
