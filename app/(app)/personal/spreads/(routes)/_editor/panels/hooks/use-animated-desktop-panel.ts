"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";

interface UseAnimatedDesktopPanelArgs {
  isMobile: boolean;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  panelRef: RefObject<PanelImperativeHandle | null>;
  focusTargetId?: string;
  contentHiddenState: gsap.TweenVars;
  contentVisibleState: gsap.TweenVars;
  triggerHiddenState?: gsap.TweenVars;
  triggerVisibleState?: gsap.TweenVars;
  openTriggerDuration?: number;
  openTriggerEase?: string;
  openContentDuration?: number;
  openContentEase?: string;
  closeContentDuration?: number;
  closeContentEase?: string;
  closeTriggerDuration?: number;
  closeTriggerEase?: string;
  beforeOpenDelay?: number;
  beforeCloseDelay?: number;
  onBeforeOpen?: () => void;
  onAfterOpen?: () => void;
  onBeforeClose?: () => void;
  onAfterClose?: () => void;
}

interface UseAnimatedDesktopPanelReturn {
  isCollapsed: boolean;
  triggerRef: RefObject<HTMLDivElement | null>;
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
  triggerHiddenState,
  triggerVisibleState,
  openTriggerDuration = 0.16,
  openTriggerEase = "power2.in",
  openContentDuration = 0.24,
  openContentEase = "power2.out",
  closeContentDuration = 0.18,
  closeContentEase = "power2.in",
  closeTriggerDuration = 0.22,
  closeTriggerEase = "power2.out",
  beforeOpenDelay = 0,
  beforeCloseDelay = 0,
  onBeforeOpen,
  onAfterOpen,
  onBeforeClose,
  onAfterClose,
}: UseAnimatedDesktopPanelArgs): UseAnimatedDesktopPanelReturn {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelContentRef = useRef<HTMLDivElement | null>(null);
  const isAnimatingRef = useRef(false);
  const hasTriggerAnimation = !!(triggerHiddenState && triggerVisibleState);

  useGSAP(
    () => {
      if (isMobile || isAnimatingRef.current) return;

      if (isCollapsed) {
        if (hasTriggerAnimation) {
          gsap.set(triggerRef.current, triggerVisibleState!);
        }
        gsap.set(panelContentRef.current, contentHiddenState);
        return;
      }

      if (hasTriggerAnimation) {
        gsap.set(triggerRef.current, triggerHiddenState!);
      }
      gsap.set(panelContentRef.current, contentVisibleState);
    },
    [
      isCollapsed,
      isMobile,
      hasTriggerAnimation,
      contentHiddenState,
      contentVisibleState,
      triggerHiddenState,
      triggerVisibleState,
    ]
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
      onBeforeOpen?.();

      if (hasTriggerAnimation) {
        gsap.to(triggerRef.current, {
          ...triggerHiddenState,
          duration: openTriggerDuration,
          ease: openTriggerEase,
          onComplete: finishOpen,
        });
        return;
      }

      if (beforeOpenDelay > 0) {
        gsap.delayedCall(beforeOpenDelay, finishOpen);
        return;
      }

      finishOpen();
    },
    [
      beforeOpenDelay,
      contentHiddenState,
      contentVisibleState,
      focusTarget,
      hasTriggerAnimation,
      isMobile,
      onOpenChange,
      onAfterOpen,
      onBeforeOpen,
      openContentDuration,
      openContentEase,
      openTriggerDuration,
      openTriggerEase,
      panelRef,
      triggerHiddenState,
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

        if (!hasTriggerAnimation) {
          isAnimatingRef.current = false;
          onAfterClose?.();
          onComplete?.();
          return;
        }

        requestAnimationFrame(() => {
          gsap.fromTo(triggerRef.current, triggerHiddenState!, {
            ...triggerVisibleState,
            duration: closeTriggerDuration,
            ease: closeTriggerEase,
            clearProps: "transform",
            onComplete: () => {
              isAnimatingRef.current = false;
              onAfterClose?.();
              onComplete?.();
            },
          });
        });
      };

      isAnimatingRef.current = true;
      onBeforeClose?.();

      if (beforeCloseDelay > 0) {
        gsap.delayedCall(beforeCloseDelay, () => {
          gsap.to(panelContentRef.current, {
            ...contentHiddenState,
            duration: closeContentDuration,
            ease: closeContentEase,
            onComplete: finishClose,
          });
        });
        return;
      }

      gsap.to(panelContentRef.current, {
        ...contentHiddenState,
        duration: closeContentDuration,
        ease: closeContentEase,
        onComplete: finishClose,
      });
    },
    [
      beforeCloseDelay,
      closeContentDuration,
      closeContentEase,
      closeTriggerDuration,
      closeTriggerEase,
      contentHiddenState,
      hasTriggerAnimation,
      isMobile,
      onOpenChange,
      onAfterClose,
      onBeforeClose,
      panelRef,
      triggerHiddenState,
      triggerVisibleState,
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
    triggerRef,
    panelContentRef,
    handleResize,
    openPanel,
    closePanel,
    togglePanel,
  };
}
