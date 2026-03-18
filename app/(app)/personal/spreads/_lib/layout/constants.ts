// ------------ CARD DIMENSIONS ------------ //

// Shared physical dimensions for a spread card anywhere it is rendered.
export const CARD_WIDTH = 90
export const CARD_HEIGHT = 150

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
