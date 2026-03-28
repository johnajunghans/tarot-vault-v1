"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useCallback, useRef } from "react";

const PANEL_GAP = 12;
const CONTROLS_HIDDEN_STATE = { autoAlpha: 0, x: -4, scale: 0.96 };
const CONTROLS_VISIBLE_STATE = { autoAlpha: 1, x: 0, scale: 1 };
const CONTROLS_HIDE_DURATION = 0.16;
const CONTROLS_SHOW_DURATION = 0.22;
const CONTROLS_CLOSE_REAPPEAR_DELAY = 0.50;

function getControlsXOffset(panelWidth: number) {
  if (panelWidth <= 0) return 0;
  return -(panelWidth + PANEL_GAP);
}

export function useDesktopCanvasControlsAnimation() {
  const controlsPositionRef = useRef<HTMLDivElement | null>(null);
  const controlsContentRef = useRef<HTMLDivElement | null>(null);
  const delayedReappearRef = useRef<gsap.core.Tween | null>(null);
  const pendingPhaseRef = useRef<"opening" | "closing" | null>(null);

  const cancelPendingReappear = useCallback(() => {
    delayedReappearRef.current?.kill();
    delayedReappearRef.current = null;
  }, []);

  useGSAP(() => {
    gsap.set(controlsPositionRef.current, { x: 0 });
    gsap.set(controlsContentRef.current, CONTROLS_VISIBLE_STATE);

    return () => {
      cancelPendingReappear();
      gsap.killTweensOf(controlsContentRef.current);
      gsap.killTweensOf(controlsPositionRef.current);
    };
  }, []);

  const syncToPanelWidth = useCallback((panelWidth: number) => {
    gsap.set(controlsPositionRef.current, {
      x: getControlsXOffset(panelWidth),
    });
  }, []);

  const animateForPanelOpen = useCallback(() => {
    pendingPhaseRef.current = "opening";
    cancelPendingReappear();
    gsap.killTweensOf(controlsContentRef.current);
    gsap.to(controlsContentRef.current, {
      ...CONTROLS_HIDDEN_STATE,
      duration: CONTROLS_HIDE_DURATION,
      ease: "power2.in",
      overwrite: "auto",
    });
  }, [cancelPendingReappear]);

  const settleAfterPanelOpen = useCallback((panelWidth: number) => {
    if (pendingPhaseRef.current !== "opening") {
      gsap.set(controlsPositionRef.current, {
        x: getControlsXOffset(panelWidth),
      });
      gsap.set(controlsContentRef.current, CONTROLS_VISIBLE_STATE);
      return;
    }

    pendingPhaseRef.current = null;
    cancelPendingReappear();
    gsap.killTweensOf(controlsContentRef.current);
    gsap.set(controlsPositionRef.current, {
      x: getControlsXOffset(panelWidth),
    });
    gsap.fromTo(controlsContentRef.current, CONTROLS_HIDDEN_STATE, {
      ...CONTROLS_VISIBLE_STATE,
      duration: CONTROLS_SHOW_DURATION,
      ease: "power2.out",
      overwrite: "auto",
      clearProps: "opacity,transform",
    });
  }, [cancelPendingReappear]);

  const animateForPanelClose = useCallback(() => {
    pendingPhaseRef.current = "closing";
    cancelPendingReappear();
    gsap.killTweensOf(controlsContentRef.current);
    gsap.to(controlsContentRef.current, {
      ...CONTROLS_HIDDEN_STATE,
      duration: CONTROLS_HIDE_DURATION,
      ease: "power2.in",
      overwrite: "auto",
    });
  }, [cancelPendingReappear]);

  const settleAfterPanelClose = useCallback(() => {
    if (pendingPhaseRef.current !== "closing") {
      gsap.set(controlsPositionRef.current, { x: 0 });
      gsap.set(controlsContentRef.current, CONTROLS_VISIBLE_STATE);
      return;
    }

    pendingPhaseRef.current = null;
    cancelPendingReappear();
    gsap.killTweensOf(controlsContentRef.current);
    gsap.set(controlsPositionRef.current, { x: 0 });
    delayedReappearRef.current = gsap.delayedCall(CONTROLS_CLOSE_REAPPEAR_DELAY, () => {
      delayedReappearRef.current = null;
      gsap.fromTo(controlsContentRef.current, CONTROLS_HIDDEN_STATE, {
        ...CONTROLS_VISIBLE_STATE,
        duration: CONTROLS_SHOW_DURATION,
        ease: "power2.out",
        overwrite: "auto",
        clearProps: "opacity,transform",
      });
    });
  }, [cancelPendingReappear]);

  return {
    controlsPositionRef,
    controlsContentRef,
    syncToPanelWidth,
    animateForPanelOpen,
    settleAfterPanelOpen,
    animateForPanelClose,
    settleAfterPanelClose,
  };
}
