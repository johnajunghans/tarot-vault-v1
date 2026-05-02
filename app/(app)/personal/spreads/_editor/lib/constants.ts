// ------------ CARD DIMENSIONS ------------ //

// Card dimensions are owned by the shared @personal/_card subsystem.
// Imported here so CANVAS_BOUNDS can reference them, and re-exported so all
// existing spreads imports continue to work unchanged.
import { CARD_WIDTH, CARD_HEIGHT } from '@personal/_card'
export { CARD_WIDTH, CARD_HEIGHT }

// Axis-aligned padding around the card face in SVG space for drag + toolbar hover
// hit-testing (matches the invisible rect in `card.tsx`). These must cover the
// top-left toolbar (see `BUTTON_OFFSET` + `BUTTON_R` in `card-button-frame.tsx`).
export const CARD_HOVER_HIT_PADDING_X = 5
export const CARD_HOVER_HIT_PADDING_Y = 20

// Canvas interactions snap to this unit so dragging and manual edits align.
export const GRID_SIZE = 15

// ------------ CANVAS DIMENSIONS ------------ //

// The editor uses a fixed virtual canvas so panning and fit-to-view behavior
// can work against a predictable space.
export const CANVAS_WIDTH = 2400
export const CANVAS_HEIGHT = 1800

// Cards are clamped so their top-left origin stays inside the virtual canvas.
export const CANVAS_BOUNDS = {
    minX: 0,
    minY: 0,
    maxX: CANVAS_WIDTH - CARD_WIDTH,
    maxY: CANVAS_HEIGHT - CARD_HEIGHT,
}

// The visual center is reused when creating or recentering spreads.
export const CANVAS_CENTER = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
}

// ------------ DEFAULT CARD SPACING ------------ //

// These spacing values define the default rhythm for generated card placement.
export const CARD_SPACING_X = 105
export const CARD_SPACING_Y = 165
