"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useCallback, useRef } from "react";
import {
  CONTROLS_PANEL_GAP,
  CONTROLS_HIDDEN_STATE,
  CONTROLS_VISIBLE_STATE,
  CONTROLS_OPEN_HIDE_DURATION,
  CONTROLS_OPEN_SHOW_DURATION,
  CONTROLS_CLOSE_HIDE_DURATION,
  CONTROLS_CLOSE_SHOW_DURATION,
  CONTROLS_CLOSE_REAPPEAR_DELAY,
} from "../panels/right-card/hooks/use-card-panel-animation";

function getControlsXOffset(panelWidth: number) {
  if (panelWidth <= 0) return 0;
  return -(panelWidth + CONTROLS_PANEL_GAP);
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

  const animateForPanelOpen = useCallback((onComplete?: () => void) => {
    pendingPhaseRef.current = "opening";
    cancelPendingReappear();
    gsap.killTweensOf(controlsContentRef.current);
    gsap.to(controlsContentRef.current, {
      ...CONTROLS_HIDDEN_STATE,
      duration: CONTROLS_OPEN_HIDE_DURATION,
      ease: "power2.in",
      overwrite: "auto",
      onComplete,
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
      duration: CONTROLS_OPEN_SHOW_DURATION,
      ease: "power2.out",
      overwrite: "auto",
      clearProps: "opacity,transform",
    });
  }, [cancelPendingReappear]);

  const animateForPanelClose = useCallback((onComplete?: () => void) => {
    pendingPhaseRef.current = "closing";
    cancelPendingReappear();
    gsap.killTweensOf(controlsContentRef.current);
    gsap.to(controlsContentRef.current, {
      ...CONTROLS_HIDDEN_STATE,
      duration: CONTROLS_CLOSE_HIDE_DURATION,
      ease: "power2.in",
      overwrite: "auto",
      onComplete,
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
    gsap.set(controlsContentRef.current, CONTROLS_HIDDEN_STATE);
    gsap.set(controlsPositionRef.current, { x: 0 });
    delayedReappearRef.current = gsap.delayedCall(CONTROLS_CLOSE_REAPPEAR_DELAY, () => {
      delayedReappearRef.current = null;
      gsap.fromTo(controlsContentRef.current, CONTROLS_HIDDEN_STATE, {
        ...CONTROLS_VISIBLE_STATE,
        duration: CONTROLS_CLOSE_SHOW_DURATION,
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
