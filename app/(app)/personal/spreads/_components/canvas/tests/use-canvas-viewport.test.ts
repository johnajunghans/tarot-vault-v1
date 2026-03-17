import { describe, expect, it } from 'vitest'
import {
    reconcileViewportBounds,
    resolveViewportRequest,
    shouldApplyViewportRequest,
} from '../hooks/use-canvas-viewport'

describe('useCanvasViewport', () => {
    it('applies a viewport request once for a new request key', () => {
        expect(
            shouldApplyViewportRequest(
                { key: 'request-1', type: 'center-canvas-point', point: { x: 800, y: 600 } },
                null,
                null
            )
        ).toBe(true)
    })

    it('ignores a duplicate viewport request key after it has already been applied', () => {
        expect(
            shouldApplyViewportRequest(
                { key: 'request-1', type: 'center-canvas-point', point: { x: 800, y: 600 } },
                'request-1',
                null
            )
        ).toBe(false)

        expect(
            shouldApplyViewportRequest(
                { key: 'request-2', type: 'center-canvas-point', point: { x: 800, y: 600 } },
                null,
                'request-2'
            )
        ).toBe(false)
    })

    it.todo('exposes getZoom, setZoom, zoomIn, zoomOut, and resetZoom through the imperative handle')

    it('resolves center-point viewport requests to the expected zoom and pan', () => {
        expect(
            resolveViewportRequest({
                viewportRequest: {
                    key: 'center',
                    type: 'center-canvas-point',
                    point: { x: 1000, y: 500 },
                    zoom: 2,
                },
                clientWidth: 400,
                clientHeight: 300,
                svgWidth: 2400,
                svgHeight: 1800,
                minimumZoom: 0.5,
            })
        ).toEqual({
            zoom: 2,
            pan: {
                x: 900,
                y: 425,
            },
        })
    })

    it('resolves fit-spread viewport requests using bounds, padding, and max zoom', () => {
        const resolvedViewport = resolveViewportRequest({
            viewportRequest: {
                key: 'fit',
                type: 'fit-spread',
                bounds: {
                    left: 100,
                    top: 100,
                    right: 400,
                    bottom: 300,
                    width: 300,
                    height: 200,
                    centerX: 250,
                    centerY: 200,
                },
                maxZoom: 2,
                padding: 50,
            },
            clientWidth: 600,
            clientHeight: 400,
            svgWidth: 2400,
            svgHeight: 1800,
            minimumZoom: 0.5,
        })

        expect(resolvedViewport.zoom).toBe(1.5)
        expect(resolvedViewport.pan.x).toBeCloseTo(50, 5)
        expect(resolvedViewport.pan.y).toBeCloseTo(66.6667, 4)
    })

    it('reconciles pan and zoom when the container size changes', () => {
        expect(
            reconcileViewportBounds({
                panX: 200,
                panY: 100,
                zoom: 0.4,
                clientWidth: 600,
                clientHeight: 400,
                svgWidth: 2400,
                svgHeight: 1800,
                minimumZoom: 0.5,
            })
        ).toEqual({
            zoom: 0.5,
            pan: {
                x: 200,
                y: 100,
            },
        })

        expect(
            reconcileViewportBounds({
                panX: 2100,
                panY: 1600,
                zoom: 1,
                clientWidth: 600,
                clientHeight: 400,
                svgWidth: 2400,
                svgHeight: 1800,
                minimumZoom: 0.5,
            })
        ).toEqual({
            zoom: 1,
            pan: {
                x: 1800,
                y: 1400,
            },
        })
    })

    it.todo('updates viewport state when the custom scrollbar pan handler is used')
    it.todo('suppresses card selection briefly after zoom gestures')
})
