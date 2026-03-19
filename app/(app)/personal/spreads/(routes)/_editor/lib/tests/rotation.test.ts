import { describe, expect, it } from 'vitest'
import { normalizeRotationForStorage, ROTATION_STEP } from '..'

describe('normalizeRotationForStorage', () => {
    it('snaps to the nearest 45-degree increment', () => {
        expect(normalizeRotationForStorage(20)).toBe(0)
        expect(normalizeRotationForStorage(23)).toBe(45)
        expect(normalizeRotationForStorage(44)).toBe(45)
        expect(normalizeRotationForStorage(80)).toBe(90)
    })

    it('wraps values into the 0–315 range', () => {
        expect(normalizeRotationForStorage(360)).toBe(0)
        expect(normalizeRotationForStorage(405)).toBe(45)
        expect(normalizeRotationForStorage(720)).toBe(0)
    })

    it('handles negative values', () => {
        expect(normalizeRotationForStorage(-45)).toBe(315)
        expect(normalizeRotationForStorage(-90)).toBe(270)
        expect(normalizeRotationForStorage(-360)).toBe(0)
    })

    it('returns exact multiples unchanged', () => {
        expect(normalizeRotationForStorage(0)).toBe(0)
        expect(normalizeRotationForStorage(45)).toBe(45)
        expect(normalizeRotationForStorage(90)).toBe(90)
        expect(normalizeRotationForStorage(135)).toBe(135)
        expect(normalizeRotationForStorage(180)).toBe(180)
        expect(normalizeRotationForStorage(225)).toBe(225)
        expect(normalizeRotationForStorage(270)).toBe(270)
        expect(normalizeRotationForStorage(315)).toBe(315)
    })

    it('exports the expected step constant', () => {
        expect(ROTATION_STEP).toBe(45)
    })
})
