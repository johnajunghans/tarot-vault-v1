import { useCallback, useMemo } from 'react'
import {
    clampLayer,
    getLayersWithBackCard,
    getLayersWithFrontCard,
    getNextKeyAngle,
    normalizeLayerValues,
} from '../../../lib'
import { CanvasCard } from '../../types'

export function useCanvasCardButtonActions (
    effectiveCards: CanvasCard[],
    onRotationChange: ((index: number, value: number) => void) | undefined,
    rotationAngles: number[] | undefined,
    onLayerChange: ((updates: { index: number; z: number }[]) => void) | undefined
) {
    const layers = useMemo(
        () => normalizeLayerValues(effectiveCards.map((card) => clampLayer(card.z, effectiveCards.length))),
        [effectiveCards]
    )

    const layerBounds = useMemo(() => {
        const max = layers.length > 0 ? Math.max(...layers) : 0
        const min = layers.length > 0 ? Math.min(...layers) : 0
        return { max, min }
    }, [layers])

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
            const next = getLayersWithFrontCard(layers, index)
            onLayerChange(next.map((z, i) => ({ index: i, z })))
        },
        [layers, onLayerChange]
    )

    const handleSendToBack = useCallback(
        (index: number) => {
            if (!onLayerChange) return
            const next = getLayersWithBackCard(layers, index)
            onLayerChange(next.map((z, i) => ({ index: i, z })))
        },
        [layers, onLayerChange]
    )

    return {
        layers,
        layerBounds,
        handleRotateStep,
        handleButtonRotationChange,
        handleBringToFront,
        handleSendToBack
    }
}
