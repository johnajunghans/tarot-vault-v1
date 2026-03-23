'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import {
    CARD_HEIGHT,
    CARD_HOVER_HIT_PADDING,
    CARD_WIDTH,
    clampLayer,
    getLayersWithBackCard,
    getLayersWithFrontCard,
    getNextKeyAngle,
} from '../../lib'
import {
    pickCardIndexForToolbarHoverDefault,
    pointInAxisAlignedCardPadding,
} from '../lib/card-hover-hit'
import type { CanvasCard } from '../types'
import {
    getBaseSortedCards,
    getLayeredCardIndices,
} from './use-canvas-card-layering'

interface UseCanvasCardButtonsParams {
    effectiveCards: CanvasCard[]
    rotationAngles?: number[]
    draggingIndex: number | null
    selectedCardIndex: number | null
    isMobile: boolean
    isViewMode: boolean
    clientToSVG: (clientX: number, clientY: number) => { x: number; y: number }
    onRotationChange?: (index: number, value: number) => void
    onLayerChange?: (updates: { index: number; z: number }[]) => void
}

const UNMOUNT_DELAY = 0 // delay for buttons to hide after mouse leaves card

export function useCanvasCardButtons({
    effectiveCards,
    rotationAngles,
    draggingIndex,
    selectedCardIndex,
    isMobile,
    isViewMode,
    clientToSVG,
    onRotationChange,
    onLayerChange,
}: UseCanvasCardButtonsParams) {
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)
    const hoverLeaveTimeoutRef = useRef<number | null>(null)
    const isButtonFrameHoveredRef = useRef(false)

    const baseSortedCards = useMemo(
        () => getBaseSortedCards(effectiveCards),
        [effectiveCards]
    )

    const layeredCardIndices = useMemo(
        () =>
            getLayeredCardIndices(
                baseSortedCards,
                selectedCardIndex,
                draggingIndex
            ),
        [baseSortedCards, draggingIndex, selectedCardIndex]
    )

    const cancelHoverLeaveTimeout = useCallback(() => {
        if (hoverLeaveTimeoutRef.current !== null) {
            window.clearTimeout(hoverLeaveTimeoutRef.current)
            hoverLeaveTimeoutRef.current = null
        }
    }, [])

    useEffect(() => cancelHoverLeaveTimeout, [cancelHoverLeaveTimeout])

    useEffect(() => {
        if (
            hoveredCardIndex === null ||
            draggingIndex !== null ||
            isMobile ||
            isViewMode
        ) {
            isButtonFrameHoveredRef.current = false
        }
    }, [draggingIndex, hoveredCardIndex, isMobile, isViewMode])

    const clearHoveredCard = useCallback(() => {
        isButtonFrameHoveredRef.current = false
        setHoveredCardIndex(null)
        hoverLeaveTimeoutRef.current = null
    }, [])

    const scheduleHoverLeave = useCallback(() => {
        cancelHoverLeaveTimeout()
        hoverLeaveTimeoutRef.current = window.setTimeout(clearHoveredCard, UNMOUNT_DELAY)
    }, [cancelHoverLeaveTimeout, clearHoveredCard])

    const handleSvgPointerMove = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            if (isMobile || isViewMode || draggingIndex !== null) return

            const { x, y } = clientToSVG(e.clientX, e.clientY)
            cancelHoverLeaveTimeout()

            if (isButtonFrameHoveredRef.current) {
                return
            }

            if (hoveredCardIndex !== null) {
                const hoveredCard = effectiveCards[hoveredCardIndex]

                if (
                    hoveredCard &&
                    pointInAxisAlignedCardPadding(
                        x,
                        y,
                        hoveredCard.x,
                        hoveredCard.y,
                        CARD_WIDTH,
                        CARD_HEIGHT,
                        CARD_HOVER_HIT_PADDING
                    )
                ) {
                    return
                }
            }

            const next = pickCardIndexForToolbarHoverDefault(
                x,
                y,
                layeredCardIndices,
                effectiveCards,
                rotationAngles
            )
            setHoveredCardIndex((current) => (current === next ? current : next))
        },
        [
            cancelHoverLeaveTimeout,
            clientToSVG,
            draggingIndex,
            effectiveCards,
            hoveredCardIndex,
            isMobile,
            isViewMode,
            layeredCardIndices,
            rotationAngles,
        ]
    )

    const handleSvgPointerLeave = useCallback(() => {
        scheduleHoverLeave()
    }, [scheduleHoverLeave])

    const handleButtonFrameMouseEnter = useCallback(() => {
        isButtonFrameHoveredRef.current = true
        cancelHoverLeaveTimeout()
    }, [cancelHoverLeaveTimeout])

    const handleButtonFrameMouseLeave = useCallback(() => {
        isButtonFrameHoveredRef.current = false
        scheduleHoverLeave()
    }, [scheduleHoverLeave])

    const activeHoveredCardIndex =
        !isMobile &&
        !isViewMode &&
        draggingIndex === null &&
        hoveredCardIndex !== null &&
        effectiveCards[hoveredCardIndex]
            ? hoveredCardIndex
            : null

    const hoveredCard =
        activeHoveredCardIndex !== null
            ? effectiveCards[activeHoveredCardIndex]
            : null

    const showButtonFrame =
        activeHoveredCardIndex !== null &&
        hoveredCard !== null &&
        !isMobile &&
        !isViewMode &&
        draggingIndex === null

    const buttonFrameLayerInfo = useMemo(() => {
        if (activeHoveredCardIndex === null) {
            return { isAtFront: true, isAtBack: true }
        }
        const layers = effectiveCards.map((card) => clampLayer(card.z))
        const hovered = layers[activeHoveredCardIndex] ?? 0
        const max = layers.length > 0 ? Math.max(...layers) : 0
        const min = layers.length > 0 ? Math.min(...layers) : 0
        return { isAtFront: hovered >= max, isAtBack: hovered <= min }
    }, [activeHoveredCardIndex, effectiveCards])

    const handleRotateStep = useCallback(
        (index: number, direction: 1 | -1) => {
            if (!onRotationChange) return
            const currentAngle =
                rotationAngles?.[index] ?? effectiveCards[index]?.r ?? 0
            onRotationChange(index, getNextKeyAngle(currentAngle, direction))
        },
        [effectiveCards, onRotationChange, rotationAngles]
    )

    const handleButtonRotationChange = useCallback(
        (index: number, value: number) => {
            onRotationChange?.(index, value)
        },
        [onRotationChange]
    )

    const handleBringToFront = useCallback(
        (index: number) => {
            if (!onLayerChange) return
            const layers = effectiveCards.map((card) => clampLayer(card.z))
            const next = getLayersWithFrontCard(layers, index)
            onLayerChange(next.map((z, i) => ({ index: i, z })))
        },
        [effectiveCards, onLayerChange]
    )

    const handleSendToBack = useCallback(
        (index: number) => {
            if (!onLayerChange) return
            const layers = effectiveCards.map((card) => clampLayer(card.z))
            const next = getLayersWithBackCard(layers, index)
            onLayerChange(next.map((z, i) => ({ index: i, z })))
        },
        [effectiveCards, onLayerChange]
    )

    return {
        hoveredCard,
        hoveredCardIndex: activeHoveredCardIndex,
        showButtonFrame,
        buttonFrameLayerInfo,
        handleSvgPointerMove,
        handleSvgPointerLeave,
        handleButtonFrameMouseEnter,
        handleButtonFrameMouseLeave,
        handleRotateStep,
        handleButtonRotationChange,
        handleBringToFront,
        handleSendToBack,
    }
}
