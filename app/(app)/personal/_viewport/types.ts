'use client'

export interface CanvasPoint {
    x: number
    y: number
}

export interface ViewportContentBounds {
    width: number
    height: number
    centerX: number
    centerY: number
}

export type ViewportRequest =
    | {
          key: string
          type: 'center-canvas-point'
          point: CanvasPoint
          zoom?: number
      }
    | {
          key: string
          type: 'fit-content'
          bounds: ViewportContentBounds
          maxZoom?: number
          padding?: number
      }

export interface ViewportHandle {
    getZoom: () => number
    resetZoom: () => void
    setZoom: (zoom: number) => void
    zoomIn: () => void
    zoomOut: () => void
}
