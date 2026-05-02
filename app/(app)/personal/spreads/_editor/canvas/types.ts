'use client'

export type {
    CanvasPoint,
    ViewportHandle as SpreadCanvasHandle,
    ViewportRequest as SpreadCanvasViewportRequest,
} from '@personal/_viewport'

/** Card data for canvas (no position field; index is used instead). */
export interface CanvasCard {
    name: string
    description?: string
    allowReverse?: boolean
    x: number
    y: number
    r: number
    z: number
}

export interface CanvasDragState {
    index: number
    x: number
    y: number
}

export interface SpreadCanvasPositionUpdate {
    index: number
    x: number
    y: number
}
