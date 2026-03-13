import type { CardDB, CardForm } from '@/types/spreads'

export const CARD_WIDTH = 90
export const CARD_HEIGHT = 150
export const GRID_SIZE = 15

export const CANVAS_WIDTH = 2400
export const CANVAS_HEIGHT = 1800

export const CANVAS_BOUNDS = {
    minX: 0,
    minY: 0,
    maxX: CANVAS_WIDTH - CARD_WIDTH,
    maxY: CANVAS_HEIGHT - CARD_HEIGHT,
}

export const CANVAS_CENTER = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
}

const CARDS_PER_ROW = 10
export const CARD_SPACING_X = 105
const CARD_SPACING_Y = 165

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
type TranslatableCard = Pick<CardForm, 'x' | 'y'>

function snapToGrid(value: number) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE
}

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

function getSpreadBounds<T extends PositionedCard>(cards: T[]): SpreadBounds | null {
    if (cards.length === 0) return null

    const [first, ...rest] = cards
    const initialBounds = getRotatedCardBounds(first)

    const bounds = rest.reduce((acc, card) => {
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

    return bounds
}

function getSpreadCenteringDelta(bounds: SpreadBounds) {
    return {
        dx: snapToGrid(CANVAS_CENTER.x - bounds.centerX),
        dy: snapToGrid(CANVAS_CENTER.y - bounds.centerY),
    }
}

function translateCards<T extends TranslatableCard>(
    cards: T[],
    dx: number,
    dy: number
): T[] {
    return cards.map((card) => ({
        ...card,
        x: card.x + dx,
        y: card.y + dy,
    }))
}

function normalizeCardsToCanvasCenter<T extends PositionedCard & TranslatableCard>(
    cards: T[]
): T[] {
    const bounds = getSpreadBounds(cards)
    if (!bounds) return cards

    const { dx, dy } = getSpreadCenteringDelta(bounds)
    return translateCards(cards, dx, dy)
}

function getGeneratedCardPosition(index: number) {
    return {
        x: GRID_SIZE + (index % CARDS_PER_ROW) * CARD_SPACING_X,
        y: GRID_SIZE + Math.floor(index / CARDS_PER_ROW) * CARD_SPACING_Y,
    }
}

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

export {
    calcSpreadDimensions,
    getGeneratedCardPosition,
    getSpreadBounds,
    getSpreadCenteringDelta,
    normalizeCardsToCanvasCenter,
    snapToGrid,
    translateCards,
}
