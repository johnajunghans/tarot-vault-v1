import { normalizeRotationForStorage } from '../../_lib/rotation'

// ------------ CONTINUOUS ROTATION HELPERS ------------ //

// Resolve a snapped rotation value to the nearest continuous angle relative to
// the previous rendered angle so repeated turns animate in the expected
// direction instead of wrapping backward at 360 degrees.
function resolveContinuousRotation(
    value: number,
    previousActualRotation: number
): number {
    const fullRotation = 360
    const normalized = normalizeRotationForStorage(value)
    const turns = Math.round(
        (previousActualRotation - normalized) / fullRotation
    )

    return normalized + turns * fullRotation
}

// Rebuild the canvas rotation cache using stable card ids. This preserves each
// card's continuous rendered angle even if the field array is reordered.
function reconcileContinuousRotations(
    cardIds: string[],
    normalizedRotations: number[],
    previousRotations: Record<string, number>
): Record<string, number> {
    return Object.fromEntries(
        cardIds.map((cardId, index) => {
            const normalized = normalizeRotationForStorage(
                normalizedRotations[index] ?? 0
            )
            const previousActualRotation = previousRotations[cardId]

            if (previousActualRotation === undefined) {
                return [cardId, normalized]
            }

            if (
                normalizeRotationForStorage(previousActualRotation) === normalized
            ) {
                return [cardId, previousActualRotation]
            }

            return [
                cardId,
                resolveContinuousRotation(normalized, previousActualRotation),
            ]
        })
    )
}

export { reconcileContinuousRotations, resolveContinuousRotation }
