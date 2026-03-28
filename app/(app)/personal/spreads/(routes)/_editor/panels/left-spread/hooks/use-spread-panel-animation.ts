"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
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
  const [hideSettings, setHideSettings] = useState(false);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const panelContentRef = useRef<HTMLDivElement | null>(null);
  const isAnimatingRef = useRef(false);

  useGSAP(
    () => {
      if (isMobile || isAnimatingRef.current) return;

      if (hideSettings) {
        gsap.set(toolbarRef.current, TOOLBAR_VISIBLE_STATE);
        gsap.set(panelContentRef.current, PANEL_HIDDEN_STATE);
        return;
      }

      gsap.set(toolbarRef.current, TOOLBAR_HIDDEN_STATE);
      gsap.set(panelContentRef.current, PANEL_VISIBLE_STATE);
    },
    { dependencies: [hideSettings, isMobile] }
  );

  useEffect(() => {
    if (isMobile) return;

    const frame = requestAnimationFrame(() => {
      if (panelRef.current) {
        setHideSettings(panelRef.current.isCollapsed());
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [isMobile, panelRef]);

  const handleResize = useCallback(() => {
    if (panelRef.current) {
      setHideSettings(panelRef.current.isCollapsed());
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

  const handleTogglePanel = useCallback(() => {
    if (isMobile) {
      onOpenChange?.(!open);
      return;
    }

    if (!panelRef.current || isAnimatingRef.current) return;

    const toolbar = toolbarRef.current;
    const panelContent = panelContentRef.current;

    if (panelRef.current.isCollapsed()) {
      isAnimatingRef.current = true;

      gsap.to(toolbar, {
        ...TOOLBAR_HIDDEN_STATE,
        duration: 0.16,
        ease: "power2.in",
        onComplete: () => {
          setHideSettings(false);
          panelRef.current?.expand();

          requestAnimationFrame(() => {
            gsap.fromTo(panelContent, PANEL_HIDDEN_STATE, {
              ...PANEL_VISIBLE_STATE,
              duration: 0.24,
              ease: "power2.out",
              clearProps: "opacity,transform,visibility",
              onComplete: () => {
                focusTarget();
                isAnimatingRef.current = false;
              },
            });
          });
        },
      });
      return;
    }

    isAnimatingRef.current = true;

    gsap.to(panelContent, {
      ...PANEL_HIDDEN_STATE,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => {
        panelRef.current?.collapse();
        setHideSettings(true);

        requestAnimationFrame(() => {
          gsap.fromTo(toolbar, TOOLBAR_HIDDEN_STATE, {
            ...TOOLBAR_VISIBLE_STATE,
            duration: 0.22,
            ease: "power2.out",
            clearProps: "transform",
            onComplete: () => {
              isAnimatingRef.current = false;
            },
          });
        });
      },
    });
  }, [focusTarget, isMobile, onOpenChange, open, panelRef]);

  return {
    hideSettings,
    toolbarRef,
    panelContentRef,
    handleResize,
    handleTogglePanel,
  };
}
