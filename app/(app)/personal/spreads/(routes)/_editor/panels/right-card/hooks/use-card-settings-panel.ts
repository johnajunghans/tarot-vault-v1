"use client";

import { useAnimatedDesktopPanel } from "@/app/(app)/personal/spreads/(routes)/_editor/panels/hooks/use-animated-desktop-panel";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { usePanelRef } from "react-resizable-panels";

interface UseCardSettingsPanelArgs {
  cards: Record<"id", string>[];
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
  isMobile: boolean;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  focusTargetId?: string;
  onDesktopWidthChange?: (panelWidth: number) => void;
  onBeforeDesktopOpen?: (panelWidth: number) => void;
  onAfterDesktopOpen?: (panelWidth: number) => void;
  onBeforeDesktopClose?: (panelWidth: number) => void;
  onAfterDesktopClose?: (panelWidth: number) => void;
}

const PANEL_HIDDEN_STATE = { autoAlpha: 0, x: 20 };
const PANEL_VISIBLE_STATE = { autoAlpha: 1, x: 0 };

export function useCardSettingsPanel({
  cards,
  selectedCardIndex,
  setSelectedCardIndex,
  isMobile,
  open,
  onOpenChange,
  focusTargetId,
  onDesktopWidthChange,
  onBeforeDesktopOpen,
  onAfterDesktopOpen,
  onBeforeDesktopClose,
  onAfterDesktopClose,
}: UseCardSettingsPanelArgs) {
  const panelRef = usePanelRef();
  const isClosingRef = useRef(false);
  const didInitRef = useRef(false);
  const lastExpandedWidthRef = useRef(320);
  const [visibleSelectedCardIndex, setVisibleSelectedCardIndex] = useState<number | null>(
    selectedCardIndex
  );

  const getPanelWidth = useCallback(() => {
    const pixels = panelRef.current?.getSize().inPixels ?? 0;
    if (pixels > 0) {
      lastExpandedWidthRef.current = pixels;
      return pixels;
    }

    return lastExpandedWidthRef.current;
  }, [panelRef]);

  const {
    isCollapsed,
    panelContentRef,
    handleResize: syncCollapsedState,
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
    beforeOpenDelay: 0.16,
    beforeCloseDelay: 0,
    onBeforeOpen: () => onBeforeDesktopOpen?.(getPanelWidth()),
    onAfterOpen: () => {
      const panelWidth = getPanelWidth();
      onDesktopWidthChange?.(panelWidth);
      onAfterDesktopOpen?.(panelWidth);
    },
    onBeforeClose: () => onBeforeDesktopClose?.(getPanelWidth()),
    onAfterClose: () => {
      onDesktopWidthChange?.(0);
      onAfterDesktopClose?.(0);
    },
  });

  const handleClosePanel = useCallback(() => {
    if (selectedCardIndex === null) return;

    if (isMobile) {
      setVisibleSelectedCardIndex(null);
      setSelectedCardIndex(null);
      onOpenChange?.(false);
      return;
    }

    isClosingRef.current = true;
    closePanel(() => {
      isClosingRef.current = false;
      setVisibleSelectedCardIndex(null);
      setSelectedCardIndex(null);
      onOpenChange?.(false);
    });
  }, [closePanel, isMobile, onOpenChange, selectedCardIndex, setSelectedCardIndex]);

  const handleResize = useCallback(() => {
    syncCollapsedState();

    if (panelRef.current?.isCollapsed()) {
      if (!isClosingRef.current) {
        onDesktopWidthChange?.(0);
      }
      setVisibleSelectedCardIndex(null);
      setSelectedCardIndex(null);
      return;
    }

    onDesktopWidthChange?.(getPanelWidth());
  }, [getPanelWidth, onDesktopWidthChange, panelRef, setSelectedCardIndex, syncCollapsedState]);

  useEffect(() => {
    if (isMobile) return;

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;

      if (!didInitRef.current) {
        if (selectedCardIndex !== null) {
          setVisibleSelectedCardIndex(selectedCardIndex);
          panel.expand();
          onDesktopWidthChange?.(getPanelWidth());
        } else {
          setVisibleSelectedCardIndex(null);
          panel.collapse();
          onDesktopWidthChange?.(0);
        }
        syncCollapsedState();
        didInitRef.current = true;
        return;
      }

      if (isClosingRef.current) return;

      if (selectedCardIndex !== null) {
        setVisibleSelectedCardIndex(selectedCardIndex);
        openPanel();
      } else {
        isClosingRef.current = true;
        closePanel(() => {
          isClosingRef.current = false;
          setVisibleSelectedCardIndex(null);
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [closePanel, getPanelWidth, isMobile, onDesktopWidthChange, openPanel, panelRef, selectedCardIndex, syncCollapsedState]);

  useEffect(() => {
    if (selectedCardIndex === null || cards.some((_, index) => index === selectedCardIndex)) return;

    const frame = requestAnimationFrame(() => {
      setVisibleSelectedCardIndex(null);
      setSelectedCardIndex(null);
    });

    return () => cancelAnimationFrame(frame);
  }, [cards, selectedCardIndex, setSelectedCardIndex]);

  useAppHotkey("Mod+K", handleClosePanel, {
    enabled: selectedCardIndex !== null,
    ignoreInputs: false,
  });

  return {
    panelRef,
    panelContentRef,
    visibleSelectedCardIndex,
    hideHandle: isCollapsed,
    handleResize,
    handleClosePanel,
  };
}
