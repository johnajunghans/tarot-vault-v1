import { describe, expect, it } from "vitest";
import {
  getCanvasPointAtViewportPoint,
  getClampedViewportScrollForZoomAnchor,
} from "../helpers/viewport";

describe("getClampedViewportScrollForZoomAnchor", () => {
  it("keeps the anchored canvas point stable while zooming", () => {
    const anchorViewportX = 220;
    const anchorViewportY = 160;
    const before = getCanvasPointAtViewportPoint({
      scrollLeft: 180,
      scrollTop: 120,
      viewportX: anchorViewportX,
      viewportY: anchorViewportY,
      zoom: 1,
    });

    const nextScroll = getClampedViewportScrollForZoomAnchor({
      scrollLeft: 180,
      scrollTop: 120,
      anchorViewportX,
      anchorViewportY,
      fromZoom: 1,
      toZoom: 1.8,
      clientWidth: 500,
      clientHeight: 400,
      contentWidth: 2400 * 1.8,
      contentHeight: 1800 * 1.8,
    });

    const after = getCanvasPointAtViewportPoint({
      scrollLeft: nextScroll.left,
      scrollTop: nextScroll.top,
      viewportX: anchorViewportX,
      viewportY: anchorViewportY,
      zoom: 1.8,
    });

    expect(after.x).toBeCloseTo(before.x, 5);
    expect(after.y).toBeCloseTo(before.y, 5);
  });

  it("translates the viewport when the pinch midpoint moves without changing zoom", () => {
    const nextScroll = getClampedViewportScrollForZoomAnchor({
      scrollLeft: 300,
      scrollTop: 200,
      anchorViewportX: 150,
      anchorViewportY: 120,
      targetViewportX: 210,
      targetViewportY: 170,
      fromZoom: 1,
      toZoom: 1,
      clientWidth: 500,
      clientHeight: 400,
      contentWidth: 2400,
      contentHeight: 1800,
    });

    expect(nextScroll).toEqual({
      left: 240,
      top: 150,
    });
  });

  it("clamps the scroll target to the content bounds", () => {
    const nextScroll = getClampedViewportScrollForZoomAnchor({
      scrollLeft: 0,
      scrollTop: 0,
      anchorViewportX: 20,
      anchorViewportY: 20,
      targetViewportX: 600,
      targetViewportY: 500,
      fromZoom: 1,
      toZoom: 1,
      clientWidth: 400,
      clientHeight: 300,
      contentWidth: 800,
      contentHeight: 700,
    });

    expect(nextScroll).toEqual({
      left: 0,
      top: 0,
    });
  });
});
