const FULL_ROTATION = 360

// The spread editor only supports rotations at 45-degree increments.
export const ROTATION_STEP = 45

// Normalize free-form input into the canonical persisted angle used by forms
// and stored spread data.
export function normalizeRotationForStorage(value: number): number {
    const snapped = Math.round(value / ROTATION_STEP) * ROTATION_STEP
    const wrapped =
        ((snapped % FULL_ROTATION) + FULL_ROTATION) % FULL_ROTATION

    return wrapped === FULL_ROTATION ? 0 : wrapped
}
