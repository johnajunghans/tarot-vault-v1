"use client";

import { useAnimatedDesktopPanel } from "@/app/(app)/personal/spreads/(routes)/_editor/panels/hooks/use-animated-desktop-panel";
import { type RefObject } from "react";
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

const TOOLBAR_HIDDEN_STATE = { autoAlpha: 0, x: -4, scale: 0.96 };
const TOOLBAR_VISIBLE_STATE = { autoAlpha: 1, x: 0, scale: 1 };
const PANEL_HIDDEN_STATE = { autoAlpha: 0, x: -20 };
const PANEL_VISIBLE_STATE = { autoAlpha: 1, x: 0 };

export function useSpreadPanelAnimation({
  isMobile,
  open,
  onOpenChange,
  panelRef,
  focusTargetId,
}: UseSpreadPanelAnimationArgs): UseSpreadPanelAnimationReturn {
  const {
    isCollapsed,
    triggerRef,
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
    triggerHiddenState: TOOLBAR_HIDDEN_STATE,
    triggerVisibleState: TOOLBAR_VISIBLE_STATE,
  });

  return {
    hideSettings: isCollapsed,
    toolbarRef: triggerRef,
    panelContentRef,
    handleResize,
    handleTogglePanel: togglePanel,
  };
}
