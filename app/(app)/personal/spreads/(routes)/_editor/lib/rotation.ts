const FULL_ROTATION = 360

export const ROTATION_STEP = 45

export const KEY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const

export const SNAP_THRESHOLD = 5

// Round and wrap a free-form angle into the persisted [0, 359] integer range.
export function normalizeRotationForStorage(value: number): number {
    const rounded = Math.round(value)
    const wrapped = ((rounded % FULL_ROTATION) + FULL_ROTATION) % FULL_ROTATION
    return wrapped === FULL_ROTATION ? 0 : wrapped
}

// Step to the next key angle in the given direction (+1 = CW, -1 = CCW).
// If the current angle is not on a key value, snap to the nearest one in the
// requested direction first.
export function getNextKeyAngle(currentAngle: number, direction: 1 | -1): number {
    const normalized = normalizeRotationForStorage(currentAngle)

    if (direction === 1) {
        for (const angle of KEY_ANGLES) {
            if (angle > normalized) return angle
        }
        return 0
    }

    for (let i = KEY_ANGLES.length - 1; i >= 0; i--) {
        if (KEY_ANGLES[i] < normalized) return KEY_ANGLES[i]
    }
    return 315
}

// Snap to the nearest key angle when within `threshold` degrees; otherwise
// return the angle rounded to an integer in [0, 359].
export function snapToKeyAngle(
    angle: number,
    threshold: number = SNAP_THRESHOLD
): number {
    const normalized = normalizeRotationForStorage(angle)
    for (const key of KEY_ANGLES) {
        const diff = Math.abs(normalized - key)
        const wrappedDiff = Math.min(diff, FULL_ROTATION - diff)
        if (wrappedDiff <= threshold) return key
    }
    return normalized
}
