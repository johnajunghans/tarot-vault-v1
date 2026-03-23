'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    clampLayer,
    getLayersWithBackCard,
    getLayersWithFrontCard,
    getNextKeyAngle,
} from '../../lib'
import type { CanvasCard } from '../types'

interface UseCanvasCardButtonsParams {
    effectiveCards: CanvasCard[]
    rotationAngles?: number[]
    draggingIndex: number | null
    isMobile: boolean
    isViewMode: boolean
    onRotationChange?: (index: number, value: number) => void
    onLayerChange?: (updates: { index: number; z: number }[]) => void
}

const UNMOUNT_DELAY = 120 // delay for buttons to hide after mouse leaves card

export function useCanvasCardButtons({
    effectiveCards,
    rotationAngles,
    draggingIndex,
    isMobile,
    isViewMode,
    onRotationChange,
    onLayerChange,
}: UseCanvasCardButtonsParams) {
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)
    const hoverLeaveTimeoutRef = useRef<number | null>(null)

    const cancelHoverLeaveTimeout = useCallback(() => {
        if (hoverLeaveTimeoutRef.current !== null) {
            window.clearTimeout(hoverLeaveTimeoutRef.current)
            hoverLeaveTimeoutRef.current = null
        }
    }, [])

    useEffect(() => cancelHoverLeaveTimeout, [cancelHoverLeaveTimeout])

    const clearHoveredCard = useCallback(() => {
        setHoveredCardIndex(null)
        hoverLeaveTimeoutRef.current = null
    }, [])

    const scheduleHoverLeave = useCallback(() => {
        cancelHoverLeaveTimeout()
        hoverLeaveTimeoutRef.current = window.setTimeout(clearHoveredCard, UNMOUNT_DELAY)
    }, [cancelHoverLeaveTimeout, clearHoveredCard])

    const handleCardMouseEnter = useCallback(
        (index: number) => {
            cancelHoverLeaveTimeout()
            setHoveredCardIndex(index)
        },
        [cancelHoverLeaveTimeout]
    )

    const handleCardMouseLeave = useCallback(() => {
        scheduleHoverLeave()
    }, [scheduleHoverLeave])

    const handleButtonFrameMouseEnter = useCallback(() => {
        cancelHoverLeaveTimeout()
    }, [cancelHoverLeaveTimeout])

    const handleButtonFrameMouseLeave = useCallback(() => {
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
        handleCardMouseEnter,
        handleCardMouseLeave,
        handleButtonFrameMouseEnter,
        handleButtonFrameMouseLeave,
        handleRotateStep,
        handleButtonRotationChange,
        handleBringToFront,
        handleSendToBack,
    }
}
