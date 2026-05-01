"use client"

import { useCallback, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { spreadSchema } from "../schema"
import type { SpreadForm } from "@/types/spreads"
import type { UseFieldArrayMove, UseFieldArrayRemove } from "react-hook-form"
import {
    CANVAS_CENTER,
    CARD_HEIGHT,
    CARD_SPACING_X,
    CARD_WIDTH,
    generateCardAt,
    normalizeCardLayers,
} from "../lib"
import { useSpreadCanvasModel } from "./use-canvas-model"
import { useSpreadFormHistory } from "./use-spread-form-history"

interface UseSpreadFormOptions {
    defaultValues?: SpreadForm
    isViewMode?: boolean
}

/**
 * Central hook for spread editing. It owns the form state, the positions field
 * array, and the higher-level actions shared by both create and edit screens.
 *
 * @param {UseSpreadFormOptions} [options] - Optional settings for the spread form:
 *   - defaultValues: Pre-populated form values for editing mode.
 *   - isViewMode: If true, disables editing and canvas undo/redo history.
 */
export function useSpreadForm(options?: UseSpreadFormOptions) {
    // ------------ FORM STATE ------------ //

    // Build the RHF form once, using either supplied values or a blank spread.
    const form = useForm<SpreadForm>({
        resolver: zodResolver(spreadSchema),
        defaultValues: options?.defaultValues ?? {
            name: "",
            description: "",
            positions: [],
        },
    })

    // `positions` is the editable card list. `useFieldArray` gives us stable ids
    // for rendering plus helpers for insert/remove/reorder operations.
    const { fields: cards, append, move, replace } = useFieldArray({
        control: form.control,
        name: "positions",
    })

    // Selection lives beside the form history so undo/redo can restore the
    // position the user was actually working on after reorders or removals.
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)

    const isHistoryEnabled = !options?.isViewMode
    const history = useSpreadFormHistory({
        form,
        enabled: isHistoryEnabled,
        selectedCardIndex,
        setSelectedCardIndex,
    })
    const {
        canUndo,
        canRedo,
        pushSnapshot,
        beginTextEdit,
        commitTextEdit,
        undo,
        redo,
        clearHistory,
    } = history

    // Watch the live form so the canvas and page chrome react immediately to
    // field edits made in panels or on the canvas.
    const watchedValues = useWatch({ control: form.control })
    const watchedName = watchedValues?.name
    const watchedPositions = watchedValues?.positions

    // Adapt form data into canvas-friendly state and callbacks.
    const canvasModel = useSpreadCanvasModel({
        cards,
        form,
        watchedPositions,
        selectedCardIndex,
        setSelectedCardIndex,
        recordImmediateChange: pushSnapshot,
    })

    // ------------ CARD CREATION ------------ //

    // Add a card beside the last one when possible; otherwise place the first
    // card in the visual center of the canvas and focus its name field.
    const addCard = useCallback(() => {
        if (cards.length >= 78) return

        const nextIndex = cards.length
        const lastCard = nextIndex > 0 ? form.getValues(`positions.${nextIndex - 1}`) : null
        const newCard = lastCard
            ? generateCardAt(lastCard.x + CARD_SPACING_X, lastCard.y, nextIndex + 1)
            : generateCardAt(
                  CANVAS_CENTER.x - CARD_WIDTH / 2,
                  CANVAS_CENTER.y - CARD_HEIGHT / 2,
                  nextIndex + 1
              )
        pushSnapshot()
        append(newCard, { focusName: `positions.${nextIndex}.name` })
        setSelectedCardIndex(nextIndex)
    }, [append, cards.length, form, pushSnapshot, setSelectedCardIndex])

    // Add a card at an explicit canvas coordinate, used by double-clicking the
    // canvas. The 78-card cap matches the domain limit for a tarot deck.
    const addCardAt = useCallback(
        (x: number, y: number) => {
            if (cards.length >= 78) return
            const newCard = generateCardAt(x, y, cards.length + 1)
            pushSnapshot()
            append(newCard)
            setSelectedCardIndex(cards.length)
        },
        [cards.length, append, pushSnapshot, setSelectedCardIndex]
    )

    const removeWithHistory: UseFieldArrayRemove = useCallback(
        (index?: number | number[]) => {
            pushSnapshot()
            if (index === undefined) {
                replace([])
                return
            }

            const indicesToRemove = new Set(Array.isArray(index) ? index : [index])
            const remainingCards = (form.getValues("positions") ?? []).filter(
                (_card, cardIndex) => !indicesToRemove.has(cardIndex)
            )
            replace(normalizeCardLayers(remainingCards))
        },
        [form, pushSnapshot, replace]
    )

    const moveWithHistory: UseFieldArrayMove = useCallback(
        (from: number, to: number) => {
            if (from === to) return
            pushSnapshot()
            move(from, to)
        },
        [pushSnapshot, move]
    )

    // ------------ PUBLIC API ------------ //

    return {
        form,
        cards,
        remove: removeWithHistory,
        move: moveWithHistory,
        watchedValues,
        watchedName,
        watchedPositions,
        addCard,
        addCardAt,
        ...canvasModel,
        canUndo,
        canRedo,
        undo,
        redo,
        clearHistory,
        beginTextEdit,
        commitTextEdit,
        recordImmediateChange: pushSnapshot,
    }
}

export type UseSpreadFormReturn = ReturnType<typeof useSpreadForm>
