"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";

// Both panels: shared default durations and easing
export const OPEN_CONTENT_DURATION = 0.24; // panel content slides in
export const OPEN_CONTENT_EASE = "power2.out";
export const CLOSE_CONTENT_DURATION = 0.18; // panel content slides out
export const CLOSE_CONTENT_EASE = "power2.in";

interface UseAnimatedDesktopPanelArgs {
  isMobile: boolean;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  panelRef: RefObject<PanelImperativeHandle | null>;
  focusTargetId?: string;
  contentHiddenState: gsap.TweenVars;
  contentVisibleState: gsap.TweenVars;
  openContentDuration?: number;
  openContentEase?: string;
  closeContentDuration?: number;
  closeContentEase?: string;
  beforeOpen?: (proceed: () => void) => void;
  beforeClose?: (proceed: () => void) => void;
  onBeforeOpen?: () => void;
  onAfterOpen?: () => void;
  onBeforeClose?: () => void;
  onAfterClose?: () => void;
}

interface UseAnimatedDesktopPanelReturn {
  isCollapsed: boolean;
  panelContentRef: RefObject<HTMLDivElement | null>;
  handleResize: () => void;
  openPanel: (onComplete?: () => void) => void;
  closePanel: (onComplete?: () => void) => void;
  togglePanel: () => void;
}

export function useAnimatedDesktopPanel({
  isMobile,
  open,
  onOpenChange,
  panelRef,
  focusTargetId,
  contentHiddenState,
  contentVisibleState,
  openContentDuration = OPEN_CONTENT_DURATION,
  openContentEase = OPEN_CONTENT_EASE,
  closeContentDuration = CLOSE_CONTENT_DURATION,
  closeContentEase = CLOSE_CONTENT_EASE,
  beforeOpen,
  beforeClose,
  onBeforeOpen,
  onAfterOpen,
  onBeforeClose,
  onAfterClose,
}: UseAnimatedDesktopPanelArgs): UseAnimatedDesktopPanelReturn {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelContentRef = useRef<HTMLDivElement | null>(null);
  const isAnimatingRef = useRef(false);

  useGSAP(
    () => {
      if (isMobile || isAnimatingRef.current) return;

      gsap.set(panelContentRef.current, isCollapsed ? contentHiddenState : contentVisibleState);
    },
    [isCollapsed, isMobile, contentHiddenState, contentVisibleState]
  );

  useEffect(() => {
    if (isMobile) return;

    const frame = requestAnimationFrame(() => {
      if (panelRef.current) {
        setIsCollapsed(panelRef.current.isCollapsed());
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [isMobile, panelRef]);

  const handleResize = useCallback(() => {
    if (panelRef.current) {
      setIsCollapsed(panelRef.current.isCollapsed());
    }
  }, [panelRef]);

  const focusTarget = useCallback(() => {
    if (!focusTargetId) return;

    const target = document.getElementById(focusTargetId);
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    target.focus();
    if (target instanceof HTMLInputElement) {
      target.select();
    }
  }, [focusTargetId]);

  const openPanel = useCallback(
    (onComplete?: () => void) => {
      if (isMobile) {
        onOpenChange?.(true);
        onComplete?.();
        return;
      }

      if (!panelRef.current || isAnimatingRef.current) return;

      if (!panelRef.current.isCollapsed()) {
        setIsCollapsed(false);
        focusTarget();
        onComplete?.();
        return;
      }

      const finishOpen = () => {
        setIsCollapsed(false);
        panelRef.current?.expand();

        requestAnimationFrame(() => {
          gsap.fromTo(panelContentRef.current, contentHiddenState, {
            ...contentVisibleState,
            duration: openContentDuration,
            ease: openContentEase,
            clearProps: "opacity,transform,visibility",
            onComplete: () => {
              focusTarget();
              isAnimatingRef.current = false;
              onAfterOpen?.();
              onComplete?.();
            },
          });
        });
      };

      isAnimatingRef.current = true;

      if (beforeOpen) {
        beforeOpen(finishOpen);
        return;
      }

      onBeforeOpen?.();
      finishOpen();
    },
    [
      beforeOpen,
      contentHiddenState,
      contentVisibleState,
      focusTarget,
      isMobile,
      onOpenChange,
      onAfterOpen,
      onBeforeOpen,
      openContentDuration,
      openContentEase,
      panelRef,
    ]
  );

  const closePanel = useCallback(
    (onComplete?: () => void) => {
      if (isMobile) {
        onOpenChange?.(false);
        onComplete?.();
        return;
      }

      if (!panelRef.current || isAnimatingRef.current) return;

      if (panelRef.current.isCollapsed()) {
        setIsCollapsed(true);
        onAfterClose?.();
        onComplete?.();
        return;
      }

      const finishClose = () => {
        panelRef.current?.collapse();
        setIsCollapsed(true);
        isAnimatingRef.current = false;
        onAfterClose?.();
        onComplete?.();
      };

      isAnimatingRef.current = true;

      const animateContentOut = () => {
        gsap.to(panelContentRef.current, {
          ...contentHiddenState,
          duration: closeContentDuration,
          ease: closeContentEase,
          onComplete: finishClose,
        });
      };

      if (beforeClose) {
        beforeClose(animateContentOut);
        return;
      }

      onBeforeClose?.();
      animateContentOut();
    },
    [
      beforeClose,
      closeContentDuration,
      closeContentEase,
      contentHiddenState,
      isMobile,
      onOpenChange,
      onAfterClose,
      onBeforeClose,
      panelRef,
    ]
  );

  const togglePanel = useCallback(() => {
    if (isMobile) {
      onOpenChange?.(!open);
      return;
    }

    if (panelRef.current?.isCollapsed()) {
      openPanel();
      return;
    }

    closePanel();
  }, [closePanel, isMobile, onOpenChange, open, openPanel, panelRef]);

  return {
    isCollapsed,
    panelContentRef,
    handleResize,
    openPanel,
    closePanel,
    togglePanel,
  };
}
