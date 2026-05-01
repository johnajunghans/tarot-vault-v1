import type { CardForm } from '@/types/spreads'
import {
    CANVAS_CENTER,
    CARD_SPACING_X,
    CARD_SPACING_Y,
    GRID_SIZE,
} from './constants'
import type { SpreadBounds } from './bounds'
import { getSpreadBounds } from './bounds'

// ------------ INTERNAL TYPES ------------ //

type PositionedCard = Pick<CardForm, 'x' | 'y' | 'r'>
type TranslatableCard = Pick<CardForm, 'x' | 'y'>

// ------------ GRID HELPERS ------------ //

// Snap a coordinate to the shared grid used throughout the spread editor.
function snapToGrid(value: number) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE
}

// ------------ SPREAD POSITIONING ------------ //

// Compute how far a spread needs to move so its center aligns with the canvas
// center on a snapped grid.
function getSpreadCenteringDelta(bounds: SpreadBounds) {
    return {
        dx: snapToGrid(CANVAS_CENTER.x - bounds.centerX),
        dy: snapToGrid(CANVAS_CENTER.y - bounds.centerY),
    }
}

// Shift every card in a spread by a shared delta without changing rotation.
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

// Recenter a spread on the canvas, preserving the layout between cards.
function normalizeCardsToCanvasCenter<T extends PositionedCard & TranslatableCard>(
    cards: T[]
): T[] {
    const bounds = getSpreadBounds(cards)
    if (!bounds) return cards

    const { dx, dy } = getSpreadCenteringDelta(bounds)
    return translateCards(cards, dx, dy)
}

// Generate a default grid-based placement for a card by index.
function getGeneratedCardPosition(index: number) {
    const cardsPerRow = 10

    return {
        x: GRID_SIZE + (index % cardsPerRow) * CARD_SPACING_X,
        y: GRID_SIZE + Math.floor(index / cardsPerRow) * CARD_SPACING_Y,
    }
}

// Create a new blank card at a specific canvas coordinate.
function generateCardAt(x: number, y: number, layer = 1): CardForm {
    return {
        name: '',
        description: '',
        allowReverse: true,
        x,
        y,
        r: 0,
        z: layer,
    }
}

export {
    generateCardAt,
    getGeneratedCardPosition,
    getSpreadCenteringDelta,
    normalizeCardsToCanvasCenter,
    snapToGrid,
    translateCards,
}
