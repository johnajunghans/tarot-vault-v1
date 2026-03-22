import { describe, expect, it } from 'vitest'
import {
    normalizeRotationForStorage,
    ROTATION_STEP,
    KEY_ANGLES,
    SNAP_THRESHOLD,
    getNextKeyAngle,
    snapToKeyAngle,
} from '..'

describe('normalizeRotationForStorage', () => {
    it('rounds to the nearest integer', () => {
        expect(normalizeRotationForStorage(20.3)).toBe(20)
        expect(normalizeRotationForStorage(20.7)).toBe(21)
        expect(normalizeRotationForStorage(44.5)).toBe(45)
    })

    it('preserves integer values within range', () => {
        expect(normalizeRotationForStorage(0)).toBe(0)
        expect(normalizeRotationForStorage(20)).toBe(20)
        expect(normalizeRotationForStorage(137)).toBe(137)
        expect(normalizeRotationForStorage(359)).toBe(359)
    })

    it('wraps values into 0–359 range', () => {
        expect(normalizeRotationForStorage(360)).toBe(0)
        expect(normalizeRotationForStorage(361)).toBe(1)
        expect(normalizeRotationForStorage(405)).toBe(45)
        expect(normalizeRotationForStorage(720)).toBe(0)
    })

    it('handles negative values', () => {
        expect(normalizeRotationForStorage(-1)).toBe(359)
        expect(normalizeRotationForStorage(-45)).toBe(315)
        expect(normalizeRotationForStorage(-90)).toBe(270)
        expect(normalizeRotationForStorage(-360)).toBe(0)
    })

    it('passes through key angles unchanged', () => {
        for (const angle of KEY_ANGLES) {
            expect(normalizeRotationForStorage(angle)).toBe(angle)
        }
    })

    it('exports the expected constants', () => {
        expect(ROTATION_STEP).toBe(45)
        expect(SNAP_THRESHOLD).toBe(5)
        expect(KEY_ANGLES).toEqual([0, 45, 90, 135, 180, 225, 270, 315])
    })
})

describe('getNextKeyAngle', () => {
    it('steps CW to the next key angle when between values', () => {
        expect(getNextKeyAngle(25, 1)).toBe(45)
        expect(getNextKeyAngle(80, 1)).toBe(90)
        expect(getNextKeyAngle(200, 1)).toBe(225)
    })

    it('steps CCW to the previous key angle when between values', () => {
        expect(getNextKeyAngle(25, -1)).toBe(0)
        expect(getNextKeyAngle(80, -1)).toBe(45)
        expect(getNextKeyAngle(200, -1)).toBe(180)
    })

    it('steps CW from an exact key angle to the next one', () => {
        expect(getNextKeyAngle(0, 1)).toBe(45)
        expect(getNextKeyAngle(45, 1)).toBe(90)
        expect(getNextKeyAngle(270, 1)).toBe(315)
    })

    it('steps CCW from an exact key angle to the previous one', () => {
        expect(getNextKeyAngle(315, -1)).toBe(270)
        expect(getNextKeyAngle(90, -1)).toBe(45)
        expect(getNextKeyAngle(45, -1)).toBe(0)
    })

    it('wraps CW from 315 to 0', () => {
        expect(getNextKeyAngle(315, 1)).toBe(0)
        expect(getNextKeyAngle(320, 1)).toBe(0)
    })

    it('wraps CCW from 0 to 315', () => {
        expect(getNextKeyAngle(0, -1)).toBe(315)
        expect(getNextKeyAngle(10, -1)).toBe(0)
    })
})

describe('snapToKeyAngle', () => {
    it('snaps to a key angle when within threshold', () => {
        expect(snapToKeyAngle(3)).toBe(0)
        expect(snapToKeyAngle(43)).toBe(45)
        expect(snapToKeyAngle(47)).toBe(45)
        expect(snapToKeyAngle(88)).toBe(90)
        expect(snapToKeyAngle(317)).toBe(315)
    })

    it('returns the integer angle when outside threshold', () => {
        expect(snapToKeyAngle(20)).toBe(20)
        expect(snapToKeyAngle(55)).toBe(55)
        expect(snapToKeyAngle(100)).toBe(100)
        expect(snapToKeyAngle(200)).toBe(200)
    })

    it('snaps 0/360 boundary correctly', () => {
        expect(snapToKeyAngle(358)).toBe(0)
        expect(snapToKeyAngle(2)).toBe(0)
    })

    it('respects a custom threshold', () => {
        expect(snapToKeyAngle(40, 10)).toBe(45)
        expect(snapToKeyAngle(40, 3)).toBe(40)
    })

    it('returns exact key angles unchanged', () => {
        for (const angle of KEY_ANGLES) {
            expect(snapToKeyAngle(angle)).toBe(angle)
        }
    })
})
