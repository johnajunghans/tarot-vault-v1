'use client'

import type { SpreadBounds } from '../_lib/layout'

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

export interface CanvasPoint {
    x: number
    y: number
}

export interface CanvasGuide {
    axis: 'v' | 'h'
    pos: number
}

export interface OffscreenPointer {
    index: number
    x: number
    y: number
    rotation: number
    label: string
}

export type SpreadCanvasViewportRequest =
    | {
          key: string
          type: 'center-canvas-point'
          point: CanvasPoint
          zoom?: number
      }
    | {
          key: string
          type: 'fit-spread'
          bounds: SpreadBounds
          maxZoom?: number
          padding?: number
      }

export interface SpreadCanvasPositionUpdate {
    index: number
    x: number
    y: number
}

export interface SpreadCanvasHandle {
    getZoom: () => number
    resetZoom: () => void
    setZoom: (zoom: number) => void
    zoomIn: () => void
    zoomOut: () => void
}
