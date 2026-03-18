"use client"

import { useCallback } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { spreadSchema } from "../../schema"
import type { SpreadForm } from "@/types/spreads"
import {
    CANVAS_CENTER,
    CARD_HEIGHT,
    CARD_SPACING_X,
    CARD_WIDTH,
    generateCardAt,
} from "../../_lib/layout"
import { useSpreadCanvasModel } from "../../_canvas/hooks/use-canvas-model"

interface UseSpreadFormOptions {
    defaultValues?: SpreadForm
}

// Central hook for spread editing. It owns the form state, the positions field
// array, and the higher-level actions shared by both create and edit screens.
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
    const { fields: cards, append, remove, move } = useFieldArray({
        control: form.control,
        name: "positions",
    })

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
    })

    const { setSelectedCardIndex } = canvasModel

    // ------------ CARD CREATION ------------ //

    // Add a card beside the last one when possible; otherwise place the first
    // card in the visual center of the canvas and focus its name field.
    const addCard = useCallback(() => {
        const nextIndex = cards.length
        const lastCard = nextIndex > 0 ? form.getValues(`positions.${nextIndex - 1}`) : null
        const newCard = lastCard
            ? generateCardAt(lastCard.x + CARD_SPACING_X, lastCard.y)
            : generateCardAt(
                  CANVAS_CENTER.x - CARD_WIDTH / 2,
                  CANVAS_CENTER.y - CARD_HEIGHT / 2
              )
        append(newCard, { focusName: `positions.${nextIndex}.name` })
        setSelectedCardIndex(nextIndex)
    }, [append, cards.length, form, setSelectedCardIndex])

    // Add a card at an explicit canvas coordinate, used by double-clicking the
    // canvas. The 78-card cap matches the domain limit for a tarot deck.
    const addCardAt = useCallback(
        (x: number, y: number) => {
            if (cards.length >= 78) return
            const newCard = generateCardAt(x, y)
            append(newCard)
            setSelectedCardIndex(cards.length)
        },
        [cards.length, append, setSelectedCardIndex]
    )

    // ------------ PUBLIC API ------------ //

    return {
        form,
        cards,
        append,
        remove,
        move,
        watchedValues,
        watchedName,
        watchedPositions,
        addCard,
        addCardAt,
        ...canvasModel,
    }
}

export type UseSpreadFormReturn = ReturnType<typeof useSpreadForm>
