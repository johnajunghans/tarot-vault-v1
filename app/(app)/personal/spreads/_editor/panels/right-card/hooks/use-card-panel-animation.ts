"use client";

import { useAnimatedDesktopPanel } from "@/app/(app)/personal/spreads/_editor/panels/shared/use-animated-desktop-panel";
import { gsap } from "gsap";
import { useCallback, type RefObject } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";

interface UseCardPanelAnimationArgs {
  isMobile: boolean;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  panelRef: RefObject<PanelImperativeHandle | null>;
  focusTargetId?: string;
  onBeforeOpen?: () => void;
  onAfterOpen?: () => void;
  onBeforeClose?: () => void;
  onAfterClose?: () => void;
}

interface UseCardPanelAnimationReturn {
  hideHandle: boolean;
  panelContentRef: RefObject<HTMLDivElement | null>;
  handleResize: () => void;
  openPanel: (onComplete?: () => void) => void;
  closePanel: (onComplete?: () => void) => void;
}

// Right panel: content slide direction (slides in from right)
const PANEL_HIDDEN_STATE = { autoAlpha: 0, x: 20 };
const PANEL_VISIBLE_STATE = { autoAlpha: 1, x: 0 };
// Right panel: delay before content appears (lets controls hide first)
const BEFORE_OPEN_DELAY = 0.16;

// Right panel — canvas controls (zoom/undo-redo) animation timing
export const CONTROLS_PANEL_GAP = 12; // px gap between controls and panel edge for x-offset calc
export const CONTROLS_HIDDEN_STATE = { autoAlpha: 0, x: -4, scale: 0.96 }; // fade/scale state when hidden
export const CONTROLS_VISIBLE_STATE = { autoAlpha: 1, x: 0, scale: 1 }; // resting visible state
export const CONTROLS_OPEN_HIDE_DURATION = 0.16; // how fast controls fade out when panel opens
export const CONTROLS_OPEN_SHOW_DURATION = 0.14; // how fast controls fade back in at new position after open
export const CONTROLS_CLOSE_HIDE_DURATION = 0.18; // how fast controls fade out when panel closes (parallel with content)
export const CONTROLS_CLOSE_SHOW_DURATION = 0.22; // how fast controls fade back in after close
export const CONTROLS_CLOSE_REAPPEAR_DELAY = 0.20; // pause before controls reappear after panel close

export function useCardPanelAnimation({
  isMobile,
  open,
  onOpenChange,
  panelRef,
  focusTargetId,
  onBeforeOpen,
  onAfterOpen,
  onBeforeClose,
  onAfterClose,
}: UseCardPanelAnimationArgs): UseCardPanelAnimationReturn {
  const beforeOpen = useCallback(
    (proceed: () => void) => {
      onBeforeOpen?.();
      gsap.delayedCall(BEFORE_OPEN_DELAY, proceed);
    },
    [onBeforeOpen]
  );

  const {
    isCollapsed,
    panelContentRef,
    handleResize,
    openPanel,
    closePanel,
  } = useAnimatedDesktopPanel({
    isMobile,
    open,
    onOpenChange,
    panelRef,
    focusTargetId,
    contentHiddenState: PANEL_HIDDEN_STATE,
    contentVisibleState: PANEL_VISIBLE_STATE,
    beforeOpen,
    onAfterOpen,
    onBeforeClose,
    onAfterClose,
  });

  return {
    hideHandle: isCollapsed,
    panelContentRef,
    handleResize,
    openPanel,
    closePanel,
  };
}
