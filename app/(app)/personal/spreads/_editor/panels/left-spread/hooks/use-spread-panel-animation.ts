"use client";

import { useAnimatedDesktopPanel } from "@/app/(app)/personal/spreads/_editor/panels/hooks/use-animated-desktop-panel";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";

interface UseSpreadPanelAnimationArgs {
  isMobile: boolean;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  panelRef: RefObject<PanelImperativeHandle | null>;
  focusTargetId?: string;
}

interface UseSpreadPanelAnimationReturn {
  hideSettings: boolean;
  toolbarRef: RefObject<HTMLDivElement | null>;
  panelContentRef: RefObject<HTMLDivElement | null>;
  handleResize: () => void;
  handleTogglePanel: () => void;
}

// Left panel: content slide direction (slides in from left)
const PANEL_HIDDEN_STATE = { autoAlpha: 0, x: -20 };
const PANEL_VISIBLE_STATE = { autoAlpha: 1, x: 0 };
// Left panel: floating toolbar fade/scale when panel opens/closes
const TOOLBAR_HIDDEN_STATE = { autoAlpha: 0, x: -4, scale: 0.96 };
const TOOLBAR_VISIBLE_STATE = { autoAlpha: 1, x: 0, scale: 1 };
const TOOLBAR_HIDE_DURATION = 0.16; // toolbar fades out before panel opens
const TOOLBAR_HIDE_EASE = "power2.in";
const TOOLBAR_SHOW_DURATION = 0.22; // toolbar fades back in after panel closes
const TOOLBAR_SHOW_EASE = "power2.out";

export function useSpreadPanelAnimation({
  isMobile,
  open,
  onOpenChange,
  panelRef,
  focusTargetId,
}: UseSpreadPanelAnimationArgs): UseSpreadPanelAnimationReturn {
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const {
    isCollapsed,
    panelContentRef,
    handleResize,
    togglePanel,
  } = useAnimatedDesktopPanel({
    isMobile,
    open,
    onOpenChange,
    panelRef,
    focusTargetId,
    contentHiddenState: PANEL_HIDDEN_STATE,
    contentVisibleState: PANEL_VISIBLE_STATE,
    beforeOpen: (proceed) => {
      gsap.to(toolbarRef.current, {
        ...TOOLBAR_HIDDEN_STATE,
        duration: TOOLBAR_HIDE_DURATION,
        ease: TOOLBAR_HIDE_EASE,
        onComplete: proceed,
      });
    },
    onAfterClose: () => {
      requestAnimationFrame(() => {
        gsap.fromTo(toolbarRef.current, TOOLBAR_HIDDEN_STATE, {
          ...TOOLBAR_VISIBLE_STATE,
          duration: TOOLBAR_SHOW_DURATION,
          ease: TOOLBAR_SHOW_EASE,
          clearProps: "transform",
        });
      });
    },
  });

  // Sync toolbar visibility to collapsed state (without animation)
  useGSAP(
    () => {
      if (isMobile) return;
      gsap.set(toolbarRef.current, isCollapsed ? TOOLBAR_VISIBLE_STATE : TOOLBAR_HIDDEN_STATE);
    },
    [isCollapsed, isMobile]
  );

  return {
    hideSettings: isCollapsed,
    toolbarRef,
    panelContentRef,
    handleResize,
    handleTogglePanel: togglePanel,
  };
}
