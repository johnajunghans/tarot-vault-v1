import { describe, expect, it } from 'vitest'
import {
    resolveViewportRequest,
    shouldApplyViewportRequest,
} from './viewport-request'
import { reconcileViewportBounds } from './viewport-state'
import {
    clampPan,
    getCanvasPointAtViewportPoint,
    getCanvasViewportRect,
    getClampedPanForZoomAnchor,
    getMinZoomForViewport,
    getPanForCanvasPoint,
} from './viewport'
import { getSteppedZoom, normalizeZoom } from './zoom/zoom'

describe('viewport helpers', () => {
    describe('viewport request helpers', () => {
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
    })

    describe('viewport state helpers', () => {
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
    })

    describe('viewport geometry helpers', () => {
        it('keeps the anchored canvas point stable while zooming', () => {
            const anchorViewportX = 220
            const anchorViewportY = 160

            const before = getCanvasPointAtViewportPoint({
                panX: 180,
                panY: 120,
                viewportX: anchorViewportX,
                viewportY: anchorViewportY,
                zoom: 1,
            })

            const nextPan = getClampedPanForZoomAnchor({
                panX: 180,
                panY: 120,
                anchorViewportX,
                anchorViewportY,
                fromZoom: 1,
                toZoom: 1.8,
                clientWidth: 500,
                clientHeight: 400,
                canvasWidth: 2400,
                canvasHeight: 1800,
            })

            const after = getCanvasPointAtViewportPoint({
                panX: nextPan.x,
                panY: nextPan.y,
                viewportX: anchorViewportX,
                viewportY: anchorViewportY,
                zoom: 1.8,
            })

            expect(after.x).toBeCloseTo(before.x, 5)
            expect(after.y).toBeCloseTo(before.y, 5)
        })

        it('translates the viewport when the pinch midpoint moves without changing zoom', () => {
            const nextPan = getClampedPanForZoomAnchor({
                panX: 300,
                panY: 200,
                anchorViewportX: 150,
                anchorViewportY: 120,
                targetViewportX: 210,
                targetViewportY: 170,
                fromZoom: 1,
                toZoom: 1,
                clientWidth: 500,
                clientHeight: 400,
                canvasWidth: 2400,
                canvasHeight: 1800,
            })

            expect(nextPan).toEqual({
                x: 240,
                y: 150,
            })
        })

        it('clamps the pan to the canvas bounds', () => {
            const nextPan = getClampedPanForZoomAnchor({
                panX: 0,
                panY: 0,
                anchorViewportX: 20,
                anchorViewportY: 20,
                targetViewportX: 600,
                targetViewportY: 500,
                fromZoom: 1,
                toZoom: 1,
                clientWidth: 400,
                clientHeight: 300,
                canvasWidth: 800,
                canvasHeight: 700,
            })

            expect(nextPan).toEqual({
                x: 0,
                y: 0,
            })
        })

        it('raises the minimum zoom when the container would otherwise exceed the canvas', () => {
            expect(
                getMinZoomForViewport({
                    canvasWidth: 2400,
                    canvasHeight: 1800,
                    clientWidth: 1440,
                    clientHeight: 900,
                })
            ).toBeCloseTo(0.6, 5)
        })

        it('preserves the configured floor when the viewport already fits within the canvas', () => {
            expect(
                getMinZoomForViewport({
                    canvasWidth: 2400,
                    canvasHeight: 1800,
                    clientWidth: 900,
                    clientHeight: 700,
                })
            ).toBe(0.5)
        })

        it('centers a requested canvas point at the requested zoom level', () => {
            const pan = getPanForCanvasPoint({
                contentX: 500,
                contentY: 400,
                viewportX: 250,
                viewportY: 200,
                zoom: 2,
            })

            expect(pan).toEqual({
                x: 375,
                y: 300,
            })

            expect(
                getCanvasPointAtViewportPoint({
                    panX: pan.x,
                    panY: pan.y,
                    viewportX: 250,
                    viewportY: 200,
                    zoom: 2,
                })
            ).toEqual({
                x: 500,
                y: 400,
            })
        })

        it('clamps pan correctly for all canvas edges and viewport sizes', () => {
            expect(
                clampPan({
                    panX: -50,
                    panY: 900,
                    canvasWidth: 1000,
                    canvasHeight: 800,
                    viewportWidth: 300,
                    viewportHeight: 200,
                })
            ).toEqual({
                x: 0,
                y: 600,
            })

            expect(
                clampPan({
                    panX: 120,
                    panY: 140,
                    canvasWidth: 1000,
                    canvasHeight: 800,
                    viewportWidth: 300,
                    viewportHeight: 200,
                })
            ).toEqual({
                x: 120,
                y: 140,
            })
        })

        it('returns the correct canvas viewport rectangle for a pan and zoom level', () => {
            expect(
                getCanvasViewportRect({
                    panX: 100,
                    panY: 50,
                    clientWidth: 400,
                    clientHeight: 200,
                    zoom: 2,
                })
            ).toEqual({
                left: 100,
                top: 50,
                right: 300,
                bottom: 150,
                width: 200,
                height: 100,
                centerX: 200,
                centerY: 100,
            })
        })
    })

    describe('zoom helpers', () => {
        it('normalizes zoom values to nearby stepped increments when within epsilon', () => {
            expect(normalizeZoom(1.099)).toBe(1.1)
            expect(normalizeZoom(1.106)).toBe(1.106)
        })

        it('steps zoom in and out from aligned and unaligned values', () => {
            expect(getSteppedZoom(1, 'in')).toBe(1.1)
            expect(getSteppedZoom(1.04, 'in')).toBe(1.1)
            expect(getSteppedZoom(1, 'out')).toBe(0.9)
            expect(getSteppedZoom(1.16, 'out')).toBe(1.1)
        })
    })
})
