import type { CanvasCard, CanvasDragState } from '../types'
import { CARD_HEIGHT, CARD_WIDTH } from '../../_lib'

export interface CanvasGuide {
    axis: 'v' | 'h'
    pos: number
}

export function generateGuideLines(
    effectiveCards: CanvasCard[],
    dragging: CanvasDragState
): CanvasGuide[] {
    const draggedLeft = dragging.x
    const draggedRight = dragging.x + CARD_WIDTH
    const draggedTop = dragging.y
    const draggedBottom = dragging.y + CARD_HEIGHT

    const found = {
        left: false,
        right: false,
        top: false,
        bottom: false,
    }

    for (let index = 0; index < effectiveCards.length; index += 1) {
        if (index === dragging.index) continue

        const card = effectiveCards[index]
        const otherLeft = card.x
        const otherRight = card.x + CARD_WIDTH
        const otherTop = card.y
        const otherBottom = card.y + CARD_HEIGHT

        if (
            !found.left &&
            (otherLeft === draggedLeft || otherRight === draggedLeft)
        ) {
            found.left = true
        }

        if (
            !found.right &&
            (otherLeft === draggedRight || otherRight === draggedRight)
        ) {
            found.right = true
        }

        if (
            !found.top &&
            (otherTop === draggedTop || otherBottom === draggedTop)
        ) {
            found.top = true
        }

        if (
            !found.bottom &&
            (otherTop === draggedBottom || otherBottom === draggedBottom)
        ) {
            found.bottom = true
        }

        if (found.left && found.right && found.top && found.bottom) {
            break
        }
    }

    const guides: CanvasGuide[] = []

    if (found.left) guides.push({ axis: 'v', pos: draggedLeft })
    if (found.right) guides.push({ axis: 'v', pos: draggedRight })
    if (found.top) guides.push({ axis: 'h', pos: draggedTop })
    if (found.bottom) guides.push({ axis: 'h', pos: draggedBottom })

    return guides
}