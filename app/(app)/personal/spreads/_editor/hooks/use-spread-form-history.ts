'use client'

import { useCallback, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useAppHotkey } from '@/hooks/use-app-hotkey'
import type { CardForm, SpreadForm } from '@/types/spreads'

const MAX_HISTORY = 50

type SpreadSnapshot = SpreadForm

interface UseSpreadFormHistoryArgs {
    form: UseFormReturn<SpreadForm>
    enabled: boolean
}

function cloneCard(card: CardForm): CardForm {
    return {
        name: card.name ?? '',
        description: card.description ?? '',
        allowReverse: card.allowReverse,
        x: card.x ?? 0,
        y: card.y ?? 0,
        r: card.r ?? 0,
        z: card.z ?? 0,
    }
}

function cloneSnapshot(values: SpreadForm): SpreadSnapshot {
    return {
        name: values.name ?? '',
        description: values.description ?? '',
        positions: (values.positions ?? []).map(cloneCard),
    }
}

function cardsAreEqual(a: CardForm, b: CardForm) {
    return (
        a.name === b.name &&
        a.description === b.description &&
        a.allowReverse === b.allowReverse &&
        a.x === b.x &&
        a.y === b.y &&
        a.r === b.r &&
        a.z === b.z
    )
}

function snapshotsAreEqual(a: SpreadSnapshot, b: SpreadSnapshot) {
    return (
        a.name === b.name &&
        a.description === b.description &&
        a.positions.length === b.positions.length &&
        a.positions.every((card, index) => cardsAreEqual(card, b.positions[index]))
    )
}

export function useSpreadFormHistory({
    form,
    enabled,
}: UseSpreadFormHistoryArgs) {
    const undoStackRef = useRef<SpreadSnapshot[]>([])
    const redoStackRef = useRef<SpreadSnapshot[]>([])
    const textEditStartSnapshotRef = useRef<SpreadSnapshot | null>(null)

    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    const syncState = useCallback(() => {
        setCanUndo(undoStackRef.current.length > 0)
        setCanRedo(redoStackRef.current.length > 0)
    }, [])

    const takeSnapshot = useCallback(
        () => cloneSnapshot(form.getValues()),
        [form]
    )

    const pushSnapshot = useCallback(
        (snapshot: SpreadSnapshot = takeSnapshot()) => {
            if (!enabled) return

            const previousSnapshot =
                undoStackRef.current[undoStackRef.current.length - 1]
            if (
                previousSnapshot &&
                snapshotsAreEqual(previousSnapshot, snapshot)
            ) {
                redoStackRef.current = []
                syncState()
                return
            }

            undoStackRef.current = [
                ...undoStackRef.current.slice(-(MAX_HISTORY - 1)),
                snapshot,
            ]
            redoStackRef.current = []
            syncState()
        },
        [enabled, syncState, takeSnapshot]
    )

    const pushSnapshotIfChangedSince = useCallback(
        (snapshot: SpreadSnapshot | null) => {
            if (!snapshot) return
            if (snapshotsAreEqual(snapshot, takeSnapshot())) return
            pushSnapshot(snapshot)
        },
        [pushSnapshot, takeSnapshot]
    )

    const beginTextEdit = useCallback(() => {
        if (!enabled) return
        textEditStartSnapshotRef.current = takeSnapshot()
    }, [enabled, takeSnapshot])

    const commitTextEdit = useCallback(() => {
        if (!enabled) return

        const snapshot = textEditStartSnapshotRef.current
        textEditStartSnapshotRef.current = null
        pushSnapshotIfChangedSince(snapshot)
    }, [enabled, pushSnapshotIfChangedSince])

    const applySnapshot = useCallback(
        (snapshot: SpreadSnapshot) => {
            textEditStartSnapshotRef.current = null
            form.reset(snapshot, { keepDefaultValues: true })
        },
        [form]
    )

    const undo = useCallback(() => {
        if (!enabled || undoStackRef.current.length === 0) return

        const snapshot = undoStackRef.current[undoStackRef.current.length - 1]
        undoStackRef.current = undoStackRef.current.slice(0, -1)
        redoStackRef.current = [
            ...redoStackRef.current.slice(-(MAX_HISTORY - 1)),
            takeSnapshot(),
        ]
        applySnapshot(snapshot)
        syncState()
    }, [applySnapshot, enabled, syncState, takeSnapshot])

    const redo = useCallback(() => {
        if (!enabled || redoStackRef.current.length === 0) return

        const snapshot = redoStackRef.current[redoStackRef.current.length - 1]
        redoStackRef.current = redoStackRef.current.slice(0, -1)
        undoStackRef.current = [
            ...undoStackRef.current.slice(-(MAX_HISTORY - 1)),
            takeSnapshot(),
        ]
        applySnapshot(snapshot)
        syncState()
    }, [applySnapshot, enabled, syncState, takeSnapshot])

    const clearHistory = useCallback(() => {
        undoStackRef.current = []
        redoStackRef.current = []
        textEditStartSnapshotRef.current = null
        syncState()
    }, [syncState])

    useAppHotkey('Mod+Shift+Z', redo, {
        enabled,
        ignoreInputs: true,
    })

    useAppHotkey('Mod+Z', undo, {
        enabled,
        ignoreInputs: true,
    })

    useAppHotkey('Mod+Y', redo, {
        enabled,
        ignoreInputs: true,
    })

    return {
        canUndo: enabled ? canUndo : false,
        canRedo: enabled ? canRedo : false,
        pushSnapshot,
        beginTextEdit,
        commitTextEdit,
        undo,
        redo,
        clearHistory,
    }
}
