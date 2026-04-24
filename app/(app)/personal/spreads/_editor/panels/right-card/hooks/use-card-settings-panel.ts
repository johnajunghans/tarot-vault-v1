"use client";

import { useCardPanelAnimation } from "./use-card-panel-animation";
import { useAppHotkey } from "@/hooks/use-app-hotkey";
import { useLatestRef } from "@/hooks/use-latest-ref";
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

  const onPanelBeforeOpen = useCallback(() => {
    onBeforeDesktopOpen?.(getPanelWidth());
  }, [getPanelWidth, onBeforeDesktopOpen]);

  const onPanelAfterOpen = useCallback(() => {
    const panelWidth = getPanelWidth();
    onDesktopWidthChange?.(panelWidth);
    onAfterDesktopOpen?.(panelWidth);
  }, [getPanelWidth, onAfterDesktopOpen, onDesktopWidthChange]);

  const onPanelBeforeClose = useCallback(() => {
    onBeforeDesktopClose?.(getPanelWidth());
  }, [getPanelWidth, onBeforeDesktopClose]);

  const onPanelAfterClose = useCallback(() => {
    onAfterDesktopClose?.(0);
    onDesktopWidthChange?.(0);
  }, [onAfterDesktopClose, onDesktopWidthChange]);

  const {
    hideHandle: isCollapsed,
    panelContentRef,
    handleResize: syncCollapsedState,
    openPanel,
    closePanel,
  } = useCardPanelAnimation({
    isMobile,
    open,
    onOpenChange,
    panelRef,
    focusTargetId,
    onBeforeOpen: onPanelBeforeOpen,
    onAfterOpen: onPanelAfterOpen,
    onBeforeClose: onPanelBeforeClose,
    onAfterClose: onPanelAfterClose,
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

  // Latest refs for the desktop sync effect (deps stay `selectedCardIndex`-driven only). See
  // useLatestRef — values are read inside rAF, after that commit's effects, so refs are current.
  const openPanelRef = useLatestRef(openPanel);
  const closePanelRef = useLatestRef(closePanel);
  const syncCollapsedStateRef = useLatestRef(syncCollapsedState);
  const getPanelWidthRef = useLatestRef(getPanelWidth);
  const onDesktopWidthChangeRef = useLatestRef(onDesktopWidthChange);

  useEffect(() => {
    if (isMobile) return;

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;

      if (!didInitRef.current) {
        if (selectedCardIndex !== null) {
          setVisibleSelectedCardIndex(selectedCardIndex);
          panel.expand();
          onDesktopWidthChangeRef.current?.(getPanelWidthRef.current());
        } else {
          setVisibleSelectedCardIndex(null);
          panel.collapse();
          onDesktopWidthChangeRef.current?.(0);
        }
        syncCollapsedStateRef.current();
        didInitRef.current = true;
        return;
      }

      if (isClosingRef.current) return;

      if (selectedCardIndex !== null) {
        setVisibleSelectedCardIndex(selectedCardIndex);
        openPanelRef.current();
      } else if (!panel.isCollapsed()) {
        isClosingRef.current = true;
        closePanelRef.current(() => {
          isClosingRef.current = false;
          setVisibleSelectedCardIndex(null);
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [isMobile, panelRef, selectedCardIndex]);

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
