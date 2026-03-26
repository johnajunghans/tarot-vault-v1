'use client'

import type { SpreadForm } from '@/types/spreads'
import type { UseFormReturn } from 'react-hook-form'
import { useCallback, useEffect, useRef, useState } from 'react'

type PlacementSnapshot = { x: number; y: number; r: number; z: number }[]

const MAX_HISTORY = 50

interface UseCanvasHistoryArgs {
    form: UseFormReturn<SpreadForm>
    cards: ReadonlyArray<{ id: string }>
    enabled: boolean
}

// Provides undo/redo for card placement transforms (x, y, r, z). History is
// stored as snapshots of all card positions, with keyboard shortcuts for
// Ctrl+Z (undo) and Ctrl+Shift+Z / Ctrl+Y (redo). History clears when card
// count changes to avoid applying stale snapshots.
export function useCanvasHistory({ form, cards, enabled }: UseCanvasHistoryArgs) {
    const undoStackRef = useRef<PlacementSnapshot[]>([])
    const redoStackRef = useRef<PlacementSnapshot[]>([])

    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // Sync boolean state with ref stacks so UI can react.
    const syncState = useCallback(() => {
        setCanUndo(undoStackRef.current.length > 0)
        setCanRedo(redoStackRef.current.length > 0)
    }, [])

    // Read current form positions into a snapshot array.
    const takeSnapshot = useCallback((): PlacementSnapshot => {
        const positions = form.getValues('positions') ?? []
        return positions.map((p) => ({
            x: p.x ?? 0,
            y: p.y ?? 0,
            r: p.r ?? 0,
            z: p.z ?? 0,
        }))
    }, [form])

    // Capture current state before a change. Call this at the start of each
    // commit handler so the previous state is available for undo.
    const pushSnapshot = useCallback(() => {
        if (!enabled) return

        const snapshot = takeSnapshot()
        undoStackRef.current = [
            ...undoStackRef.current.slice(-(MAX_HISTORY - 1)),
            snapshot,
        ]
        redoStackRef.current = []
        syncState()
    }, [enabled, takeSnapshot, syncState])

    // Write a snapshot back into the form.
    const applySnapshot = useCallback(
        (snapshot: PlacementSnapshot) => {
            snapshot.forEach(({ x, y, r, z }, index) => {
                form.setValue(`positions.${index}.x`, x, { shouldDirty: true })
                form.setValue(`positions.${index}.y`, y, { shouldDirty: true })
                form.setValue(`positions.${index}.r`, r, { shouldDirty: true })
                form.setValue(`positions.${index}.z`, z, { shouldDirty: true })
            })
        },
        [form]
    )

    const undo = useCallback(() => {
        if (!enabled || undoStackRef.current.length === 0) return

        const snapshot = undoStackRef.current[undoStackRef.current.length - 1]
        // Guard: skip stale snapshot if card count changed
        if (snapshot.length !== cards.length) {
            undoStackRef.current = []
            redoStackRef.current = []
            syncState()
            return
        }

        undoStackRef.current = undoStackRef.current.slice(0, -1)
        redoStackRef.current = [...redoStackRef.current, takeSnapshot()]
        applySnapshot(snapshot)
        syncState()
    }, [enabled, cards.length, takeSnapshot, applySnapshot, syncState])

    const redo = useCallback(() => {
        if (!enabled || redoStackRef.current.length === 0) return

        const snapshot = redoStackRef.current[redoStackRef.current.length - 1]
        // Guard: skip stale snapshot if card count changed
        if (snapshot.length !== cards.length) {
            undoStackRef.current = []
            redoStackRef.current = []
            syncState()
            return
        }

        redoStackRef.current = redoStackRef.current.slice(0, -1)
        undoStackRef.current = [...undoStackRef.current, takeSnapshot()]
        applySnapshot(snapshot)
        syncState()
    }, [enabled, cards.length, takeSnapshot, applySnapshot, syncState])

    const clearHistory = useCallback(() => {
        undoStackRef.current = []
        redoStackRef.current = []
        syncState()
    }, [syncState])

    // ------------ KEYBOARD SHORTCUTS ------------ //

    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

            const isCtrlOrMeta = e.ctrlKey || e.metaKey

            if (isCtrlOrMeta && e.shiftKey && e.key === 'z') {
                e.preventDefault()
                redo()
                return
            }

            if (isCtrlOrMeta && e.key === 'z') {
                e.preventDefault()
                undo()
                return
            }

            if (isCtrlOrMeta && e.key === 'y') {
                e.preventDefault()
                redo()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [enabled, undo, redo])

    // ------------ CLEAR ON CARD COUNT CHANGE ------------ //

    const prevCardCountRef = useRef(cards.length)

    useEffect(() => {
        if (prevCardCountRef.current !== cards.length) {
            clearHistory()
            prevCardCountRef.current = cards.length
        }
    }, [cards.length, clearHistory])

    // ------------ PUBLIC API ------------ //

    return {
        canUndo: enabled ? canUndo : false,
        canRedo: enabled ? canRedo : false,
        pushSnapshot,
        undo,
        redo,
        clearHistory,
    }
}
