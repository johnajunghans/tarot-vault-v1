"use client"

import { useCallback } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { spreadSchema } from "../schema"
import type { SpreadForm } from "@/types/spreads"
import {
    CANVAS_CENTER,
    CARD_HEIGHT,
    CARD_SPACING_X,
    CARD_WIDTH,
    generateCardAt,
} from "../spread-layout"
import { useSpreadCanvasModel } from "../_components/canvas/hooks/use-spread-canvas-model"

interface UseSpreadFormOptions {
    defaultValues?: SpreadForm
}

export function useSpreadForm(options?: UseSpreadFormOptions) {
    const form = useForm<SpreadForm>({
        resolver: zodResolver(spreadSchema),
        defaultValues: options?.defaultValues ?? {
            name: "",
            description: "",
            positions: [],
        },
    })

    const { fields: cards, append, remove, move } = useFieldArray({
        control: form.control,
        name: "positions",
    })

    const watchedValues = useWatch({ control: form.control })
    const watchedName = watchedValues?.name
    const watchedPositions = watchedValues?.positions

    const canvasModel = useSpreadCanvasModel({
        cards,
        form,
        watchedPositions,
    })

    const { setSelectedCardIndex } = canvasModel

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

    const addCardAt = useCallback(
        (x: number, y: number) => {
            if (cards.length >= 78) return
            const newCard = generateCardAt(x, y)
            append(newCard)
            setSelectedCardIndex(cards.length)
        },
        [cards.length, append, setSelectedCardIndex]
    )

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
