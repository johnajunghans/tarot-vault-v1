const FULL_ROTATION = 360
export const ROTATION_STEP = 45

export function normalizeRotationForStorage(value: number): number {
    const snapped = Math.round(value / ROTATION_STEP) * ROTATION_STEP
    const wrapped =
        ((snapped % FULL_ROTATION) + FULL_ROTATION) % FULL_ROTATION

    return wrapped === FULL_ROTATION ? 0 : wrapped
}

export function resolveContinuousRotation(
    value: number,
    previousActualRotation: number
): number {
    const normalized = normalizeRotationForStorage(value)
    const turns = Math.round(
        (previousActualRotation - normalized) / FULL_ROTATION
    )

    return normalized + turns * FULL_ROTATION
}

export function reconcileContinuousRotations(
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
