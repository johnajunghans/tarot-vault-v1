import type { CanvasCard } from '../types'
import {
    CARD_HEIGHT,
    CARD_HOVER_HIT_PADDING_X,
    CARD_HOVER_HIT_PADDING_Y,
    CARD_WIDTH,
} from '../../lib'

/**
 * Card face in local space is [0,cw]×[0,ch] with rotation around its center.
 * Matches the rotation `<g>` in `card.tsx` (GSAP `svgOrigin` at card center).
 */
export function pointInRotatedCardCore(
    svgX: number,
    svgY: number,
    cardX: number,
    cardY: number,
    rotationDeg: number,
    cw: number,
    ch: number
): boolean {
    const cx = cw / 2
    const cy = ch / 2
    const lx = svgX - cardX
    const ly = svgY - cardY
    const rad = (-rotationDeg * Math.PI) / 180
    const rx = lx - cx
    const ry = ly - cy
    const px = rx * Math.cos(rad) - ry * Math.sin(rad) + cx
    const py = rx * Math.sin(rad) + ry * Math.cos(rad) + cy
    return px >= 0 && px <= cw && py >= 0 && py <= ch
}

/**
 * Unrotated expanded box in the card group's local space — matches the sibling
 * `<rect>` before the rotated content in `card.tsx`.
 */
export function pointInAxisAlignedCardPadding(
    svgX: number,
    svgY: number,
    cardX: number,
    cardY: number,
    cw: number,
    ch: number,
    padX: number,
    padY: number
): boolean {
    const lx = svgX - cardX
    const ly = svgY - cardY
    return (
        lx >= -padX &&
        lx <= cw + padX &&
        ly >= -padY &&
        ly <= ch + padY
    )
}

/**
 * Resolves which card should own toolbar hover using core-first hit testing
 * so a lower card’s face wins over a higher card’s padding-only overlap.
 *
 * `layeredCardIndices` is bottom → top (same order as `useCardLayering` walks DOM).
 */
export function pickCardIndexForToolbarHover(
    svgX: number,
    svgY: number,
    layeredCardIndices: number[],
    effectiveCards: CanvasCard[],
    rotationAngles: number[] | undefined,
    cw: number,
    ch: number,
    padX: number,
    padY: number
): number | null {
    const topFirst = [...layeredCardIndices].reverse()

    for (const index of topFirst) {
        const card = effectiveCards[index]
        if (!card) continue
        const r = rotationAngles?.[index] ?? card.r ?? 0
        if (pointInRotatedCardCore(svgX, svgY, card.x, card.y, r, cw, ch)) {
            return index
        }
    }

    for (const index of topFirst) {
        const card = effectiveCards[index]
        if (!card) continue
        if (
            pointInAxisAlignedCardPadding(
                svgX,
                svgY,
                card.x,
                card.y,
                cw,
                ch,
                padX,
                padY
            )
        ) {
            return index
        }
    }

    return null
}

export function pickCardIndexForToolbarHoverDefault(
    svgX: number,
    svgY: number,
    layeredCardIndices: number[],
    effectiveCards: CanvasCard[],
    rotationAngles: number[] | undefined
): number | null {
    return pickCardIndexForToolbarHover(
        svgX,
        svgY,
        layeredCardIndices,
        effectiveCards,
        rotationAngles,
        CARD_WIDTH,
        CARD_HEIGHT,
        CARD_HOVER_HIT_PADDING_X,
        CARD_HOVER_HIT_PADDING_Y
    )
}
