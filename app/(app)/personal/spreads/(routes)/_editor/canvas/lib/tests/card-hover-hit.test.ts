import { describe, expect, test } from 'vitest'
import {
    pickCardIndexForToolbarHover,
    pointInAxisAlignedCardPadding,
    pointInRotatedCardCore,
} from '../card-hover-hit'
import type { CanvasCard } from '../../types'
import {
    CARD_HEIGHT,
    CARD_HOVER_HIT_PADDING_X,
    CARD_HOVER_HIT_PADDING_Y,
    CARD_WIDTH,
} from '../../../lib'

function card(overrides: Partial<CanvasCard> & { x: number; y: number }): CanvasCard {
    const { x, y, r, z, ...rest } = overrides

    return {
        name: 'A',
        x,
        y,
        r: r ?? 0,
        z: z ?? 0,
        ...rest,
    }
}

describe('pointInRotatedCardCore', () => {
    test('detects center at r=0', () => {
        expect(
            pointInRotatedCardCore(10, 20, 0, 0, 0, CARD_WIDTH, CARD_HEIGHT)
        ).toBe(true)
    })

    test('detects corner at 90° rotation', () => {
        const x = 100
        const y = 100
        const r = 90
        const cx = x + CARD_WIDTH / 2
        const cy = y + CARD_HEIGHT / 2
        expect(
            pointInRotatedCardCore(cx, cy, x, y, r, CARD_WIDTH, CARD_HEIGHT)
        ).toBe(true)
    })
})

describe('pointInAxisAlignedCardPadding', () => {
    test('includes asymmetric padding bands', () => {
        const padX = CARD_HOVER_HIT_PADDING_X
        const padY = CARD_HOVER_HIT_PADDING_Y
        expect(
            pointInAxisAlignedCardPadding(
                100 - padX,
                200 - padY,
                100,
                200,
                CARD_WIDTH,
                CARD_HEIGHT,
                padX,
                padY
            )
        ).toBe(true)
    })
})

describe('pickCardIndexForToolbarHover', () => {
    test('prefers lower card face over higher card padding-only overlap', () => {
        const padX = CARD_HOVER_HIT_PADDING_X
        // Left card higher z (on top); right card lower z — flush horizontal spacing 0.
        const cards: CanvasCard[] = [
            card({ x: 0, y: 0, z: 1, name: 'LeftTop' }),
            card({ x: CARD_WIDTH, y: 0, z: 0, name: 'RightBelow' }),
        ]
        const layered = [1, 0]
        const px = CARD_WIDTH + padX / 2
        const py = CARD_HEIGHT / 2

        const hit = pickCardIndexForToolbarHover(
            px,
            py,
            layered,
            cards,
            [0, 0],
            CARD_WIDTH,
            CARD_HEIGHT,
            padX,
            CARD_HOVER_HIT_PADDING_Y
        )
        expect(hit).toBe(1)
    })

    test('returns topmost when cores overlap', () => {
        const cards: CanvasCard[] = [
            card({ x: 100, y: 100, z: 0, name: 'A' }),
            card({ x: 100, y: 100, z: 1, name: 'B' }),
        ]
        const layered = [0, 1]
        const hit = pickCardIndexForToolbarHover(
            145,
            175,
            layered,
            cards,
            [0, 0],
            CARD_WIDTH,
            CARD_HEIGHT,
            CARD_HOVER_HIT_PADDING_X,
            CARD_HOVER_HIT_PADDING_Y
        )
        expect(hit).toBe(1)
    })
})
