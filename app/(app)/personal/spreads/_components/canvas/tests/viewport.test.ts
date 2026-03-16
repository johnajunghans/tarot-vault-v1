import { describe, expect, it } from "vitest";
import {
  getCanvasPointAtViewportPoint,
  getClampedPanForZoomAnchor,
} from "../helpers/viewport";

describe("getClampedPanForZoomAnchor", () => {
  it("keeps the anchored canvas point stable while zooming", () => {
    const anchorViewportX = 220;
    const anchorViewportY = 160;

    // Canvas point under anchor at old zoom
    const before = getCanvasPointAtViewportPoint({
      panX: 180,
      panY: 120,
      viewportX: anchorViewportX,
      viewportY: anchorViewportY,
      zoom: 1,
    });

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
    });

    // Canvas point under anchor at new zoom
    const after = getCanvasPointAtViewportPoint({
      panX: nextPan.x,
      panY: nextPan.y,
      viewportX: anchorViewportX,
      viewportY: anchorViewportY,
      zoom: 1.8,
    });

    expect(after.x).toBeCloseTo(before.x, 5);
    expect(after.y).toBeCloseTo(before.y, 5);
  });

  it("translates the viewport when the pinch midpoint moves without changing zoom", () => {
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
    });

    // Moving the anchor by +60px/+50px at zoom=1 shifts pan by -60/-50
    expect(nextPan).toEqual({
      x: 240,
      y: 150,
    });
  });

  it("clamps the pan to the canvas bounds", () => {
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
    });

    expect(nextPan).toEqual({
      x: 0,
      y: 0,
    });
  });
});
