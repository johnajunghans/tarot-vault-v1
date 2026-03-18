import type { CardDB, CardForm } from '@/types/spreads'
import { CARD_HEIGHT, CARD_WIDTH } from './constants'

// ------------ SHARED TYPES ------------ //

// Bounding box information for a single rotated card or an entire spread.
export interface SpreadBounds {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
    centerX: number
    centerY: number
}

type PositionedCard = Pick<CardForm, 'x' | 'y' | 'r'>

// ------------ BOUNDS HELPERS ------------ //

// Measure the axis-aligned bounding box of one rotated card on the canvas.
function getRotatedCardBounds(card: PositionedCard): SpreadBounds {
    const cx = card.x + CARD_WIDTH / 2
    const cy = card.y + CARD_HEIGHT / 2
    const radians = (card.r * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)

    const corners = [
        { x: card.x, y: card.y },
        { x: card.x + CARD_WIDTH, y: card.y },
        { x: card.x + CARD_WIDTH, y: card.y + CARD_HEIGHT },
        { x: card.x, y: card.y + CARD_HEIGHT },
    ].map(({ x, y }) => {
        const translatedX = x - cx
        const translatedY = y - cy

        return {
            x: cx + translatedX * cos - translatedY * sin,
            y: cy + translatedX * sin + translatedY * cos,
        }
    })

    const left = Math.min(...corners.map(({ x }) => x))
    const right = Math.max(...corners.map(({ x }) => x))
    const top = Math.min(...corners.map(({ y }) => y))
    const bottom = Math.max(...corners.map(({ y }) => y))

    return {
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top,
        centerX: (left + right) / 2,
        centerY: (top + bottom) / 2,
    }
}

// Measure the outer bounds that contain every card in a spread.
function getSpreadBounds<T extends PositionedCard>(cards: T[]): SpreadBounds | null {
    if (cards.length === 0) return null

    const [first, ...rest] = cards
    const initialBounds = getRotatedCardBounds(first)

    return rest.reduce((acc, card) => {
        const cardBounds = getRotatedCardBounds(card)
        const left = Math.min(acc.left, cardBounds.left)
        const top = Math.min(acc.top, cardBounds.top)
        const right = Math.max(acc.right, cardBounds.right)
        const bottom = Math.max(acc.bottom, cardBounds.bottom)

        return {
            left,
            top,
            right,
            bottom,
            width: right - left,
            height: bottom - top,
            centerX: (left + right) / 2,
            centerY: (top + bottom) / 2,
        }
    }, initialBounds)
}

// Convert spread bounds into the min/max coordinates needed by thumbnails.
function calcSpreadDimensions(cards: CardDB[]) {
    const bounds = getSpreadBounds(cards)

    if (!bounds) {
        return {
            xMin: 0,
            xMax: CARD_WIDTH,
            yMin: 0,
            yMax: CARD_HEIGHT,
        }
    }

    return {
        xMin: bounds.left,
        xMax: bounds.right,
        yMin: bounds.top,
        yMax: bounds.bottom,
    }
}

export { calcSpreadDimensions, getSpreadBounds }
